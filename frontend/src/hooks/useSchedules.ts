import { useState, useCallback } from 'react';
import { CalendarEvent } from '../types';
import { getMonthlyCalendar } from '../services/scheduleService';

interface UseSchedulesReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: (month?: string) => Promise<void>;
}

/**
 * Custom hook để lấy danh sách lịch trình tháng từ CalendarEvent
 */
export const useSchedules = (): UseSchedulesReturn => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (month?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMonthlyCalendar(month);
      setEvents(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Không thể tải lịch trình tháng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { events, isLoading, error, refetch };
};
