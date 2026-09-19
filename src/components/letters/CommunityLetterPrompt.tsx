import { Modal } from '@/components/ui/Modal';
import { LetterEditor } from '@/components/letters/LetterEditor';

interface CommunityLetterPromptProps {
  isOpen: boolean;
  onSend: (content: string) => Promise<boolean>;
  onClose: () => void;
}

export function CommunityLetterPrompt({ isOpen, onSend, onClose }: CommunityLetterPromptProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <LetterEditor type="community" onSend={onSend} onCancel={onClose} />
    </Modal>
  );
}