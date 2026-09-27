export default function Login() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <p style={styles.text}>Continue with your GitHub account to access your capsules.</p>
        <a href="/api/auth/github" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={styles.btn}>
            <GitHubMark /> Continue with GitHub
          </button>
        </a>
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: 8 }}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
      0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
  },
  card: {
    maxWidth: 380,
    width: '100%',
    textAlign: 'center',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-secondary)',
  },
  text: {
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
  },
  btn: {
    width: '100%',
    fontSize: '0.95rem',
    padding: '0.65rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};