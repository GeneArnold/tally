import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await params;
  // TODO: Fetch diary entries for date from Directus
  return NextResponse.json({ date, meals: [], totals: {} });
}
