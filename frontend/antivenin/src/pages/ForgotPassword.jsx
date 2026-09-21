import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 pb-24">
        <h1 className="mb-2 text-3xl text-ink">Check your email</h1>
        <p className="text-ink/70">
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="mt-8 inline-block text-sm font-semibold text-olive">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 pb-24">
      <h1 className="mb-2 text-3xl text-ink">Reset your password</h1>
      <p className="mb-8 text-ink/70">
        Enter the email you registered with. We'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] bg-surface p-8 border border-ink/10">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-ink/20 bg-cream px-4 py-2.5 text-ink outline-none focus:border-select"
            placeholder="staff@hospital.org"
            autoComplete="email"
          />
        </div>

        {error && <p className="text-sm text-warning-text">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-press w-full rounded-full bg-olive py-3 font-semibold text-cream hover:bg-olive-dark disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
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