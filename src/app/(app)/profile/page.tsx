import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, schema } from '@/lib/db';
import { eq, and, asc } from 'drizzle-orm';
import ProfileForm from '@/components/profile/ProfileForm';
import WeightChart from '@/components/profile/WeightChart';
import TagManager from '@/components/profile/TagManager';
import LogoutButton from '@/components/profile/LogoutButton';
import ChangePassword from '@/components/profile/ChangePassword';

export const dynamic = 'force-dynamic';

function getProfile(userId: string) {
  const row = db.select().from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();
  if (!row) return null;
  return {
    id: row.id,
    user: row.userId,
    date_of_birth: row.dateOfBirth ?? undefined,
    sex: row.sex ?? undefined,
    height_ft: row.heightFt ?? undefined,
    height_in: row.heightIn ?? undefined,
    starting_weight_lbs: row.startingWeightLbs ?? undefined,
    current_weight_lbs: row.currentWeightLbs ?? undefined,
    goal_weight_lbs: row.goalWeightLbs ?? undefined,
    goal_target_date: row.goalTargetDate ?? undefined,
    activity_level: row.activityLevel ?? undefined,
    weekly_goal: row.weeklyGoal ?? undefined,
    daily_calorie_goal: row.dailyCalorieGoal ?? undefined,
    daily_step_goal: row.dailyStepGoal ?? undefined,
    goal_water_oz: row.goalWaterOz ?? undefined,
    goal_protein_g: row.goalProteinG ?? undefined,
    goal_carbs_g: row.goalCarbsG ?? undefined,
    goal_fat_g: row.goalFatG ?? undefined,
    goal_fiber_g: row.goalFiberG ?? undefined,
    goal_sodium_mg: row.goalSodiumMg ?? undefined,
    goal_sugar_g: row.goalSugarG ?? undefined,
    unit_system: row.unitSystem ?? undefined,
    meal_names: row.mealNames ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function getWeightHistory(userId: string) {
  return db.select({
    date: schema.measurements.date,
    value: schema.measurements.value,
  })
    .from(schema.measurements)
    .where(and(
      eq(schema.measurements.userId, userId),
      eq(schema.measurements.type, 'weight'),
    ))
    .orderBy(asc(schema.measurements.date))
    .limit(365)
    .all();
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const profile = getProfile(session.user.id);
  const weightHistory = getWeightHistory(session.user.id);

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Weight chart */}
      <WeightChart
        measurements={weightHistory}
        startingWeight={profile?.starting_weight_lbs ?? null}
        goalWeight={profile?.goal_weight_lbs ?? null}
        goalDate={profile?.goal_target_date ?? null}
      />

      {/* Tag management */}
      <TagManager />

      {/* Profile form */}
      <ProfileForm
        profile={profile}
        userId={session.user.id}
        userEmail={session.user.email}
        userName={`${session.user.first_name || ''} ${session.user.last_name || ''}`.trim()}
      />

      {/* Change Password */}
      <div className="mt-8">
        <ChangePassword />
      </div>

      {/* Logout */}
      <div className="mt-4">
        <LogoutButton />
      </div>
    </div>
  );
}
