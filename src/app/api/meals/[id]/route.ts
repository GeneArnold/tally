import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';

// GET — single meal with items and tags
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Fetch the meal
    const meal = await db
      .select()
      .from(schema.meals)
      .where(eq(schema.meals.id, id))
      .limit(1);

    if (!meal.length) {
      return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
    }

    const mealRecord = meal[0];

    // Fetch meal items with food data
    const items = await db
      .select({
        id: schema.mealItems.id,
        quantity: schema.mealItems.quantity,
        food: {
          id: schema.foods.id,
          description: schema.foods.description,
          brand_name: schema.foods.brandName,
          energy_kcal: schema.foods.energyKcal,
          protein_g: schema.foods.proteinG,
          carbs_g: schema.foods.carbohydrateG,
          fat_g: schema.foods.totalFatG,
        },
      })
      .from(schema.mealItems)
      .innerJoin(schema.foods, eq(schema.mealItems.foodId, schema.foods.id))
      .where(eq(schema.mealItems.mealId, id));

    // Fetch meal tags
    const tagRecords = await db
      .select({
        id: schema.mealsToFoodTags.id,
        foodTagId: schema.mealsToFoodTags.foodTagId,
        tagName: schema.foodTags.name,
        tagColor: schema.foodTags.color,
      })
      .from(schema.mealsToFoodTags)
      .innerJoin(schema.foodTags, eq(schema.mealsToFoodTags.foodTagId, schema.foodTags.id))
      .where(eq(schema.mealsToFoodTags.mealId, id));

    // Extract tag_ids and tag_objects
    const tag_ids = tagRecords.map((record) => record.foodTagId);
    const tag_objects = tagRecords.map((record) => ({
      id: record.foodTagId,
      name: record.tagName,
      color: record.tagColor,
    }));

    // Frontend expects this nested shape
    const meal_tags = tagRecords.map((record) => ({
      nx_food_tags_id: {
        id: record.foodTagId,
        name: record.tagName,
        color: record.tagColor,
      },
    }));

    return NextResponse.json({
      meal: {
        id: mealRecord.id,
        name: mealRecord.name,
        description: mealRecord.description,
        default_meal_type: mealRecord.defaultMealType,
        user: mealRecord.userId,
        items,
        tag_ids,
        tag_objects,
        meal_tags,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

// PATCH — update meal fields and optionally tags
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { tag_ids, ...mealFields } = await request.json();

    // Convert snake_case to camelCase
    const updateData: Record<string, any> = {};
    if (mealFields.name !== undefined) updateData.name = mealFields.name;
    if (mealFields.description !== undefined) updateData.description = mealFields.description;
    if (mealFields.default_meal_type !== undefined) updateData.defaultMealType = mealFields.default_meal_type;

    // Update meal fields if any
    if (Object.keys(updateData).length > 0) {
      await db
        .update(schema.meals)
        .set(updateData)
        .where(eq(schema.meals.id, id));
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Delete existing tags
      await db
        .delete(schema.mealsToFoodTags)
        .where(eq(schema.mealsToFoodTags.mealId, id));

      // Insert new tags
      if (tag_ids.length > 0) {
        const tagsToInsert = tag_ids.map((tagId: string) => ({
          mealId: id,
          foodTagId: tagId,
        }));
        await db.insert(schema.mealsToFoodTags).values(tagsToInsert);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

// DELETE — soft delete meal
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Soft delete: set deletedAt to current ISO timestamp
    await db
      .update(schema.meals)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(schema.meals.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
