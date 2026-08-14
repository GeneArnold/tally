import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, sum } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Accept date from client (local timezone) — don't calculate server-side (UTC)
  const { searchParams } = new URL(request.url);
  const clientDate = searchParams.get('date');

  // Use client-provided date (local timezone) or fall back to server date
  const now = new Date();
  const serverToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const today = clientDate || serverToday;

  // Get profile
  const profile = await db
    .select({
      daily_calorie_goal: schema.healthProfiles.dailyCalorieGoal,
      goal_protein_g: schema.healthProfiles.goalProteinG,
      goal_carbs_g: schema.healthProfiles.goalCarbsG,
      goal_fat_g: schema.healthProfiles.goalFatG,
      current_weight_lbs: schema.healthProfiles.currentWeightLbs,
      goal_weight_lbs: schema.healthProfiles.goalWeightLbs,
    })
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, session.user.id))
    .get();

  // Get totals for the day
  const totalsResult = await db
    .select({
      calories: sum(schema.diaryEntries.totalCalories),
      protein: sum(schema.diaryEntries.totalProteinG),
      carbs: sum(schema.diaryEntries.totalCarbsG),
      fat: sum(schema.diaryEntries.totalFatG),
    })
    .from(schema.diaryEntries)
    .where(
      and(
        eq(schema.diaryEntries.userId, session.user.id),
        eq(schema.diaryEntries.date, today),
        eq(schema.diaryEntries.type, 'diary_meal'),
      ),
    )
    .get();

  const totals = {
    calories: Number(totalsResult?.calories || 0),
    protein: Number(totalsResult?.protein || 0),
    carbs: Number(totalsResult?.carbs || 0),
    fat: Number(totalsResult?.fat || 0),
  };

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
