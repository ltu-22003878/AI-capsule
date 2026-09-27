import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const empty = {
  project_name: '', prompt_title: '', prompt_version: '', prompt_text: '',
  response_summary: '', category: 'Coding', usefulness: 'Good', reviewed: false,
  improved: false, screenshot_url: '', notes: '',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch('/api/me')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setUser(data); loadCapsules(); })
      .catch(() => navigate('/login'));
  }, []);

  function loadCapsules() {
    fetch('/api/capsules').then(r => r.json()).then(setCapsules);
  }

  function handleChange(e) {
    const { name, type, checked, value } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editingId ? `/api/capsules/${editingId}` : '/api/capsules';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(empty);
      setEditingId(null);
      loadCapsules();
    }
  }

  function startEdit(c) {
    setEditingId(c.id);
    setForm({ ...empty, ...c, reviewed: !!c.reviewed, improved: !!c.improved });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this capsule? This cannot be undone.')) return;
    await fetch(`/api/capsules/${id}`, { method: 'DELETE' });
    loadCapsules();
  }

  async function handleLogout() {
    if (!window.confirm('Log out of AI Capsule?')) return;
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  function formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts.includes('Z') ? ts : ts + 'Z').toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    });
  }

  if (!user) return null;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h2 style={{ margin: 0 }}>
          <span style={{ color: 'var(--accent-green-text)' }}>AI</span> Capsule
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Signed in as <strong>{user.login}</strong></span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main style={s.main}>
        <section style={s.formCard}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit capsule' : 'New capsule'}</h3>
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.row}>
              <input name="project_name" placeholder="Project name" value={form.project_name} onChange={handleChange} required />
              <input name="prompt_version" placeholder="Version (v1, v2...)" value={form.prompt_version} onChange={handleChange} style={{ maxWidth: 140 }} />
            </div>
            <input name="prompt_title" placeholder="Prompt title" value={form.prompt_title} onChange={handleChange} required />
            <textarea name="prompt_text" placeholder="Prompt text" value={form.prompt_text} onChange={handleChange} required />
            <textarea name="response_summary" placeholder="Response summary" value={form.response_summary} onChange={handleChange} />
            <div style={s.row}>
              <select name="category" value={form.category} onChange={handleChange} required>
                <option>Coding</option>
                <option>Writing</option>
                <option>Research</option>
              </select>
              <select name="usefulness" value={form.usefulness} onChange={handleChange} required>
                <option>Good</option>
                <option>Needs Improvement</option>
              </select>
            </div>
            <div style={s.row}>
              <label style={s.checkboxLabel}>
                <input type="checkbox" name="reviewed" checked={form.reviewed} onChange={handleChange} style={{ width: 'auto' }} />
                Reviewed
              </label>
              <label style={s.checkboxLabel}>
                <input type="checkbox" name="improved" checked={form.improved} onChange={handleChange} style={{ width: 'auto' }} />
                Improved
              </label>
            </div>
            <input name="screenshot_url" placeholder="Screenshot URL (optional)" value={form.screenshot_url} onChange={handleChange} />
            <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
            <div style={s.row}>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                {editingId ? 'Save changes' : 'Create capsule'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section style={{ flex: 1 }}>
          <h3>Your capsules ({capsules.length})</h3>
          {capsules.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No capsules yet — create your first one.</p>
          )}
          <div style={s.list}>
            {capsules.map(c => (
              <div key={c.id} style={s.capsuleCard}>
                <div style={s.capsuleHeader}>
                  <strong>{c.prompt_title}</strong>
                  <span style={s.badge}>{c.prompt_version || '—'}</span>
                </div>
                <div style={s.meta}>
                  {c.project_name} · {c.category || 'Uncategorised'} · {c.usefulness || '—'}
                </div>
                <p style={s.promptText}>{c.prompt_text}</p>
                {c.response_summary && <p style={s.summary}><em>Response:</em> {c.response_summary}</p>}
                <div style={s.flags}>
                  <span style={c.reviewed ? s.flagOn : s.flagOff}>{c.reviewed ? '✓ Reviewed' : 'Not reviewed'}</span>
                  <span style={c.improved ? s.flagOn : s.flagOff}>{c.improved ? '✓ Improved' : 'Not improved'}</span>
                </div>
                {c.notes && <p style={s.notes}>{c.notes}</p>}
                <div style={s.footer}>
                  <span style={s.timestamp}>Created {formatDate(c.created_at)}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg-primary)' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
  },
  main: {
    display: 'flex', gap: '2rem', padding: '2rem', maxWidth: 1100,
    margin: '0 auto', alignItems: 'flex-start', flexWrap: 'wrap',
  },
  formCard: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 12, padding: '1.5rem', width: 340, flexShrink: 0,
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  row: { display: 'flex', gap: '0.6rem' },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    color: 'var(--text-secondary)', fontSize: '0.9rem',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
  capsuleCard: {
    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 10, padding: '1rem 1.25rem',
  },
  capsuleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    fontSize: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
    borderRadius: 20, padding: '0.1rem 0.6rem', color: 'var(--text-secondary)',
  },
  meta: { fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0.6rem' },
  promptText: { margin: '0.3rem 0', lineHeight: 1.4 },
  summary: { margin: '0.3rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' },
  flags: { display: 'flex', gap: '0.5rem', margin: '0.5rem 0' },
  flagOn: {
    fontSize: '0.75rem', color: 'var(--accent-green-text)', border: '1px solid var(--accent-green)',
    borderRadius: 20, padding: '0.1rem 0.6rem',
  },
  flagOff: {
    fontSize: '0.75rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)',
    borderRadius: 20, padding: '0.1rem 0.6rem',
  },
  notes: { fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0.4rem 0' },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)',
  },
  timestamp: { fontSize: '0.75rem', color: 'var(--text-secondary)' },
};