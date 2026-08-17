'use client';
import { useState } from 'react';
import styles from './CardDetail.module.css';

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" className={styles.shareBtn} onClick={copy} data-copied={copied}>
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}
