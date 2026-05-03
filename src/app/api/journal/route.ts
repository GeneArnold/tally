import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      'filter[entry_date][_eq]': date,
      'filter[user_created][_eq]': session.user.id,
      'filter[deleted_at][_null]': 'true',
      'fields': 'id,entry_date,entry_time,content,date_created',
      'sort': 'entry_time',
      'limit': '100',
    });

    const res = await fetch(`${DIRECTUS_URL}/items/nx_journal_entries?${params}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to fetch journal entries' }, { status: 500 });
    }

    const { data } = await res.json();
    return NextResponse.json({ entries: data || [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { entry_date, entry_time, content } = await request.json();

  if (!entry_date || !entry_time || !content?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: entry_date, entry_time, content' }, { status: 400 });
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/items/nx_journal_entries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entry_date,
        entry_time,
        content: content.trim(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to create journal entry' }, { status: 500 });
    }

    const { data } = await res.json();
    return NextResponse.json({ entry: data });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
