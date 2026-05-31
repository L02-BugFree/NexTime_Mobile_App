import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, ICalendarEventBase } from 'react-native-big-calendar';
import dayjs from 'dayjs';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getMonthlyCalendar } from '../../services/scheduleService';
import { CalendarEvent } from '../../types';
import { CreateEventModal } from '../../components/calendar/CreateEventModal';
import { ShareEventModal } from '../../components/calendar/ShareEventModal';

interface BigCalendarEvent extends ICalendarEventBase {
  title: string;
  start: Date;
  end: Date;
  color?: string;
  originalEvent?: CalendarEvent;
}

export const PersonalCalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<'week' | 'month'>('week');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedEventForShare, setSelectedEventForShare] = useState<any>(null);

  useEffect(() => {
    loadEventsForThreeMonths();
  }, [currentDate]);

  // Load events for previous, current, and next month
  const loadEventsForThreeMonths = async () => {
    try {
      setLoading(true);
      
      const currentMonth = dayjs(currentDate).format('YYYY-MM');
      const prevMonth = dayjs(currentDate).subtract(1, 'month').format('YYYY-MM');
      const nextMonth = dayjs(currentDate).add(1, 'month').format('YYYY-MM');
      
      const months = [prevMonth, currentMonth, nextMonth];
      
      console.log('📅 Fetching months:', months);
      
      const allEvents = await Promise.all(
        months.map(month => getMonthlyCalendar(month))
      );
      
      // Merge all events from 3 months
      const mergedEvents = allEvents.flat();
      console.log('📅 Total events loaded:', mergedEvents.length);
      
      setEvents(mergedEvents);
    } catch (e) {
      console.log('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  };

  const transformEventsForCalendar = (events: any[], viewDate: Date): BigCalendarEvent[] => {
    const result: BigCalendarEvent[] = [];
    const currentMonth = dayjs(viewDate).month();
    const currentYear = dayjs(viewDate).year();
    const startOfMonth = dayjs(viewDate).startOf('month');
    
    events.forEach(e => {
      if (e.type === 'weekly' && e.dayOfWeek !== undefined) {
        // Map 1=Monday..7=Sunday to JS days 0=Sunday..6=Saturday
        const jsDay = e.dayOfWeek === 7 ? 0 : e.dayOfWeek;
        
        // Generate for -1 to 5 weeks from the start of the month
        for (let weekOffset = -1; weekOffset <= 5; weekOffset++) {
          const targetDate = startOfMonth.add(weekOffset, 'week').startOf('week').add(jsDay, 'day');
          const dateStr = targetDate.format('YYYY-MM-DD');
          
          result.push({
            title: e.title,
            start: dayjs(`${dateStr}T${e.startTime}`).toDate(),
            end: dayjs(`${dateStr}T${e.endTime}`).toDate(),
            color: e.colorHex || '#3B82F6',
            originalEvent: e,
          });
        }
      } else if (e.type === 'oneshot' && e.fullDate) {
        const eventDate = dayjs(e.fullDate);
        const eventMonth = eventDate.month();
        const eventYear = eventDate.year();
        
        // Only show events that are within ±1 month of current view
        // This prevents showing far-away events but still shows adjacent months
        const monthDiff = Math.abs((eventYear - currentYear) * 12 + (eventMonth - currentMonth));
        
        if (monthDiff <= 1) {
          const dateStr = eventDate.format('YYYY-MM-DD');
          result.push({
            title: e.title,
            start: dayjs(`${dateStr}T${e.startTime}`).toDate(),
            end: dayjs(`${dateStr}T${e.endTime}`).toDate(),
            color: e.colorHex || '#3B82F6',
            originalEvent: e,
          });
        }
      }
    });
    
    console.log('🎯 Transformed events for calendar:', result.length);
    return result;
  };

  const bigCalendarEvents = transformEventsForCalendar(events, currentDate);

  const handleEventPress = (event: BigCalendarEvent) => {
    if (event.originalEvent) {
      setSelectedEventForShare(event.originalEvent);
      setShareModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Lịch của tôi</Text>
            <Text style={styles.headerSubtitle}>
              {dayjs(currentDate).format('MMMM YYYY')} • {mode === 'week' ? 'Tuần' : 'Tháng'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={styles.modeBtn} 
              onPress={() => setMode(mode === 'week' ? 'month' : 'week')}
            >
              <Text style={styles.modeBtnText}>{mode === 'week' ? 'Tháng' : 'Tuần'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
              <Ionicons name="search-outline" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          {loading && events.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : (
            <Calendar
              events={bigCalendarEvents}
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
              onPressEvent={(event) => handleEventPress(event)}
              swipeEnabled={true}
              eventCellStyle={(event: BigCalendarEvent) => ({
                backgroundColor: event.color || '#3B82F6',
                borderRadius: 4,
              })}
            />
          )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <CreateEventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={loadEventsForThreeMonths}
        defaultDate={dayjs(currentDate).format('YYYY-MM-DD')}
      />
      <ShareEventModal
        visible={shareModalVisible}
        eventId={selectedEventForShare?.originalEventId || selectedEventForShare?._id}
        eventTitle={selectedEventForShare?.title || ''}
        currentSharedRooms={selectedEventForShare?.sharedWithRooms || []}
        onClose={() => setShareModalVisible(false)}
        onSuccess={loadEventsForThreeMonths}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFFFFF' 
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' },
  searchBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#F8FAFC', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modeBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  calendarContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  fab: { 
    position: 'absolute', 
    bottom: Platform.OS === 'ios' ? 120 : 110, 
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#3B82F6', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#3B82F6', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 12, 
    elevation: 8 
  },
  eventTitleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  eventTimeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  }
});