export default function Login() {
  return (
    <div style={{ maxWidth: 400, margin: '4rem auto', textAlign: 'center' }}>
      <h2>Log in</h2>
      <a href="/api/auth/github">
        <button style={{ padding: '0.75rem 1.5rem' }}>Continue with GitHub</button>
      </a>
    </div>
  );
}