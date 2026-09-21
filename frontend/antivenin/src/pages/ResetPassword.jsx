import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    // Supabase already reads the recovery token from the URL and starts a
    // temporary session for this tab (handled automatically by the client
    // in src/lib/supabase.js). This just sets the new password on it.
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setSubmitting(false);

    if (updateError) {
      setError(
        updateError.message ||
          'Could not reset your password. The link may have expired — request a new one.'
      );
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 pb-24">
        <h1 className="mb-2 text-3xl text-ink">Password updated</h1>
        <p className="text-ink/70">Redirecting you to log in…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Set a new password</h1>
      <p className="mb-8 text-ink/70">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] bg-surface p-8 border border-ink/10">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-ink outline-none focus:border-select"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-ink outline-none focus:border-select"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-warning-text">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-press w-full rounded-full bg-olive py-3 font-semibold text-cream hover:bg-olive-dark disabled:opacity-60"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>

        <p className="text-center text-sm text-ink/70">
          <Link to="/login" className="font-semibold text-olive">
            Back to log in
          </Link>
        </p>
      </form>
    </div>
  );
}