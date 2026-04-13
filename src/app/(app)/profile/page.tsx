import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/components/profile/ProfileForm';
import WeightChart from '@/components/profile/WeightChart';
import LogoutButton from '@/components/profile/LogoutButton';

export const dynamic = 'force-dynamic';

const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8058';

async function getProfile(token: string, userId: string) {
  const params = new URLSearchParams({
    'filter[user][_eq]': userId,
    'fields': '*',
    'limit': '1',
  });
  const res = await fetch(`${DIRECTUS_URL}/items/nx_health_profile?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

async function getWeightHistory(token: string, userId: string) {
  const params = new URLSearchParams({
    'filter[user][_eq]': userId,
    'filter[type][_eq]': 'weight',
    'fields': 'date,value',
    'sort': 'date',
    'limit': '365',
  });
  const res = await fetch(`${DIRECTUS_URL}/items/nx_measurements?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [profile, weightHistory] = await Promise.all([
    getProfile(session.token, session.user.id),
    getWeightHistory(session.token, session.user.id),
  ]);

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Weight chart */}
      <WeightChart
        measurements={weightHistory}
        startingWeight={profile?.starting_weight_lbs}
        goalWeight={profile?.goal_weight_lbs}
        goalDate={profile?.goal_target_date}
      />

      {/* Profile form */}
      <ProfileForm
        profile={profile}
        userId={session.user.id}
        userEmail={session.user.email}
        userName={`${session.user.first_name || ''} ${session.user.last_name || ''}`.trim()}
      />

      {/* Logout */}
      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
