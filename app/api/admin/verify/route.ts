import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD || '';

  if (!expected) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let password = '';
  try {
    const body = (await req.json()) as unknown;
    if (typeof body === 'object' && body !== null && 'password' in body) {
      const value = (body as { password: unknown }).password;
      if (typeof value === 'string') password = value;
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const match = a.length === b.length && timingSafeEqual(a, b);

  if (!match) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
