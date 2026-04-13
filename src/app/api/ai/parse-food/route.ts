import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getProvider } from '@/lib/ai-providers';

const SYSTEM_PROMPT = `You are a nutrition data extraction assistant. Extract structured food nutrition information from user input (text or images).

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
  "cholesterol_mg": number or null
}

Rules:
- Use the most common/standard values when ranges are given (e.g. 72-78 kcal → use 78)
- For photos of food, estimate reasonable portions and nutrition
- For nutrition labels, read exact values
- Do NOT include tags — the user manages tags manually
- If a value cannot be determined, use null
- Return ONLY the JSON object, no markdown fences, no explanation`;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { type, content, mediaType, context } = body;

    if (!type || !content) {
      return NextResponse.json({ error: 'Missing type or content' }, { status: 400 });
    }

    let rawResponse: string;

    if (type === 'text') {
      const provider = getProvider('text');
      rawResponse = await provider.parseText(
        `Extract nutrition information from this text:\n\n${content}`,
        SYSTEM_PROMPT,
      );
    } else if (type === 'image') {
      if (!mediaType) {
        return NextResponse.json({ error: 'Missing mediaType for image' }, { status: 400 });
      }
      const provider = getProvider('vision');
      if (!provider.parseImage) {
        return NextResponse.json({ error: 'No vision-capable AI provider configured' }, { status: 503 });
      }
      const userPrompt = context
        ? `Extract nutrition information from this image. Context: ${context}`
        : 'Extract nutrition information from this image. If this is a nutrition label, read the exact values. If this is a photo of food, identify the food and estimate nutrition.';
      rawResponse = await provider.parseImage(content, mediaType, SYSTEM_PROMPT, userPrompt);
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "text" or "image"' }, { status: 400 });
    }

    // Clean up response — strip markdown fences if present
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const food = JSON.parse(cleaned);
    return NextResponse.json({ food });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('No AI provider')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    if (message.includes('JSON') || message.includes('Unexpected token')) {
      return NextResponse.json({ error: 'AI returned invalid data. Try again or enter manually.' }, { status: 502 });
    }
    return NextResponse.json({ error: `AI parsing failed: ${message}` }, { status: 502 });
  }
}
