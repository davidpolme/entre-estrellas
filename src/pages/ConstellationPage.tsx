import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConstellation } from '@/hooks/useConstellation';
import { useLetters } from '@/hooks/useLetters';
import { useEvent } from '@/hooks/useEvent';
import { ConstellationCanvas } from '@/components/constellation/ConstellationCanvas';
import { CommunityLetterPrompt } from '@/components/letters/CommunityLetterPrompt';
import { LetterEditor } from '@/components/letters/LetterEditor';
import { Modal } from '@/components/ui/Modal';
import { LetterCard } from '@/components/letters/LetterCard';

interface ConstellationPageProps {
  isAdmin: boolean;
  username: string;
  userId: string;
  onLogout: () => void;
  onAdminPanel: () => void;
}

export function ConstellationPage({ isAdmin, username, userId, onLogout, onAdminPanel }: ConstellationPageProps) {
  const { users, connections, loading, selectedUserId, selectUser, refresh: refreshConstellation } = useConstellation();
  const { letters, assignment, unreadCount, sendCommunityLetter, sendDirectLetter, markAsRead, loading: lettersLoading } = useLetters();
  const { status } = useEvent();

  const [showCommunityPrompt, setShowCommunityPrompt] = useState(false);
  const [showLetterEditor, setShowLetterEditor] = useState(false);
  const [letterRecipient, setLetterRecipient] = useState<{ id: string; name: string } | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [showNav, setShowNav] = useState(false);

  const communityCompleted = assignment?.completed ?? false;

  useEffect(() => {
    if (status === 'ACTIVE' && !communityCompleted && !lettersLoading) {
      setShowCommunityPrompt(true);
    }
  }, [status, communityCompleted, lettersLoading]);

  const currentUserProfile = users.find(u => u.id === userId);

  const handleWriteLetter = (targetUserId: string) => {
    const target = users.find(u => u.id === targetUserId);
    if (target) {
      setLetterRecipient({ id: target.id, name: target.username });
      setShowLetterEditor(true);
    }
  };

  const isActive = status === 'ACTIVE';

  return (
    <div className="relative w-full h-dvh flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/40">✨</span>
          <span className="text-sm text-white/40 font-light">Entre Estrellas</span>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => setShowInbox(true)}
              className="relative px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm"
            >
              ✨ {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={() => setShowNav(true)}
            className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main constellation */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/30 animate-pulse">Cargando constelación...</div>
          </div>
        ) : (
          <ConstellationCanvas
            users={users}
            connections={connections}
            currentUserId={userId}
            selectedUserId={selectedUserId}
            onSelectUser={selectUser}
            onWriteLetter={handleWriteLetter}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { selectUser(userId); setShowInbox(true); }}
            className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-sm active:scale-95 transition-transform"
          >
            Mis cartas {unreadCount > 0 && `(${unreadCount})`}
          </button>
          {!communityCompleted && isActive && (
            <button
              onClick={() => setShowCommunityPrompt(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/20 text-blue-400 text-sm active:scale-95 transition-transform animate-pulse"
            >
              ✨ Escribir carta comunitaria
            </button>
          )}
        </div>
      </div>

      {/* Community letter prompt */}
      <CommunityLetterPrompt
        isOpen={showCommunityPrompt}
        onSend={sendCommunityLetter}
        onClose={() => setShowCommunityPrompt(false)}
      />

      {/* Direct letter editor */}
      <Modal
        isOpen={showLetterEditor}
        onClose={() => { setShowLetterEditor(false); setLetterRecipient(null); }}
      >
        {letterRecipient && (
          <LetterEditor
            type="direct"
            recipientName={letterRecipient.name}
            onSend={async (content) => {
              const sent = await sendDirectLetter(letterRecipient.id, content);
              if (sent) await refreshConstellation();
              return sent;
            }}
            onCancel={() => { setShowLetterEditor(false); setLetterRecipient(null); }}
          />
        )}
      </Modal>

      {/* Inbox */}
      <Modal isOpen={showInbox} onClose={() => setShowInbox(false)} title="Mis cartas">
        <div className="space-y-3">
          {letters.filter(letter => letter.recipientId === userId).length === 0 ? (
            <p className="text-white/40 text-center py-8">Aún no tienes cartas recibidas</p>
          ) : (
            letters
              .filter(letter => letter.recipientId === userId)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(letter => (
                <LetterCard
                  key={letter.id}
                  letter={letter}
                  received
                  onRead={markAsRead}
                />
              ))
          )}
        </div>
      </Modal>

      {/* Navigation menu */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNav(false)}
          >
            <motion.div
              className="bg-space-800/95 border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6"
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-1 mb-4">
                <p className="text-white font-medium">{username}</p>
                <p className="text-white/40 text-sm">✨ {currentUserProfile?.starColor ?? 'blue'}</p>
              </div>
              <div className="space-y-2">
                {isAdmin && (
                  <button
                    onClick={() => { setShowNav(false); onAdminPanel(); }}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 text-white/80 text-left hover:bg-white/10 transition-colors"
                  >
                    Panel de administración
                  </button>
                )}
                <button
                  onClick={() => { setShowNav(false); setShowInbox(true); }}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 text-white/80 text-left hover:bg-white/10 transition-colors"
                >
                  Mis cartas {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => { setShowNav(false); selectUser(userId); }}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 text-white/80 text-left hover:bg-white/10 transition-colors"
                >
                  Mi constelación
                </button>
                <hr className="border-white/10" />
                <button
                  onClick={onLogout}
                  className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-400 text-left hover:bg-red-500/20 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}