import axiosClient from '../api/axiosClient';
import { SCHEDULE_ENDPOINTS } from '../api/endpoints';
import {
  CalendarEvent,
  CreateWeeklyEventRequest,
  CreateOneshotEventRequest,
  UpdateEventRequest,
  HeatmapData,
} from '../types';

export const getMonthlyCalendar = async (month?: string): Promise<CalendarEvent[]> => {
  const response = await axiosClient.get(SCHEDULE_ENDPOINTS.GET_MONTHLY, {
    params: month ? { month } : undefined,
  });
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export const createWeeklyEvent = async (payload: CreateWeeklyEventRequest): Promise<void> => {
  await axiosClient.post(SCHEDULE_ENDPOINTS.CREATE_WEEKLY, payload);
};

export const createOneshotEvent = async (payload: CreateOneshotEventRequest): Promise<void> => {
  await axiosClient.post(SCHEDULE_ENDPOINTS.CREATE_ONESHOT, payload);
};

export const updateEvent = async (eventId: string, payload: UpdateEventRequest): Promise<any> => {
  const response = await axiosClient.patch<any>(SCHEDULE_ENDPOINTS.UPDATE(eventId), payload);
  return response.data;
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await axiosClient.delete(SCHEDULE_ENDPOINTS.DELETE(eventId));
};

export const getScheduleHeatmap = async (groupId: string): Promise<HeatmapData> => {
  const response = await axiosClient.get<HeatmapData>(SCHEDULE_ENDPOINTS.GET_HEATMAP(groupId));
  return response.data;
};

/**
 * Share an event to multiple rooms
 */
export const shareEventToRooms = async (eventId: string, roomIds: string[]): Promise<any> => {
  const response = await axiosClient.post(`/schedule/events/${eventId}/share`, { roomIds });
  return response.data;
};

/**
 * Unshare an event from a room
 */
export const unshareEventFromRoom = async (eventId: string, roomId: string): Promise<any> => {
  const response = await axiosClient.delete(`/schedule/events/${eventId}/share/${roomId}`);
  return response.data;
};

/**
 * Get shared events in a room
 */
export const getSharedEventsInRoom = async (roomId: string, month?: string): Promise<any[]> => {
  const response = await axiosClient.get(`/schedule/rooms/${roomId}/shared-events`, {
    params: month ? { month } : undefined,
  });
  return response.data;
};