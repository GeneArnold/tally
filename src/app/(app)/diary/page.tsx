'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiaryPage() {
  const router = useRouter();

  useEffect(() => {
    // Use local timezone, not UTC — hard navigate to avoid cache
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    window.location.replace(`/diary/${year}-${month}-${day}`);
  }, []);

  return (
    <div className="text-center py-12 text-gray-500">Loading diary...</div>
  );
}
