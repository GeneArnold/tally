'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Props {
  foodId: string;
  foodName: string;
}

export default function DeleteFoodButton({ foodId, foodName }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch('/api/my-foods/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId }),
      });

      if (res.ok) {
        window.location.href = '/my-foods';
      }
    } catch {
      // Silent fail
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-red-200 px-4 py-3 text-red-600 font-medium active:bg-red-50 min-h-[48px]"
      >
        <Trash2 size={18} />
        Delete Food
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Delete food?"
        message={`Permanently delete "${foodName}" from My Foods? This will also remove it from any diary entries that reference it.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
