import { generateClient } from 'aws-amplify/api';
import { useState, useEffect, useCallback } from 'react';
import type { ConstellationUser, Connection } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { LIST_USERS, LIST_CONNECTIONS, ON_USER_JOINED, ON_CONNECTION_CREATED, ON_CONNECTION_UPDATED } from '@/graphql/operations';

const client = generateClient();

interface ConstellationData {
  users: ConstellationUser[];
  connections: Connection[];
  loading: boolean;
  error: string | null;
}

export function useConstellation() {
  const { user } = useAuth();
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
        client.graphql({ query: LIST_CONNECTIONS }) as any,
      ]);
      const allUsers: ConstellationUser[] = usersRes.data.listUserProfiles ?? [];
      const allConnections: Connection[] = connectionsRes.data.listConnections ?? [];
      // Filter to only current user's connections
      const myConnections = user
        ? allConnections.filter(c => c.userAId === user.userId || c.userBId === user.userId)
        : [];
      setData({
        users: allUsers,
        connections: myConnections,
        loading: false,
        error: null,
      });
    } catch {
      setData(prev => ({ ...prev, loading: false, error: 'Error al cargar la constelación' }));
    }
  }, [user]);

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
            const newUser = event.data.onCreateUserProfile ?? event.data.onUserJoined;
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
            const conn = event.data.onCreateConnection;
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
            const conn = event.data.onUpdateConnection;
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