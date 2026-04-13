import { createDirectus, rest, authentication } from '@directus/sdk';
import type { Schema } from '@/types/directus';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// Public client for server-side operations (no auth)
export function createPublicClient() {
  return createDirectus<Schema>(directusUrl).with(rest());
}

// Authenticated client for user-scoped operations
export function createAuthClient(token: string) {
  return createDirectus<Schema>(directusUrl)
    .with(rest())
    .with(authentication('json'));
}

// Server-side client with token injection
export function createServerClient(token: string) {
  const client = createDirectus<Schema>(directusUrl).with(rest());
  // Attach token to all requests
  return {
    client,
    token,
    url: directusUrl,
  };
}

export { directusUrl };
