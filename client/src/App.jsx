import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          <span style={{ color: 'var(--accent-green-text)' }}>AI</span> Capsule
        </h1>
        <p style={styles.subtitle}>
          Save, review and improve the AI prompts you actually use — in one
          private, authenticated library.
        </p>
        <Link to="/login">
          <button className="btn-primary" style={styles.cta}>Sign in to get started</button>
        </Link>
      </div>
    </div>
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
    maxWidth: 480,
    textAlign: 'center',
    padding: '2.5rem',
    border: '1px solid var(--border-color)',
    borderRadius: 12,
    background: 'var(--bg-secondary)',
  },
  title: {
    fontSize: '2.2rem',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '1.75rem',
    lineHeight: 1.5,
  },
  cta: {
    fontSize: '1rem',
    padding: '0.65rem 1.5rem',
  },
};