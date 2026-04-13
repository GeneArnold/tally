import { redirect } from 'next/navigation';

// Redirect /diary to today's date
export default function DiaryPage() {
  const today = new Date().toISOString().split('T')[0];
  redirect(`/diary/${today}`);
}
