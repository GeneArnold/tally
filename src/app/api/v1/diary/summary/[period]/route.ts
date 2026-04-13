import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(_request: Request, { params }: { params: Promise<{ period: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { period } = await params;
  // TODO: Calculate averages for period (7d, 30d, 90d)
  return NextResponse.json({ period, averages: {} });
}
