import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// POST — add foods to a meal
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: mealId } = await params;
  const { food_items } = await request.json();

  if (!food_items || food_items.length === 0) {
    return NextResponse.json({ error: 'No foods provided' }, { status: 400 });
  }

  const items = food_items.map((item: { food_id: string; quantity: number }) => ({
    meal: mealId,
    food: item.food_id,
    quantity: item.quantity || 1,
  }));

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meal_items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to add items' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove a meal item
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await request.json();
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meal_items/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
