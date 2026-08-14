import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { weight, date: clientDate } = await request.json();

    if (!weight || weight <= 0) {
      return NextResponse.json({ error: 'Invalid weight' }, { status: 400 });
    }

    const now = new Date();
    const serverToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const today = clientDate || serverToday;

    // 1. Insert measurement record
    await db
      .insert(schema.measurements)
      .values({
        userId: session.user.id,
        date: today,
        type: 'weight',
        value: weight,
        unit: 'lbs',
      });

    // 2. Find user's health profile
    const profile = await db
      .select()
      .from(schema.healthProfiles)
      .where(eq(schema.healthProfiles.userId, session.user.id))
      .get();

    // 3. Update currentWeightLbs on health profile if it exists
    if (profile?.id) {
      await db
        .update(schema.healthProfiles)
        .set({ currentWeightLbs: weight })
        .where(eq(schema.healthProfiles.id, profile.id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
