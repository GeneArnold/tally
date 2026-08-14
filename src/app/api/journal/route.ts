import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, and, isNull, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const entries = await db
      .select({
        id: schema.journalEntries.id,
        entry_date: schema.journalEntries.entryDate,
        entry_time: schema.journalEntries.entryTime,
        content: schema.journalEntries.content,
        date_created: schema.journalEntries.createdAt,
      })
      .from(schema.journalEntries)
      .where(and(
        eq(schema.journalEntries.userId, session.user.id),
        eq(schema.journalEntries.entryDate, date),
        isNull(schema.journalEntries.deletedAt),
      ))
      .orderBy(asc(schema.journalEntries.entryTime));

    return NextResponse.json({ entries }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { entry_date, entry_time, content } = await request.json();

    if (!entry_date || !entry_time || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields: entry_date, entry_time, content' }, { status: 400 });
    }

    const entry = await db
      .insert(schema.journalEntries)
      .values({
        userId: session.user.id,
        entryDate: entry_date,
        entryTime: entry_time,
        content: content.trim(),
      })
      .returning({
        id: schema.journalEntries.id,
        entry_date: schema.journalEntries.entryDate,
        entry_time: schema.journalEntries.entryTime,
        content: schema.journalEntries.content,
        date_created: schema.journalEntries.createdAt,
      })
      .get();

    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
