import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const res = await fetch(
    `${DIRECTUS_URL}/items/nx_foods/${id}?fields=*,food_tags.id,food_tags.nx_food_tags_id.id,food_tags.nx_food_tags_id.name,food_tags.nx_food_tags_id.color`,
    { headers: { Authorization: `Bearer ${session.token}` } },
  );

  if (!res.ok) return NextResponse.json({ error: 'Food not found' }, { status: 404 });

  const data = await res.json();
  const food = data.data;

  // Flatten M2M tags
  const foodTags = food.food_tags as { id: number; nx_food_tags_id: { id: string; name: string; color: string } }[] || [];
  food.tag_ids = foodTags.map((t) => t.nx_food_tags_id?.id).filter(Boolean);
  food.tag_names = foodTags.map((t) => t.nx_food_tags_id?.name).filter(Boolean);
  food.tag_objects = foodTags.map((t) => t.nx_food_tags_id).filter(Boolean);

  return NextResponse.json({ food });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Separate tag_ids from other fields
  const { tag_ids, ...foodFields } = body;

  // Update food fields
  if (Object.keys(foodFields).length > 0) {
    const res = await fetch(`${DIRECTUS_URL}/items/nx_foods/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(foodFields),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to update' }, { status: 500 });
    }
  }

  // Update tags via junction if tag_ids provided
  if (tag_ids !== undefined) {
    // Delete existing junction records one by one
    const existingRes = await fetch(
      `${DIRECTUS_URL}/items/nx_foods_nx_food_tags?filter[nx_foods_id][_eq]=${id}&fields=id&limit=-1`,
      { headers: { Authorization: `Bearer ${session.token}` } },
    );
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      const existingIds = (existingData.data || []).map((r: { id: number }) => r.id);
      for (const eid of existingIds) {
        await fetch(`${DIRECTUS_URL}/items/nx_foods_nx_food_tags/${eid}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      }
    }

    // Create new junction records
    if (tag_ids.length > 0) {
      const junctionRecords = tag_ids.map((tagId: string) => ({
        nx_foods_id: id,
        nx_food_tags_id: tagId,
      }));
      await fetch(`${DIRECTUS_URL}/items/nx_foods_nx_food_tags`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(junctionRecords),
      });
    }
  }

  return NextResponse.json({ success: true });
}
