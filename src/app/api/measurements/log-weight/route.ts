import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { weight } = await request.json();

  if (!weight || weight <= 0) {
    return NextResponse.json({ error: 'Invalid weight' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    // Create measurement record
    const measRes = await fetch(`${DIRECTUS_URL}/items/nx_measurements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: today,
        type: 'weight',
        value: weight,
        unit: 'lbs',
        user: session.user.id,
      }),
    });

    if (!measRes.ok) {
      const err = await measRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.errors?.[0]?.message || 'Failed to log weight' }, { status: 500 });
    }

    // Update current_weight_lbs on health profile
    const profileParams = new URLSearchParams({
      'filter[user][_eq]': session.user.id,
      'fields': 'id',
      'limit': '1',
    });
    const profileRes = await fetch(`${DIRECTUS_URL}/items/nx_health_profile?${profileParams}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const profileData = await profileRes.json();

    if (profileData.data?.[0]?.id) {
      await fetch(`${DIRECTUS_URL}/items/nx_health_profile/${profileData.data[0].id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current_weight_lbs: weight }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
