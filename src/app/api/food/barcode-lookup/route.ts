import { NextResponse } from 'next/server';
import { lookupBarcodeUSDA, lookupBarcodeOpenFoodFacts } from '@/lib/usda';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get('upc')?.trim();
  const source = searchParams.get('source')?.trim();

  if (!upc) {
    return NextResponse.json({ error: 'Missing upc' }, { status: 400 });
  }

  try {
    if (source === 'usda') {
      const result = await lookupBarcodeUSDA(upc);
      if (result) {
        return NextResponse.json({ food: result, source: 'USDA FoodData Central' });
      }
      return NextResponse.json({ food: null, source: null }, { status: 404 });
    }

    if (source === 'openfoodfacts') {
      const result = await lookupBarcodeOpenFoodFacts(upc);
      if (result) {
        return NextResponse.json({ food: result, source: 'Open Food Facts' });
      }
      return NextResponse.json({ food: null, source: null }, { status: 404 });
    }

    // No source specified — try both
    const usda = await lookupBarcodeUSDA(upc);
    if (usda) {
      return NextResponse.json({ food: usda, source: 'USDA FoodData Central' });
    }

    const off = await lookupBarcodeOpenFoodFacts(upc);
    if (off) {
      return NextResponse.json({ food: off, source: 'Open Food Facts' });
    }

    return NextResponse.json({ food: null, source: null }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: `Lookup failed: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 502 },
    );
  }
}
