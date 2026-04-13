# Directus Schema Reference

All collections live in Directus. The app talks to them via the Directus SDK (`@directus/sdk`).

**Development URL:** `http://192.168.40.51:8058`
**Production URL:** `http://192.168.40.51:8057`
**Testing URL:** `http://192.168.40.51:8059`

ALL work targets DEVELOPMENT. Never touch production directly.

## Existing Collections

### nx_health_profile (28 fields)
Currently a singleton — needs to be converted to per-user (add `user` M2O field, remove singleton).

**Identity:** name, date_of_birth, sex, profile_photo, photo_before, photo_after
**Body:** height_ft, height_in, starting_weight_lbs, current_weight_lbs, goal_weight_lbs, target_date
**Activity & Goals:** activity_level, weekly_goal, daily_calorie_goal, daily_step_goal, goal_water_oz
**Macros:** goal_protein_g, goal_carbs_g, goal_fat_g, goal_fiber_g, goal_sodium_mg, goal_sugar_g
**Preferences:** unit_system, meal_1_name, meal_2_name, meal_3_name, meal_4_name, notes

### nx_diary_entries (16 fields)
Daily log entries. Types: diary_meal, exercise, steps_aggregate, water.

**Fields:** date, type, diary_meal (Breakfast/Lunch/Dinner/Snacks), steps_count, water_oz, notes
**Nutrition totals:** total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, total_sodium_mg, total_sugar_g
**Relations:** food_entries (O2M), exercises (O2M)

### nx_foods (26 fields)
Food database. USDA FoodData Central + custom entries.

**Identity:** fdc_id, description, brand_owner, brand_name, upc_code, data_type, source
**Serving:** serving_size, serving_size_unit, household_serving
**Nutrition (per serving):** energy_kcal, protein_g, total_fat_g, saturated_fat_g, trans_fat_g, polyunsaturated_fat_g, monounsaturated_fat_g, cholesterol_mg, carbohydrate_g, dietary_fiber_g, total_sugars_g, added_sugars_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, vitamin_d_mcg

### nx_food_servings (6 fields)
M2O to nx_foods (CASCADE delete). nutrition_multiplier for serving size math.

**Fields:** food (M2O), label, serving_size, serving_unit, nutrition_multiplier

### nx_food_entries (12 fields)
Junction: diary_entry -> food + serving. Calculated nutrition stored at log time.

**Fields:** diary_entry (M2O CASCADE), food (M2O SET NULL), serving (M2O SET NULL), quantity
**Calculated nutrition:** energy_kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, sugar_g

### nx_exercises (12 fields)
M2O to diary (CASCADE).

**Common:** exercise_type, duration_seconds, calories_burned, notes
**Cardio:** distance, distance_unit, avg_heart_rate
**Strength:** exercise_name, sets, reps_per_set, weight_per_set_lbs

### nx_measurements (7 fields)
Body measurements with optional progress photo.

**Fields:** date, measurement_type (weight, body_fat, waist, neck, chest, hips, bicep, thigh, calf), value, unit, notes, photo

### nx_meals (saved meal templates)
**Fields:** name, description, default_meal_type, user (to be added)
**Relation:** meal_items (O2M)

### nx_meal_items
**Fields:** meal (M2O), food (M2O), serving (M2O), quantity

## Multi-User Changes Needed

1. Add `user` (M2O -> directus_users, NOT NULL, CASCADE) to: nx_health_profile, nx_diary_entries, nx_measurements
2. Add `user` (M2O -> directus_users, NULLABLE, CASCADE) to: nx_meals
3. Remove singleton from nx_health_profile
4. Create `athlete` role with user-scoped permissions
5. Create `admin` role with full access

## Nutrition Calculation Formula

When logging a food entry:
```
calculated_value = food.base_nutrition * serving.nutrition_multiplier * quantity
```

Example: 2 servings of chicken breast (100g base, 1.5x multiplier for 150g serving)
- energy_kcal = 165 * 1.5 * 2 = 495 kcal
