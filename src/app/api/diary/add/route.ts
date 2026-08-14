import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { recalcDiaryTotals } from '@/lib/db/helpers';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date, meal, food, quantity } = await request.json();

  if (!date || !meal || !food || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Find existing diary entry for this date + meal + user
    let diaryEntry = db
      .select()
      .from(schema.diaryEntries)
      .where(
        and(
          eq(schema.diaryEntries.date, date),
          eq(schema.diaryEntries.diaryMeal, meal),
          eq(schema.diaryEntries.type, 'diary_meal'),
          eq(schema.diaryEntries.userId, session.user.id),
        ),
      )
      .get();

    let diaryEntryId: string;

    if (diaryEntry) {
      diaryEntryId = diaryEntry.id;
    } else {
      // Create new diary entry
      const result = db
        .insert(schema.diaryEntries)
        .values({
          date,
          type: 'diary_meal',
          diaryMeal: meal,
          userId: session.user.id,
          totalCalories: 0,
          totalProteinG: 0,
          totalCarbsG: 0,
          totalFatG: 0,
          totalFiberG: 0,
          totalSodiumMg: 0,
          totalSugarG: 0,
        })
        .returning()
        .get();

      diaryEntryId = result.id;
    }

    // Calculate nutrition * quantity
    const calories = Math.round((food.calories || 0) * quantity * 10) / 10;
    const protein = Math.round((food.protein_g || 0) * quantity * 10) / 10;
    const carbs = Math.round((food.carbs_g || 0) * quantity * 10) / 10;
    const fat = Math.round((food.fat_g || 0) * quantity * 10) / 10;
    const fiber = Math.round((food.fiber_g || 0) * quantity * 10) / 10;
    const sodium = Math.round((food.sodium_mg || 0) * quantity * 10) / 10;
    const sugar = Math.round((food.sugar_g || 0) * quantity * 10) / 10;

    // Create food entry linked to diary entry (and food.food_id if provided)
    db.insert(schema.foodEntries)
      .values({
        diaryEntryId,
        foodId: food.food_id || null,
        quantity,
        energyKcal: calories,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
        fiberG: fiber,
        sodiumMg: sodium,
        sugarG: sugar,
      })
      .run();

    // Recalculate diary entry totals
    recalcDiaryTotals(diaryEntryId);

    return NextResponse.json({ success: true, diary_entry: diaryEntryId });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
