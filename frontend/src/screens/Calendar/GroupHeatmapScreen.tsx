import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar, ICalendarEventBase } from 'react-native-big-calendar';
import dayjs from 'dayjs';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getRoomHeatmap } from '../../services/roomService';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getSharedEventsInRoom } from '../../services/scheduleService';

type Route = RouteProp<RootStackParamList, 'GroupHeatmap'>;

interface HeatmapEvent extends ICalendarEventBase {
  title: string;
  start: Date;
  end: Date;
  color: string;
  busyCount: number;
}

export const GroupHeatmapScreen = () => {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { roomId = 'group_123', roomName = 'Nhóm Phát Triển Mobile App' } = route.params || {};

  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [sharedEvents, setSharedEvents] = useState<any[]>([]);
  const TOTAL_MEMBERS = 10;

  const fetchHeatmap = async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getRoomHeatmap(roomId);
      setHeatmapData(res || {});
    } catch (err) {
      console.log('Heatmap API failed:', err);
      setHeatmapData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHeatmap(); }, [roomId]);

  const transformHeatmapToEvents = (data: any, viewDate: Date, totalMembers: number): HeatmapEvent[] => {
    if (!data || !data.timeSlots || !Array.isArray(data.timeSlots)) return [];
    const result: HeatmapEvent[] = [];
    
    data.timeSlots.forEach((slot: any) => {
      const { date, startTime, endTime, busyCount } = slot;
      if (busyCount > 0) {
        let color = '#BAE6FD'; // Ít bận
        if (busyCount >= (totalMembers * 2) / 3) {
          color = '#1D4ED8'; // Bận nhiều
        } else if (busyCount >= totalMembers / 3) {
          color = '#3B82F6'; // Bận trung bình
        }
        
        result.push({
          title: `${busyCount}/${totalMembers} bận`,
          start: dayjs(`${date}T${startTime}:00`).toDate(),
          end: dayjs(`${date}T${endTime}:00`).toDate(),
          color,
          busyCount,
        });
      }
    });

    return result;
  };

  const events = transformHeatmapToEvents(heatmapData, currentDate, TOTAL_MEMBERS);

  const loadSharedEvents = async () => {
    if (!roomId) return;
    try {
      const events = await getSharedEventsInRoom(roomId);
      setSharedEvents(events);
    } catch (e) {
      console.log('Error loading shared events:', e);
    }
  };

  useEffect(() => {
    fetchHeatmap();
    loadSharedEvents();
  }, [roomId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Lịch chung</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Tháng {dayjs(currentDate).format('MM/YYYY')} • {roomName}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.modeBtn} 
            onPress={() => setMode(mode === 'week' ? 'month' : 'week')}
          >
            <Text style={styles.modeBtnText}>{mode === 'week' ? 'Tháng' : 'Tuần'}</Text>
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legendWrapper}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]} />
              <Text style={styles.legendText}>Rảnh</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#BAE6FD' }]} />
              <Text style={styles.legendText}>Ít bận</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Bận vừa</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#1D4ED8' }]} />
              <Text style={styles.legendText}>Bận nhiều</Text>
            </View>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarWrapper}>
          {loading && !heatmapData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Đang tổng hợp lịch nhóm...</Text>
            </View>
          ) : (
            <Calendar
              events={events}
              height={600}
              mode={mode}
              date={currentDate}
              onChangeDate={(dates) => {
                if (dates && dates.length > 0) {
                  const newDate = dates[0];
                  if (currentDate.toISOString() !== newDate.toISOString()) {
                    setCurrentDate(newDate);
                  }
                }
              }}
              swipeEnabled={true}
              eventCellStyle={(event: HeatmapEvent) => ({
                backgroundColor: event.color,
                borderRadius: 2,
              })}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC', 
    alignItems: 'center', justifyContent: 'center'
  },
  headerTextContainer: { flex: 1, marginLeft: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  modeBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  
  legendWrapper: { paddingHorizontal: 20, marginBottom: 12 },
  legendContainer: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  
  calendarWrapper: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF' 
  },
  loadingText: { marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: '500' },
  
  eventText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  }
});
