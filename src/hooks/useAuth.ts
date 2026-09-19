import { signUp, signIn, signOut, confirmSignUp, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { useState, useEffect, useCallback } from 'react';

interface AuthUser {
  userId: string;
  username: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups = session.tokens?.accessToken?.payload?.['cognito:groups'] as string[] | undefined;
      setUser({ userId: currentUser.userId, username: currentUser.username ?? '' });
      setIsAdmin(groups?.includes('admins') ?? false);
    } catch {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(async (username: string, password: string) => {
    await signIn({ username, password });
    await checkUser();
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    await signUp({
      username,
      password,
      options: { userAttributes: { preferred_username: username } },
    });
  }, []);

  const confirmRegistration = useCallback(async (username: string, code: string) => {
    await confirmSignUp({ username, confirmationCode: code });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return { user, loading, isAdmin, login, register, confirmRegistration, logout, checkUser };
}