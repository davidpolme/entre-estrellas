import { useState, useEffect } from 'react';
import { configureAmplify } from '@/amplify/configure';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/pages/LoginPage';
import { ConstellationPage } from '@/pages/ConstellationPage';
import { AdminPage } from '@/pages/AdminPage';

configureAmplify();

type Screen = 'loading' | 'login' | 'constellation' | 'admin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const { user, loading, isAdmin, logout, checkUser } = useAuth();

  useEffect(() => {
    if (!loading) {
      setScreen(user ? 'constellation' : 'login');
    }
  }, [user, loading]);

  if (loading || screen === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-white/30 animate-pulse text-lg">✨</div>
      </div>
    );
  }

  if (screen === 'login') {
    return <LoginPage onAuth={() => { checkUser(); setScreen('constellation'); }} />;
  }

  if (screen === 'admin') {
    return <AdminPage onBack={() => setScreen('constellation')} />;
  }

  return (
    <ConstellationPage
      isAdmin={isAdmin}
      username={user?.username ?? ''}
      userId={user?.userId ?? ''}
      onLogout={async () => { await logout(); setScreen('login'); }}
      onAdminPanel={() => setScreen('admin')}
    />
  );
}