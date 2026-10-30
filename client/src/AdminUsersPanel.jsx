import React, { useEffect, useState } from 'react';

async function adminApi(path, { method = 'GET', body, csrf } = {}) {
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

export default function AdminUsersPanel({ csrf }) {
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [filters, setFilters] = useState({ action: '', userId: '', from: '', to: '' });
  const [audit, setAudit] = useState({ logs: [], total: 0, page: 1, limit: 50 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const data = await adminApi('/admin/users');
    setUsers(data.users);
    setDrafts(Object.fromEntries(data.users.map((user) => [user.id, { name: user.name, email: user.email, role: user.role, active: user.active, password: '' }])));
  }
  async function refreshAudit(page = 1, activeFilters = filters) {
    const query = new URLSearchParams({ page: String(page), limit: '50' });
    if (activeFilters.action) query.set('action', activeFilters.action);
    if (activeFilters.userId) query.set('userId', activeFilters.userId);
    if (activeFilters.from) query.set('from', `${activeFilters.from}T00:00:00.000Z`);
    if (activeFilters.to) query.set('to', `${activeFilters.to}T23:59:59.999Z`);
    setAudit(await adminApi(`/admin/audit-logs?${query}`));
  }
  useEffect(() => { Promise.all([refresh(), refreshAudit()]).catch((e) => setError(e.message)); }, []);

  async function createUser(event) {
    event.preventDefault();
    if (form.role === 'Administrator' && !window.confirm('Create another administrator account?')) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await adminApi('/admin/users', { method: 'POST', csrf, body: form });
      setForm({ name: '', email: '', password: '', role: 'Student' });
      await Promise.all([refresh(), refreshAudit(1)]); setMessage('Account created. Share the initial password through your approved secure channel.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function saveUser(id) {
    const current = users.find((user) => user.id === id);
    const draft = drafts[id];
    if ((current?.role !== draft.role || current?.active !== draft.active)
      && !window.confirm(`Apply account access change for ${current?.email}?`)) return;
    setBusy(true); setError(''); setMessage('');
    const fields = { ...drafts[id] };
    delete fields.email;
    const password = fields.password;
    delete fields.password;
    try {
      await adminApi(`/admin/users/${id}`, { method: 'PATCH', csrf, body: password ? { ...fields, password } : fields });
      await Promise.all([refresh(), refreshAudit(1)]); setMessage('Account updated. Role or password changes end existing sessions.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return <section className="exam-list admin-users" aria-labelledby="admin-users-title">
    <div className="section-heading"><div><p className="eyebrow">ADMINISTRATION</p><h2 id="admin-users-title">Manage accounts</h2></div><span className="count">{users.length} accounts</span></div>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <form className="management-card management-form admin-create-form" onSubmit={createUser}>
      <h3>Create account</h3>
      <label>Full name<input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
      <label>Email<input required type="email" maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label>
      <label>Initial password<input required type="password" autoComplete="new-password" minLength="8" maxLength="128" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/><small>Use upper-case, lower-case, and a number. Deliver it securely.</small></label>
      <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Student</option><option>Instructor</option><option>Administrator</option></select></label>
      <button className="primary" disabled={busy}>Create account</button>
    </form>
    <div className="admin-user-list"><h3>Existing accounts</h3>{users.map((user) => {
      const draft = drafts[user.id]; if (!draft) return null;
      return <form className="admin-user-row" key={user.id} onSubmit={(event) => { event.preventDefault(); saveUser(user.id); }}>
        <label>Name<input value={draft.name} maxLength="100" onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, name: event.target.value } })}/></label>
        <label>Email<input type="email" value={draft.email} readOnly aria-describedby={`email-note-${user.id}`}/><small id={`email-note-${user.id}`}>Email cannot be changed until a verified email update flow is available.</small></label>
        <label>Role<select value={draft.role} onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, role: event.target.value } })}><option>Student</option><option>Instructor</option><option>Administrator</option></select></label>
        <label>New password<input type="password" autoComplete="new-password" placeholder="Leave blank to keep current" value={draft.password} onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, password: event.target.value } })}/></label>
        <label className="check-label"><input type="checkbox" checked={draft.active} onChange={(event) => setDrafts({ ...drafts, [user.id]: { ...draft, active: event.target.checked } })}/> Active</label>
        <button className="primary compact" disabled={busy}>Save changes</button>
      </form>;
    })}</div>
    <div className="admin-audit"><h3>Audit records</h3>
      <form className="admin-audit-filters" onSubmit={(event) => { event.preventDefault(); refreshAudit(1).catch((e) => setError(e.message)); }}>
        <label>Action<input value={filters.action} onChange={(event) => setFilters({ ...filters, action: event.target.value })} maxLength="80" placeholder="Any action"/></label>
        <label>User<select value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })}><option value="">Any user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}</select></label>
        <label>From<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })}/></label>
        <label>To<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })}/></label>
        <button className="primary compact">Filter</button>
      </form>
      <div className="admin-audit-list" aria-live="polite">
        {audit.logs.length ? audit.logs.map((log) => <article className="admin-audit-entry" key={log.id}><strong>{log.action}</strong><span>{users.find((user) => user.id === log.userId)?.email ?? log.userId ?? 'System'}</span><span>{log.ip ?? 'IP unavailable'}</span><time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleString()}</time><pre>{JSON.stringify(log.details, null, 2)}</pre></article>) : <p className="empty">No audit records match these filters.</p>}
      </div>
      <div className="admin-audit-pagination"><span>{audit.total} records · page {audit.page}</span><button className="text-button" disabled={busy || audit.page <= 1} onClick={() => refreshAudit(audit.page - 1).catch((e) => setError(e.message))}>Previous</button><button className="text-button" disabled={busy || audit.page * audit.limit >= audit.total} onClick={() => refreshAudit(audit.page + 1).catch((e) => setError(e.message))}>Next</button></div>
    </div>
  </section>;
}
