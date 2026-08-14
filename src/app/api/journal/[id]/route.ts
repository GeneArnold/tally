import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.content !== undefined) updates.content = body.content.trim();
    if (body.entry_date !== undefined) updates.entryDate = body.entry_date;
    if (body.entry_time !== undefined) updates.entryTime = body.entry_time;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const entry = await db
      .update(schema.journalEntries)
      .set(updates)
      .where(eq(schema.journalEntries.id, id))
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    await db
      .update(schema.journalEntries)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(schema.journalEntries.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
