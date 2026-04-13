import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProgressPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Progress</h1>
      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
        <p className="text-gray-400 text-sm text-center">Charts coming soon</p>
      </div>
    </div>
  );
}
