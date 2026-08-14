import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, like, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const tagsParam = searchParams.get('tags')?.trim();
  const tagNames = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

  try {
    // Build conditions
    const conditions = [
      eq(schema.foods.userId, session.user.id),
      isNull(schema.foods.deletedAt),
    ];
    if (query) {
      conditions.push(like(schema.foods.description, `%${query}%`));
    }

    let foods = db
      .select({
        id: schema.foods.id,
        description: schema.foods.description,
        brandName: schema.foods.brandName,
        brandOwner: schema.foods.brandOwner,
        upcCode: schema.foods.upcCode,
        fdcId: schema.foods.fdcId,
        source: schema.foods.source,
        defaultServingSize: schema.foods.defaultServingSize,
        defaultServingUnit: schema.foods.defaultServingUnit,
        energyKcal: schema.foods.energyKcal,
        proteinG: schema.foods.proteinG,
        totalFatG: schema.foods.totalFatG,
        carbohydrateG: schema.foods.carbohydrateG,
        dietaryFiberG: schema.foods.dietaryFiberG,
        totalSugarsG: schema.foods.totalSugarsG,
        sodiumMg: schema.foods.sodiumMg,
        saturatedFatG: schema.foods.saturatedFatG,
        cholesterolMg: schema.foods.cholesterolMg,
      })
      .from(schema.foods)
      .where(and(...conditions))
      .all();

    // For single tag, use database join to filter efficiently
    if (tagNames.length === 1) {
      const targetTagName = tagNames[0];

      // Get the tag ID for this name
      const tag = await db
        .select({ id: schema.foodTags.id })
        .from(schema.foodTags)
        .where(
          and(
            eq(schema.foodTags.userId, session.user.id),
            eq(schema.foodTags.name, targetTagName),
            isNull(schema.foodTags.deletedAt),
          ),
        )
        .limit(1);

      if (tag.length > 0) {
        const tagId = tag[0].id;

        // Get food IDs that have this tag
        const foodsWithTag = await db
          .select({ foodId: schema.foodsToFoodTags.foodId })
          .from(schema.foodsToFoodTags)
          .where(eq(schema.foodsToFoodTags.foodTagId, tagId));

        const foodIds = foodsWithTag.map((f) => f.foodId);

        // Filter the foods list to only those with the tag
        foods = foods.filter((f) => foodIds.includes(f.id));
      } else {
        foods = [];
      }
    }

    // Fetch tags for each food
    const foodsWithTags = await Promise.all(
      foods.map(async (food) => {
        const tags = await db
          .select({
            id: schema.foodTags.id,
            name: schema.foodTags.name,
            color: schema.foodTags.color,
          })
          .from(schema.foodsToFoodTags)
          .innerJoin(schema.foodTags, eq(schema.foodsToFoodTags.foodTagId, schema.foodTags.id))
          .where(eq(schema.foodsToFoodTags.foodId, food.id));

        return {
          ...food,
          tags,
        };
      }),
    );

    // Multi-tag filter (AND logic) — food must have ALL selected tags
    if (tagNames.length > 1) {
      const filteredFoods = foodsWithTags.filter((food) => {
        const foodTagNames = food.tags.map((t) => t.name);
        return tagNames.every((tn) => foodTagNames.includes(tn));
      });
      foodsWithTags.splice(0, foodsWithTags.length, ...filteredFoods);
    }

    // Convert camelCase to snake_case for response
    const foodsResponse = foodsWithTags.map((f) => ({
      id: f.id,
      description: f.description,
      brand_name: f.brandName,
      brand_owner: f.brandOwner,
      upc_code: f.upcCode,
      fdc_id: f.fdcId,
      source: f.source,
      default_serving_size: f.defaultServingSize,
      default_serving_unit: f.defaultServingUnit,
      energy_kcal: f.energyKcal,
      protein_g: f.proteinG,
      fat_g: f.totalFatG,
      carbs_g: f.carbohydrateG,
      fiber_g: f.dietaryFiberG,
      sugar_g: f.totalSugarsG,
      sodium_mg: f.sodiumMg,
      saturated_fat_g: f.saturatedFatG,
      cholesterol_mg: f.cholesterolMg,
      tags: f.tags,
    }));

    // Get user's tag list for filter pills
    const userTags = await db
      .select({
        name: schema.foodTags.name,
        color: schema.foodTags.color,
      })
      .from(schema.foodTags)
      .where(
        and(eq(schema.foodTags.userId, session.user.id), isNull(schema.foodTags.deletedAt)),
      )
      .orderBy(schema.foodTags.sort, schema.foodTags.name);

    return NextResponse.json({
      foods: foodsResponse,
      tags: userTags,
      total: foodsResponse.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
