
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

async function api(path, { method = 'GET', body, csrf } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? 'Request failed.');
  }

  return data;
}

function App() {
  const [user, setUser] = useState(null);
  const [csrf, setCsrf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [exams, setExams] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function loadExams() {
    const data = await api('/exams');
    setExams(data.exams);
  }

  useEffect(() => {
    api('/auth/me')
      .then((data) => {
        setUser(data.user);
        setCsrf(data.csrfToken);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      loadExams().catch((e) => setError(e.message));
    }
  }, [user]);

  useEffect(() => {
    if (attempt?.status !== 'IN_PROGRESS') return;

    const timer = setInterval(() => {
      if (Date.now() >= new Date(attempt.endsAt).getTime()) {
        submit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt]);

  async function signIn(event) {
    event.preventDefault();
    setError('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      setUser(data.user);
      setCsrf(data.csrfToken);
      setPassword('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function signOut() {
    try {
      await api('/auth/logout', { method: 'POST', csrf });
      setUser(null);
      setAttempt(null);
      setResult(null);
      setExams([]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function begin(exam) {
    setBusy(true);
    setError('');

    try {
      const data = await api(`/exams/${exam.id}/attempts`, {
        method: 'POST',
        csrf,
      });

      setAttempt(data.attempt);
      setQuestions(data.questions);
      setAnswers(
        Object.fromEntries(
          data.questions.map((question) => [
            question.id,
            data.attempt.answers?.find(
              (answer) => answer.questionId === question.id
            )?.selectedOptionId ?? null,
          ])
        )
      );
      setResult(null);
    } catch (e) {
      setError(e.message);
      await loadExams().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  async function save(questionId, selectedOptionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: selectedOptionId,
    }));

    try {
      await api(`/attempts/${attempt.id}/answers/${questionId}`, {
        method: 'PUT',
        csrf,
        body: { selectedOptionId },
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function submit() {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || busy) return;

    setBusy(true);

    try {
      const data = await api(`/attempts/${attempt.id}/submit`, {
        method: 'POST',
        csrf,
      });

      setAttempt(data.attempt);
      setResult(data.attempt);
      await loadExams().catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const remaining = attempt?.endsAt
    ? Math.max(
        0,
        Math.ceil((new Date(attempt.endsAt).getTime() - Date.now()) / 1000)
      )
    : 0;

  if (!user) {
    return (
      <main className="sign-in">
        <section className="login-card">
          <div className="mark">OE</div>
          <p className="eyebrow">PES UNIVERSITY · SOFTWARE ENGINEERING</p>
          <h1>Online Exam Portal</h1>
          <p className="subtle">
            Sign in to access your examination workspace.
          </p>

          <form onSubmit={signIn}>
            <label>
              Email
              <input
                autoComplete="username"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button className="primary" disabled={busy}>
              Sign in
            </button>
          </form>

          {error && <p className="error" role="alert">{error}</p>}
          <p className="footnote">
            This demonstration uses temporary local accounts and data.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#home">
          <span className="brand-mark">OE</span>
          Exam Portal
        </a>

        <div className="user-menu">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <span>
            {user.name}
            <small>{user.role}</small>
          </span>
          <button className="text-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">
        <section className="welcome">
          <p className="eyebrow">{user.role.toUpperCase()} WORKSPACE</p>
          <h1>
            {attempt?.status === 'IN_PROGRESS'
              ? 'Your exam is in progress'
              : result
                ? 'Exam submitted'
                : `Welcome, ${user.name.split(' ')[0]}`}
          </h1>
          <p className="subtle">
            {attempt?.status === 'IN_PROGRESS'
              ? 'Your answers save as you work. Submit when you are ready.'
              : 'Your assigned examinations and recent results appear here.'}
          </p>
        </section>

        {error && <p className="error notice" role="alert">{error}</p>}

        {attempt?.status === 'IN_PROGRESS' ? (
          <section className="exam-panel">
            <div className="exam-top">
              <div>
                <p className="eyebrow">TIMED EXAM</p>
                <h2>
                  {exams.find((e) => e.id === attempt.examId)?.title
                    ?? 'Examination'}
                </h2>
              </div>

              <div className="timer">
                <span>TIME REMAINING</span>
                <strong>
                  {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                  {String(remaining % 60).padStart(2, '0')}
                </strong>
              </div>
            </div>

            {questions.map((question, index) => (
              <article className="question" key={question.id}>
                <p className="question-count">
                  QUESTION {index + 1}
                  <span>
                    {question.marks} point
                    {question.marks === 1 ? '' : 's'}
                  </span>
                </p>

                <h3>{question.text}</h3>

                <div className="options">
                  {question.options.map((option) => (
                    <label
                      className={`option ${
                        answers[question.id] === option.id ? 'selected' : ''
                      }`}
                      key={option.id}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === option.id}
                        onChange={() => save(question.id, option.id)}
                      />
                      <span>{option.text}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}

            <button
              className="primary submit"
              onClick={submit}
              disabled={busy}
            >
              Submit exam
            </button>
          </section>
        ) : result ? (
          <section className="result-card">
            <p className="eyebrow">RESULT</p>
            <h2>{result.passed ? 'Passed' : 'Not passed'}</h2>
            <p className="score">
              {result.score} <span>/ {result.maximumScore}</span>
            </p>
            <p>
              {result.correctCount} correct · {result.wrongCount} incorrect ·{' '}
              {result.unansweredCount} unanswered
            </p>
          </section>
        ) : user.role === 'Student' ? (
          <section className="exam-list">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WORK</p>
                <h2>Assigned exams</h2>
              </div>
              <span className="count">
                {exams.length} exam{exams.length === 1 ? '' : 's'}
              </span>
            </div>

            {exams.length ? (
              exams.map((exam) => (
                <article className="exam-card" key={exam.id}>
                  <div className="exam-icon">✦</div>

                  <div className="exam-info">
                    <h3>{exam.title}</h3>
                    <p>{exam.durationMinutes} minutes</p>
                    <p>
                      Starts: {new Date(exam.startAt).toLocaleString()}
                    </p>
                    <p>
                      Ends: {new Date(exam.endAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="exam-actions">
                    <span
                      className={`status-badge status-${(
                        exam.studentStatus ?? 'Upcoming'
                      ).toLowerCase()}`}
                    >
                      {exam.studentStatus ?? 'Upcoming'}
                    </span>

                    {exam.studentStatus === 'Open' && (
                      <button
                        className="primary compact"
                        onClick={() => begin(exam)}
                        disabled={busy}
                      >
                        {exam.canResume ? 'Continue exam →' : 'Start exam →'}
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="empty">
                No exams are assigned to your account yet.
              </p>
            )}
          </section>
        ) : (
          <section className="exam-list">
            <p className="eyebrow">INSTRUCTOR VIEW</p>
            <h2>Your exams</h2>

            {exams.map((exam) => (
              <article className="exam-card" key={exam.id}>
                <div className="exam-icon">✦</div>
                <div className="exam-info">
                  <h3>{exam.title}</h3>
                  <p>
                    {exam.durationMinutes} minutes · {exam.status}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer>
          <span>Online Exam Portal</span>
          <span>Software Engineering Mini-Project</span>
        </footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
