import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { recalcDiaryTotals } from '@/lib/db/helpers';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodEntryId, diaryEntryId } = await request.json();

  if (!foodEntryId) {
    return NextResponse.json({ error: 'Missing foodEntryId' }, { status: 400 });
  }

  try {
    // Delete the food entry
    db.delete(schema.foodEntries).where(eq(schema.foodEntries.id, foodEntryId)).run();

    // Recalculate diary entry totals
    if (diaryEntryId) {
      recalcDiaryTotals(diaryEntryId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
