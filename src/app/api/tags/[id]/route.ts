import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const res = await fetch(`${DIRECTUS_URL}/items/nx_food_tags/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to update tag' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ tag: data.data });
}
