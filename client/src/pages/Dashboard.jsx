import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const empty = {
  project_name: '', prompt_title: '', prompt_version: '', prompt_text: '',
  response_summary: '', category: '', usefulness: '', reviewed: false,
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
    await fetch(`/api/capsules/${id}`, { method: 'DELETE' });
    loadCapsules();
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    navigate('/login');
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Welcome, {user.login}</h2>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', margin: '1.5rem 0' }}>
        <input name="project_name" placeholder="Project name" value={form.project_name} onChange={handleChange} required />
        <input name="prompt_title" placeholder="Prompt title" value={form.prompt_title} onChange={handleChange} required />
        <input name="prompt_version" placeholder="Version (v1, v2...)" value={form.prompt_version} onChange={handleChange} />
        <textarea name="prompt_text" placeholder="Prompt text" value={form.prompt_text} onChange={handleChange} required />
        <textarea name="response_summary" placeholder="Response summary" value={form.response_summary} onChange={handleChange} />
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">Category</option>
          <option>Coding</option>
          <option>Writing</option>
          <option>Research</option>
        </select>
        <select name="usefulness" value={form.usefulness} onChange={handleChange}>
          <option value="">Usefulness</option>
          <option>Good</option>
          <option>Needs Improvement</option>
        </select>
        <label><input type="checkbox" name="reviewed" checked={form.reviewed} onChange={handleChange} /> Reviewed</label>
        <label><input type="checkbox" name="improved" checked={form.improved} onChange={handleChange} /> Improved</label>
        <input name="screenshot_url" placeholder="Screenshot URL (optional)" value={form.screenshot_url} onChange={handleChange} />
        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <button type="submit">{editingId ? 'Update' : 'Create'} capsule</button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm(empty); }}>
            Cancel edit
          </button>
        )}
      </form>

      <h3>Your capsules</h3>
      {capsules.map(c => (
        <div key={c.id} style={{ border: '1px solid #ccc', padding: '0.75rem', marginBottom: '0.5rem' }}>
          <strong>{c.prompt_title}</strong> ({c.project_name}, {c.prompt_version})
          <p>{c.prompt_text}</p>
          <button onClick={() => startEdit(c)}>Edit</button>
          <button onClick={() => handleDelete(c.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}