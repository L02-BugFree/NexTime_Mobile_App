// src/screens/Calendar/GroupHeatmapScreen.tsx - SỬA LỖI TIMEZONE

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, Platform, 
  ActivityIndicator, TouchableOpacity, Modal, 
  FlatList, Dimensions 
} from 'react-native';
import { Calendar, ICalendarEventBase } from 'react-native-big-calendar';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { getRoomHeatmap } from '../../services/roomService';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { HeatmapSlot } from '../../types';

// Add timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

type Route = RouteProp<RootStackParamList, 'GroupHeatmap'>;

interface HeatmapEvent extends ICalendarEventBase {
  title: string;
  start: Date;
  end: Date;
  color: string;
  busyCount: number;
  slotData?: HeatmapSlot;
}

export const GroupHeatmapScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { roomId = '', roomName = 'Nhóm' } = route.params || {};

  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<HeatmapSlot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [calendarKey, setCalendarKey] = useState(0);

  const fetchHeatmapForThreeMonths = useCallback(async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      const currentMonth = dayjs(currentDate).format('YYYY-MM');
      const prevMonth = dayjs(currentDate).subtract(1, 'month').format('YYYY-MM');
      const nextMonth = dayjs(currentDate).add(1, 'month').format('YYYY-MM');
      
      const months = [prevMonth, currentMonth, nextMonth];
      console.log('📊 Fetching heatmap for months:', months);
      
      const results = await Promise.all(
        months.map(month => getRoomHeatmap(roomId, month))
      );
      
      console.log('📊 Heatmap responses count:', results.length);
      
      setHeatmapData(results);
      
      // ✅ Get totalMembers from first response that has it
      for (const res of results) {
        if (res?.totalMembers) {
          setTotalMembers(res.totalMembers);
          break;
        }
      }
      
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      console.log('Heatmap API failed:', err);
      setHeatmapData([]);
    } finally {
      setLoading(false);
    }
  }, [roomId, currentDate]);

  useEffect(() => {
    fetchHeatmapForThreeMonths();
  }, [fetchHeatmapForThreeMonths]);

  const getHeatmapForMonth = (date: Date) => {
    const monthStr = dayjs(date).format('YYYY-MM');
    return heatmapData.find(data => data?.month === monthStr);
  };

  // 🔧 FIXED: Properly handle timezone and midnight transitions
  const transformHeatmapToEvents = (): HeatmapEvent[] => {
    const result: HeatmapEvent[] = [];

    heatmapData.forEach((data) => {
      if (!data?.busySlots || !Array.isArray(data.busySlots)) return;

      const total = data.totalMembers || totalMembers || 1;

      console.log(
        `🔄 Processing ${data.busySlots.length} slots for ${data.month}`
      );

      data.busySlots.forEach((slot: HeatmapSlot) => {
        const { date, startTime, endTime, busyCount } = slot;

        let color = '#BAE6FD';

        if (busyCount >= (total * 2) / 3) {
          color = '#1D4ED8';
        } else if (busyCount >= total / 3) {
          color = '#3B82F6';
        }

        const [startHour, startMinute] = startTime
          .split(':')
          .map(Number);

        let [endHour, endMinute] = endTime
          .split(':')
          .map(Number);

        const slotDate = dayjs(date);

        const startDate = slotDate
          .hour(startHour)
          .minute(startMinute)
          .second(0)
          .millisecond(0)
          .toDate();

        let endDate = slotDate
          .hour(endHour)
          .minute(endMinute)
          .second(0)
          .millisecond(0);

        // xử lý trường hợp 00:00 ngày hôm sau
        if (endHour === 0 && endMinute === 0) {
          endDate = endDate.add(1, 'day');
        }

        console.log(
          `✅ Event ${date} ${startTime}-${endTime}`,
          {
            start: startDate.toString(),
            end: endDate.toDate().toString(),
          }
        );

        result.push({
          title: `${busyCount}/${total} bận`,
          start: startDate,
          end: endDate.toDate(),
          color,
          busyCount,
          slotData: slot,
        });
      });
    });

    console.log('📅 Total events:', result.length);

    return result;
  };

  const events = transformHeatmapToEvents();

  const handleEventPress = async (event: HeatmapEvent) => {
    if (!event.slotData) return;
    setSelectedSlot(event.slotData);
    setModalVisible(true);
  };

  const handleDateChange = (dates: Date[]) => {
    if (dates && dates.length > 0) {
      const newDate = dates[0];
      if (currentDate.toISOString() !== newDate.toISOString()) {
        console.log('📅 Month changed to:', dayjs(newDate).format('YYYY-MM'));
        setCurrentDate(newDate);
      }
    }
  };

  const getBusyLevelText = (busyCount: number, total: number) => {
    const ratio = busyCount / total;
    if (ratio === 0) return 'Rảnh';
    if (ratio <= 0.33) return 'Ít bận';
    if (ratio <= 0.66) return 'Bận vừa';
    return 'Bận nhiều';
  };

  const getBusyLevelColor = (busyCount: number, total: number) => {
    const ratio = busyCount / total;
    if (ratio === 0) return '#10B981';
    if (ratio <= 0.33) return '#F59E0B';
    if (ratio <= 0.66) return '#F97316';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Lịch chung</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {dayjs(currentDate).format('MMMM YYYY')} • {roomName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.modeBtn} 
              onPress={() => setMode(mode === 'week' ? 'month' : 'week')}
            >
              <Text style={styles.modeBtnText}>{mode === 'week' ? 'Tháng' : 'Tuần'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.legendWrapper}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#BAE6FD' }]} />
              <Text style={styles.legendText}>Ít bận (≤33%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Bận vừa (34-66%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#1D4ED8' }]} />
              <Text style={styles.legendText}>Bận nhiều (≥67%)</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarWrapper}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tổng hợp lịch nhóm...</Text>
            </View>
          ) : (
            <Calendar
              key={calendarKey}
              events={events}
              height={600}
              mode={mode}
              date={currentDate}
              onChangeDate={handleDateChange}
              onPressEvent={handleEventPress}
              swipeEnabled={true}
              showTime={mode === 'week'} // Show time in week view
              weekStartsOn={1} // Start week on Monday (adjust as needed)
              eventCellStyle={(event: HeatmapEvent) => ({
                backgroundColor: event.color,
                borderRadius: 4,
                paddingHorizontal: 4,
                justifyContent: 'center',
              })}
              // Add these to debug
              onPressDate={(date: Date) => {
                console.log('Date pressed:', date);
                console.log('Events for this date:', events.filter(e => 
                  dayjs(e.start).isSame(date, 'day')
                ));
              }}
            />
          )}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSlot ? dayjs(selectedSlot.date).format('DD/MM/YYYY') : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedSlot && (
              <>
                <View style={styles.timeInfo}>
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                  <Text style={styles.timeText}>
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </Text>
                  <View style={[
                    styles.busyBadge, 
                    { backgroundColor: getBusyLevelColor(selectedSlot.busyCount, totalMembers || 5) }
                  ]}>
                    <Text style={styles.busyBadgeText}>
                      {getBusyLevelText(selectedSlot.busyCount, totalMembers || 5)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <Text style={styles.statsText}>
                    {selectedSlot.busyCount}/{totalMembers || 5} thành viên bận
                  </Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Thành viên bận trong khung giờ này</Text>
                
                <View style={styles.emptyMembers}>
                  <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>
                    Đang tải danh sách thành viên...
                  </Text>
                  <Text style={styles.emptySubtext}>
                    (Tính năng đang phát triển)
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modeBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  legendWrapper: { paddingHorizontal: 20, marginBottom: 12, marginTop: 12 },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendBox: { width: 16, height: 16, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  calendarWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: { marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: '500' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  busyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  busyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});