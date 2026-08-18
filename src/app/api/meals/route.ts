import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, isNull } from 'drizzle-orm';

// GET — list user's meals + shared meals, exclude soft-deleted
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const meals = await db
      .select()
      .from(schema.meals)
      .where(
        and(
          eq(schema.meals.userId, session.user.id),
          isNull(schema.meals.deletedAt)
        )
      )
      .orderBy(schema.meals.name);

    // For each meal, fetch items and tags
    const mealsWithDetails = await Promise.all(
      meals.map(async (meal) => {
        // Fetch meal items with food data
        const items = await db
          .select({
            id: schema.mealItems.id,
            quantity: schema.mealItems.quantity,
            food: {
              id: schema.foods.id,
              description: schema.foods.description,
              energy_kcal: schema.foods.energyKcal,
              protein_g: schema.foods.proteinG,
              carbs_g: schema.foods.carbohydrateG,
              fat_g: schema.foods.totalFatG,
            },
          })
          .from(schema.mealItems)
          .innerJoin(schema.foods, eq(schema.mealItems.foodId, schema.foods.id))
          .where(eq(schema.mealItems.mealId, meal.id));

        // Fetch meal tags with nested structure (frontend expects this shape)
        const tagRecords = await db
          .select({
            id: schema.mealsToFoodTags.id,
            foodTagId: schema.mealsToFoodTags.foodTagId,
            tagName: schema.foodTags.name,
            tagColor: schema.foodTags.color,
          })
          .from(schema.mealsToFoodTags)
          .innerJoin(schema.foodTags, eq(schema.mealsToFoodTags.foodTagId, schema.foodTags.id))
          .where(eq(schema.mealsToFoodTags.mealId, meal.id));

        const meal_tags = tagRecords.map((record) => ({
          nx_food_tags_id: {
            id: record.foodTagId,
            name: record.tagName,
            color: record.tagColor,
          },
        }));

        return {
          id: meal.id,
          name: meal.name,
          description: meal.description,
          default_meal_type: meal.defaultMealType,
          items,
          meal_tags,
        };
      })
    );

    return NextResponse.json({ meals: mealsWithDetails });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

// POST — create a new meal
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description, default_meal_type, food_items } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Meal name is required' }, { status: 400 });
  }

  try {
    // Create the meal
    const insertResult = await db
      .insert(schema.meals)
      .values({
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        defaultMealType: default_meal_type || null,
      })
      .returning();

    const mealId = insertResult[0]?.id;
    if (!mealId) {
      return NextResponse.json({ error: 'Failed to create meal' }, { status: 500 });
    }

    // Add food items if provided
    if (food_items && food_items.length > 0) {
      const itemsToInsert = food_items.map((item: { food_id: string; quantity: number }) => ({
        mealId,
        foodId: item.food_id,
        quantity: item.quantity || 1,
      }));

      await db.insert(schema.mealItems).values(itemsToInsert);
    }

    return NextResponse.json({ meal: insertResult[0] });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
