import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { Letter, CommunityAssignment } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  LIST_LETTERS,
  GET_MY_ASSIGNMENT,
  ON_LETTER_CREATED,
  SEND_COMMUNITY_LETTER,
  SEND_DIRECT_LETTER,
  MARK_LETTER_READ,
  LIST_USERS,
} from '@/graphql/operations';

const client = generateClient();

export function useLetters() {
  const { user, sessionToken } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [assignment, setAssignment] = useState<CommunityAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLetters = useCallback(async () => {
    if (!user || !sessionToken) return;
    try {
      const [lettersRes, assignRes, usersRes] = await Promise.all([
        client.graphql({ query: LIST_LETTERS }) as any,
        client.graphql({
          query: GET_MY_ASSIGNMENT,
          variables: { senderId: user.userId },
        }) as any,
        client.graphql({ query: LIST_USERS }) as any,
      ]);
      const allLetters: Letter[] = lettersRes.data.listLetters?.items ?? [];
      const users: { id: string; username: string }[] = usersRes.data.listUserProfiles?.items ?? [];
      const usernames = new Map(users.map(profile => [profile.id, profile.username]));
      const myLetters = allLetters
        .filter(letter => letter.senderId === user.userId || letter.recipientId === user.userId)
        .map(letter => ({ ...letter, senderName: usernames.get(letter.senderId) }));
      setLetters(myLetters);
      setAssignment(assignRes.data.getCommunityAssignment ?? null);
      setUnreadCount(myLetters.filter((l: Letter) => !l.readAt && l.recipientId === user.userId).length);
    } catch {
      // Not configured yet
    } finally {
      setLoading(false);
    }
  }, [user, sessionToken]);

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
    const refreshInterval = window.setInterval(fetchLetters, 15000);
    return () => {
      sub?.unsubscribe();
      window.clearInterval(refreshInterval);
    };
  }, [fetchLetters]);

  const sendCommunityLetter = useCallback(async (content: string): Promise<boolean> => {
    if (!sessionToken) return false;
    try {
      await (client.graphql({
        query: SEND_COMMUNITY_LETTER,
        variables: { content, sessionToken },
      }) as any);
      await fetchLetters();
      return true;
    } catch {
      return false;
    }
  }, [sessionToken, fetchLetters]);

  const sendDirectLetter = useCallback(async (recipientId: string, content: string): Promise<boolean> => {
    if (!sessionToken) return false;
    try {
      await (client.graphql({
        query: SEND_DIRECT_LETTER,
        variables: { recipientId, content, sessionToken },
      }) as any);
      await fetchLetters();
      return true;
    } catch {
      return false;
    }
  }, [sessionToken, fetchLetters]);

  const markAsRead = useCallback(async (letterId: string) => {
    if (!sessionToken) return;
    try {
      await (client.graphql({
        query: MARK_LETTER_READ,
        variables: { letterId, sessionToken },
      }) as any);
      setLetters(prev => prev.map(l => l.id === letterId ? { ...l, readAt: new Date().toISOString() } : l));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }, [sessionToken]);

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