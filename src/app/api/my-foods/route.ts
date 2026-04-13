import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const tagFilter = searchParams.get('tag')?.trim();

  const filters: string[] = [];
  if (query) {
    filters.push(`filter[description][_icontains]=${encodeURIComponent(query)}`);
  }

  const fields = 'id,description,brand_name,energy_kcal,protein_g,carbs_g,fat_g,fiber_g,sugar_g,sodium_mg,default_serving_size,default_serving_unit,tags,source';
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
    let foods = data.data || [];

    // Client-side tag filter
    if (tagFilter) {
      foods = foods.filter((f: Record<string, unknown>) => {
        const tags = f.tags as string[] | null;
        return tags && tags.includes(tagFilter);
      });
    }

    // Get user's tags from nx_food_tags (not from food-level tags)
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
