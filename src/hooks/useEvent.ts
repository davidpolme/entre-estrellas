import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { EventStatus, AdminStats } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  GET_EVENT,
  ON_EVENT_UPDATED,
  GET_ADMIN_STATS,
  START_EVENT,
  FINISH_EVENT,
} from '@/graphql/operations';

const client = generateClient();

export function useEvent() {
  const { sessionToken } = useAuth();
  const [status, setStatus] = useState<EventStatus>('REGISTRATION_OPEN');
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await client.graphql({ query: GET_EVENT }) as any;
      const event = res.data.getEvent;
      if (event) {
        setStatus(event.status);
      }
    } catch {
      // Not configured yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    let sub: any;
    async function setupSubscriptions() {
      try {
        sub = (client as any).graphql({ query: ON_EVENT_UPDATED }).subscribe({
          next: (event: any) => {
            setStatus(event.data.onUpdateEvent.status);
          },
        });
      } catch {
        // Subscriptions not configured
      }
    }
    setupSubscriptions();
    return () => { sub?.unsubscribe(); };
  }, []);

  const fetchAdminStats = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await client.graphql({
        query: GET_ADMIN_STATS,
        variables: { sessionToken },
      }) as any;
      setAdminStats(res.data.getAdminStats ?? null);
    } catch {
      // Not admin or not configured
    }
  }, [sessionToken]);

  const startEvent = useCallback(async (): Promise<boolean> => {
    if (!sessionToken) return false;
    try {
      const res = await client.graphql({
        query: START_EVENT,
        variables: { sessionToken },
      }) as any;
      setStatus(res.data.startEvent.status);
      return true;
    } catch {
      return false;
    }
  }, [sessionToken]);

  const finishEvent = useCallback(async (): Promise<boolean> => {
    if (!sessionToken) return false;
    try {
      const res = await client.graphql({
        query: FINISH_EVENT,
        variables: { sessionToken },
      }) as any;
      setStatus(res.data.finishEvent.status);
      return true;
    } catch {
      return false;
    }
  }, [sessionToken]);

  return { status, loading, adminStats, fetchAdminStats, startEvent, finishEvent, refresh: fetchStatus };
}