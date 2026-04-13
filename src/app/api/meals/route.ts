import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

// GET — list user's meals
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fields = 'id,name,description,default_meal_type,items.id,items.quantity,items.food.id,items.food.description,items.food.energy_kcal';
  const params = new URLSearchParams({
    'fields': fields,
    'sort': 'name',
    'limit': '100',
  });
  // Show user's meals + shared meals (user=null)
  const url = `${DIRECTUS_URL}/items/nx_meals?${params}&filter[_or][0][user][_eq]=${session.user.id}&filter[_or][1][user][_null]=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ meals: data.data || [] });
}

// POST — create a new meal
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, default_meal_type, food_items } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
  }

  try {
    // Create the meal
    const mealRes = await fetch(`${DIRECTUS_URL}/items/nx_meals`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description?.trim() || null,
        default_meal_type: default_meal_type || null,
        user: session.user.id,
      }),
    });

    if (!mealRes.ok) {
      const err = await mealRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to create meal' }, { status: 500 });
    }

    const mealData = await mealRes.json();
    const mealId = mealData.data.id;

    // Add food items
    if (food_items && food_items.length > 0) {
      const items = food_items.map((item: { food_id: string; quantity: number }) => ({
        meal: mealId,
        food: item.food_id,
        quantity: item.quantity || 1,
      }));

      await fetch(`${DIRECTUS_URL}/items/nx_meal_items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      });
    }

    return NextResponse.json({ meal: mealData.data });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
