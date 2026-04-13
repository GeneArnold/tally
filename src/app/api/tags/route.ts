import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// GET — list user's tags
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Use Directus REST filter — _null needs special handling
  const url = `${DIRECTUS_URL}/items/nx_food_tags?filter[user][_eq]=${session.user.id}&fields=id,name,color,sort&sort=sort,name&limit=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  const data = await res.json();
  return NextResponse.json({ tags: data.data || [] });
}

// POST — create a new tag
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Tag name required' }, { status: 400 });

  const res = await fetch(`${DIRECTUS_URL}/items/nx_food_tags`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name.trim().toLowerCase(),
      color: color || '#3B82F6',
      sort: 0,
      user: session.user.id,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to create tag' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ tag: data.data });
}

// DELETE — soft delete a tag
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { tagId } = await request.json();
  if (!tagId) return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });

  const res = await fetch(`${DIRECTUS_URL}/items/nx_food_tags/${tagId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  return NextResponse.json({ success: true });
}
