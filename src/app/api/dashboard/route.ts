import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Accept date from client (local timezone) — don't calculate server-side (UTC)
  const { searchParams } = new URL(request.url);
  const clientDate = searchParams.get('date');

  // Get profile
  const profileRes = await fetch(
    `${DIRECTUS_URL}/items/nx_health_profile?filter[user][_eq]=${session.user.id}&fields=daily_calorie_goal,goal_protein_g,goal_carbs_g,goal_fat_g,current_weight_lbs,goal_weight_lbs&limit=1`,
    { headers: { Authorization: `Bearer ${session.token}` } },
  );
  let profile = null;
  if (profileRes.ok) {
    const pd = await profileRes.json();
    profile = pd.data?.[0] || null;
  }

  // Use client-provided date (local timezone) or fall back to server date
  const now = new Date();
  const serverToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const today = clientDate || serverToday;

  const totalsRes = await fetch(
    `${DIRECTUS_URL}/items/nx_diary_entries?filter[date][_eq]=${today}&filter[user][_eq]=${session.user.id}&filter[type][_eq]=diary_meal&aggregate[sum]=total_calories,total_protein_g,total_carbs_g,total_fat_g`,
    { headers: { Authorization: `Bearer ${session.token}` } },
  );
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (totalsRes.ok) {
    const td = await totalsRes.json();
    const sums = td.data?.[0]?.sum || {};
    totals = {
      calories: parseFloat(sums.total_calories) || 0,
      protein: parseFloat(sums.total_protein_g) || 0,
      carbs: parseFloat(sums.total_carbs_g) || 0,
      fat: parseFloat(sums.total_fat_g) || 0,
    };
  }

  const response = NextResponse.json({
    user: {
      first_name: session.user.first_name,
      last_name: session.user.last_name,
    },
    profile,
    totals,
    hasProfile: !!profile,
  });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  return response;
}
