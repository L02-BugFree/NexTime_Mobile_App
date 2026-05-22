import axiosClient from '../api/axiosClient';
import { GROUP_ENDPOINTS } from '../api/endpoints';
import { HeatmapData } from '../types';

export const createGroup = async (payload: any): Promise<any> => {
  const response = await axiosClient.post<any>(GROUP_ENDPOINTS.CREATE, payload);
  return response.data;
};

export const getGroups = async (): Promise<any[]> => {
  const response = await axiosClient.get<any[]>(GROUP_ENDPOINTS.GET);
  return response.data;
};

export const getGroupHeatmap = async (groupId: string): Promise<HeatmapData> => {
  const response = await axiosClient.get<HeatmapData>(GROUP_ENDPOINTS.HEATMAP(groupId));
  return response.data;
};
