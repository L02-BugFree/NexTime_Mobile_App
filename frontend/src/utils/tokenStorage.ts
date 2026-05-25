import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'nextime_access_token';
const REFRESH_KEY = 'nextime_refresh_token';

// ─── Access Token ─────────────────────────────────────────────────────────────
export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const saveToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(REFRESH_KEY);
  }
  return await SecureStore.getItemAsync(REFRESH_KEY);
};

export const saveRefreshToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(REFRESH_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_KEY, token);
};

export const removeRefreshToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_KEY);
};

// ─── Clear All Auth ───────────────────────────────────────────────────────────
export const clearAllTokens = async (): Promise<void> => {
  await Promise.all([removeToken(), removeRefreshToken()]);
};
