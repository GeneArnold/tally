/**
 * Migrate data from Directus production to local SQLite database.
 *
 * Usage:
 *   DIRECTUS_URL=http://192.168.40.51:8057 DIRECTUS_TOKEN=<admin-token> npx tsx scripts/migrate-from-directus.ts
 *
 * This script:
 * 1. Fetches all data from Directus REST API
 * 2. Maps Directus users to local users (with a placeholder password)
 * 3. Inserts everything into the local SQLite database
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://192.168.40.51:8057';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_TOKEN) {
  console.error('DIRECTUS_TOKEN is required. Get an admin static token from Directus.');
  process.exit(1);
}

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'health.db');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = OFF'); // Disable during migration for insert order flexibility
const db = drizzle(sqlite, { schema });

// Run migrations first
migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });

async function fetchAll(collection: string, params = '') {
  const url = `${DIRECTUS_URL}/items/${collection}?limit=-1${params ? '&' + params : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
  });
  if (!res.ok) {
    console.error(`Failed to fetch ${collection}: ${res.status} ${res.statusText}`);
    return [];
  }
  const data = await res.json();
  return data.data || [];
}

async function fetchUsers() {
  const res = await fetch(`${DIRECTUS_URL}/users?limit=-1&fields=id,email,first_name,last_name,role`, {
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

async function main() {
  console.log(`Migrating from ${DIRECTUS_URL} to ${DB_PATH}...`);

  // 1. Users
  console.log('\n--- Users ---');
  const directusUsers = await fetchUsers();
  const placeholderHash = await bcrypt.hash('changeme123', 12);
  const userIdMap = new Map<string, string>();

  for (const u of directusUsers) {
    const id = crypto.randomUUID();
    userIdMap.set(u.id, id);
    try {
      db.insert(schema.users).values({
        id,
        email: u.email.toLowerCase(),
        passwordHash: placeholderHash,
        firstName: u.first_name,
        lastName: u.last_name,
        role: 'athlete',
      }).run();
      console.log(`  User: ${u.email} (${u.id} -> ${id})`);
    } catch (err) {
      console.log(`  Skip user ${u.email}: ${(err as Error).message}`);
    }
  }

  // 2. Health Profiles
  console.log('\n--- Health Profiles ---');
  const profiles = await fetchAll('nx_health_profile');
  for (const p of profiles) {
    const userId = userIdMap.get(p.user);
    if (!userId) { console.log(`  Skip profile: no user mapping for ${p.user}`); continue; }
    try {
      db.insert(schema.healthProfiles).values({
        id: crypto.randomUUID(),
        userId,
        dateOfBirth: p.date_of_birth,
        sex: p.sex,
        heightFt: p.height_ft,
        heightIn: p.height_in,
        startingWeightLbs: p.starting_weight_lbs,
        currentWeightLbs: p.current_weight_lbs,
        goalWeightLbs: p.goal_weight_lbs,
        goalTargetDate: p.goal_target_date,
        activityLevel: p.activity_level,
        weeklyGoal: p.weekly_goal,
        dailyCalorieGoal: p.daily_calorie_goal,
        dailyStepGoal: p.daily_step_goal,
        goalWaterOz: p.goal_water_oz,
        goalProteinG: p.goal_protein_g,
        goalCarbsG: p.goal_carbs_g,
        goalFatG: p.goal_fat_g,
        goalFiberG: p.goal_fiber_g,
        goalSodiumMg: p.goal_sodium_mg,
        goalSugarG: p.goal_sugar_g,
        unitSystem: p.unit_system,
        mealNames: p.meal_names,
        notes: p.notes,
      }).run();
      console.log(`  Profile for user ${userId}`);
    } catch (err) {
      console.log(`  Skip profile: ${(err as Error).message}`);
    }
  }

  // 3. Food Tags
  console.log('\n--- Food Tags ---');
  const tags = await fetchAll('nx_food_tags');
  const tagIdMap = new Map<string, string>();
  for (const t of tags) {
    const id = crypto.randomUUID();
    const userId = userIdMap.get(t.user);
    if (!userId) { console.log(`  Skip tag ${t.name}: no user mapping`); continue; }
    tagIdMap.set(String(t.id), id);
    try {
      db.insert(schema.foodTags).values({
        id,
        userId,
        name: t.name,
        color: t.color || '#3B82F6',
        sort: t.sort || 0,
        deletedAt: t.deleted_at,
      }).run();
      console.log(`  Tag: ${t.name} (${t.id} -> ${id})`);
    } catch (err) {
      console.log(`  Skip tag ${t.name}: ${(err as Error).message}`);
    }
  }

  // 4. Foods
  console.log('\n--- Foods ---');
  const foods = await fetchAll('nx_foods');
  const foodIdMap = new Map<string, string>();
  for (const f of foods) {
    const id = crypto.randomUUID();
    foodIdMap.set(String(f.id), id);
    const userId = f.user_created ? userIdMap.get(f.user_created) : null;
    try {
      db.insert(schema.foods).values({
        id,
        userId: userId || null,
        fdcId: f.fdc_id,
        description: f.description || 'Unknown',
        brandOwner: f.brand_owner,
        brandName: f.brand_name,
        upcCode: f.upc_code,
        dataType: f.data_type,
        source: f.source,
        defaultServingSize: f.default_serving_size,
        defaultServingUnit: f.default_serving_unit,
        householdServing: f.household_serving,
        energyKcal: f.energy_kcal,
        proteinG: f.protein_g,
        totalFatG: f.fat_g ?? f.total_fat_g,
        saturatedFatG: f.saturated_fat_g,
        transFatG: f.trans_fat_g,
        cholesterolMg: f.cholesterol_mg,
        carbohydrateG: f.carbs_g ?? f.carbohydrate_g,
        dietaryFiberG: f.fiber_g ?? f.dietary_fiber_g,
        totalSugarsG: f.sugar_g ?? f.total_sugars_g,
        sodiumMg: f.sodium_mg,
        deletedAt: f.deleted_at,
      }).run();
      console.log(`  Food: ${f.description} (${f.id} -> ${id})`);
    } catch (err) {
      console.log(`  Skip food ${f.description}: ${(err as Error).message}`);
    }
  }

  // 5. Food-Tag junctions
  console.log('\n--- Food-Tag Junctions ---');
  const foodTagJunctions = await fetchAll('nx_foods_nx_food_tags');
  let junctionCount = 0;
  for (const j of foodTagJunctions) {
    const foodId = foodIdMap.get(String(j.nx_foods_id));
    const tagId = tagIdMap.get(String(j.nx_food_tags_id));
    if (!foodId || !tagId) continue;
    try {
      db.insert(schema.foodsToFoodTags).values({
        id: crypto.randomUUID(),
        foodId,
        foodTagId: tagId,
      }).run();
      junctionCount++;
    } catch (err) {
      // Skip duplicates
    }
  }
  console.log(`  Inserted ${junctionCount} food-tag links`);

  // 6. Meals
  console.log('\n--- Meals ---');
  const meals = await fetchAll('nx_meals');
  const mealIdMap = new Map<string, string>();
  for (const m of meals) {
    const id = crypto.randomUUID();
    mealIdMap.set(String(m.id), id);
    const userId = m.user ? userIdMap.get(m.user) : null;
    try {
      db.insert(schema.meals).values({
        id,
        userId: userId || null,
        name: m.name || 'Unnamed',
        description: m.description,
        defaultMealType: m.default_meal_type,
        deletedAt: m.deleted_at,
      }).run();
      console.log(`  Meal: ${m.name} (${m.id} -> ${id})`);
    } catch (err) {
      console.log(`  Skip meal ${m.name}: ${(err as Error).message}`);
    }
  }

  // 7. Meal Items
  console.log('\n--- Meal Items ---');
  const mealItems = await fetchAll('nx_meal_items');
  let mealItemCount = 0;
  for (const mi of mealItems) {
    const mealId = mealIdMap.get(String(mi.meal));
    const foodId = foodIdMap.get(String(mi.food));
    if (!mealId || !foodId) continue;
    try {
      db.insert(schema.mealItems).values({
        id: crypto.randomUUID(),
        mealId,
        foodId,
        quantity: mi.quantity || 1,
      }).run();
      mealItemCount++;
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${mealItemCount} meal items`);

  // 8. Meal-Tag junctions
  console.log('\n--- Meal-Tag Junctions ---');
  const mealTagJunctions = await fetchAll('nx_meals_nx_food_tags');
  let mealTagCount = 0;
  for (const j of mealTagJunctions) {
    const mealId = mealIdMap.get(String(j.nx_meals_id));
    const tagId = tagIdMap.get(String(j.nx_food_tags_id));
    if (!mealId || !tagId) continue;
    try {
      db.insert(schema.mealsToFoodTags).values({
        id: crypto.randomUUID(),
        mealId,
        foodTagId: tagId,
      }).run();
      mealTagCount++;
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${mealTagCount} meal-tag links`);

  // 9. Diary Entries
  console.log('\n--- Diary Entries ---');
  const diaryEntries = await fetchAll('nx_diary_entries');
  const diaryIdMap = new Map<string, string>();
  for (const d of diaryEntries) {
    const id = crypto.randomUUID();
    diaryIdMap.set(String(d.id), id);
    const userId = userIdMap.get(d.user);
    if (!userId) continue;
    try {
      db.insert(schema.diaryEntries).values({
        id,
        userId,
        date: d.date,
        type: d.type || 'diary_meal',
        diaryMeal: d.diary_meal,
        notes: d.notes,
        stepsCount: d.steps_count,
        waterOz: d.water_oz,
        totalCalories: d.total_calories || 0,
        totalProteinG: d.total_protein_g || 0,
        totalCarbsG: d.total_carbs_g || 0,
        totalFatG: d.total_fat_g || 0,
        totalFiberG: d.total_fiber_g || 0,
        totalSodiumMg: d.total_sodium_mg || 0,
        totalSugarG: d.total_sugar_g || 0,
      }).run();
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${diaryIdMap.size} diary entries`);

  // 10. Food Entries
  console.log('\n--- Food Entries ---');
  const foodEntries = await fetchAll('nx_food_entries');
  let foodEntryCount = 0;
  for (const fe of foodEntries) {
    const diaryEntryId = diaryIdMap.get(String(fe.diary_entry));
    if (!diaryEntryId) continue;
    const foodId = fe.food ? foodIdMap.get(String(fe.food)) : null;
    try {
      db.insert(schema.foodEntries).values({
        id: crypto.randomUUID(),
        diaryEntryId,
        foodId: foodId || null,
        quantity: fe.quantity || 1,
        energyKcal: fe.energy_kcal,
        proteinG: fe.protein_g,
        carbsG: fe.carbs_g,
        fatG: fe.fat_g,
        fiberG: fe.fiber_g,
        sodiumMg: fe.sodium_mg,
        sugarG: fe.sugar_g,
      }).run();
      foodEntryCount++;
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${foodEntryCount} food entries`);

  // 11. Measurements
  console.log('\n--- Measurements ---');
  const measurements = await fetchAll('nx_measurements');
  let measCount = 0;
  for (const m of measurements) {
    const userId = userIdMap.get(m.user);
    if (!userId) continue;
    try {
      db.insert(schema.measurements).values({
        id: crypto.randomUUID(),
        userId,
        date: m.date,
        type: m.type,
        value: m.value,
        unit: m.unit,
        notes: m.notes,
        photo: m.photo,
      }).run();
      measCount++;
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${measCount} measurements`);

  // 12. Journal Entries
  console.log('\n--- Journal Entries ---');
  const journalEntries = await fetchAll('nx_journal_entries');
  let journalCount = 0;
  for (const j of journalEntries) {
    const userId = j.user_created ? userIdMap.get(j.user_created) : null;
    if (!userId) continue;
    try {
      db.insert(schema.journalEntries).values({
        id: crypto.randomUUID(),
        userId,
        entryDate: j.entry_date,
        entryTime: j.entry_time,
        content: j.content,
        deletedAt: j.deleted_at,
      }).run();
      journalCount++;
    } catch (err) {
      // Skip
    }
  }
  console.log(`  Inserted ${journalCount} journal entries`);

  // Re-enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  console.log('\n✓ Migration complete!');
  console.log('\nIMPORTANT: All users have password "changeme123" — change passwords after migration.');
  console.log('\nUser ID mappings (Directus -> Local):');
  for (const [directusId, localId] of userIdMap) {
    console.log(`  ${directusId} -> ${localId}`);
  }

  sqlite.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
