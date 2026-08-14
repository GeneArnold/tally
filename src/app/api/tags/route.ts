import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

// GET — list user's tags
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tags = await db
      .select({
        id: schema.foodTags.id,
        name: schema.foodTags.name,
        color: schema.foodTags.color,
        sort: schema.foodTags.sort,
      })
      .from(schema.foodTags)
      .where(eq(schema.foodTags.userId, session.user.id))
      .orderBy(asc(schema.foodTags.sort), asc(schema.foodTags.name));

    return NextResponse.json({ tags });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}

// POST — create a new tag
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, color } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Tag name required' }, { status: 400 });

    const tag = await db
      .insert(schema.foodTags)
      .values({
        userId: session.user.id,
        name: name.trim().toLowerCase(),
        color: color || '#3B82F6',
        sort: 0,
      })
      .returning({
        id: schema.foodTags.id,
        name: schema.foodTags.name,
        color: schema.foodTags.color,
        sort: schema.foodTags.sort,
      })
      .get();

    return NextResponse.json({ tag });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}

// DELETE — soft delete a tag
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { tagId } = await request.json();
    if (!tagId) return NextResponse.json({ error: 'Missing tagId' }, { status: 400 });

    await db
      .update(schema.foodTags)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(schema.foodTags.id, tagId));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 },
    );
  }
}
