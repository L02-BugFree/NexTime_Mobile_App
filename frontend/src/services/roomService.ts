import axiosClient from '../api/axiosClient';
import { ROOM_ENDPOINTS } from '../api/endpoints';
import { Room, Message, CreateRoomRequest, CreateMessageRequest } from '../types';

export const createRoom = async (payload: CreateRoomRequest): Promise<Room> => {
  const response = await axiosClient.post<Room>(ROOM_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const getRooms = async (): Promise<Room[]> => {
  const response = await axiosClient.get(ROOM_ENDPOINTS.GET);
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export const getRoomMessages = async (roomId: string): Promise<Message[]> => {
  const response = await axiosClient.get<Message[]>(ROOM_ENDPOINTS.GET_MESSAGES(roomId));
  return response.data;
};

export const sendMessage = async (roomId: string, content: string): Promise<Message> => {
  const response = await axiosClient.post<Message>(ROOM_ENDPOINTS.SEND_MESSAGE(roomId), { content } as CreateMessageRequest);
  return response.data;
};

export const getRoomHeatmap = async (roomId: string): Promise<any> => {
  const response = await axiosClient.get<any>(ROOM_ENDPOINTS.HEATMAP(roomId));
  return response.data;
};
