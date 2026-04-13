// USDA FoodData Central nutrient ID mapping
export const NUTRIENT_MAP: Record<number, string> = {
  1008: 'calories',
  1003: 'protein_g',
  1004: 'fat_g',
  1005: 'carbs_g',
  2000: 'sugar_g',
  1093: 'sodium_mg',
  1079: 'fiber_g',
};

export const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const DIARY_ENTRY_TYPES = ['diary_meal', 'exercise', 'steps_aggregate', 'water'] as const;
export type DiaryEntryType = (typeof DIARY_ENTRY_TYPES)[number];

export const MEASUREMENT_TYPES = [
  'weight', 'body_fat', 'waist', 'neck', 'chest', 'hips', 'bicep', 'thigh', 'calf',
] as const;
export type MeasurementType = (typeof MEASUREMENT_TYPES)[number];

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'active', label: 'Active (3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week)' },
] as const;

// Default macro targets (can be overridden by health profile)
export const DEFAULT_DAILY_GOALS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 65,
  fiber_g: 30,
  sodium_mg: 2300,
  sugar_g: 50,
  water_oz: 64,
  steps: 10000,
};
