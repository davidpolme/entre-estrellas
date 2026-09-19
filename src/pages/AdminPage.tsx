import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useConstellation } from '@/hooks/useConstellation';
import { ConstellationCanvas } from '@/components/constellation/ConstellationCanvas';

export function AdminPage({ onBack }: { onBack: () => void }) {
  const { user, isAdmin, logout } = useAuth();
  const { users, connections, selectedUserId, selectUser } = useConstellation();

  const [view, setView] = useState<'admin' | 'preview'>('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-white/60">No tienes permisos de administrador</p>
          <button onClick={onBack} className="text-blue-400 hover:text-blue-300">Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white/80 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => setView('admin')}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              view === 'admin' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Panel
          </button>
          <button
            onClick={() => setView('preview')}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              view === 'preview' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            Vista
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'admin' ? (
          <AdminPanel username={user?.username ?? 'admin'} />
        ) : (
          <div className="w-full h-full relative">
            <ConstellationCanvas
              users={users}
              connections={connections}
              currentUserId={user?.userId ?? ''}
              selectedUserId={selectedUserId}
              onSelectUser={selectUser}
              onWriteLetter={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}