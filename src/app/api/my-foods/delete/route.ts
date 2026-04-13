import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodId } = await request.json();

  if (!foodId) {
    return NextResponse.json({ error: 'Missing foodId' }, { status: 400 });
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/nx_foods/${foodId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to delete food' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
