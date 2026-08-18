PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_food_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#2EA96B',
	`sort` integer DEFAULT 0,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_food_tags`("id", "user_id", "name", "color", "sort", "deleted_at") SELECT "id", "user_id", "name", "color", "sort", "deleted_at" FROM `food_tags`;--> statement-breakpoint
DROP TABLE `food_tags`;--> statement-breakpoint
ALTER TABLE `__new_food_tags` RENAME TO `food_tags`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_foods` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
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
INSERT INTO `__new_foods`("id", "user_id", "fdc_id", "description", "brand_owner", "brand_name", "upc_code", "data_type", "source", "default_serving_size", "default_serving_unit", "household_serving", "energy_kcal", "protein_g", "total_fat_g", "saturated_fat_g", "trans_fat_g", "polyunsaturated_fat_g", "monounsaturated_fat_g", "cholesterol_mg", "carbohydrate_g", "dietary_fiber_g", "total_sugars_g", "added_sugars_g", "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg", "vitamin_d_mcg", "deleted_at", "created_at") SELECT "id", "user_id", "fdc_id", "description", "brand_owner", "brand_name", "upc_code", "data_type", "source", "default_serving_size", "default_serving_unit", "household_serving", "energy_kcal", "protein_g", "total_fat_g", "saturated_fat_g", "trans_fat_g", "polyunsaturated_fat_g", "monounsaturated_fat_g", "cholesterol_mg", "carbohydrate_g", "dietary_fiber_g", "total_sugars_g", "added_sugars_g", "sodium_mg", "potassium_mg", "calcium_mg", "iron_mg", "vitamin_d_mcg", "deleted_at", "created_at" FROM `foods`;--> statement-breakpoint
DROP TABLE `foods`;--> statement-breakpoint
ALTER TABLE `__new_foods` RENAME TO `foods`;--> statement-breakpoint
CREATE TABLE `__new_meals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`default_meal_type` text,
	`deleted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meals`("id", "user_id", "name", "description", "default_meal_type", "deleted_at", "created_at") SELECT "id", "user_id", "name", "description", "default_meal_type", "deleted_at", "created_at" FROM `meals`;--> statement-breakpoint
DROP TABLE `meals`;--> statement-breakpoint
ALTER TABLE `__new_meals` RENAME TO `meals`;