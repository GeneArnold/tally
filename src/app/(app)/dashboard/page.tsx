import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import LogWeightButton from '@/components/dashboard/LogWeightButton';

export const dynamic = 'force-dynamic';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

async function getProfile(token: string, userId: string) {
  const params = new URLSearchParams({
    'filter[user][_eq]': userId,
    'fields': 'daily_calorie_goal,goal_protein_g,goal_carbs_g,goal_fat_g,current_weight_lbs,goal_weight_lbs',
    'limit': '1',
  });
  const res = await fetch(`${DIRECTUS_URL}/items/nx_health_profile?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

async function getTodayTotals(token: string, userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const params = new URLSearchParams({
    'filter[date][_eq]': today,
    'filter[user][_eq]': userId,
    'filter[type][_eq]': 'diary_meal',
    'aggregate[sum]': 'total_calories,total_protein_g,total_carbs_g,total_fat_g',
  });
  const res = await fetch(`${DIRECTUS_URL}/items/nx_diary_entries?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const data = await res.json();
  const sums = data.data?.[0]?.sum || {};
  return {
    calories: parseFloat(sums.total_calories) || 0,
    protein: parseFloat(sums.total_protein_g) || 0,
    carbs: parseFloat(sums.total_carbs_g) || 0,
    fat: parseFloat(sums.total_fat_g) || 0,
  };
}

function ProgressRing({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-900">{Math.round(value)}</span>
        </div>
      </div>
      <p className="text-[10px] text-gray-500 mt-1">{label}</p>
      <p className="text-[10px] text-gray-400">/ {max}{unit}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [profile, totals] = await Promise.all([
    getProfile(session.token, session.user.id),
    getTodayTotals(session.token, session.user.id),
  ]);

  const calGoal = profile?.daily_calorie_goal || 2000;
  const proGoal = profile?.goal_protein_g || 150;
  const carbGoal = profile?.goal_carbs_g || 250;
  const fatGoal = profile?.goal_fat_g || 65;

  const calPct = Math.min((totals.calories / calGoal) * 100, 100);
  const calRemaining = Math.max(calGoal - totals.calories, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/nexus-logo.png" alt="Nexus Health" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Hi, {session.user.first_name || 'there'}
            </h1>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <Link href="/profile" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200">
          <Settings size={20} className="text-gray-500" />
        </Link>
      </div>

      {/* Calorie hero card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Today&apos;s Calories</h2>
          <span className="text-sm text-gray-500">{Math.round(totals.calories)} / {calGoal}</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${calPct}%`,
              backgroundColor: calPct > 100 ? '#ef4444' : calPct > 80 ? '#f59e0b' : '#3b82f6',
            }}
          />
        </div>
        <p className="text-center mt-3">
          <span className="text-2xl font-bold text-gray-900">{Math.round(calRemaining)}</span>
          <span className="text-sm text-gray-500 ml-1">cal remaining</span>
        </p>
      </div>

      {/* Macro rings */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="font-semibold text-gray-800 mb-4">Macros</h2>
        <div className="flex justify-around">
          <ProgressRing value={totals.protein} max={proGoal} label="Protein" unit="g" color="#3b82f6" />
          <ProgressRing value={totals.carbs} max={carbGoal} label="Carbs" unit="g" color="#22c55e" />
          <ProgressRing value={totals.fat} max={fatGoal} label="Fat" unit="g" color="#a855f7" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/diary" className="bg-white rounded-xl p-4 shadow-sm text-center active:bg-gray-50 min-h-[72px] flex flex-col items-center justify-center">
          <span className="text-2xl mb-1">📖</span>
          <span className="text-sm font-medium text-gray-700">Food Diary</span>
        </Link>
        <Link href="/my-foods/add" className="bg-white rounded-xl p-4 shadow-sm text-center active:bg-gray-50 min-h-[72px] flex flex-col items-center justify-center">
          <span className="text-2xl mb-1">➕</span>
          <span className="text-sm font-medium text-gray-700">Add Food</span>
        </Link>
        <LogWeightButton />
      </div>

      {/* Setup prompt if no profile */}
      {!profile && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800">Set up your profile</p>
          <p className="text-xs text-blue-600 mt-1">Add your goals and targets to personalize your dashboard.</p>
          <Link href="/profile" className="inline-block mt-2 text-sm font-semibold text-blue-700 active:text-blue-900">
            Go to Profile &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
