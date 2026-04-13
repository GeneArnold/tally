import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export interface ParsedFood {
  description: string;
  brand_name: string | null;
  default_serving_size: number | null;
  default_serving_unit: string | null;
  energy_kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  saturated_fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  cholesterol_mg: number | null;
  tags: string[];
}

const SYSTEM_PROMPT = `You are a nutrition data extraction assistant. Your job is to extract structured food nutrition information from user input (text or images).

Return ONLY valid JSON with these fields:
{
  "description": "Food name (e.g. Hard-Boiled Egg, Subway Italian BMT 6-inch)",
  "brand_name": "Brand if applicable, null otherwise",
  "default_serving_size": number or null,
  "default_serving_unit": "g, oz, cup, piece, sandwich, bowl, etc.",
  "energy_kcal": number or null,
  "protein_g": number or null,
  "fat_g": number (total fat) or null,
  "saturated_fat_g": number or null,
  "carbs_g": number (total carbohydrates) or null,
  "fiber_g": number or null,
  "sugar_g": number or null,
  "sodium_mg": number or null,
  "cholesterol_mg": number or null,
  "tags": ["suggested", "tags", "for", "categorization"]
}

Rules:
- Use the most common/standard values when ranges are given (e.g. 72-78 kcal → use 78)
- For photos of food, estimate reasonable portions and nutrition based on what you see
- For nutrition labels, read exact values from the label
- Tags should be practical categories: "protein", "breakfast", "snack", "restaurant", "homemade", "vegetable", "fruit", "grain", "dairy", "beverage", "fast-food", etc.
- If a value cannot be determined, use null
- Return ONLY the JSON object, no markdown, no explanation`;

export async function parseFromText(text: string): Promise<ParsedFood> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract nutrition information from this text:\n\n${text}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return JSON.parse(content.text);
}

export async function parseFromImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  context?: string,
): Promise<ParsedFood> {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const userContent: Anthropic.MessageCreateParams['messages'][0]['content'] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: base64Image,
      },
    },
    {
      type: 'text',
      text: context
        ? `Extract nutrition information from this image. Additional context: ${context}`
        : 'Extract nutrition information from this image. If this is a nutrition label, read the exact values. If this is a photo of food, identify the food and estimate nutrition.',
    },
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  return JSON.parse(content.text);
}
