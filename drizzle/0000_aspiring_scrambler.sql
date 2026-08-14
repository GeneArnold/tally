CREATE TABLE `diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'diary_meal' NOT NULL,
	`diary_meal` text,
	`notes` text,
	`steps_count` integer,
	`water_oz` real,
	`total_calories` real DEFAULT 0,
	`total_protein_g` real DEFAULT 0,
	`total_carbs_g` real DEFAULT 0,
	`total_fat_g` real DEFAULT 0,
	`total_fiber_g` real DEFAULT 0,
	`total_sodium_mg` real DEFAULT 0,
	`total_sugar_g` real DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`diary_entry_id` text NOT NULL,
	`exercise_type` text,
	`exercise_name` text,
	`duration_seconds` integer,
	`calories_burned` real,
	`notes` text,
	`distance` real,
	`distance_unit` text,
	`avg_heart_rate` integer,
	`sets` integer,
	`reps_per_set` integer,
	`weight_per_set_lbs` real,
	FOREIGN KEY (`diary_entry_id`) REFERENCES `diary_entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `food_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`diary_entry_id` text NOT NULL,
	`food_id` text,
	`serving_id` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`energy_kcal` real,
	`protein_g` real,
	`carbs_g` real,
	`fat_g` real,
	`fiber_g` real,
	`sodium_mg` real,
	`sugar_g` real,
	FOREIGN KEY (`diary_entry_id`) REFERENCES `diary_entries`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`serving_id`) REFERENCES `food_servings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `food_servings` (
	`id` text PRIMARY KEY NOT NULL,
	`food_id` text NOT NULL,
	`label` text NOT NULL,
	`serving_size` real,
	`serving_unit` text,
	`nutrition_multiplier` real DEFAULT 1 NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `food_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3B82F6',
	`sort` integer DEFAULT 0,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `foods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`fdc_id` integer,
	`description` text NOT NULL,
	`brand_owner` text,
	`brand_name` text,
	`upc_code` text,
	`data_type` text,
	`source` text,
	`default_serving_size` real,
	`default_serving_unit` text,
	`household_serving` text,
	`energy_kcal` real,
	`protein_g` real,
	`total_fat_g` real,
	`saturated_fat_g` real,
	`trans_fat_g` real,
	`polyunsaturated_fat_g` real,
	`monounsaturated_fat_g` real,
	`cholesterol_mg` real,
	`carbohydrate_g` real,
	`dietary_fiber_g` real,
	`total_sugars_g` real,
	`added_sugars_g` real,
	`sodium_mg` real,
	`potassium_mg` real,
	`calcium_mg` real,
	`iron_mg` real,
	`vitamin_d_mcg` real,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `foods_food_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`food_id` text NOT NULL,
	`food_tag_id` text NOT NULL,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_tag_id`) REFERENCES `food_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date_of_birth` text,
	`sex` text,
	`height_ft` integer,
	`height_in` integer,
	`starting_weight_lbs` real,
	`current_weight_lbs` real,
	`goal_weight_lbs` real,
	`goal_target_date` text,
	`activity_level` text,
	`weekly_goal` text,
	`daily_calorie_goal` integer,
	`daily_step_goal` integer,
	`goal_water_oz` integer,
	`goal_protein_g` integer,
	`goal_carbs_g` integer,
	`goal_fat_g` integer,
	`goal_fiber_g` integer,
	`goal_sodium_mg` integer,
	`goal_sugar_g` integer,
	`unit_system` text DEFAULT 'imperial',
	`meal_names` text,
	`notes` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_profiles_user_id_unique` ON `health_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`entry_time` text NOT NULL,
	`content` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meal_items` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_id` text NOT NULL,
	`food_id` text NOT NULL,
	`serving_id` text,
	`quantity` real DEFAULT 1 NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serving_id`) REFERENCES `food_servings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`description` text,
	`default_meal_type` text,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meals_food_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`meal_id` text NOT NULL,
	`food_tag_id` text NOT NULL,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`food_tag_id`) REFERENCES `food_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text,
	`notes` text,
	`photo` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`role` text DEFAULT 'athlete' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);