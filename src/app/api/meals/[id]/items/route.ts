import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';

// POST — add foods to a meal
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: mealId } = await params;
  const { food_items } = await request.json();

  if (!food_items || food_items.length === 0) {
    return NextResponse.json({ error: 'No foods provided' }, { status: 400 });
  }

  try {
    const itemsToInsert = food_items.map((item: { food_id: string; quantity: number }) => ({
      mealId,
      foodId: item.food_id,
      quantity: item.quantity || 1,
    }));

    await db.insert(schema.mealItems).values(itemsToInsert);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

// DELETE — remove a meal item
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId } = await request.json();
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });

  try {
    await db
      .delete(schema.mealItems)
      .where(eq(schema.mealItems.id, itemId));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
