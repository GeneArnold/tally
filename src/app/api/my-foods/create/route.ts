import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Food name is required' }, { status: 400 });
  }

  try {
    // Map snake_case body fields to camelCase schema fields
    const foodData = {
      userId: session.user.id,
      description: body.description.trim(),
      brandName: body.brand_name || null,
      brandOwner: body.brand_owner || null,
      upcCode: body.upc_code || null,
      fdcId: body.fdc_id || null,
      source: body.source || 'manual',
      defaultServingSize: body.default_serving_size || null,
      defaultServingUnit: body.default_serving_unit || null,
      energyKcal: body.energy_kcal || null,
      proteinG: body.protein_g || null,
      totalFatG: body.fat_g || null,
      carbohydrateG: body.carbs_g || null,
      dietaryFiberG: body.fiber_g || null,
      totalSugarsG: body.sugar_g || null,
      sodiumMg: body.sodium_mg || null,
      saturatedFatG: body.saturated_fat_g || null,
      cholesterolMg: body.cholesterol_mg || null,
    };

    // Insert food
    const insertedFood = await db.insert(schema.foods).values(foodData).returning();

    if (!insertedFood || insertedFood.length === 0) {
      return NextResponse.json({ error: 'Failed to create food' }, { status: 500 });
    }

    const food = insertedFood[0];

    // Create junction records for tags if provided
    const tagIds = body.tag_ids as string[] | undefined;
    if (tagIds && tagIds.length > 0) {
      const junctionRecords = tagIds.map((tagId: string) => ({
        foodId: food.id,
        foodTagId: tagId,
      }));
      await db.insert(schema.foodsToFoodTags).values(junctionRecords);
    }

    // Convert camelCase to snake_case for response
    const foodResponse = {
      id: food.id,
      description: food.description,
      brand_name: food.brandName,
      brand_owner: food.brandOwner,
      upc_code: food.upcCode,
      fdc_id: food.fdcId,
      source: food.source,
      default_serving_size: food.defaultServingSize,
      default_serving_unit: food.defaultServingUnit,
      energy_kcal: food.energyKcal,
      protein_g: food.proteinG,
      fat_g: food.totalFatG,
      carbs_g: food.carbohydrateG,
      fiber_g: food.dietaryFiberG,
      sugar_g: food.totalSugarsG,
      sodium_mg: food.sodiumMg,
      saturated_fat_g: food.saturatedFatG,
      cholesterol_mg: food.cholesterolMg,
    };

    return NextResponse.json({ food: foodResponse });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
