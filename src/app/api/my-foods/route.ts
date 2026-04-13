import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const tagFilter = searchParams.get('tag')?.trim();

  const filters: string[] = [
    'filter[deleted_at][_null]=true', // Exclude soft-deleted foods
  ];
  if (query) {
    filters.push(`filter[description][_icontains]=${encodeURIComponent(query)}`);
  }
  if (tagFilter) {
    // Filter foods that have this tag via the M2M junction
    filters.push(`filter[food_tags][nx_food_tags_id][name][_eq]=${encodeURIComponent(tagFilter)}`);
  }

  const fields = 'id,description,brand_name,energy_kcal,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,default_serving_size,default_serving_unit,source,food_tags.nx_food_tags_id.id,food_tags.nx_food_tags_id.name,food_tags.nx_food_tags_id.color';
  const url = `${DIRECTUS_URL}/items/nx_foods?fields=${fields}&sort=description&limit=100${filters.length ? '&' + filters.join('&') : ''}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to fetch foods' }, { status: 500 });
    }

    const data = await res.json();
    const foods = (data.data || []).map((f: Record<string, unknown>) => {
      // Flatten M2M tags into a simple array
      const foodTags = f.food_tags as { nx_food_tags_id: { id: string; name: string; color: string } }[] || [];
      return {
        ...f,
        tags: foodTags.map((t) => t.nx_food_tags_id).filter(Boolean),
        food_tags: undefined,
      };
    });

    // Get user's tag list for filter pills
    const tagsRes = await fetch(
      `${DIRECTUS_URL}/items/nx_food_tags?filter[user][_eq]=${session.user.id}&fields=name,color&sort=sort,name&limit=100`,
      { headers: { Authorization: `Bearer ${session.token}` } },
    );
    let userTags: { name: string; color: string | null }[] = [];
    if (tagsRes.ok) {
      const tagsData = await tagsRes.json();
      userTags = tagsData.data || [];
    }

    return NextResponse.json({
      foods,
      tags: userTags,
      total: foods.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
