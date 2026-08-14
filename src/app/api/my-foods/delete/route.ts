import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { foodId } = await request.json();

  if (!foodId) {
    return NextResponse.json({ error: 'Missing foodId' }, { status: 400 });
  }

  try {
    // Soft delete: set deletedAt to current ISO timestamp
    await db
      .update(schema.foods)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(schema.foods.id, foodId));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
