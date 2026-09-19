import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function LoginPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-sm space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center space-y-3">
          <div className="text-5xl mb-2">✨</div>
          <h1 className="text-3xl font-light text-white tracking-wide">Entre Estrellas</h1>
          <p className="text-sm text-white/40">
            Una constelación hecha de palabras bonitas
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <LoginForm
                key="login"
                onLogin={onAuth}
                onSwitchToRegister={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                key="register"
                onRegister={() => setMode('login')}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}