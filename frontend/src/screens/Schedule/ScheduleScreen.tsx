import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, Dimensions, Platform, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMonthlyCalendar, createWeeklyEvent, createOneshotEvent, updateEvent, deleteEvent } from '../../services/scheduleService';
import { CalendarEvent } from '../../types';

const { width } = Dimensions.get('window');
const DAYS = ['T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7', 'CN'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 5);
const CELL_HEIGHT = 64; // Increased cell height for better spacing
const TIME_COL = 60;

const getEventTop = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return ((h - 5) + m / 60) * CELL_HEIGHT;
};
const getEventHeight = (start: string, end: string) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(((eh - sh) + (em - sm) / 60) * CELL_HEIGHT, CELL_HEIGHT * 0.6);
};
const EVENT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

export const ScheduleScreen: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [addType, setAddType] = useState<'weekly' | 'oneshot'>('oneshot');
  const [form, setForm] = useState({ title: '', date: '', startTime: '09:00', endTime: '10:00', colorHex: EVENT_COLORS[0] });
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setSelectedEventId(null);
    setForm({ title: '', date: '', startTime: '09:00', endTime: '10:00', colorHex: EVENT_COLORS[0] });
    setShowAddModal(true);
  };

  const today = new Date();
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(today);
    const dow = today.getDay() || 7;
    d.setDate(today.getDate() - dow + 1 + i);
    return d.getDate();
  });

  const loadEvents = async () => {
    try { setLoading(true); setEvents(await getMonthlyCalendar()); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadEvents(); }, []);

  const todayEvents = events.filter(ev => {
    if (ev.isWeekly) return ev.dayOfWeek === selectedDay;
    if (ev.date) return new Date(ev.date).getDay() === (selectedDay === 7 ? 0 : selectedDay);
    return false;
  });

  const handleSave = async () => {
    if (!form.title || !form.startTime || !form.endTime) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ tiêu đề và thời gian'); return;
    }
    try {
      setSaving(true);
      if (selectedEventId) {
        await updateEvent(selectedEventId, {
          title: form.title,
          startTime: form.startTime,
          endTime: form.endTime,
          colorHex: form.colorHex,
          date: addType === 'oneshot' ? form.date : undefined,
          dayOfWeek: addType === 'weekly' ? selectedDay : undefined,
          type: addType === 'weekly' ? 'WeeklyEvent' : 'OneshotEvent',
        });
      } else {
        if (addType === 'weekly') await createWeeklyEvent({ title: form.title, dayOfWeek: selectedDay, startTime: form.startTime, endTime: form.endTime, colorHex: form.colorHex });
        else await createOneshotEvent({ title: form.title, date: form.date || today.toISOString().slice(0, 10), startTime: form.startTime, endTime: form.endTime, colorHex: form.colorHex });
      }
      setShowAddModal(false);
      loadEvents();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu sự kiện');
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    if (!selectedEventId) return;
    Alert.alert('Xóa sự kiện', 'Bạn có chắc muốn xóa sự kiện này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await deleteEvent(selectedEventId);
          setShowAddModal(false);
          loadEvents();
        } catch (e) {
          Alert.alert('Lỗi', 'Không thể xóa sự kiện');
        }
      }}
    ]);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.hBtn}><Ionicons name="menu" size={26} color="#1E293B" /></TouchableOpacity>
          <View style={s.headerTitleContainer}>
            <Text style={s.hSubtitle}>Lịch trình</Text>
            <Text style={s.hTitle}>Tháng {today.getMonth() + 1}, {today.getFullYear()}</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity style={s.hBtn}><Ionicons name="search" size={24} color="#1E293B" /></TouchableOpacity>
            <TouchableOpacity style={s.hBtn}>
              <Ionicons name="notifications-outline" size={24} color="#1E293B" />
              <View style={s.badge} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Days Strip */}
      <View style={s.dayStripContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayStrip}>
          {DAYS.map((d, i) => {
            const sel = i + 1 === selectedDay;
            const isToday = weekDates[i] === today.getDate();
            return (
              <TouchableOpacity key={i} style={[s.dayCell, sel && s.dayCellSel]} onPress={() => setSelectedDay(i + 1)}>
                <Text style={[s.dayLabel, sel && s.dayLabelSel]}>{d}</Text>
                <View style={[s.dayNum, sel && s.dayNumSel, isToday && !sel && s.dayNumToday]}>
                  <Text style={[s.dayNumTxt, sel && s.dayNumTxtSel]}>{weekDates[i]}</Text>
                </View>
                {sel && <View style={s.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content */}
      <View style={s.mainContent}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            <View style={s.timelineContainer}>
              {HOURS.map((h, idx) => (
                <View key={h} style={[s.hourRow, { top: idx * CELL_HEIGHT }]}>
                  <Text style={s.hourLabel}>{String(h).padStart(2, '0')}:00</Text>
                  <View style={s.hourLineWrapper}>
                    <View style={s.hourLine} />
                  </View>
                </View>
              ))}
              
              <View style={s.eventsContainer}>
                {todayEvents.map((ev, i) => {
                  if (!ev.startTime || !ev.endTime) return null;
                  const top = getEventTop(ev.startTime);
                  const height = getEventHeight(ev.startTime, ev.endTime);
                  const color = ev.colorHex || EVENT_COLORS[i % EVENT_COLORS.length];
                  return (
                    <TouchableOpacity 
                      key={ev._id || i} 
                      style={[s.evBlock, { top, height, backgroundColor: color + '1A', borderLeftColor: color }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedEventId(ev._id!);
                        setAddType(ev.isWeekly ? 'weekly' : 'oneshot');
                        setForm({
                          title: ev.title || '',
                          date: ev.date ? new Date(ev.date).toISOString().slice(0, 10) : today.toISOString().slice(0, 10),
                          startTime: ev.startTime || '09:00',
                          endTime: ev.endTime || '10:00',
                          colorHex: ev.colorHex || color
                        });
                        setShowAddModal(true);
                      }}
                    >
                      <Text style={[s.evTitle, { color }]} numberOfLines={1}>{ev.title}</Text>
                      <View style={s.evTimeRow}>
                        <Ionicons name="time-outline" size={12} color={color} style={{ opacity: 0.8 }} />
                        <Text style={[s.evTime, { color, opacity: 0.8 }]}>{ev.startTime} - {ev.endTime}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {todayEvents.length === 0 && (
                <View style={s.emptyBox}>
                  <View style={s.emptyIconBg}>
                    <Ionicons name="calendar-clear-outline" size={40} color="#94A3B8" />
                  </View>
                  <Text style={s.emptyTitle}>Lịch trống</Text>
                  <Text style={s.emptyTxt}>Không có sự kiện nào được lên lịch cho ngày này.</Text>
                  <TouchableOpacity style={s.emptyBtn} onPress={openAddModal}>
                    <Text style={s.emptyBtnTxt}>Thêm sự kiện mới</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={s.mOverlay}>
          <View style={s.mCard}>
            <View style={s.handleBar} />
            <View style={s.mHeader}>
              <Text style={s.mTitle}>{selectedEventId ? 'Sửa sự kiện' : 'Tạo sự kiện mới'}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Loại sự kiện</Text>
                <View style={s.typeRow}>
                  {(['oneshot', 'weekly'] as const).map(t => (
                    <TouchableOpacity key={t} style={[s.typeBtn, addType === t && s.typeBtnA]} onPress={() => setAddType(t)}>
                      <Ionicons name={t === 'oneshot' ? 'calendar-outline' : 'repeat'} size={18} color={addType === t ? '#FFFFFF' : '#64748B'} />
                      <Text style={[s.typeTxt, addType === t && s.typeTxtA]}>{t === 'oneshot' ? 'Một lần' : 'Hàng tuần'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Tiêu đề</Text>
                <View style={s.inputWrapper}>
                  <Ionicons name="text-outline" size={20} color="#94A3B8" style={s.inputIcon} />
                  <TextInput style={s.mInput} placeholder="Ví dụ: Họp nhóm..." placeholderTextColor="#94A3B8" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} />
                </View>
              </View>

              {addType === 'oneshot' && (
                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>Ngày diễn ra</Text>
                  <View style={s.inputWrapper}>
                    <Ionicons name="calendar-number-outline" size={20} color="#94A3B8" style={s.inputIcon} />
                    <TextInput style={s.mInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8" value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} />
                  </View>
                </View>
              )}

              <View style={s.timeRow}>
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={s.inputLabel}>Bắt đầu</Text>
                  <View style={s.inputWrapper}>
                    <Ionicons name="time-outline" size={20} color="#94A3B8" style={s.inputIcon} />
                    <TextInput style={s.mInput} placeholder="09:00" placeholderTextColor="#94A3B8" value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
                <View style={s.timeDivider} />
                <View style={[s.inputGroup, { flex: 1 }]}>
                  <Text style={s.inputLabel}>Kết thúc</Text>
                  <View style={s.inputWrapper}>
                    <Ionicons name="time-outline" size={20} color="#94A3B8" style={s.inputIcon} />
                    <TextInput style={s.mInput} placeholder="10:00" placeholderTextColor="#94A3B8" value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} keyboardType="numbers-and-punctuation" />
                  </View>
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>Màu sắc</Text>
                <View style={s.colorRow}>
                  {EVENT_COLORS.map(c => (
                    <TouchableOpacity 
                      key={c} 
                      style={[s.colorCircle, { backgroundColor: c }, form.colorHex === c && s.colorCircleSel]} 
                      onPress={() => setForm(f => ({ ...f, colorHex: c }))}
                    >
                      {form.colorHex === c && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={s.mFooter}>
              {selectedEventId && (
                <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.saveBtn, selectedEventId && { flex: 1, marginLeft: 12 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={s.saveTxt}>Lưu sự kiện</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 16, 
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4,
    zIndex: 10
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitleContainer: { alignItems: 'center' },
  hSubtitle: { fontSize: 13, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  hTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  hBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' },
  headerActions: { flexDirection: 'row', gap: 8 },
  badge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#F1F5F9' },
  
  dayStripContainer: { marginTop: 16 },
  dayStrip: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  dayCell: { width: 56, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  dayCellSel: { backgroundColor: '#1E293B', borderColor: '#1E293B', shadowColor: '#1E293B', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  dayLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  dayLabelSel: { color: '#94A3B8' },
  dayNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNumSel: { backgroundColor: '#3B82F6' },
  dayNumToday: { borderWidth: 1.5, borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  dayNumTxt: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  dayNumTxtSel: { color: '#FFFFFF' },
  activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3B82F6', position: 'absolute', bottom: 8 },
  
  mainContent: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 100 },
  timelineContainer: { minHeight: HOURS.length * CELL_HEIGHT, position: 'relative', marginTop: 8 },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', height: CELL_HEIGHT },
  hourLabel: { width: TIME_COL, fontSize: 11, color: '#94A3B8', fontWeight: '600', textAlign: 'center', paddingTop: 8 },
  hourLineWrapper: { flex: 1, height: CELL_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', borderStyle: 'dashed' },
  hourLine: { display: 'none' },
  eventsContainer: { position: 'absolute', left: TIME_COL, right: 16, top: 0, bottom: 0 },
  evBlock: { position: 'absolute', left: 0, right: 0, borderRadius: 12, borderLeftWidth: 4, paddingHorizontal: 12, paddingVertical: 8, overflow: 'hidden' },
  evTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  evTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evTime: { fontSize: 11, fontWeight: '600' },
  
  emptyBox: { position: 'absolute', top: CELL_HEIGHT * 3, left: 0, right: 0, alignItems: 'center', padding: 32 },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  emptyBtnTxt: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
  
  fab: { position: 'absolute', bottom: 32, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
  
  mOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  mCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, maxHeight: '90%' },
  handleBar: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  mTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  mInput: { flex: 1, paddingVertical: 16, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', paddingVertical: 14, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', gap: 8 },
  typeBtnA: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeTxt: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  typeTxtA: { color: '#FFFFFF' },
  
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeDivider: { width: 16 },
  
  colorRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  colorCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  colorCircleSel: { borderColor: '#E2E8F0', transform: [{ scale: 1.1 }] },
  
  mFooter: { flexDirection: 'row', paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  saveBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  deleteBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
});
