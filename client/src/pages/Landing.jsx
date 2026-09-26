import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
      <h1>AI Capsule</h1>
      <p>Save, review and improve the AI prompts you actually use.</p>
      <Link to="/login">Sign in to get started</Link>
    </div>
  );
}