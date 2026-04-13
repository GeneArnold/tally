import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MealsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Saved Meals</h1>
      <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
        <p className="text-gray-400 text-sm text-center">No saved meals yet</p>
      </div>
    </div>
  );
}
