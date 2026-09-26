require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET, BASE_URL } = process.env;
const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());

// ---------- public ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ---------- OAuth: start login ----------
app.get('/api/auth/github', (req, res) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/github/callback`,
    scope: 'read:user',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ---------- OAuth: callback ----------
app.get('/api/auth/github/callback', async (req, res) => {
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: req.query.code,
      }),
    }).then(r => r.json());

    if (!tokenRes.access_token) throw new Error('no access token');

    const ghUser = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenRes.access_token}`,
        'User-Agent': 'ai-capsule-app',
      },
    }).then(r => r.json());

    const appToken = jwt.sign(
      { sub: String(ghUser.id), login: ghUser.login },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', appToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth callback failed:', err);
    res.redirect('/login?error=1');
  }
});

// ---------- logout ----------
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'lax' });
  res.json({ ok: true });
});

// ---------- JWT middleware ----------
function requireAuth(req, res, next) {
  try {
    const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ---------- who am I ----------
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ login: req.user.login });
});

// ---------- CRUD ----------
const FIELDS = [
  'project_name', 'prompt_title', 'prompt_version', 'prompt_text',
  'response_summary', 'category', 'usefulness', 'reviewed', 'improved',
  'screenshot_url', 'notes',
];

function toRow(body) {
  return FIELDS.map(f => {
    if (f === 'reviewed' || f === 'improved') return body[f] ? 1 : 0;
    return body[f] ?? null;
  });
}

app.get('/api/capsules', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY id DESC').all(req.user.sub);
  res.json(rows);
});

app.post('/api/capsules', requireAuth, (req, res) => {
  const { project_name, prompt_title, prompt_text } = req.body;
  if (!project_name || !prompt_title || !prompt_text) {
    return res.status(400).json({ error: 'project_name, prompt_title and prompt_text are required' });
  }
  const stmt = db.prepare(
    `INSERT INTO capsules (user_id, ${FIELDS.join(', ')}) VALUES (?, ${FIELDS.map(() => '?').join(', ')})`
  );
  const info = stmt.run(req.user.sub, ...toRow(req.body));
  const created = db.prepare('SELECT * FROM capsules WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/capsules/:id', requireAuth, (req, res) => {
  const stmt = db.prepare(
    `UPDATE capsules SET ${FIELDS.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND user_id = ?`
  );
  const info = stmt.run(...toRow(req.body), req.params.id, req.user.sub);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(db.prepare('SELECT * FROM capsules WHERE id = ?').get(req.params.id));
});

app.delete('/api/capsules/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.sub);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// ---------- serve React build ----------
const distPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(distPath));
app.use((req, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));