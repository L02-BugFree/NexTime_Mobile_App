import axiosClient from '../api/axiosClient';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '../api/endpoints';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UpdateProfileRequest,
  UpdatePrivacyRequest,
  UpdateVisibilityRequest,
  ApiResponse,
} from '../types';
import { saveToken, saveRefreshToken, clearAllTokens } from '../utils/tokenStorage';

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * Đăng nhập và lưu trữ token
 */
export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosClient.post<any>(AUTH_ENDPOINTS.LOGIN, payload);
  const data = response.data;

  // Hỗ trợ linh hoạt nhiều định dạng response từ Backend
  const jwtToken = data?.token || data?.access_token || data?.tokens?.accessToken;
  const refreshToken = data?.refreshToken || data?.tokens?.refreshToken;

  if (jwtToken) {
    await saveToken(jwtToken);
  }
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }

  return {
    user: data?.user || data,
    token: jwtToken,
  };
};

/**
 * Đăng ký tài khoản mới
 */
export const register = async (payload: RegisterRequest): Promise<AuthResponse> => {
  const response = await axiosClient.post<any>(AUTH_ENDPOINTS.REGISTER, payload);
  const data = response.data;

  const jwtToken = data?.token || data?.access_token || data?.tokens?.accessToken;
  const refreshToken = data?.refreshToken || data?.tokens?.refreshToken;

  if (jwtToken) {
    await saveToken(jwtToken);
  }
  if (refreshToken) {
    await saveRefreshToken(refreshToken);
  }

  return {
    user: data?.user || data,
    token: jwtToken,
  };
};

/**
 * Đăng xuất
 */
export const logout = async (): Promise<void> => {
  try {
    await axiosClient.post(AUTH_ENDPOINTS.LOGOUT);
  } finally {
    await clearAllTokens();
  }
};

/**
 * Lấy thông tin user hiện tại
 */
export const getMe = async (): Promise<User> => {
  const response = await axiosClient.get<User>(USER_ENDPOINTS.ME);
  return response.data;
};

/**
 * Cập nhật thông tin profile
 */
export const updateProfile = async (payload: UpdateProfileRequest): Promise<void> => {
  await axiosClient.patch(USER_ENDPOINTS.UPDATE_PROFILE, payload);
};

/**
 * Cập nhật cấu hình bảo mật
 */
export const updatePrivacy = async (payload: UpdatePrivacyRequest): Promise<void> => {
  await axiosClient.patch(USER_ENDPOINTS.UPDATE_PRIVACY, payload);
};

/**
 * Cập nhật chế độ hiển thị công khai
 */
export const updateVisibility = async (payload: UpdateVisibilityRequest): Promise<void> => {
  await axiosClient.patch(USER_ENDPOINTS.UPDATE_VISIBILITY, payload);
};

/**
 * Lấy mã QR Code (Friend Code)
 */
export const getQrCode = async (): Promise<string> => {
  const response = await axiosClient.get<string>(USER_ENDPOINTS.GET_QR);
  return response.data;
};
