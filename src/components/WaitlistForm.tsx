'use client';
import { useState } from 'react';
import styles from './WaitlistForm.module.css';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: wire to email provider / API route. For now, optimistic confirm.
    setDone(true);
  }

  if (done) {
    return (
      <div className={styles.success}>
        <strong>You&apos;re on the list. 🎉</strong>
        <p>We&apos;ll email <span className="mono">{email}</span> the moment packs drop.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email address"
      />
      <button type="submit" className="btn-primary">Notify me</button>
    </form>
  );
}
