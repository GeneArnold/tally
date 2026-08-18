import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Users ──────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  role: text('role').notNull().default('athlete'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Health Profile ─────────────────────────────────────────────────

export const healthProfiles = sqliteTable('health_profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  dateOfBirth: text('date_of_birth'),
  sex: text('sex'),
  heightFt: integer('height_ft'),
  heightIn: integer('height_in'),
  startingWeightLbs: real('starting_weight_lbs'),
  currentWeightLbs: real('current_weight_lbs'),
  goalWeightLbs: real('goal_weight_lbs'),
  goalTargetDate: text('goal_target_date'),
  activityLevel: text('activity_level'),
  weeklyGoal: text('weekly_goal'),
  dailyCalorieGoal: integer('daily_calorie_goal'),
  dailyStepGoal: integer('daily_step_goal'),
  goalWaterOz: integer('goal_water_oz'),
  goalProteinG: integer('goal_protein_g'),
  goalCarbsG: integer('goal_carbs_g'),
  goalFatG: integer('goal_fat_g'),
  goalFiberG: integer('goal_fiber_g'),
  goalSodiumMg: integer('goal_sodium_mg'),
  goalSugarG: integer('goal_sugar_g'),
  unitSystem: text('unit_system').default('imperial'),
  mealNames: text('meal_names', { mode: 'json' }).$type<string[]>(),
  notes: text('notes'),
});

// ── Foods ──────────────────────────────────────────────────────────

export const foods = sqliteTable('foods', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fdcId: integer('fdc_id'),
  description: text('description').notNull(),
  brandOwner: text('brand_owner'),
  brandName: text('brand_name'),
  upcCode: text('upc_code'),
  dataType: text('data_type'),
  source: text('source'),
  defaultServingSize: real('default_serving_size'),
  defaultServingUnit: text('default_serving_unit'),
  householdServing: text('household_serving'),
  energyKcal: real('energy_kcal'),
  proteinG: real('protein_g'),
  totalFatG: real('total_fat_g'),
  saturatedFatG: real('saturated_fat_g'),
  transFatG: real('trans_fat_g'),
  polyunsaturatedFatG: real('polyunsaturated_fat_g'),
  monounsaturatedFatG: real('monounsaturated_fat_g'),
  cholesterolMg: real('cholesterol_mg'),
  carbohydrateG: real('carbohydrate_g'),
  dietaryFiberG: real('dietary_fiber_g'),
  totalSugarsG: real('total_sugars_g'),
  addedSugarsG: real('added_sugars_g'),
  sodiumMg: real('sodium_mg'),
  potassiumMg: real('potassium_mg'),
  calciumMg: real('calcium_mg'),
  ironMg: real('iron_mg'),
  vitaminDMcg: real('vitamin_d_mcg'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Food Tags ──────────────────────────────────────────────────────

export const foodTags = sqliteTable('food_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#2EA96B'),
  sort: integer('sort').default(0),
  deletedAt: text('deleted_at'),
});

export const foodsToFoodTags = sqliteTable('foods_food_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  foodId: text('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  foodTagId: text('food_tag_id').notNull().references(() => foodTags.id, { onDelete: 'cascade' }),
});

// ── Food Servings ──────────────────────────────────────────────────

export const foodServings = sqliteTable('food_servings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  foodId: text('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  servingSize: real('serving_size'),
  servingUnit: text('serving_unit'),
  nutritionMultiplier: real('nutrition_multiplier').notNull().default(1),
});

// ── Diary Entries ──────────────────────────────────────────────────

export const diaryEntries = sqliteTable('diary_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  type: text('type').notNull().default('diary_meal'),
  diaryMeal: text('diary_meal'),
  notes: text('notes'),
  stepsCount: integer('steps_count'),
  waterOz: real('water_oz'),
  totalCalories: real('total_calories').default(0),
  totalProteinG: real('total_protein_g').default(0),
  totalCarbsG: real('total_carbs_g').default(0),
  totalFatG: real('total_fat_g').default(0),
  totalFiberG: real('total_fiber_g').default(0),
  totalSodiumMg: real('total_sodium_mg').default(0),
  totalSugarG: real('total_sugar_g').default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Food Entries (child of diary entry) ────────────────────────────

export const foodEntries = sqliteTable('food_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  diaryEntryId: text('diary_entry_id').notNull().references(() => diaryEntries.id, { onDelete: 'cascade' }),
  foodId: text('food_id').references(() => foods.id, { onDelete: 'set null' }),
  servingId: text('serving_id').references(() => foodServings.id, { onDelete: 'set null' }),
  quantity: real('quantity').notNull().default(1),
  energyKcal: real('energy_kcal'),
  proteinG: real('protein_g'),
  carbsG: real('carbs_g'),
  fatG: real('fat_g'),
  fiberG: real('fiber_g'),
  sodiumMg: real('sodium_mg'),
  sugarG: real('sugar_g'),
});

// ── Exercises (child of diary entry) ───────────────────────────────

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  diaryEntryId: text('diary_entry_id').notNull().references(() => diaryEntries.id, { onDelete: 'cascade' }),
  exerciseType: text('exercise_type'),
  exerciseName: text('exercise_name'),
  durationSeconds: integer('duration_seconds'),
  caloriesBurned: real('calories_burned'),
  notes: text('notes'),
  distance: real('distance'),
  distanceUnit: text('distance_unit'),
  avgHeartRate: integer('avg_heart_rate'),
  sets: integer('sets'),
  repsPerSet: integer('reps_per_set'),
  weightPerSetLbs: real('weight_per_set_lbs'),
});

// ── Measurements ───────────────────────────────────────────────────

export const measurements = sqliteTable('measurements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  type: text('type').notNull(),
  value: real('value').notNull(),
  unit: text('unit'),
  notes: text('notes'),
  photo: text('photo'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ── Meals (templates) ──────────────────────────────────────────────

export const meals = sqliteTable('meals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  defaultMealType: text('default_meal_type'),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const mealItems = sqliteTable('meal_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId: text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  foodId: text('food_id').notNull().references(() => foods.id, { onDelete: 'cascade' }),
  servingId: text('serving_id').references(() => foodServings.id, { onDelete: 'set null' }),
  quantity: real('quantity').notNull().default(1),
});

export const mealsToFoodTags = sqliteTable('meals_food_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  mealId: text('meal_id').notNull().references(() => meals.id, { onDelete: 'cascade' }),
  foodTagId: text('food_tag_id').notNull().references(() => foodTags.id, { onDelete: 'cascade' }),
});

// ── Journal Entries ────────────────────────────────────────────────

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  entryDate: text('entry_date').notNull(),
  entryTime: text('entry_time').notNull(),
  content: text('content').notNull(),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
