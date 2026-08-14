'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import LogWeightButton from '@/components/dashboard/LogWeightButton';

interface DashboardData {
  user: { first_name: string | null; last_name: string | null };
  profile: {
    daily_calorie_goal: number | null;
    goal_protein_g: number | null;
    goal_carbs_g: number | null;
    goal_fat_g: number | null;
  } | null;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  hasProfile: boolean;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const res = await fetch(`/api/dashboard?date=${localDate}&_t=${Date.now()}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Could not load dashboard</div>;
  }

  const calGoal = data.profile?.daily_calorie_goal || 2000;
  const proGoal = data.profile?.goal_protein_g || 150;
  const carbGoal = data.profile?.goal_carbs_g || 250;
  const fatGoal = data.profile?.goal_fat_g || 65;

  const calPct = Math.min((data.totals.calories / calGoal) * 100, 100);
  const calRemaining = Math.max(calGoal - data.totals.calories, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img src="/nexus-logo.png" alt="Tally" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Hi, {data.user.first_name || 'there'}
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
          <span className="text-sm text-gray-500">{Math.round(data.totals.calories)} / {calGoal}</span>
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
          <ProgressRing value={data.totals.protein} max={proGoal} label="Protein" unit="g" color="#3b82f6" />
          <ProgressRing value={data.totals.carbs} max={carbGoal} label="Carbs" unit="g" color="#22c55e" />
          <ProgressRing value={data.totals.fat} max={fatGoal} label="Fat" unit="g" color="#a855f7" />
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
      {!data.hasProfile && (
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
