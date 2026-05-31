// ─── Environment Variables ────────────────────────────────────────────────────
// Đọc từ app.json extra hoặc .env (expo-constants)

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/';

export const API_TIMEOUT: number = Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10_000;

export const APP_ENV: 'development' | 'staging' | 'production' =
  (process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production') ?? 'development';

export const IS_DEV = APP_ENV === 'development';
