import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { reconcileCorrectOptionId, validateQuestionDraft } from './question-form.js';
import './style.css';

async function api(path, { method = 'GET', body, csrf } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? 'Request failed.');
  return data;
}

function localDateTime(date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function App() {
  const [user, setUser] = useState(null);
  const [csrf, setCsrf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [students, setStudents] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [attemptQuestions, setAttemptQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [optionTexts, setOptionTexts] = useState(['', '', '', '']);
  const [correctOptionId, setCorrectOptionId] = useState('a');
  const [questionMarks, setQuestionMarks] = useState(1);
  const now = new Date();
  const [examDraft, setExamDraft] = useState({
    title: '', durationMinutes: 30, startAt: localDateTime(now),
    endAt: localDateTime(new Date(now.getTime() + 60 * 60_000)), passMark: 1,
    negativeMark: 0, reviewEnabled: false,
  });
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [assignedStudentIds, setAssignedStudentIds] = useState([]);

  useEffect(() => { api('/auth/me').then((d) => { setUser(d.user); setCsrf(d.csrfToken); }).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) return;
    api('/exams').then((d) => setExams(d.exams)).catch((e) => setError(e.message));
    if (user.role !== 'Student') {
      Promise.all([api('/questions'), api('/students')])
        .then(([questionData, studentData]) => { setQuestions(questionData.questions); setStudents(studentData.students); })
        .catch((e) => setError(e.message));
    }
  }, [user]);
  useEffect(() => {
    if (attempt?.status !== 'IN_PROGRESS') return undefined;
    const timer = setInterval(() => {
      if (Date.now() >= new Date(attempt.endsAt).getTime()) submit();
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt]);

  async function signIn(event) {
    event.preventDefault(); setError('');
    try { const data = await api('/auth/login', { method: 'POST', body: { email, password } }); setUser(data.user); setCsrf(data.csrfToken); setPassword(''); }
    catch (e) { setError(e.message); }
  }
  async function signOut() {
    try { await api('/auth/logout', { method: 'POST', csrf }); setUser(null); setAttempt(null); setResult(null); setQuestions([]); setStudents([]); }
    catch (e) { setError(e.message); }
  }
  async function begin(exam) {
    setBusy(true); setError('');
    try {
      const data = await api(`/exams/${exam.id}/attempts`, { method: 'POST', csrf });
      setAttempt(data.attempt); setAttemptQuestions(data.questions);
      setAnswers(Object.fromEntries(data.questions.map((q) => [q.id, data.attempt.answers?.find((answer) => answer.questionId === q.id)?.selectedOptionId ?? null])));
      setResult(null);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function save(questionId, selectedOptionId) {
    setAnswers((current) => ({ ...current, [questionId]: selectedOptionId }));
    try { await api(`/attempts/${attempt.id}/answers/${questionId}`, { method: 'PUT', csrf, body: { selectedOptionId } }); }
    catch (e) { setError(e.message); }
  }
  async function submit() {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || busy) return;
    setBusy(true);
    try { const data = await api(`/attempts/${attempt.id}/submit`, { method: 'POST', csrf }); setAttempt(data.attempt); setResult(data.attempt); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function updateOptionText(index, value) {
    const nextOptionTexts = optionTexts.map((text, i) => i === index ? value : text);
    setOptionTexts(nextOptionTexts);
    setCorrectOptionId((selected) => reconcileCorrectOptionId(nextOptionTexts, selected));
  }

  async function createQuestion(event) {
    event.preventDefault(); setError(''); setNotice('');
    const options = optionTexts.map((text, index) => ({ id: String.fromCharCode(97 + index), text: text.trim() })).filter((option) => option.text);
    const validationError = validateQuestionDraft(options, correctOptionId);
    if (validationError) { setError(validationError); return; }
    setBusy(true);
    try {
      const data = await api('/questions', { method: 'POST', csrf, body: { text: questionText, options, correctOptionId, marks: Number(questionMarks) } });
      setQuestions((current) => [data, ...current]); setQuestionText(''); setOptionTexts(['', '', '', '']); setCorrectOptionId('a'); setQuestionMarks(1); setNotice('Question added to your question bank.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function createExam(event) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const data = await api('/exams', {
        method: 'POST', csrf,
        body: {
          title: examDraft.title, durationMinutes: Number(examDraft.durationMinutes),
          startAt: new Date(examDraft.startAt).toISOString(), endAt: new Date(examDraft.endAt).toISOString(),
          passMark: Number(examDraft.passMark), negativeMark: Number(examDraft.negativeMark),
          questionIds: selectedQuestionIds, assignedStudentIds, reviewEnabled: examDraft.reviewEnabled,
        },
      });
      setExams((current) => [...current, { ...examDraft, id: data.id, status: data.status }]);
      setExamDraft((current) => ({ ...current, title: '' })); setSelectedQuestionIds([]); setAssignedStudentIds([]);
      setNotice('Exam configured, published, and assigned to the selected students.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const remaining = attempt?.endsAt ? Math.max(0, Math.ceil((new Date(attempt.endsAt) - Date.now()) / 1000)) : 0;
  if (!user) return <main className="sign-in"><section className="login-card"><div className="mark">OE</div><p className="eyebrow">PES UNIVERSITY · SOFTWARE ENGINEERING</p><h1>Online Exam Portal</h1><p className="subtle">Sign in to access your examination workspace.</p><form onSubmit={signIn}><label>Email<input autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/></label><button className="primary" disabled={busy}>Sign in</button></form>{error && <p className="error" role="alert">{error}</p>}<p className="footnote">This demonstration uses temporary local accounts and data.</p></section></main>;

  return <div className="app-shell"><header><a className="brand" href="#home"><span className="brand-mark">OE</span>Exam Portal</a><div className="user-menu"><span className="avatar">{user.name.slice(0, 1)}</span><span>{user.name}<small>{user.role}</small></span><button className="text-button" onClick={signOut}>Sign out</button></div></header><main className="content">
    <section className="welcome"><p className="eyebrow">{user.role.toUpperCase()} WORKSPACE</p><h1>{attempt?.status === 'IN_PROGRESS' ? 'Your exam is in progress' : result ? 'Exam submitted' : `Welcome, ${user.name.split(' ')[0]}`}</h1><p className="subtle">{attempt?.status === 'IN_PROGRESS' ? 'Your answers save as you work. Submit when you are ready.' : 'Your examinations and recent results appear here.'}</p></section>
    {error && <p className="error notice" role="alert">{error}</p>}{notice && <p className="success notice" role="status">{notice}</p>}
    {attempt?.status === 'IN_PROGRESS' ? <section className="exam-panel"><div className="exam-top"><div><p className="eyebrow">TIMED EXAM</p><h2>{exams.find((exam) => exam.id === attempt.examId)?.title ?? 'Examination'}</h2></div><div className="timer"><span>TIME REMAINING</span><strong>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong></div></div>{attemptQuestions.map((question, index) => <article className="question" key={question.id}><p className="question-count">QUESTION {index + 1} <span>{question.marks} point{question.marks === 1 ? '' : 's'}</span></p><h3>{question.text}</h3><div className="options">{question.options.map((option) => <label className={`option ${answers[question.id] === option.id ? 'selected' : ''}`} key={option.id}><input type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => save(question.id, option.id)}/><span>{option.text}</span></label>)}</div></article>)}<button className="primary submit" onClick={submit} disabled={busy}>Submit exam</button></section>
      : result ? <section className="result-card"><p className="eyebrow">RESULT</p><h2>{result.passed ? 'Passed' : 'Not passed'}</h2><p className="score">{result.score} <span>/ {result.maximumScore}</span></p><p>{result.correctCount} correct · {result.wrongCount} incorrect · {result.unansweredCount} unanswered</p></section>
      : user.role === 'Student' ? <section className="exam-list"><div className="section-heading"><div><p className="eyebrow">YOUR WORK</p><h2>Assigned exams</h2></div><span className="count">{exams.length} exam{exams.length === 1 ? '' : 's'}</span></div>{exams.length ? exams.map((exam) => <article className="exam-card" key={exam.id}><div className="exam-icon">✦</div><div className="exam-info"><h3>{exam.title}</h3><p>{exam.durationMinutes} minutes · Opens {new Date(exam.startAt).toLocaleString()}</p></div><button className="primary compact" onClick={() => begin(exam)} disabled={busy}>Start exam <span>→</span></button></article>) : <p className="empty">No exams are assigned to your account yet.</p>}</section>
      : <><section className="exam-list"><p className="eyebrow">INSTRUCTOR VIEW</p><h2>Your exams</h2>{exams.length ? exams.map((exam) => <article className="exam-card" key={exam.id}><div className="exam-icon">✦</div><div className="exam-info"><h3>{exam.title}</h3><p>{exam.durationMinutes} minutes · {exam.status}</p></div></article>) : <p className="empty">No exams created yet.</p>}</section>
        <section className="management-grid"><section className="management-card"><p className="eyebrow">QUESTION BANK</p><h2>Add a multiple-choice question</h2><form className="management-form" onSubmit={createQuestion}><label>Question<input value={questionText} onChange={(event) => setQuestionText(event.target.value)} maxLength={2000} required/></label>{optionTexts.map((value, index) => <label key={index}>Option {index + 1}<input value={value} onChange={(event) => updateOptionText(index, event.target.value)} maxLength={500} required={index < 2}/></label>)}<label>Correct answer<select value={correctOptionId} onChange={(event) => setCorrectOptionId(event.target.value)}>{optionTexts.map((text, index) => text.trim() && <option key={index} value={String.fromCharCode(97 + index)}>Option {index + 1}: {text}</option>)}</select></label><label>Marks<input type="number" min="1" max="100" value={questionMarks} onChange={(event) => setQuestionMarks(event.target.value)} required/></label><button className="primary" disabled={busy}>Save question</button></form><h3 className="subheading">Your questions ({questions.length})</h3>{questions.length ? <ul className="management-list">{questions.map((question) => <li key={question.id}><strong>{question.text}</strong><small>{question.options.length} options · {question.marks} mark{question.marks === 1 ? '' : 's'}</small></li>)}</ul> : <p className="empty">Add questions before configuring an exam.</p>}</section>
          <section className="management-card"><p className="eyebrow">EXAM SETUP</p><h2>Configure and publish an exam</h2><form className="management-form" onSubmit={createExam}><label>Exam title<input value={examDraft.title} onChange={(event) => setExamDraft((current) => ({ ...current, title: event.target.value }))} maxLength={160} required/></label><label>Duration (minutes)<input type="number" min="1" max="600" value={examDraft.durationMinutes} onChange={(event) => setExamDraft((current) => ({ ...current, durationMinutes: event.target.value }))} required/></label><label>Opens<input type="datetime-local" value={examDraft.startAt} onChange={(event) => setExamDraft((current) => ({ ...current, startAt: event.target.value }))} required/></label><label>Closes<input type="datetime-local" value={examDraft.endAt} onChange={(event) => setExamDraft((current) => ({ ...current, endAt: event.target.value }))} required/></label><label>Pass mark<input type="number" min="0" step="0.5" value={examDraft.passMark} onChange={(event) => setExamDraft((current) => ({ ...current, passMark: event.target.value }))} required/></label><label>Negative mark per wrong answer<input type="number" min="0" max="100" step="0.25" value={examDraft.negativeMark} onChange={(event) => setExamDraft((current) => ({ ...current, negativeMark: event.target.value }))} required/></label><label className="check-label"><input type="checkbox" checked={examDraft.reviewEnabled} onChange={(event) => setExamDraft((current) => ({ ...current, reviewEnabled: event.target.checked }))}/> Allow answer review after exam closes</label><fieldset><legend>Questions</legend>{questions.map((question) => <label className="check-label" key={question.id}><input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={(event) => setSelectedQuestionIds((current) => event.target.checked ? [...current, question.id] : current.filter((id) => id !== question.id))}/>{question.text} ({question.marks} marks)</label>)}{!questions.length && <small>Create questions first.</small>}</fieldset><fieldset><legend>Assign students</legend>{students.map((student) => <label className="check-label" key={student.id}><input type="checkbox" checked={assignedStudentIds.includes(student.id)} onChange={(event) => setAssignedStudentIds((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id))}/>{student.name} · {student.email}</label>)}{!students.length && <small>No verified active student accounts are available.</small>}</fieldset><button className="primary" disabled={busy || !questions.length}>Configure and publish</button></form></section></section></>}
    <footer><span>Online Exam Portal</span><span>Software Engineering Mini-Project</span></footer></main></div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
