import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let email = '';
  let source = 'collect';

  try {
    const body = await request.json();
    email = String(body.email ?? '').trim().toLowerCase();
    if (body.source) source = String(body.source).slice(0, 40);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  try {
    await db().execute({
      // UPSERT: a repeat signup is a success, not an error.
      sql: 'INSERT INTO waitlist (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING',
      args: [email, source],
    });
  } catch (err) {
    console.error('waitlist insert failed', err);
    return NextResponse.json({ error: 'Something went wrong. Try again later.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
