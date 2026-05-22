import { useState, useCallback } from 'react';
import { User } from '../types';
import { login as loginService, logout as logoutService, getMe } from '../services/authService';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

/**
 * Custom hook quản lý trạng thái xác thực
 */
export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loginService({ email, password });
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Đăng nhập thất bại');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logoutService();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMe();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading, error, login, logout, fetchCurrentUser };
};
