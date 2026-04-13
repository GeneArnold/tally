import { cookies } from 'next/headers';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';
const ACCESS_TOKEN_COOKIE = 'health_access_token';
const REFRESH_TOKEN_COOKIE = 'health_refresh_token';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires: number;
}

interface DirectusUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export async function login(email: string, password: string): Promise<{ user: DirectusUser; error?: never } | { user?: never; error: string }> {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.errors?.[0]?.message || 'Invalid credentials' };
  }

  const { data } = await res.json() as { data: AuthTokens };
  await setTokenCookies(data);

  const user = await getUser(data.access_token);
  if (!user) return { error: 'Failed to fetch user profile' };

  return { user };
}

export async function signup(email: string, password: string, firstName: string, lastName: string): Promise<{ user: DirectusUser; error?: never } | { user?: never; error: string }> {
  // Create user in Directus
  const res = await fetch(`${DIRECTUS_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      role: process.env.DIRECTUS_ATHLETE_ROLE_ID,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { error: body?.errors?.[0]?.message || 'Registration failed' };
  }

  // Auto-login after signup
  return login(email, password);
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await fetch(`${DIRECTUS_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getSession(): Promise<{ token: string; user: DirectusUser } | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) {
    // Try refresh
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) return null;

    const refreshed = await refreshAccessToken(refreshToken);
    if (!refreshed) return null;

    await setTokenCookies(refreshed);
    token = refreshed.access_token;
  }

  const user = await getUser(token);
  if (!user) return null;

  return { token, user };
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token ?? null;
}

async function getUser(token: string): Promise<DirectusUser | null> {
  const res = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email,first_name,last_name,role`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  const { data } = await res.json();
  return data;
}

async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
  });

  if (!res.ok) return null;
  const { data } = await res.json();
  return data;
}

async function setTokenCookies(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();
  // Only set Secure flag when served over HTTPS
  const secure = process.env.COOKIE_SECURE === 'true';

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(tokens.expires / 1000),
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
