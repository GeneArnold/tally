// Directus collection type definitions
// Maps to the schema in Directus development environment

export interface NxHealthProfile {
  id: string;
  user: string; // directus_users UUID
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  sex: 'M' | 'F' | null;
  profile_photo: string | null;
  photo_before: string | null;
  photo_after: string | null;
  height_ft: number | null;
  height_in: number | null;
  starting_weight_lbs: number | null;
  current_weight_lbs: number | null;
  goal_weight_lbs: number | null;
  goal_target_date: string | null;
  activity_level: 'sedentary' | 'lightly_active' | 'active' | 'very_active' | null;
  weekly_goal: string | null;
  daily_calorie_goal: number | null;
  daily_step_goal: number | null;
  goal_water_oz: number | null;
  goal_protein_g: number | null;
  goal_carbs_g: number | null;
  goal_fat_g: number | null;
  goal_fiber_g: number | null;
  goal_sodium_mg: number | null;
  goal_sugar_g: number | null;
  unit_system: 'imperial' | 'metric' | null;
  meal_names: string[] | null;
  notes: string | null;
}

export interface NxDiaryEntry {
  id: string;
  user: string;
  date: string;
  type: 'diary_meal' | 'exercise' | 'steps_aggregate' | 'water';
  diary_meal: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | null;
  notes: string | null;
  steps_count: number | null;
  water_oz: number | null;
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  total_fiber_g: number | null;
  total_sodium_mg: number | null;
  total_sugar_g: number | null;
  food_entries: NxFoodEntry[] | string[];
  exercises: NxExercise[] | string[];
}

export interface NxFood {
  id: string;
  fdc_id: number | null;
  description: string;
  brand_owner: string | null;
  brand_name: string | null;
  upc_code: string | null;
  data_type: string | null;
  source: string | null;
  serving_size: number | null;
  serving_size_unit: string | null;
  household_serving: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  polyunsaturated_fat_g: number | null;
  monounsaturated_fat_g: number | null;
  cholesterol_mg: number | null;
  carbohydrate_g: number | null;
  dietary_fiber_g: number | null;
  total_sugars_g: number | null;
  added_sugars_g: number | null;
  sodium_mg: number | null;
  potassium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  vitamin_d_mcg: number | null;
}

export interface NxFoodServing {
  id: string;
  food: string | NxFood;
  label: string;
  serving_size: number | null;
  serving_unit: string | null;
  nutrition_multiplier: number;
}

export interface NxFoodEntry {
  id: string;
  diary_entry: string | NxDiaryEntry;
  food: string | NxFood | null;
  serving: string | NxFoodServing | null;
  quantity: number;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  sugar_g: number | null;
}

export interface NxExercise {
  id: string;
  diary_entry: string | NxDiaryEntry;
  exercise_type: string | null;
  duration_seconds: number | null;
  calories_burned: number | null;
  notes: string | null;
  distance: number | null;
  distance_unit: string | null;
  avg_heart_rate: number | null;
  exercise_name: string | null;
  sets: number | null;
  reps_per_set: number | null;
  weight_per_set_lbs: number | null;
}

export interface NxMeasurement {
  id: string;
  user: string;
  date: string;
  type: 'weight' | 'body_fat' | 'waist' | 'neck' | 'chest' | 'hips' | 'bicep' | 'thigh' | 'calf';
  value: number;
  unit: 'lbs' | 'inches' | '%' | null;
  notes: string | null;
  photo: string | null;
}

export interface NxMeal {
  id: string;
  user: string | null;
  name: string;
  description: string | null;
  default_meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | null;
  items: NxMealItem[] | string[];
}

export interface NxMealItem {
  id: string;
  meal: string | NxMeal;
  food: string | NxFood;
  serving: string | NxFoodServing | null;
  quantity: number;
}

// Directus SDK schema mapping
export interface Schema {
  nx_health_profile: NxHealthProfile[];
  nx_diary_entries: NxDiaryEntry[];
  nx_foods: NxFood[];
  nx_food_servings: NxFoodServing[];
  nx_food_entries: NxFoodEntry[];
  nx_exercises: NxExercise[];
  nx_measurements: NxMeasurement[];
  nx_meals: NxMeal[];
  nx_meal_items: NxMealItem[];
}
