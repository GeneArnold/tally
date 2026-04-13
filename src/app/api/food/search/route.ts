import { NextResponse } from 'next/server';
import { searchUSDA } from '@/lib/usda';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 25);

  try {
    const results = await searchUSDA(query, limit);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 502 },
    );
  }
}
