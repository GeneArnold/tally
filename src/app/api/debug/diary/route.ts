import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No session', directusUrl: DIRECTUS_URL });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '2026-04-13';

  const fields = [
    'id', 'diary_meal', 'total_calories',
    'food_entries.id', 'food_entries.quantity',
    'food_entries.energy_kcal', 'food_entries.food.id', 'food_entries.food.description',
  ].join(',');

  const url = `${DIRECTUS_URL}/items/nx_diary_entries?filter[date][_eq]=${date}&filter[user][_eq]=${session.user.id}&filter[type][_eq]=diary_meal&fields=${fields}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  const status = res.status;
  const body = await res.json();

  return NextResponse.json({
    directusUrl: DIRECTUS_URL,
    userId: session.user.id,
    tokenPrefix: session.token.substring(0, 20) + '...',
    queryUrl: url,
    status,
    entryCount: body.data?.length || 0,
    entries: body.data,
  });
}
