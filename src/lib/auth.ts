import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const ACCESS_TOKEN_COOKIE = 'health_access_token';
const REFRESH_TOKEN_COOKIE = 'health_refresh_token';

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: string }> {
  const user = db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();

  if (!user) return { error: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: 'Invalid credentials' };

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
  };

  await setTokenCookies(user.id);
  return { user: authUser };
}

export async function signup(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<{ user: AuthUser; error?: never } | { user?: never; error: string }> {
  const existing = db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase())).get();
  if (existing) return { error: 'Email already registered' };

  const passwordHash = await bcrypt.hash(password, 12);

  const user = db.insert(schema.users).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    role: 'athlete',
  }).returning().get();

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
  };

  await setTokenCookies(user.id);
  return { user: authUser };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getSession(): Promise<{ token: string; user: AuthUser } | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (accessToken) {
    const payload = verifyToken(accessToken, 'access');
    if (payload) {
      const user = getUserById(payload.userId);
      if (user) return { token: accessToken, user };
    }
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return null;

  const payload = verifyToken(refreshToken, 'refresh');
  if (!payload) return null;

  const user = getUserById(payload.userId);
  if (!user) return null;

  await setTokenCookies(payload.userId);

  const newAccessToken = signToken(payload.userId, 'access');
  return { token: newAccessToken, user };
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}

function getUserById(id: string): AuthUser | null {
  const user = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    role: user.role,
  };
}

function signToken(userId: string, type: 'access' | 'refresh'): string {
  const expiresIn = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return jwt.sign({ userId, type } satisfies TokenPayload, JWT_SECRET, { expiresIn });
}

function verifyToken(token: string, expectedType: 'access' | 'refresh'): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    if (payload.type !== expectedType) return null;
    return payload;
  } catch {
    return null;
  }
}

async function setTokenCookies(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.COOKIE_SECURE === 'true';

  const accessToken = signToken(userId, 'access');
  const refreshToken = signToken(userId, 'refresh');

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
