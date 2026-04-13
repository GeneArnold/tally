'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface ProfileData {
  id?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  sex?: string;
  height_ft?: number;
  height_in?: number;
  starting_weight_lbs?: number;
  current_weight_lbs?: number;
  goal_weight_lbs?: number;
  goal_target_date?: string;
  activity_level?: string;
  weekly_goal?: string;
  daily_calorie_goal?: number;
  goal_protein_g?: number;
  goal_carbs_g?: number;
  goal_fat_g?: number;
  goal_fiber_g?: number;
  goal_sodium_mg?: number;
  goal_sugar_g?: number;
  goal_water_oz?: number;
  daily_step_goal?: number;
  unit_system?: string;
  meal_names?: string[];
}

interface Props {
  profile: ProfileData | null;
  userId: string;
  userEmail: string;
  userName: string;
}

export default function ProfileForm({ profile, userId, userEmail, userName }: Props) {
  const [form, setForm] = useState({
    date_of_birth: profile?.date_of_birth || '',
    sex: profile?.sex || '',
    height_ft: profile?.height_ft?.toString() || '',
    height_in: profile?.height_in?.toString() || '',
    starting_weight_lbs: profile?.starting_weight_lbs?.toString() || '',
    current_weight_lbs: profile?.current_weight_lbs?.toString() || '',
    goal_weight_lbs: profile?.goal_weight_lbs?.toString() || '',
    goal_target_date: profile?.goal_target_date || '',
    activity_level: profile?.activity_level || 'sedentary',
    weekly_goal: profile?.weekly_goal || 'Lose 1 lb per week',
    daily_calorie_goal: profile?.daily_calorie_goal?.toString() || '2000',
    goal_protein_g: profile?.goal_protein_g?.toString() || '150',
    goal_carbs_g: profile?.goal_carbs_g?.toString() || '250',
    goal_fat_g: profile?.goal_fat_g?.toString() || '65',
    goal_fiber_g: profile?.goal_fiber_g?.toString() || '30',
    goal_sodium_mg: profile?.goal_sodium_mg?.toString() || '2300',
    goal_sugar_g: profile?.goal_sugar_g?.toString() || '50',
    goal_water_oz: profile?.goal_water_oz?.toString() || '64',
    daily_step_goal: profile?.daily_step_goal?.toString() || '10000',
    unit_system: profile?.unit_system || 'imperial',
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const body: Record<string, unknown> = {
        user: userId,
        date_of_birth: form.date_of_birth || null,
        sex: form.sex || null,
        height_ft: form.height_ft ? parseInt(form.height_ft) : null,
        height_in: form.height_in ? parseInt(form.height_in) : null,
        starting_weight_lbs: form.starting_weight_lbs ? parseFloat(form.starting_weight_lbs) : null,
        current_weight_lbs: form.current_weight_lbs ? parseFloat(form.current_weight_lbs) : null,
        goal_weight_lbs: form.goal_weight_lbs ? parseFloat(form.goal_weight_lbs) : null,
        goal_target_date: form.goal_target_date || null,
        activity_level: form.activity_level || null,
        weekly_goal: form.weekly_goal || null,
        daily_calorie_goal: form.daily_calorie_goal ? parseInt(form.daily_calorie_goal) : null,
        goal_protein_g: form.goal_protein_g ? parseFloat(form.goal_protein_g) : null,
        goal_carbs_g: form.goal_carbs_g ? parseFloat(form.goal_carbs_g) : null,
        goal_fat_g: form.goal_fat_g ? parseFloat(form.goal_fat_g) : null,
        goal_fiber_g: form.goal_fiber_g ? parseFloat(form.goal_fiber_g) : null,
        goal_sodium_mg: form.goal_sodium_mg ? parseFloat(form.goal_sodium_mg) : null,
        goal_sugar_g: form.goal_sugar_g ? parseFloat(form.goal_sugar_g) : null,
        goal_water_oz: form.goal_water_oz ? parseFloat(form.goal_water_oz) : null,
        daily_step_goal: form.daily_step_goal ? parseInt(form.daily_step_goal) : null,
        unit_system: form.unit_system || 'imperial',
      };

      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile?.id, ...body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save');
        return;
      }

      setSaved(true);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Account info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Account</h2>
        <div className="space-y-1 text-sm">
          <p><span className="text-gray-500">Name:</span> <span className="text-gray-900">{userName || 'Not set'}</span></p>
          <p><span className="text-gray-500">Email:</span> <span className="text-gray-900">{userEmail}</span></p>
        </div>
      </div>

      {/* About Me */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">About Me</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sex</label>
            <select value={form.sex} onChange={(e) => update('sex', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Height (ft)</label>
              <input type="number" value={form.height_ft} onChange={(e) => update('height_ft', e.target.value)}
                placeholder="5" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Height (in)</label>
              <input type="number" value={form.height_in} onChange={(e) => update('height_in', e.target.value)}
                min="0" max="11" placeholder="10" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Activity Level</label>
            <select value={form.activity_level} onChange={(e) => update('activity_level', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="lightly_active">Lightly Active (1-3 days/week)</option>
              <option value="active">Active (3-5 days/week)</option>
              <option value="very_active">Very Active (6-7 days/week)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weight Journey */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Weight Journey</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Starting</label>
              <input type="number" step="0.1" value={form.starting_weight_lbs} onChange={(e) => update('starting_weight_lbs', e.target.value)}
                placeholder="200" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Current</label>
              <input type="number" step="0.1" value={form.current_weight_lbs} onChange={(e) => update('current_weight_lbs', e.target.value)}
                placeholder="195" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Goal</label>
              <input type="number" step="0.1" value={form.goal_weight_lbs} onChange={(e) => update('goal_weight_lbs', e.target.value)}
                placeholder="175" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Date</label>
              <input type="date" value={form.goal_target_date} onChange={(e) => update('goal_target_date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Weekly Goal</label>
              <select value={form.weekly_goal} onChange={(e) => update('weekly_goal', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Lose 2 lbs per week">Lose 2 lbs/week</option>
                <option value="Lose 1.5 lbs per week">Lose 1.5 lbs/week</option>
                <option value="Lose 1 lb per week">Lose 1 lb/week</option>
                <option value="Lose 0.5 lb per week">Lose 0.5 lb/week</option>
                <option value="Maintain">Maintain</option>
                <option value="Gain 0.5 lb per week">Gain 0.5 lb/week</option>
                <option value="Gain 1 lb per week">Gain 1 lb/week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Targets */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Daily Targets</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Calories</label>
            <input type="number" value={form.daily_calorie_goal} onChange={(e) => update('daily_calorie_goal', e.target.value)}
              className="w-full rounded-lg border-2 border-orange-200 px-3 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Protein (g)</label>
              <input type="number" value={form.goal_protein_g} onChange={(e) => update('goal_protein_g', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Carbs (g)</label>
              <input type="number" value={form.goal_carbs_g} onChange={(e) => update('goal_carbs_g', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fat (g)</label>
              <input type="number" value={form.goal_fat_g} onChange={(e) => update('goal_fat_g', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fiber (g)</label>
              <input type="number" value={form.goal_fiber_g} onChange={(e) => update('goal_fiber_g', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sugar (g)</label>
              <input type="number" value={form.goal_sugar_g} onChange={(e) => update('goal_sugar_g', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sodium (mg)</label>
              <input type="number" value={form.goal_sodium_mg} onChange={(e) => update('goal_sodium_mg', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Water (oz)</label>
              <input type="number" value={form.goal_water_oz} onChange={(e) => update('goal_water_oz', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Steps</label>
              <input type="number" value={form.daily_step_goal} onChange={(e) => update('daily_step_goal', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3">Preferences</h2>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Unit System</label>
          <select value={form.unit_system} onChange={(e) => update('unit_system', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="imperial">Imperial (lbs, oz, ft)</option>
            <option value="metric">Metric (kg, ml, cm)</option>
          </select>
        </div>
      </div>

      {/* Save button */}
      {error && <div className="bg-red-50 text-red-700 text-base rounded-lg p-3">{error}</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-semibold min-h-[52px] ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white active:bg-blue-800 disabled:opacity-50'
        }`}
      >
        <Save size={20} />
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>
    </div>
  );
}
