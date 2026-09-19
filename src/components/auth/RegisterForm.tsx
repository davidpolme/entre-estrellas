import { useState } from 'react';
import { motion } from 'framer-motion';
import { StarColorPicker } from '@/components/ui/StarColorPicker';
import { signUp, signIn } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { StarColor } from '@/types';
import { REGISTER_USER } from '@/graphql/operations';

const client = generateClient();

interface RegisterFormProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [starColor, setStarColor] = useState<StarColor>('blue');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError('Elige un nombre de usuario'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

    setLoading(true);
    try {
      // Create Cognito user (no email required)
      await signUp({
        username,
        password,
        options: {
          userAttributes: { preferred_username: username },
          autoSignIn: true,
        },
      });

      // Auto sign in
      await signIn({ username, password });

      // Create UserProfile in DynamoDB
      try {
        await (client.graphql({
          query: REGISTER_USER,
          variables: {
            input: JSON.stringify({ username: username.trim(), starColor }),
          },
        }) as any);
      } catch {
        // Profile created on first login, ignore race
      }

      onRegister();
    } catch (err: any) {
      setError(err?.message ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold text-white text-center">Crear mi estrella</h2>

      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Nombre de usuario"
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
        autoFocus
      />

      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Contraseña"
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={e => setConfirmPassword(e.target.value)}
        placeholder="Confirmar contraseña"
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
      />

      <div className="space-y-2">
        <p className="text-sm text-white/60 text-center">Color de tu estrella</p>
        <StarColorPicker value={starColor} onChange={setStarColor} />
      </div>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Crear mi estrella'}
      </button>

      <p className="text-sm text-white/40 text-center">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitchToLogin} className="text-blue-400 hover:text-blue-300">
          Iniciar sesión
        </button>
      </p>
    </motion.form>
  );
}