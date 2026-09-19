import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Letter } from '@/types';

interface LetterCardProps {
  letter: Letter;
  received: boolean;
  onRead?: (id: string) => void;
}

export function LetterCard({ letter, received, onRead }: LetterCardProps) {
  const [open, setOpen] = useState(!received);
  const isNew = received && !letter.readAt;
  const sender = letter.type === 'COMMUNITY'
    ? 'Alguien de nuestra constelación ✨'
    : letter.senderName ?? 'Alguien de nuestra constelación';

  function handleOpen() {
    setOpen(previous => !previous);
    if (!open && isNew && onRead) onRead(letter.id);
  }

  return (
    <motion.button
      type="button"
      className={`relative w-full p-4 rounded-xl border text-left transition-all ${
        isNew
          ? 'border-blue-400/30 bg-blue-500/5'
          : 'border-white/5 bg-white/[0.02]'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleOpen}
    >
      {isNew && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-white/80 font-medium">
            {received ? `Recibiste una carta de: ${sender}` : `Carta enviada a ${letter.recipientId}`}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {new Date(letter.createdAt).toLocaleDateString('es', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <span className="text-white/40 text-lg">{open ? '−' : '✉'}</span>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
              {letter.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
