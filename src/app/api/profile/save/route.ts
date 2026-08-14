import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Map snake_case request fields to camelCase schema field names
const snakeToCamelMap: Record<string, string> = {
  date_of_birth: 'dateOfBirth',
  height_ft: 'heightFt',
  height_in: 'heightIn',
  starting_weight_lbs: 'startingWeightLbs',
  current_weight_lbs: 'currentWeightLbs',
  goal_weight_lbs: 'goalWeightLbs',
  goal_target_date: 'goalTargetDate',
  activity_level: 'activityLevel',
  weekly_goal: 'weeklyGoal',
  daily_calorie_goal: 'dailyCalorieGoal',
  daily_step_goal: 'dailyStepGoal',
  goal_water_oz: 'goalWaterOz',
  goal_protein_g: 'goalProteinG',
  goal_carbs_g: 'goalCarbsG',
  goal_fat_g: 'goalFatG',
  goal_fiber_g: 'goalFiberG',
  goal_sodium_mg: 'goalSodiumMg',
  goal_sugar_g: 'goalSugarG',
  unit_system: 'unitSystem',
  meal_names: 'mealNames',
  notes: 'notes',
  sex: 'sex',
};

function mapSnakeToCamel(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [snakeKey, value] of Object.entries(data)) {
    const camelKey = snakeToCamelMap[snakeKey];
    if (camelKey) {
      result[camelKey] = value;
    }
  }
  return result;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const reverseMap = Object.fromEntries(
    Object.entries(snakeToCamelMap).map(([snake, camel]) => [camel, snake]),
  );

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = reverseMap[key] || key;
    result[snakeKey] = value;
  }
  return result;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { profileId, ...data } = body;

    // Convert snake_case to camelCase for schema
    const camelCaseData = mapSnakeToCamel(data);

    let profile: Record<string, unknown>;

    if (profileId) {
      // Update existing profile
      profile = await db
        .update(schema.healthProfiles)
        .set(camelCaseData)
        .where(eq(schema.healthProfiles.id, profileId))
        .returning()
        .get();
    } else {
      // Create new profile
      profile = await db
        .insert(schema.healthProfiles)
        .values({
          userId: session.user.id,
          ...camelCaseData,
        })
        .returning()
        .get();
    }

    // Convert response back to snake_case
    const snakeCaseProfile = camelToSnake(profile);

    return NextResponse.json({ profile: snakeCaseProfile });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
