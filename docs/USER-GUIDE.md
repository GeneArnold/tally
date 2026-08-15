# Tally — User Guide

A complete guide to using Tally for food logging, nutrition tracking, and health goals.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Food Diary](#food-diary)
4. [Adding Food to Your Diary](#adding-food-to-your-diary)
5. [My Foods](#my-foods)
6. [Adding New Foods](#adding-new-foods)
7. [Meals (Templates)](#meals-templates)
8. [Health Journal](#health-journal)
9. [Profile & Goals](#profile--goals)
10. [Tags](#tags)
11. [Weight Tracking](#weight-tracking)
12. [Tips & Workflows](#tips--workflows)

---

## Getting Started

### Creating an Account

1. Open Tally in your browser
2. Click **Sign up** on the login page
3. Enter your first name, last name, email, and a password (8+ characters)
4. You'll be taken directly to the dashboard

### First Steps

After creating your account, you'll want to:

1. **Set up your profile** — go to the Profile tab and fill in your goals (daily calories, macro targets, weight goals)
2. **Create your tags** — go to Profile > Tag Manager and create tags like "Breakfast", "Protein", "Quick", etc.
3. **Add your foods** — start building your food catalog in My Foods
4. **Log your first day** — go to the Diary and add foods to your meals

---

## Dashboard

The dashboard is your daily snapshot. It shows:

- **Calorie progress bar** — how many calories you've eaten today vs. your daily goal, with remaining calories displayed
- **Macro rings** — circular progress indicators for protein, carbs, and fat
- **Quick actions** — tiles to navigate to the diary, log weight, and access other features
- **Greeting** — shows your name and today's date

The dashboard updates automatically as you log food throughout the day.

---

## Food Diary

The diary is where you log what you eat each day. It's organized into four meal slots:

- **Breakfast**
- **Lunch**
- **Dinner**
- **Snacks**

### Navigating Dates

Use the date navigation at the top of the diary to move between days. You can go forward and backward, or jump back to today.

### Viewing a Day

Each meal slot shows:
- The foods you've logged for that meal
- Per-food details: name, quantity, calories, and macros
- A total for each meal slot
- An **Add Food** button to log more items

### Editing Food Entries

Tap on a food entry to edit it. You can:
- **Change the quantity** — adjust serving amounts
- **Delete the entry** — remove it from the diary

When you add, edit, or delete a food entry, the diary totals and dashboard update automatically.

---

## Adding Food to Your Diary

When you tap **Add Food** on a diary meal slot, you're taken to the food search screen. This is where you pick foods from your personal catalog.

### Searching

Type in the search box to filter your foods by name. Results appear instantly as you type.

### Filtering by Tags

Below the search box, you'll see tag filter pills (if you've created tags). Tap one or more tags to filter foods — for example, tap "Breakfast" to see only breakfast foods. Tags filter cumulatively (AND logic) — selecting "Breakfast" + "Protein" shows foods that have both tags.

### Selecting Foods

- Tap a food to select it — it moves to the top of the list with quantity controls
- Use the **+** and **-** buttons to adjust the quantity (in 0.25 serving increments)
- You can select multiple foods at once

### Adding to Your Diary

A sticky button at the bottom shows how many foods you've selected and the total calories. Tap it to add all selected foods to your diary entry.

---

## My Foods

My Foods is your personal food catalog — the source of truth for everything you log in your diary. Think of it as your personal food database.

### Browsing

The main My Foods page shows all your foods with:
- Food name and brand (if applicable)
- Calories per serving
- Macro breakdown (protein, carbs, fat in grams)
- Colored tag pills

### Searching and Filtering

- **Search box** — type to filter by food name
- **Tag pills** — tap to filter by tag (same AND logic as the diary)

### Viewing a Food

Tap a food to see its full nutrition details, including all macro and micronutrients, serving information, and tags.

### Editing a Food

From the food detail page, tap Edit to modify any field — name, brand, serving size, nutrition values, or tags.

### Deleting a Food

Foods are soft-deleted — they're hidden from your catalog but the data is preserved. Existing diary entries that reference the food are not affected.

---

## Adding New Foods

Tap the **+** button on the My Foods page. You have four ways to add a food:

### 1. AI Assist (Text)

Type a description of the food — for example, "hard-boiled egg" or "Subway Italian BMT 6-inch sandwich." The AI parses it into structured nutrition data. Review the results, adjust if needed, and save.

### 2. AI Assist (Photo)

Take a photo of a food or nutrition label. The AI identifies the food and extracts nutrition data. Works great for:
- **Nutrition labels** — reads exact values
- **Food photos** — estimates portions and nutrition
- **Restaurant menus** — identifies items and estimates

You can add context (e.g., "this is about 6 oz of chicken") to improve accuracy.

### 3. USDA Search

Search the USDA FoodData Central database — over 400,000 foods with detailed nutrition data. Great for generic foods like "chicken breast" or "brown rice." Requires a USDA API key.

### 4. Barcode Scanner

Use your phone's camera to scan a product's barcode (UPC). Tally looks it up in the USDA database and Open Food Facts. You can also type the barcode number manually.

### 5. Manual Entry

Fill in the nutrition data yourself. Useful for homemade recipes or foods not in any database.

### After Adding

Once the nutrition data is filled in (by any method), you can:
- Edit the name, brand, serving size, and any nutrition values
- Assign tags to organize the food
- Save it to your catalog

---

## Meals (Templates)

Meals are saved combinations of foods for quick logging. If you eat the same breakfast every day, save it as a meal and log it with one tap instead of adding each food individually.

### Creating a Meal

1. Go to the Meals tab
2. Tap **New Meal**
3. Enter a name (e.g., "Morning Smoothie"), optional description, and default meal slot
4. Search and select foods from your catalog
5. Adjust quantities for each food
6. Save

### Viewing a Meal

Tap a meal to see its foods, total calories, and per-food breakdown. You can:
- Add or remove foods
- Edit the name, description, or default slot
- See the total nutrition breakdown

### Logging a Meal

From a meal's detail page, log all its foods to your diary at once. They'll be added to the meal's default slot (or one you choose).

---

## Health Journal

The journal lets you write timestamped notes tied to specific dates. Use it for:
- How you're feeling
- Notes about your diet
- Exercise observations
- Anything you want to remember about a particular day

Journal entries appear in the diary view for the corresponding date.

### Adding an Entry

From the diary page, scroll to the journal section and tap to add a new entry. Each entry records the date and time automatically.

### Editing and Deleting

Tap an entry to edit its content, or delete it (soft delete — recoverable).

---

## Profile & Goals

The Profile page is where you configure your personal information and tracking goals.

### About Me

- Date of birth, sex, height
- Activity level (sedentary, lightly active, active, very active)

### Weight Journey

- **Starting weight** — where you began
- **Current weight** — updated as you log weight
- **Goal weight** — your target
- **Weekly goal** — how much you want to lose/gain per week
- **Target date** — auto-calculated based on your weekly goal and the difference between current and goal weight

### Daily Targets

Set your daily goals for:
- Calories
- Protein (g)
- Carbs (g)
- Fat (g)
- Fiber (g)
- Sodium (mg)
- Sugar (g)

These targets drive the progress bars and rings on the dashboard.

### Changing Your Password

On the Profile page, tap **Change Password**. Enter your current password and your new password (minimum 8 characters). The form confirms when the change is successful.

---

## Tags

Tags are colored labels you create to organize your foods and meals. Examples: "Breakfast", "Lunch", "Protein", "Quick", "Snack", "Vegetarian".

### Managing Tags

Go to Profile > Tag Manager:
- **Create a tag** — tap Add, pick a name and color from the palette
- **Edit a tag** — tap the tag to change its name or color
- **Delete a tag** — removes the tag (soft delete) and unlinks it from foods

### Using Tags

- **On foods** — assign tags when creating or editing a food
- **On meals** — assign tags when creating or editing a meal
- **For filtering** — use tag pills on the My Foods page and the Add Food screen to filter your catalog

### Filtering Logic

When you select multiple tags, foods must have **all** selected tags to appear (AND logic). This helps you narrow down large catalogs — e.g., "Breakfast" + "Quick" shows only quick breakfast foods.

---

## Weight Tracking

### Logging Weight

From the dashboard, use the **Log Weight** quick action. Enter your weight and it's recorded for today's date.

### Weight Chart

The Profile page shows a weight trend chart with:
- Your logged weights over time
- Starting weight reference line
- Goal weight reference line
- Goal date marker

---

## Tips & Workflows

### Daily Workflow

1. Open Tally in the morning
2. Log breakfast as you eat it (or after)
3. Log lunch and dinner throughout the day
4. Check the dashboard to see how your day looks
5. Log your weight if you weighed in today

### Building Your Food Catalog

Start with the foods you eat most often. You don't need to add everything at once — build it as you go. After a week or two, most of your common foods will be in your catalog and logging becomes very fast.

### Using AI Effectively

- **Text mode** is great for quick entries: "2 scrambled eggs with cheese"
- **Photo mode** works best for nutrition labels (exact values) and plated meals (estimates)
- Always review AI-generated nutrition data before saving — it's good but not perfect
- Add context to photo mode for better accuracy: "this is a large bowl, about 2 cups"

### Meal Templates Save Time

If you eat similar things regularly, create meal templates. A "Weekday Breakfast" meal with your usual items saves 30 seconds of logging every morning.

### Tags Are Powerful

Good tag categories to start with:
- **Meal type**: Breakfast, Lunch, Dinner, Snack
- **Nutrition focus**: Protein, Low-Carb, High-Fiber
- **Convenience**: Quick, Meal Prep, Restaurant
- **Dietary**: Vegetarian, Gluten-Free

Use 2-3 tags per food for the best filtering experience.
