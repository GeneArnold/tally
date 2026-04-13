import { NUTRIENT_MAP, USDA_BASE_URL } from './constants';

const USDA_API_KEY = process.env.USDA_API_KEY || '';

export interface StrippedFood {
  fdc_id: number;
  description: string;
  brand: string;
  upc: string;
  serving_size: number | null;
  serving_unit: string;
  data_type: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  fiber_g: number;
}

export interface SearchResult {
  query: string;
  total: number;
  results: StrippedFood[];
}

function stripFood(food: Record<string, unknown>): StrippedFood {
  const nutrients: Record<string, number> = {};
  const foodNutrients = (food.foodNutrients || []) as Record<string, unknown>[];

  for (const n of foodNutrients) {
    const nid = (n.nutrientId as number) || ((n.nutrient as Record<string, unknown>)?.id as number);
    if (nid && nid in NUTRIENT_MAP) {
      nutrients[NUTRIENT_MAP[nid]] = Math.round(((n.value as number) || 0) * 10) / 10;
    }
  }

  return {
    fdc_id: food.fdcId as number,
    description: (food.description as string) || '',
    brand: (food.brandOwner as string) || (food.brandName as string) || '',
    upc: (food.gtinUpc as string) || '',
    serving_size: (food.servingSize as number) || null,
    serving_unit: (food.servingSizeUnit as string) || '',
    data_type: (food.dataType as string) || '',
    calories: nutrients.calories || 0,
    protein_g: nutrients.protein_g || 0,
    fat_g: nutrients.fat_g || 0,
    carbs_g: nutrients.carbs_g || 0,
    sugar_g: nutrients.sugar_g || 0,
    sodium_mg: nutrients.sodium_mg || 0,
    fiber_g: nutrients.fiber_g || 0,
  };
}

export async function searchUSDA(query: string, limit = 10, dataTypes?: string[]): Promise<SearchResult> {
  const types = dataTypes || ['Branded', 'Survey (FNDDS)'];

  const res = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      pageSize: Math.min(limit, 25),
      dataType: types,
    }),
  });

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }

  const data = await res.json();
  const results = ((data.foods || []) as Record<string, unknown>[]).map(stripFood);

  return {
    query,
    total: data.totalHits || 0,
    results,
  };
}

export async function lookupBarcodeUSDA(upc: string): Promise<StrippedFood | null> {
  const res = await fetch(`${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: upc,
      pageSize: 3,
      dataType: ['Branded'],
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const foods = (data.foods || []) as Record<string, unknown>[];

  const exactMatch = foods.find((f) => f.gtinUpc === upc);
  if (exactMatch) return stripFood(exactMatch);

  if (foods.length > 0) return stripFood(foods[0]);

  return null;
}

export async function lookupBarcodeOpenFoodFacts(upc: string): Promise<StrippedFood | null> {
  const res = await fetch(
    `http://world.openfoodfacts.org/api/v2/product/${upc}.json?fields=product_name,brands,serving_size,serving_quantity,nutriments`,
  );

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};

  return {
    fdc_id: 0,
    description: p.product_name || '',
    brand: p.brands || '',
    upc,
    serving_size: p.serving_quantity || null,
    serving_unit: p.serving_size ? p.serving_size.replace(/[0-9.]+\s*/g, '').trim() || 'g' : 'g',
    data_type: 'OpenFoodFacts',
    calories: Math.round(n['energy-kcal_serving'] || n['energy-kcal_100g'] || 0),
    protein_g: Math.round((n.proteins_serving || n.proteins_100g || 0) * 10) / 10,
    fat_g: Math.round((n.fat_serving || n.fat_100g || 0) * 10) / 10,
    carbs_g: Math.round((n.carbohydrates_serving || n.carbohydrates_100g || 0) * 10) / 10,
    sugar_g: Math.round((n.sugars_serving || n.sugars_100g || 0) * 10) / 10,
    sodium_mg: Math.round((n.sodium_serving || n.sodium_100g || 0) * 1000 * 10) / 10,
    fiber_g: Math.round((n.fiber_serving || n.fiber_100g || 0) * 10) / 10,
  };
}

// Legacy single-call lookup (used by /api/food/barcode/[upc])
export async function lookupBarcode(upc: string): Promise<StrippedFood | null> {
  const usda = await lookupBarcodeUSDA(upc);
  if (usda) return usda;
  return lookupBarcodeOpenFoodFacts(upc);
}
