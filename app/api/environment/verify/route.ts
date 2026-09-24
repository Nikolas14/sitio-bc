import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

const environmentVariables = {
  escritorio: 'OFFICE_PASSWORD',
  galpao: 'GALPAO_PASSWORD',
} as const;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const role = 'role' in body ? (body as { role: unknown }).role : '';
  const password = 'password' in body ? (body as { password: unknown }).password : '';
  if ((role !== 'escritorio' && role !== 'galpao') || typeof password !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Temporary fallback: both environments use the existing admin password
  // until dedicated OFFICE_PASSWORD and GALPAO_PASSWORD values are configured.
  const expected = process.env[environmentVariables[role]] || process.env.ADMIN_PASSWORD || '';
  if (!expected) return NextResponse.json({ ok: false }, { status: 500 });

  const receivedBuffer = Buffer.from(password);
  const expectedBuffer = Buffer.from(expected);
  const ok = receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);

  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
