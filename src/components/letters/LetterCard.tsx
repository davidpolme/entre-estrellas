import { motion } from 'framer-motion';
import type { Letter } from '@/types';

interface LetterCardProps {
  letter: Letter;
  isOwn: boolean;
  onRead?: (id: string) => void;
}

export function LetterCard({ letter, isOwn, onRead }: LetterCardProps) {
  const isNew = !letter.readAt;

  return (
    <motion.div
      className={`relative p-4 rounded-xl border transition-all ${
        isNew
          ? 'border-blue-400/30 bg-blue-500/5'
          : 'border-white/5 bg-white/[0.02]'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => { if (isNew && onRead) onRead(letter.id); }}
    >
      {isNew && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white/60">
          {isOwn ? 'Para ti' : `De: ${letter.senderName ?? 'Alguien de nuestra constelación ✨'}`}
        </span>
        <span className="text-xs text-white/30">
          {new Date(letter.createdAt).toLocaleDateString('es', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
        {letter.content}
      </div>

      {letter.type === 'COMMUNITY' && !isOwn && (
        <div className="mt-2 text-xs text-white/30">
          Alguien de nuestra constelación
        </div>
      )}
    </motion.div>
  );
}