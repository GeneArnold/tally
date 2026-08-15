import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { checkRateLimit, clearRateLimit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown';
  return forwarded.split(',')[0].trim();
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);

  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil(retryAfterSec / 60)} minutes.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const result = await login(email, password);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  clearRateLimit(`login:${ip}`);
  return NextResponse.json({ user: result.user });
}
