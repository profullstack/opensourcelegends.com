'use client';
import { useState } from 'react';
import styles from './WaitlistForm.module.css';

export default function WaitlistForm({ source = 'collect' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Something went wrong. Try again later.');
      }
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (status === 'done') {
    return (
      <div className={styles.success}>
        <strong>You&apos;re on the list. 🎉</strong>
        <p>We&apos;ll email <span className="mono">{email}</span> the moment packs drop.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          disabled={status === 'loading'}
        />
        <button type="submit" className="btn-primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Joining…' : 'Notify me'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
