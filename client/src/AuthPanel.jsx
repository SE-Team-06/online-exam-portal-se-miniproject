import React, { useState } from 'react';

async function authApi(path, body) {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? 'Request failed.');
  return data;
}

export default function AuthPanel({ onAuthenticated, onAuthActionComplete }) {
  const query = new URLSearchParams(window.location.search);
  const verificationToken = query.get('verifyEmail') ?? '';
  const resetToken = query.get('resetPassword') ?? '';
  const initialMode = verificationToken ? 'verify' : resetToken ? 'reset' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function clearActionToken(parameter) {
    const url = new URL(window.location.href);
    url.searchParams.delete(parameter);
    window.history.replaceState({}, '', url.toString());
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') {
        const data = await authApi('login', { email, password });
        onAuthenticated(data.user, data.csrfToken);
      } else if (mode === 'register') {
        const data = await authApi('register', { name, email, password });
        setMode('login'); setPassword(''); setMessage(data.message);
      } else if (mode === 'forgot') {
        const data = await authApi('password-reset', { email });
        setMessage(data.message);
      } else if (mode === 'reset') {
        const data = await authApi('password-reset/complete', { token: resetToken, password });
        clearActionToken('resetPassword'); onAuthActionComplete(); setPassword(''); setMode('login'); setMessage(data.message);
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function verify() {
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await authApi('verify-email', { token: verificationToken });
      clearActionToken('verifyEmail'); onAuthActionComplete(); setMode('login'); setMessage(data.message);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const title = mode === 'register' ? 'Create student account' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : mode === 'verify' ? 'Verify your email' : 'Online Exam Portal';
  return <main className="sign-in"><section className="login-card"><div className="mark">OE</div><p className="eyebrow">PES UNIVERSITY · SOFTWARE ENGINEERING</p><h1>{title}</h1>
    {mode === 'verify' ? <><p className="subtle">This one-time verification link is valid for 24 hours.</p><button className="primary" onClick={verify} disabled={busy}>Verify email</button><button className="text-button" onClick={() => { clearActionToken('verifyEmail'); setMode('login'); }}>Return to sign in</button></>
      : <><p className="subtle">{mode === 'register' ? 'Register as a student. Sign in is available after email verification.' : mode === 'forgot' ? 'Enter your account email. If it matches an active verified account, we will send a reset link.' : mode === 'reset' ? 'The one-time reset link expires after 30 minutes.' : 'Sign in to access your examination workspace.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label>Full name<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength="100"/></label>}
          <label>Email<input autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength="254"/></label>
          {(mode === 'login' || mode === 'register' || mode === 'reset') && <label>Password<input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'login' ? 1 : 8} maxLength="128" pattern={mode === 'login' ? undefined : '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,128}$'} title="Use at least 8 characters with upper-case, lower-case, and a number."/><small>{mode === 'login' ? '' : 'At least 8 characters, with upper-case, lower-case, and a number.'}</small></label>}
          <button className="primary" disabled={busy}>{mode === 'register' ? 'Register' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Set new password' : 'Sign in'}</button>
        </form>
        {mode === 'login' && <div className="auth-links"><button className="text-button" onClick={() => setMode('register')}>Create a student account</button><button className="text-button" onClick={() => setMode('forgot')}>Forgot password?</button></div>}
        {mode === 'register' && <button className="text-button" onClick={() => setMode('login')}>Back to sign in</button>}
        {mode === 'forgot' && <button className="text-button" onClick={() => setMode('login')}>Back to sign in</button>}
        {mode === 'reset' && <button className="text-button" onClick={() => { clearActionToken('resetPassword'); setMode('login'); }}>Cancel reset</button>}
      </>}
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <p className="footnote">For registration and password reset, mail delivery must be configured for this environment.</p>
  </section></main>;
}
