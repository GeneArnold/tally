import { NextResponse } from 'next/server';
import { lookupBarcodeOpenFoodFacts } from '@/lib/usda';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get('upc')?.trim();

  if (!upc) {
    return NextResponse.json({ error: 'Missing upc' }, { status: 400 });
  }

  try {
    const result = await lookupBarcodeOpenFoodFacts(upc);
    if (result) {
      return NextResponse.json({ food: result, source: 'Open Food Facts' });
    }

    return NextResponse.json({ food: null, source: null }, { status: 404 });
  } catch (err) {
    return NextResponse.json(
      { error: `Lookup failed: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 502 },
    );
  }
}
