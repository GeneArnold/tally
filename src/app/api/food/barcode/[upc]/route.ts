import { NextResponse } from 'next/server';
import { lookupBarcode } from '@/lib/usda';

export async function GET(_request: Request, { params }: { params: Promise<{ upc: string }> }) {
  const { upc } = await params;

  try {
    const result = await lookupBarcode(upc);

    if (!result) {
      return NextResponse.json(
        { error: 'not_found', upc, message: `No food found for barcode ${upc}`, suggestion: 'Try searching by product name instead.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ...result.food, source: result.source });
  } catch (err) {
    return NextResponse.json(
      { error: `Lookup failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 },
    );
  }
}
