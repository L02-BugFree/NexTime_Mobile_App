import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { createOneshotEvent, createWeeklyEvent } from '../../services/scheduleService';

const PRESET_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const DAYS_OF_WEEK = [
  { label: 'T2', value: 1 },
  { label: 'T3', value: 2 },
  { label: 'T4', value: 3 },
  { label: 'T5', value: 4 },
  { label: 'T6', value: 5 },
  { label: 'T7', value: 6 },
  { label: 'CN', value: 7 },
];

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);
  const [isWeekly, setIsWeekly] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề sự kiện');
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ giờ bắt đầu và kết thúc');
      return;
    }

    const normalizeTime = (time: string): string => {
      const parts = time.split(':');
      const hour = parts[0].padStart(2, '0');
      const minute = (parts[1] || '00').padStart(2, '0');
      return `${hour}:${minute}`;
    };

    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    
    try {
      setLoading(true);
      if (isWeekly) {
        await createWeeklyEvent({
          title: title.trim(),
          description: desc.trim() || undefined,
          startTime: normalizedStartTime,  // ✅ Dùng thời gian đã chuẩn hóa
          endTime: normalizedEndTime,      // ✅ Dùng thời gian đã chuẩn hóa
          dayOfWeek,
          colorHex,
          tag: 'default',
        });
      } else {
        await createOneshotEvent({
          title: title.trim(),
          description: desc.trim() || undefined,
          date,
          startTime: normalizedStartTime,  // ✅ Dùng thời gian đã chuẩn hóa
          endTime: normalizedEndTime,      // ✅ Dùng thời gian đã chuẩn hóa
          colorHex,
          tag: 'default',
        });
      }
      
      Alert.alert('Thành công', 'Đã thêm sự kiện thành công!');
      onSuccess();
      handleClose();
    } catch (e: any) {
      console.log(e);
      Alert.alert('Thất bại', e?.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDesc('');
    setIsWeekly(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Handle */}
          <View style={s.dragHandleContainer}>
            <View style={s.dragHandle} />
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Thêm sự kiện mới</Text>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close-circle" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.form} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            {/* Title */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Tiêu đề sự kiện</Text>
              <View style={s.inputBox}>
                <Ionicons name="text-outline" size={20} color="#64748B" style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="Ví dụ: Họp nhóm dự án"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Description */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Mô tả (Không bắt buộc)</Text>
              <View style={[s.inputBox, s.textAreaBox]}>
                <Ionicons name="document-text-outline" size={20} color="#64748B" style={[s.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[s.input, s.textArea]}
                  placeholder="Nhập chi tiết về buổi họp, địa điểm..."
                  placeholderTextColor="#94A3B8"
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Toggle Is Weekly */}
            <View style={s.switchGroup}>
              <View style={s.switchTextCol}>
                <Text style={s.switchLabel}>Lặp lại hàng tuần</Text>
                <Text style={s.switchSub}>Lịch cố định lặp lại mỗi tuần</Text>
              </View>
              <Switch
                value={isWeekly}
                onValueChange={setIsWeekly}
                trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            </View>

            {/* Date Picker or Day of Week */}
            {isWeekly ? (
              <View style={s.inputGroup}>
                <Text style={s.label}>Chọn ngày trong tuần</Text>
                <View style={s.daysRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isSelected = dayOfWeek === d.value;
                    return (
                      <TouchableOpacity
                        key={d.value}
                        style={[s.dayBtn, isSelected && s.selectedDayBtn]}
                        onPress={() => setDayOfWeek(d.value)}
                      >
                        <Text style={[s.dayBtnText, isSelected && s.selectedDayBtnText]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={s.inputGroup}>
                <Text style={s.label}>Ngày diễn ra</Text>
                <View style={s.inputBox}>
                  <Ionicons name="calendar-outline" size={20} color="#64748B" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={date}
                    onChangeText={setDate}
                  />
                </View>
              </View>
            )}

            {/* Time Slots */}
            <View style={s.timeRow}>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={s.label}>Giờ bắt đầu</Text>
                <View style={s.inputBox}>
                  <Ionicons name="time-outline" size={20} color="#64748B" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="09:00"
                    placeholderTextColor="#94A3B8"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
              </View>
              <View style={[s.inputGroup, { flex: 1 }]}>
                <Text style={s.label}>Giờ kết thúc</Text>
                <View style={s.inputBox}>
                  <Ionicons name="time-outline" size={20} color="#64748B" style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="10:00"
                    placeholderTextColor="#94A3B8"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>
            </View>

            {/* Color Palette */}
            <View style={s.inputGroup}>
              <Text style={s.label}>Nhãn màu hiển thị</Text>
              <View style={s.colorsRow}>
                {PRESET_COLORS.map((c) => {
                  const isSelected = colorHex === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[s.colorCircle, { backgroundColor: c }, isSelected && s.selectedColorCircle]}
                      onPress={() => setColorHex(c)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={s.submitBtn} onPress={handleSave} disabled={loading} activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.submitBtnText}>Thêm sự kiện</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '88%', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.15, shadowRadius: 20 },
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 4 },
  form: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151' },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  textAreaBox: { alignItems: 'flex-start' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  switchGroup: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  switchTextCol: { flex: 1 },
  switchLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  switchSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  selectedDayBtn: { backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  dayBtnText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  selectedDayBtnText: { color: '#FFFFFF' },
  timeRow: { flexDirection: 'row', gap: 16 },
  colorsRow: { flexDirection: 'row', gap: 16 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedColorCircle: { borderWidth: 3, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
