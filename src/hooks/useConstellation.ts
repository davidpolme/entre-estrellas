import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { ConstellationUser, Connection } from '@/types';
import { LIST_USERS, GET_MY_CONNECTIONS, ON_USER_JOINED, ON_CONNECTION_CREATED, ON_CONNECTION_UPDATED } from '@/graphql/operations';

const client = generateClient();

interface ConstellationData {
  users: ConstellationUser[];
  connections: Connection[];
  loading: boolean;
  error: string | null;
}

export function useConstellation() {
  const [data, setData] = useState<ConstellationData>({
    users: [],
    connections: [],
    loading: true,
    error: null,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchConstellation = useCallback(async () => {
    try {
      const [usersRes, connectionsRes] = await Promise.all([
        client.graphql({ query: LIST_USERS }) as any,
        client.graphql({ query: GET_MY_CONNECTIONS }) as any,
      ]);
      setData({
        users: usersRes.data.listUsers ?? [],
        connections: connectionsRes.data.getMyConnections ?? [],
        loading: false,
        error: null,
      });
    } catch {
      setData(prev => ({ ...prev, loading: false, error: 'Error al cargar la constelación' }));
    }
  }, []);

  useEffect(() => {
    fetchConstellation();
  }, [fetchConstellation]);

  useEffect(() => {
    let userSub: any;
    let connSub: any;
    let connUpdSub: any;

    async function setupSubscriptions() {
      try {
        userSub = (client as any).graphql({ query: ON_USER_JOINED }).subscribe({
          next: (event: any) => {
            const newUser = event.data.onUserCreated ?? event.data.onUserJoined;
            if (newUser) {
              setData(prev => ({
                ...prev,
                users: [...prev.users.filter(u => u.id !== newUser.id), newUser],
              }));
            }
          },
        });

        connSub = (client as any).graphql({ query: ON_CONNECTION_CREATED }).subscribe({
          next: (event: any) => {
            const conn = event.data.onConnectionCreated;
            if (conn) {
              setData(prev => ({
                ...prev,
                connections: [...prev.connections.filter(c => c.id !== conn.id), conn],
              }));
            }
          },
        });

        connUpdSub = (client as any).graphql({ query: ON_CONNECTION_UPDATED }).subscribe({
          next: (event: any) => {
            const conn = event.data.onConnectionUpdated;
            if (conn) {
              setData(prev => ({
                ...prev,
                connections: prev.connections.map(c => c.id === conn.id ? conn : c),
              }));
            }
          },
        });
      } catch {
        // Subscriptions not configured yet
      }
    }

    setupSubscriptions();
    return () => {
      userSub?.unsubscribe();
      connSub?.unsubscribe();
      connUpdSub?.unsubscribe();
    };
  }, []);

  const selectUser = useCallback((userId: string | null) => {
    setSelectedUserId(userId);
  }, []);

  return { ...data, selectedUserId, selectUser, refresh: fetchConstellation };
}