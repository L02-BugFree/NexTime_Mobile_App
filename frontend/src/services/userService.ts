import axiosClient from "../api/axiosClient";
import { USER_ENDPOINTS } from "../api/endpoints";
import {
  User,
  UpdateProfileRequest,
  UpdatePrivacyRequest,
  UpdateVisibilityRequest,
} from "../types";

export const getMe = async (): Promise<User> => {
  const response = await axiosClient.get<User>(USER_ENDPOINTS.ME);
  return response.data;
};

export const updateProfile = async (
  payload: UpdateProfileRequest,
): Promise<User> => {
  const response = await axiosClient.patch<User>(
    USER_ENDPOINTS.UPDATE_PROFILE,
    payload,
  );
  return response.data;
};

export const updatePrivacy = async (
  payload: UpdatePrivacyRequest,
): Promise<void> => {
  await axiosClient.patch(USER_ENDPOINTS.UPDATE_PRIVACY, payload);
};

export const updateVisibility = async (
  payload: UpdateVisibilityRequest,
): Promise<void> => {
  await axiosClient.patch(USER_ENDPOINTS.UPDATE_VISIBILITY, payload);
};

export const getQrCode = async (): Promise<{ friendCode: string }> => {
  const response = await axiosClient.get<{ friendCode: string }>(
    USER_ENDPOINTS.GET_QR,
  );
  return response.data;
};

export const deleteAccount = async (): Promise<void> => {
  await axiosClient.delete(USER_ENDPOINTS.DELETE_ACCOUNT);
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.SEARCH, {
    params: { query },
  });
  return response.data;
};

export const sendFriendRequest = async (
  targetUserId: string,
): Promise<void> => {
  console.log("Sending friend request to user ID:", targetUserId);
  await axiosClient.post(USER_ENDPOINTS.FRIENDS_REQUEST, { targetUserId });
};

export const acceptFriendRequest = async (
  requesterId: string,
): Promise<void> => {
  await axiosClient.post(USER_ENDPOINTS.FRIENDS_ACCEPT, { requesterId });
};

export const removeFriend = async (friendId: string): Promise<void> => {
  await axiosClient.delete(USER_ENDPOINTS.FRIENDS_REMOVE(friendId));
};

export const getFriendsList = async (): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.FRIENDS_LIST);
  return response.data;
};

export const getFriendRequests = async (): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.REQUESTS_LIST);
  return response.data;
};

export const blockUser = async (targetUserId: string): Promise<void> => {
  await axiosClient.post(USER_ENDPOINTS.BLOCKS_ADD, { targetUserId });
};

export const getBlockedUsers = async (): Promise<User[]> => {
  const response = await axiosClient.get<User[]>(USER_ENDPOINTS.BLOCKS_LIST);
  return response.data;
};

export const unblockUser = async (targetUserId: string): Promise<void> => {
  await axiosClient.delete(USER_ENDPOINTS.BLOCKS_REMOVE(targetUserId));
};
