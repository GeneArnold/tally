import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// GET — single meal with items
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const fields = 'id,name,description,default_meal_type,user,items.id,items.quantity,items.food.id,items.food.description,items.food.brand_name,items.food.energy_kcal,items.food.protein_g,items.food.carbs_g,items.food.fat_g,meal_tags.id,meal_tags.nx_food_tags_id.id,meal_tags.nx_food_tags_id.name,meal_tags.nx_food_tags_id.color';

  const res = await fetch(`${DIRECTUS_URL}/items/nx_meals/${id}?fields=${fields}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  const data = await res.json();

  // Flatten tags
  const mealTags = (data.data.meal_tags || []).map((t: { nx_food_tags_id: { id: string; name: string; color: string } }) => t.nx_food_tags_id).filter(Boolean);
  data.data.tag_ids = mealTags.map((t: { id: string }) => t.id);
  data.data.tag_objects = mealTags;
  return NextResponse.json({ meal: data.data });
}

// PATCH — update meal name/description/type
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { tag_ids, ...mealFields } = await request.json();

  if (Object.keys(mealFields).length > 0) {
    const res = await fetch(`${DIRECTUS_URL}/items/nx_meals/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mealFields),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to update' }, { status: 500 });
    }
  }

  // Update tags via junction if provided
  if (tag_ids !== undefined) {
    // Delete existing junction records one by one (Directus batch delete needs IDs in URL)
    const existingRes = await fetch(
      `${DIRECTUS_URL}/items/nx_meals_nx_food_tags?filter[nx_meals_id][_eq]=${id}&fields=id&limit=-1`,
      { headers: { Authorization: `Bearer ${session.token}` } },
    );
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      const existingIds = (existingData.data || []).map((r: { id: number }) => r.id);
      for (const eid of existingIds) {
        await fetch(`${DIRECTUS_URL}/items/nx_meals_nx_food_tags/${eid}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      }
    }
    // Create new junction records
    if (tag_ids.length > 0) {
      await fetch(`${DIRECTUS_URL}/items/nx_meals_nx_food_tags`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(tag_ids.map((tagId: string) => ({ nx_meals_id: id, nx_food_tags_id: tagId }))),
      });
    }
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
