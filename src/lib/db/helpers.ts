import { db, schema } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export function recalcDiaryTotals(diaryEntryId: string) {
  const result = db
    .select({
      totalCalories: sql<number>`coalesce(sum(${schema.foodEntries.energyKcal}), 0)`,
      totalProteinG: sql<number>`coalesce(sum(${schema.foodEntries.proteinG}), 0)`,
      totalCarbsG: sql<number>`coalesce(sum(${schema.foodEntries.carbsG}), 0)`,
      totalFatG: sql<number>`coalesce(sum(${schema.foodEntries.fatG}), 0)`,
      totalFiberG: sql<number>`coalesce(sum(${schema.foodEntries.fiberG}), 0)`,
      totalSodiumMg: sql<number>`coalesce(sum(${schema.foodEntries.sodiumMg}), 0)`,
      totalSugarG: sql<number>`coalesce(sum(${schema.foodEntries.sugarG}), 0)`,
    })
    .from(schema.foodEntries)
    .where(eq(schema.foodEntries.diaryEntryId, diaryEntryId))
    .get();

  if (!result) return;

  db.update(schema.diaryEntries)
    .set({
      totalCalories: result.totalCalories,
      totalProteinG: result.totalProteinG,
      totalCarbsG: result.totalCarbsG,
      totalFatG: result.totalFatG,
      totalFiberG: result.totalFiberG,
      totalSodiumMg: result.totalSodiumMg,
      totalSugarG: result.totalSugarG,
    })
    .where(eq(schema.diaryEntries.id, diaryEntryId))
    .run();
}
