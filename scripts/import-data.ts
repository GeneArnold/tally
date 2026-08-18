import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'health.db');
const DUMP_PATH = path.join(process.cwd(), 'data', 'directus-dump.json');

interface DirectusDump {
  user: {
    email: string;
    first_name: string;
    last_name: string;
    directus_id: string;
  };
  profile: Record<string, any>;
  food_tags: Array<Record<string, any>>;
  foods: Array<Record<string, any>>;
  food_tag_junctions: Array<Record<string, any>>;
  meals: Array<Record<string, any>>;
  meal_items: Array<Record<string, any>>;
  meal_tag_junctions: Array<Record<string, any>>;
  diary_entries: Array<Record<string, any>>;
  food_entries: Array<Record<string, any>>;
  measurements: Array<Record<string, any>>;
  journal_entries: Array<Record<string, any>>;
}

async function importData() {
  console.log('🚀 Starting data import...');

  // Read the dump file
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`Dump file not found: ${DUMP_PATH}`);
  }

  const dumpContent = fs.readFileSync(DUMP_PATH, 'utf-8');
  const dump: DirectusDump = JSON.parse(dumpContent);

  // Delete existing DB
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('📦 Deleted existing database');
  }

  // Create data directory
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // Initialize database
  const sqlite = new Database(DB_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = OFF'); // Disable during import for flexibility
  const db = drizzle(sqlite, { schema });

  // Run migrations
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('✅ Migrations completed');

  // Create ID mapping: Directus user ID -> new UUID
  const DIRECTUS_USER_ID = dump.user.directus_id;
  const NEW_USER_ID = crypto.randomUUID();
  const idMap = new Map<string, string>([[DIRECTUS_USER_ID, NEW_USER_ID]]);

  console.log(`📍 User ID mapping: ${DIRECTUS_USER_ID} -> ${NEW_USER_ID}`);

  // 1. Insert user
  const hashedPassword = await bcrypt.hash('changeme123', 12);
  db.insert(schema.users).values({
    id: NEW_USER_ID,
    email: dump.user.email,
    passwordHash: hashedPassword,
    firstName: dump.user.first_name,
    lastName: dump.user.last_name,
    role: 'athlete',
  }).run();
  console.log('✅ User created');

  // 2. Insert health profile
  const profile = dump.profile;
  db.insert(schema.healthProfiles).values({
    id: profile.id,
    userId: NEW_USER_ID,
    dateOfBirth: profile.date_of_birth || null,
    sex: profile.sex || null,
    heightFt: profile.height_ft || null,
    heightIn: profile.height_in || null,
    startingWeightLbs: profile.starting_weight_lbs || null,
    currentWeightLbs: profile.current_weight_lbs || null,
    goalWeightLbs: profile.goal_weight_lbs || null,
    goalTargetDate: profile.goal_target_date || null,
    activityLevel: profile.activity_level || null,
    weeklyGoal: profile.weekly_goal || null,
    dailyCalorieGoal: profile.daily_calorie_goal || null,
    dailyStepGoal: profile.daily_step_goal || null,
    goalWaterOz: profile.goal_water_oz || null,
    goalProteinG: profile.goal_protein_g || null,
    goalCarbsG: profile.goal_carbs_g || null,
    goalFatG: profile.goal_fat_g || null,
    goalFiberG: profile.goal_fiber_g || null,
    goalSodiumMg: profile.goal_sodium_mg || null,
    goalSugarG: profile.goal_sugar_g || null,
    unitSystem: profile.unit_system || 'imperial',
    mealNames: profile.meal_names || null,
    notes: profile.notes || null,
  }).run();
  console.log('✅ Health profile created');

  // 3. Insert food tags
  const tagInserts = dump.food_tags.map((tag: any) => ({
    id: tag.id,
    userId: NEW_USER_ID, // Map to new user ID
    name: tag.name,
    color: tag.color || '#3B82F6',
    sort: tag.sort || 0,
    deletedAt: tag.deleted_at || null,
  }));
  for (const tag of tagInserts) {
    db.insert(schema.foodTags).values(tag).run();
  }
  console.log(`✅ Food tags created (${dump.food_tags.length} records)`);

  // 4. Insert foods
  const foodInserts = dump.foods.map((food: any) => ({
    id: food.id,
    userId: NEW_USER_ID,
    fdcId: food.fdc_id || null,
    description: food.description,
    brandOwner: food.brand_owner || null,
    brandName: food.brand_name || null,
    upcCode: food.upc_code || null,
    dataType: food.data_type || null,
    source: food.source || null,
    defaultServingSize: food.default_serving_size || null,
    defaultServingUnit: food.default_serving_unit || null,
    householdServing: food.household_serving || null,
    energyKcal: food.energy_kcal || null,
    proteinG: food.protein_g || null,
    totalFatG: food.fat_g || null,
    saturatedFatG: food.saturated_fat_g || null,
    transFatG: food.trans_fat_g || null,
    polyunsaturatedFatG: food.polyunsaturated_fat_g || null,
    monounsaturatedFatG: food.monounsaturated_fat_g || null,
    cholesterolMg: food.cholesterol_mg || null,
    carbohydrateG: food.carbs_g || null,
    dietaryFiberG: food.fiber_g || null,
    totalSugarsG: food.sugar_g || null,
    addedSugarsG: food.added_sugars_g || null,
    sodiumMg: food.sodium_mg || null,
    potassiumMg: food.potassium_mg || null,
    calciumMg: food.calcium_mg || null,
    ironMg: food.iron_mg || null,
    vitaminDMcg: food.vitamin_d_mcg || null,
    deletedAt: food.deleted_at || null,
  }));
  for (const food of foodInserts) {
    db.insert(schema.foods).values(food).run();
  }
  console.log(`✅ Foods created (${dump.foods.length} records)`);

  // 5. Insert food-tag junctions
  for (const junction of dump.food_tag_junctions) {
    db.insert(schema.foodsToFoodTags).values({
      id: junction.id,
      foodId: junction.food_id,
      foodTagId: junction.food_tag_id,
    }).run();
  }
  console.log(`✅ Food-tag junctions created (${dump.food_tag_junctions.length} records)`);

  // 6. Insert meals
  const mealInserts = dump.meals.map((meal: any) => ({
    id: meal.id,
    userId: NEW_USER_ID,
    name: meal.name,
    description: meal.description || null,
    defaultMealType: meal.default_meal_type || null,
    deletedAt: meal.deleted_at || null,
  }));
  for (const meal of mealInserts) {
    db.insert(schema.meals).values(meal).run();
  }
  console.log(`✅ Meals created (${dump.meals.length} records)`);

  // 7. Insert meal items
  for (const item of dump.meal_items) {
    db.insert(schema.mealItems).values({
      id: item.id,
      mealId: item.meal_id,
      foodId: item.food_id,
      servingId: item.serving_id || null,
      quantity: item.quantity || 1,
    }).run();
  }
  console.log(`✅ Meal items created (${dump.meal_items.length} records)`);

  // 8. Insert meal-tag junctions
  for (const junction of dump.meal_tag_junctions) {
    db.insert(schema.mealsToFoodTags).values({
      id: junction.id,
      mealId: junction.meal_id,
      foodTagId: junction.food_tag_id,
    }).run();
  }
  console.log(`✅ Meal-tag junctions created (${dump.meal_tag_junctions.length} records)`);

  // 9. Insert diary entries
  const diaryInserts = dump.diary_entries.map((entry: any) => ({
    id: entry.id,
    userId: NEW_USER_ID,
    date: entry.date,
    type: entry.type || 'diary_meal',
    diaryMeal: entry.diary_meal || null,
    notes: entry.notes || null,
    stepsCount: entry.steps_count || null,
    waterOz: entry.water_oz || null,
    totalCalories: entry.total_calories || 0,
    totalProteinG: entry.total_protein_g || 0,
    totalCarbsG: entry.total_carbs_g || 0,
    totalFatG: entry.total_fat_g || 0,
    totalFiberG: entry.total_fiber_g || 0,
    totalSodiumMg: entry.total_sodium_mg || 0,
    totalSugarG: entry.total_sugar_g || 0,
  }));
  for (const entry of diaryInserts) {
    db.insert(schema.diaryEntries).values(entry).run();
  }
  console.log(`✅ Diary entries created (${dump.diary_entries.length} records)`);

  // 10. Insert food entries
  for (const entry of dump.food_entries) {
    db.insert(schema.foodEntries).values({
      id: entry.id,
      diaryEntryId: entry.diary_entry_id,
      foodId: entry.food_id || null,
      servingId: entry.serving_id || null,
      quantity: entry.quantity || 1,
      energyKcal: entry.energy_kcal || null,
      proteinG: entry.protein_g || null,
      carbsG: entry.carbs_g || null,
      fatG: entry.fat_g || null,
      fiberG: entry.fiber_g || null,
      sodiumMg: entry.sodium_mg || null,
      sugarG: entry.sugar_g || null,
    }).run();
  }
  console.log(`✅ Food entries created (${dump.food_entries.length} records)`);

  // 11. Insert measurements
  for (const measurement of dump.measurements) {
    db.insert(schema.measurements).values({
      id: measurement.id,
      userId: NEW_USER_ID,
      date: measurement.date,
      type: measurement.type,
      value: measurement.value,
      unit: measurement.unit || null,
      notes: measurement.notes || null,
      photo: measurement.photo || null,
    }).run();
  }
  console.log(`✅ Measurements created (${dump.measurements.length} records)`);

  // 12. Insert journal entries
  for (const entry of dump.journal_entries) {
    db.insert(schema.journalEntries).values({
      id: entry.id,
      userId: NEW_USER_ID,
      entryDate: entry.entry_date,
      entryTime: entry.entry_time,
      content: entry.content,
      deletedAt: entry.deleted_at || null,
    }).run();
  }
  console.log(`✅ Journal entries created (${dump.journal_entries.length} records)`);

  // Re-enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Close database
  sqlite.close();

  console.log('\n✨ Data import completed successfully!');
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`👤 User ID: ${NEW_USER_ID}`);
}

importData().catch((error) => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
