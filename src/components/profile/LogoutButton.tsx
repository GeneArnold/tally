'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function LogoutButton() {
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-600 font-medium active:bg-gray-50 min-h-[48px]"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      <ConfirmDialog
        open={showConfirm}
        title="Sign out?"
        message="You'll need to sign in again to access your data."
        confirmLabel="Sign Out"
        onConfirm={handleLogout}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
