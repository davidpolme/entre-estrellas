import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { Letter, CommunityAssignment } from '@/types';
import {
  GET_MY_LETTERS,
  GET_MY_ASSIGNMENT,
  ON_LETTER_CREATED,
  SEND_COMMUNITY_LETTER,
  SEND_DIRECT_LETTER,
  MARK_LETTER_READ,
} from '@/graphql/operations';

const client = generateClient();

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [assignment, setAssignment] = useState<CommunityAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLetters = useCallback(async () => {
    try {
      const [lettersRes, assignRes] = await Promise.all([
        client.graphql({ query: GET_MY_LETTERS }) as any,
        client.graphql({ query: GET_MY_ASSIGNMENT }) as any,
      ]);
      const fetchedLetters: Letter[] = lettersRes.data.getMyLetters ?? [];
      setLetters(fetchedLetters);
      setAssignment(assignRes.data.getMyAssignment ?? null);
      setUnreadCount(fetchedLetters.filter((l: Letter) => !l.readAt).length);
    } catch {
      // Not configured yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  useEffect(() => {
    let sub: any;
    async function setupSubscriptions() {
      try {
        sub = (client as any).graphql({ query: ON_LETTER_CREATED }).subscribe({
          next: () => { fetchLetters(); },
        });
      } catch {
        // Subscriptions not configured
      }
    }
    setupSubscriptions();
    return () => { sub?.unsubscribe(); };
  }, [fetchLetters]);

  const sendCommunityLetter = useCallback(async (content: string): Promise<boolean> => {
    try {
      await (client.graphql({
        query: SEND_COMMUNITY_LETTER,
        variables: { content },
      }) as any);
      await fetchLetters();
      return true;
    } catch {
      return false;
    }
  }, [fetchLetters]);

  const sendDirectLetter = useCallback(async (recipientId: string, content: string): Promise<boolean> => {
    try {
      await (client.graphql({
        query: SEND_DIRECT_LETTER,
        variables: { recipientId, content },
      }) as any);
      await fetchLetters();
      return true;
    } catch {
      return false;
    }
  }, [fetchLetters]);

  const markAsRead = useCallback(async (letterId: string) => {
    try {
      await (client.graphql({
        query: MARK_LETTER_READ,
        variables: { letterId },
      }) as any);
      setLetters(prev => prev.map(l => l.id === letterId ? { ...l, readAt: new Date().toISOString() } : l));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }, []);

  return {
    letters,
    assignment,
    loading,
    unreadCount,
    sendCommunityLetter,
    sendDirectLetter,
    markAsRead,
    refresh: fetchLetters,
  };
}