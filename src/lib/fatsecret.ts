import type { StrippedFood } from './usda';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials not configured');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!res.ok) throw new Error(`FatSecret auth failed: ${res.status}`);

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

function toGTIN13(upc: string): string {
  const digits = upc.replace(/\D/g, '');
  if (digits.length === 13) return digits;
  if (digits.length === 12) return '0' + digits;
  return digits;
}

async function apiCall(method: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const query = new URLSearchParams({ method, format: 'json', ...params });

  const res = await fetch(`${API_URL}?${query}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`FatSecret API error: ${res.status}`);
  return res.json();
}

export async function lookupBarcodeFatSecret(upc: string): Promise<StrippedFood | null> {
  const gtin = toGTIN13(upc);

  // Step 1: Find food_id by barcode
  let foodId: string;
  try {
    const barcodeResult = await apiCall('food.find_id_for_barcode', { barcode: gtin });
    const foodIdContainer = barcodeResult.food_id as Record<string, unknown> | undefined;
    foodId = (foodIdContainer?.value as string) ?? '';
    if (!foodId) return null;
  } catch {
    return null;
  }

  // Step 2: Get full nutrition by food_id
  try {
    const foodResult = await apiCall('food.get.v4', { food_id: foodId });
    const food = foodResult.food as Record<string, unknown>;
    if (!food) return null;

    const servings = food.servings as Record<string, unknown>;
    const servingList = servings?.serving;
    const serving = Array.isArray(servingList) ? servingList[0] : servingList;
    if (!serving || typeof serving !== 'object') return null;

    const s = serving as Record<string, string>;

    return {
      fdc_id: 0,
      description: (food.food_name as string) || '',
      brand: (food.brand_name as string) || '',
      upc,
      serving_size: parseFloat(s.metric_serving_amount) || null,
      serving_unit: s.metric_serving_unit || s.serving_description || 'g',
      data_type: 'FatSecret',
      calories: Math.round(parseFloat(s.calories) || 0),
      protein_g: Math.round((parseFloat(s.protein) || 0) * 10) / 10,
      fat_g: Math.round((parseFloat(s.fat) || 0) * 10) / 10,
      carbs_g: Math.round((parseFloat(s.carbohydrate) || 0) * 10) / 10,
      sugar_g: Math.round((parseFloat(s.sugar) || 0) * 10) / 10,
      sodium_mg: Math.round(parseFloat(s.sodium) || 0),
      fiber_g: Math.round((parseFloat(s.fiber) || 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}
