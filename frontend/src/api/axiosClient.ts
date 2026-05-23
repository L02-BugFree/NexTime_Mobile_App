import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/env';
import { getToken, removeToken } from '../utils/tokenStorage';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Tự động đính kèm JWT Token vào mỗi request

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Xử lý lỗi toàn cục (ví dụ: 401 Unauthorized → logout)

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();
      // Có thể emit sự kiện để navigation logout tại đây
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
