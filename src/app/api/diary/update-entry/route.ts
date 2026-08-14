import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { recalcDiaryTotals } from '@/lib/db/helpers';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodEntryId, diaryEntryId, quantity } = await request.json();

  if (!foodEntryId || !quantity || quantity <= 0) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // Get the food entry with its linked food's base nutrition
    const foodEntryData = db
      .select({
        foodEntryId: schema.foodEntries.id,
        baseFood: {
          energyKcal: schema.foods.energyKcal,
          proteinG: schema.foods.proteinG,
          carbsG: schema.foods.carbohydrateG,
          fatG: schema.foods.totalFatG,
          fiberG: schema.foods.dietaryFiberG,
          sugarG: schema.foods.totalSugarsG,
          sodiumMg: schema.foods.sodiumMg,
        },
      })
      .from(schema.foodEntries)
      .leftJoin(schema.foods, eq(schema.foodEntries.foodId, schema.foods.id))
      .where(eq(schema.foodEntries.id, foodEntryId))
      .get();

    if (!foodEntryData) {
      return NextResponse.json({ error: 'Food entry not found' }, { status: 404 });
    }

    // Recalculate nutrition based on new quantity
    const updated: Record<string, number | null> = { quantity };
    if (foodEntryData.baseFood) {
      updated.energy_kcal = Math.round((foodEntryData.baseFood.energyKcal || 0) * quantity * 10) / 10;
      updated.protein_g = Math.round((foodEntryData.baseFood.proteinG || 0) * quantity * 10) / 10;
      updated.carbs_g = Math.round((foodEntryData.baseFood.carbsG || 0) * quantity * 10) / 10;
      updated.fat_g = Math.round((foodEntryData.baseFood.fatG || 0) * quantity * 10) / 10;
      updated.fiber_g = Math.round((foodEntryData.baseFood.fiberG || 0) * quantity * 10) / 10;
      updated.sugar_g = Math.round((foodEntryData.baseFood.sugarG || 0) * quantity * 10) / 10;
      updated.sodium_mg = Math.round((foodEntryData.baseFood.sodiumMg || 0) * quantity * 10) / 10;
    }

    // Update food entry
    db.update(schema.foodEntries)
      .set({
        quantity,
        energyKcal: updated.energy_kcal as number,
        proteinG: updated.protein_g as number,
        carbsG: updated.carbs_g as number,
        fatG: updated.fat_g as number,
        fiberG: updated.fiber_g as number,
        sugarG: updated.sugar_g as number,
        sodiumMg: updated.sodium_mg as number,
      })
      .where(eq(schema.foodEntries.id, foodEntryId))
      .run();

    // Recalculate diary entry totals
    if (diaryEntryId) {
      recalcDiaryTotals(diaryEntryId);
    }

    return NextResponse.json({ success: true, ...updated });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
