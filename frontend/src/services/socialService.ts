import axiosClient from '../api/axiosClient';
import { USER_ENDPOINTS } from '../api/endpoints';
import { User, FriendRequest } from '../types';

// ─── Social & Friends Service ─────────────────────────────────────────────────

/**
 * Lấy danh sách bạn bè hiện tại
 */
export const getFriends = async (): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.FRIENDS_LIST);
  return response.data;
};

/**
 * Tìm kiếm người dùng bằng email hoặc mã code với bộ lọc bảo mật
 */
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.SEARCH, {
    params: { query },
  });
  return response.data;
};

/**
 * Gửi yêu cầu kết bạn đến một người dùng khác
 */
export const sendFriendRequest = async (targetUserId: string): Promise<void> => {
  await axiosClient.post(USER_ENDPOINTS.FRIENDS_REQUEST, { targetUserId });
};

/**
 * Chấp nhận yêu cầu kết bạn
 */
export const acceptFriendRequest = async (requesterId: string): Promise<void> => {
  await axiosClient.post(USER_ENDPOINTS.FRIENDS_ACCEPT, { requesterId });
};

/**
 * Xóa bạn bè
 */
export const removeFriend = async (friendId: string): Promise<void> => {
  await axiosClient.delete(USER_ENDPOINTS.FRIENDS_REMOVE(friendId));
};

/**
 * Lấy danh sách các tài khoản đang bị chặn
 */
export const getBlockedUsers = async (): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.BLOCKS_LIST);
  return response.data;
};

/**
 * Chặn một người dùng
 */
export const blockUser = async (targetUserId: string): Promise<void> => {
  await axiosClient.post(USER_ENDPOINTS.BLOCKS_ADD, { targetUserId });
};

/**
 * Hủy chặn người dùng
 */
export const unblockUser = async (targetUserId: string): Promise<void> => {
  await axiosClient.delete(USER_ENDPOINTS.BLOCKS_REMOVE(targetUserId));
};
