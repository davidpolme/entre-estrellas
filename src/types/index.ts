export type StarColor = 'blue' | 'white' | 'yellow' | 'orange' | 'red';

export type EventStatus = 'REGISTRATION_OPEN' | 'ACTIVE' | 'FINISHED';

export type LetterType = 'COMMUNITY' | 'DIRECT';

export interface UserProfile {
  id: string;
  username: string;
  starColor: StarColor;
  x: number;
  y: number;
  communityLetterCompleted: boolean;
  createdAt: string;
}

export interface ConstellationUser {
  id: string;
  username: string;
  starColor: StarColor;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  letterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Letter {
  id: string;
  senderId: string;
  recipientId: string;
  type: LetterType;
  content: string;
  createdAt: string;
  readAt: string | null;
  senderName?: string;
}

export interface CommunityAssignment {
  senderId: string;
  recipientId: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface EventState {
  id: string;
  status: EventStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface AdminStats {
  totalParticipants: number;
  colorDistribution: Record<StarColor, number>;
  eventStatus: EventStatus;
  communityLettersSent: number;
  totalLetters: number;
  totalConnections: number;
}

export const STAR_COLORS: { value: StarColor; label: string; glow: string; hex: string }[] = [
  { value: 'blue', label: 'Azul', glow: '#60a5fa', hex: '#60a5fa' },
  { value: 'white', label: 'Blanco', glow: '#f1f5f9', hex: '#f1f5f9' },
  { value: 'yellow', label: 'Amarillo', glow: '#fbbf24', hex: '#fbbf24' },
  { value: 'orange', label: 'Naranja', glow: '#fb923c', hex: '#fb923c' },
  { value: 'red', label: 'Rojo', glow: '#f87171', hex: '#f87171' },
];

export const COMMUNITY_PROMPTS = [
  '¿Qué te gustaría recordarle hoy a alguien de nuestra comunidad?',
  '¿Qué mensaje te habría gustado recibir alguna vez?',
  '¿Qué deseo bonito quieres dejarle a alguien?',
  '¿Qué quieres recordarle sobre su valor como persona?',
  '¿Qué palabras podrían acompañar a alguien hoy?',
];

export const DIRECT_PROMPTS = [
  '¿Qué te gusta de esta persona?',
  '¿Qué cualidad suya admiras?',
  '¿Hay algo bueno que esta persona haya hecho por ti?',
  '¿Qué momento recuerdas con cariño?',
  '¿Qué quisieras agradecerle?',
  '¿Qué deseas para esta persona?',
];