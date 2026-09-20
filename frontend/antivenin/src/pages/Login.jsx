import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await login(email, password);

    setSubmitting(false);

    if (result.ok) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Hospital staff log in</h1>
      <p className="mb-8 text-ink/70">
        Sign in to update your hospital's antivenom stock.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] bg-surface p-8 border border-ink/10">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-ink outline-none focus:border-select"
            placeholder="staff@hospital.org"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-ink outline-none focus:border-select"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-warning-text">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-press w-full rounded-full bg-olive py-3 font-semibold text-cream hover:bg-olive-dark disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="text-center text-sm text-ink/70">
          New hospital?{' '}
          <Link to="/register" className="font-semibold text-olive">
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
}