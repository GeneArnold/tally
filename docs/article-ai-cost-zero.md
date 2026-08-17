# Article Outline: How I Built an AI-Powered Health App That Costs $0/Month for AI

**Author:** Gene Arnold
**Platform:** LinkedIn
**Tone:** Technical but accessible — aimed at builders, entrepreneurs, and AI-curious professionals

---

## Hook

Building an AI-powered app doesn't mean paying $500/month in API costs. I built a full health and nutrition tracking app with AI features — vision, text extraction, food identification — and the AI costs $0/month. Here's exactly how.

---

## Section 1: What the App Does

**Tally** — a mobile-first Progressive Web App for health and nutrition tracking.

Key AI features:
- **Describe a Food** — type "scrambled eggs" and AI estimates the full nutrition profile (calories, protein, carbs, fat, fiber, sodium)
- **Paste Nutrition Info** — copy text from Google, a website, anywhere — AI extracts structured nutrition data and auto-fills the form
- **Photo of Nutrition Label** — snap a photo of the back of a package, AI reads the label via vision
- **Photo of Food** — photograph your meal, AI identifies what's on the plate and estimates nutrition
- **Barcode Lookup** — scan a barcode, falls back through USDA and Open Food Facts databases

None of these features use a paid API. Zero.

---

## Section 2: The Multi-Provider Architecture

Instead of picking one AI provider and paying their rates, we built a **task-based model routing system** that selects the cheapest capable model for each task.

### The Provider Hierarchy

| Task Type | 1st Choice (Free) | 2nd Choice (Free) | 3rd Choice (Paid) |
|---|---|---|---|
| **Text parsing** | Groq (Llama 3.3 70B) | Gemini Flash | Claude Haiku |
| **Vision** (labels, food photos) | Gemini 2.5 Flash | Claude Haiku | — |

### How It Works

```
User pastes "scrambled eggs, 78 cal, 6g protein..."
  → Provider selector checks: GROQ_API_KEY set? Yes
  → Routes to Groq (Llama 3.3 70B) 
  → Response in ~0.5 seconds
  → Cost: $0.00

User snaps photo of nutrition label
  → Provider selector checks: need vision → GEMINI_API_KEY set? Yes
  → Routes to Gemini 2.5 Flash
  → Response in ~2 seconds
  → Cost: $0.00
```

The system is a simple provider abstraction — about 80 lines of code. Each provider implements `parseText()` and optionally `parseImage()`. The selector picks the cheapest one that supports the task.

### Key Design Decisions

1. **Cheapest first, not best first** — Groq is fast and free for text. Why pay for Claude when Groq handles it?
2. **Vision is a separate category** — not all providers support it. Groq doesn't. Gemini does (free tier). The router knows this.
3. **Fallback chain** — if Groq is down, it tries Gemini. If Gemini is down, it tries Anthropic. No single point of failure.
4. **Same prompt, any model** — the system prompt is provider-agnostic. Works identically across all three.

---

## Section 3: The Free Tier Reality

### Groq
- **Model:** Llama 3.3 70B Versatile
- **Free tier:** Generous rate limits for personal/small-scale use
- **Speed:** Often faster than paid APIs (inference on custom LPU hardware)
- **What we use it for:** All text extraction — pasting nutrition info, describing foods by name
- **Quality:** Excellent for structured data extraction. The prompt asks for JSON, Groq returns clean JSON.

### Google Gemini
- **Model:** Gemini 2.5 Flash
- **Free tier:** Available via Google AI Studio API key
- **What we use it for:** All vision tasks — reading nutrition labels, identifying food in photos
- **Quality:** Very good at OCR-style label reading. Decent at food identification with portion estimates.

### When We'd Pay (We Haven't Yet)
- **Claude Haiku** is the fallback. It's cheap ($0.25/MTok input) but not free. In months of development and testing, we haven't needed it. The free providers handle everything.

---

## Section 4: The Prompt Engineering

One system prompt works across all providers and task types:

```
You are a nutrition data extraction assistant. Extract structured 
food nutrition information from user input (text or images).

Return ONLY valid JSON with these fields:
{
  "description": "Food name",
  "brand_name": "Brand if applicable",
  "default_serving_size": number,
  "default_serving_unit": "g, oz, cup, piece...",
  "energy_kcal": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  ...
}
```

Key prompt decisions:
- **JSON only, no explanation** — models love to explain themselves. We don't want that. "Return ONLY valid JSON" prevents it.
- **Handle ranges** — "72-78 kcal" → the prompt says "use the higher value." Deterministic.
- **No tag suggestions** — we originally had AI suggest tags. It was inconsistent. We removed it and let the user manage tags. AI should extract data, not categorize it.

---

## Section 5: Real-World Usage Patterns

### Pattern 1: Google → Paste → Save (Most Common)
1. Google "scrambled eggs nutrition"
2. Copy the snippet from search results
3. Paste into AI Assist → "Extract Nutrition"
4. Groq returns structured data in 0.5 seconds
5. Review, adjust, save to food catalog

**Time:** ~15 seconds. **Cost:** $0.00

### Pattern 2: Describe It (Fastest)
1. Type "2 scrambled eggs with cheese"
2. AI estimates nutrition based on standard values
3. Review, save

**Time:** ~5 seconds. **Cost:** $0.00

### Pattern 3: Snap the Label (Most Accurate)
1. Take photo of nutrition label on package
2. Gemini reads every value from the label
3. Review, save

**Time:** ~10 seconds. **Cost:** $0.00

### Pattern 4: Photograph Your Plate (Least Accurate, Most Convenient)
1. Take photo of your meal
2. Gemini identifies foods and estimates portions
3. Review carefully, adjust values, save

**Time:** ~10 seconds. **Cost:** $0.00. **Accuracy:** Use as a starting point, not gospel.

---

## Section 6: The Tech Stack

- **App:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Directus (self-hosted, headless CMS as database)
- **AI:** Groq SDK, Google Gemini API, Anthropic SDK (fallback)
- **Provider router:** ~80 lines of TypeScript
- **Barcode:** zxing-js (browser camera API) + USDA API + Open Food Facts API
- **Hosting:** Docker on a home server (Optiplex Mini)
- **Total monthly AI cost:** $0.00

---

## Section 7: What This Means for Builders

You don't need a $500/month OpenAI bill to build AI features. The landscape has changed:

1. **Open-source models are good enough** — Llama 3.3 70B handles structured extraction perfectly
2. **Free tiers are generous** — Groq and Gemini give you real capacity for personal and small-scale apps
3. **Task routing is simple** — 80 lines of code to route between providers
4. **Vision is free now** — Gemini Flash reads nutrition labels for free. A year ago this would have cost real money.
5. **The moat isn't the AI** — it's the UX. The AI is commodity infrastructure. What matters is how fast you can get data into the system.

---

## Key Facts for the Article

- **App name:** Tally
- **Built in:** 2 sessions with Claude Code (AI-assisted development)
- **Lines of code:** ~12,000+
- **AI providers:** 3 (Groq, Gemini, Anthropic)
- **AI cost to date:** $0.00
- **Provider router code:** ~80 lines
- **Food entry methods:** 6 (manual, USDA search, barcode scan, AI text paste, AI describe, AI photo)
- **Free APIs used:** Groq, Gemini, USDA FoodData Central, Open Food Facts
- **Self-hosted:** Everything runs on a $200 mini PC at home

---

## Suggested LinkedIn Post Format

- Start with a bold claim (the $0/month hook)
- Show the architecture diagram (text, not image — LinkedIn compresses images)
- Give one concrete example (the scrambled eggs flow)
- End with the builder takeaway (you don't need expensive APIs)
- Include a screenshot of the AI Assist screen if possible

---

## Hashtag Suggestions

#AI #MachineLearning #HealthTech #Groq #Gemini #NextJS #BuildInPublic #AIEngineering #SoftwareArchitecture #ZeroCost
