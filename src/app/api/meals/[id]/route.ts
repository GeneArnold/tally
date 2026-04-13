import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// GET — single meal with items
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const fields = 'id,name,description,default_meal_type,user,items.id,items.quantity,items.food.id,items.food.description,items.food.brand_name,items.food.energy_kcal,items.food.protein_g,items.food.carbs_g,items.food.fat_g';

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meals/${id}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  const data = await res.json();
  return NextResponse.json({ meal: data.data });
}

// PATCH — update meal name/description/type
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meals/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE — soft delete
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meals/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deleted_at: new Date().toISOString() }),
  });

  if (!res.ok) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  return NextResponse.json({ success: true });
}
