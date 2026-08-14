import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // TODO: Fetch today's diary entries from database
  const today = new Date().toISOString().split('T')[0];
  return NextResponse.json({ date: today, meals: [], totals: {} });
}
