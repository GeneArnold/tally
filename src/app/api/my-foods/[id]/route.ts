import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, isNull } from 'drizzle-orm';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    // Fetch the food
    const foods = await db
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
        deletedAt: schema.foods.deletedAt,
        createdAt: schema.foods.createdAt,
      })
      .from(schema.foods)
      .where(eq(schema.foods.id, id));

    if (!foods || foods.length === 0) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    const food = foods[0];

    // Fetch tags for this food
    const tags = await db
      .select({
        id: schema.foodTags.id,
        name: schema.foodTags.name,
        color: schema.foodTags.color,
      })
      .from(schema.foodsToFoodTags)
      .innerJoin(schema.foodTags, eq(schema.foodsToFoodTags.foodTagId, schema.foodTags.id))
      .where(eq(schema.foodsToFoodTags.foodId, id));

    // Build response with snake_case fields
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
      deleted_at: food.deletedAt,
      created_at: food.createdAt,
      tag_ids: tags.map((t) => t.id),
      tag_names: tags.map((t) => t.name),
      tag_objects: tags,
    };

    return NextResponse.json({ food: foodResponse });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Separate tag_ids from other fields
  const { tag_ids, ...foodFields } = body;

  try {
    // Update food fields if any provided
    if (Object.keys(foodFields).length > 0) {
      // Map snake_case to camelCase
      const updateData: Record<string, unknown> = {};
      const fieldMapping: Record<string, string> = {
        description: 'description',
        brand_name: 'brandName',
        brand_owner: 'brandOwner',
        upc_code: 'upcCode',
        fdc_id: 'fdcId',
        source: 'source',
        default_serving_size: 'defaultServingSize',
        default_serving_unit: 'defaultServingUnit',
        energy_kcal: 'energyKcal',
        protein_g: 'proteinG',
        fat_g: 'totalFatG',
        carbs_g: 'carbohydrateG',
        fiber_g: 'dietaryFiberG',
        sugar_g: 'totalSugarsG',
        sodium_mg: 'sodiumMg',
        saturated_fat_g: 'saturatedFatG',
        cholesterol_mg: 'cholesterolMg',
      };

      for (const [snakeKey, value] of Object.entries(foodFields)) {
        const camelKey = fieldMapping[snakeKey];
        if (camelKey) {
          updateData[camelKey] = value;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(schema.foods).set(updateData).where(eq(schema.foods.id, id));
      }
    }

    // Update tags via junction if tag_ids provided
    if (tag_ids !== undefined) {
      // Delete existing junction records for this food
      await db.delete(schema.foodsToFoodTags).where(eq(schema.foodsToFoodTags.foodId, id));

      // Create new junction records if tag_ids is not empty
      if (Array.isArray(tag_ids) && tag_ids.length > 0) {
        const junctionRecords = tag_ids.map((tagId: string) => ({
          foodId: id,
          foodTagId: tagId,
        }));
        await db.insert(schema.foodsToFoodTags).values(junctionRecords);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
