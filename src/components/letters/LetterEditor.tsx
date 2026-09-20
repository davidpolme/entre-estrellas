import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { COMMUNITY_PROMPTS, DIRECT_PROMPTS } from '@/types';

interface LetterEditorProps {
  type: 'community' | 'direct';
  recipientName?: string;
  onSend: (content: string) => Promise<boolean>;
  onCancel: () => void;
}

export function LetterEditor({ type, recipientName, onSend, onCancel }: LetterEditorProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const maxLength = 2000;
  const prompts = type === 'community' ? COMMUNITY_PROMPTS : DIRECT_PROMPTS;
  const prompt = prompts[promptIndex % prompts.length];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPromptIndex(previous => (previous + 1) % prompts.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [prompts.length]);

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    const success = await onSend(content);
    setSending(false);
    if (success) setSent(true);
  }

  if (sent) {
    return (
      <motion.div
        className="text-center py-8 space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-4xl">✨</div>
        <p className="text-white/80 font-medium">
          {type === 'community'
            ? 'Tu carta comunitaria ha sido enviada'
            : 'Tu carta ha sido enviada'}
        </p>
        <p className="text-white/50 text-sm">Tu estrella brillará más fuerte ahora</p>
        <button
          onClick={onCancel}
          className="mt-4 px-6 py-2 rounded-full bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          Cerrar
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {type === 'community' ? (
        <div className="space-y-2">
          <p className="text-white/80 font-medium">
            Antes de explorar la constelación, deja un mensaje bonito para alguien de nuestra comunidad. ✨
          </p>
          <p className="text-white/40 text-sm">
            Todavía no sabes quién lo recibirá, pero puede ser justo el mensaje que esa persona necesitaba hoy.
          </p>
        </div>
      ) : (
        <p className="text-white/80 font-medium">
          Escribir carta para <span className="text-blue-400">{recipientName}</span>
        </p>
      )}

      <button
        type="button"
        onClick={() => setPromptIndex(previous => (previous + 1) % prompts.length)}
        className="w-full text-left text-white/40 hover:text-white/60 text-sm italic transition-colors"
        title="Mostrar otra idea"
      >
        💡 {prompt} <span className="not-italic text-xs">(otra idea)</span>
      </button>

      <div className="relative">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, maxLength))}
          placeholder="Escribe tu mensaje..."
          className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
          autoFocus
        />
        <div className="absolute bottom-3 right-3 text-xs text-white/30">
          {content.length}/{maxLength}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </motion.div>
  );
}
