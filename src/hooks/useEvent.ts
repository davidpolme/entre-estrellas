import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { EventStatus, AdminStats } from '@/types';
import {
  GET_EVENT,
  ON_EVENT_UPDATED,
  GET_ADMIN_STATS,
  START_EVENT,
  FINISH_EVENT,
} from '@/graphql/operations';

const client = generateClient();

export function useEvent() {
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
            setStatus(event.data.onEventUpdated.status);
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
    try {
      const res = await client.graphql({ query: GET_ADMIN_STATS }) as any;
      setAdminStats(res.data.getAdminStats ?? null);
    } catch {
      // Not admin or not configured
    }
  }, []);

  const startEvent = useCallback(async (): Promise<boolean> => {
    try {
      const res = await client.graphql({ query: START_EVENT }) as any;
      setStatus(res.data.startEvent.status);
      return true;
    } catch {
      return false;
    }
  }, []);

  const finishEvent = useCallback(async (): Promise<boolean> => {
    try {
      const res = await client.graphql({ query: FINISH_EVENT }) as any;
      setStatus(res.data.finishEvent.status);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { status, loading, adminStats, fetchAdminStats, startEvent, finishEvent, refresh: fetchStatus };
}