import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No session' });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || '2026-04-13';

  const entries = db.select().from(schema.diaryEntries)
    .where(and(
      eq(schema.diaryEntries.date, date),
      eq(schema.diaryEntries.userId, session.user.id),
      eq(schema.diaryEntries.type, 'diary_meal'),
    )).all();

  const entriesWithFoods = entries.map((entry) => {
    const foodEntriesData = db.select({
      id: schema.foodEntries.id,
      quantity: schema.foodEntries.quantity,
      energy_kcal: schema.foodEntries.energyKcal,
      food_id: schema.foods.id,
      food_description: schema.foods.description,
    })
      .from(schema.foodEntries)
      .leftJoin(schema.foods, eq(schema.foodEntries.foodId, schema.foods.id))
      .where(eq(schema.foodEntries.diaryEntryId, entry.id))
      .all();

    return {
      id: entry.id,
      diary_meal: entry.diaryMeal,
      total_calories: entry.totalCalories,
      food_entries: foodEntriesData.map((fe) => ({
        id: fe.id,
        quantity: fe.quantity,
        energy_kcal: fe.energy_kcal,
        food: fe.food_id ? { id: fe.food_id, description: fe.food_description } : null,
      })),
    };
  });

  return NextResponse.json({
    userId: session.user.id,
    entryCount: entriesWithFoods.length,
    entries: entriesWithFoods,
  });
}
