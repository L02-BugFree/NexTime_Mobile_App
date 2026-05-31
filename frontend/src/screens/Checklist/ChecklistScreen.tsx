import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl, Alert,
  SafeAreaView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getChecklists, previewChecklist, confirmChecklist } from '../../services/checklistService';
import { Checklist } from '../../types';

export const ChecklistScreen: React.FC = () => {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<Checklist | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadData = async () => {
    try { setLoading(true); setChecklists(await getChecklists()); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handlePreview = async () => {
    if (!prompt.trim()) return;
    try {
      setPreviewing(true);
      const data = await previewChecklist(prompt.trim());
      setPreviewData(data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'AI không thể xử lý nội dung này');
    } finally { setPreviewing(false); }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      await confirmChecklist();
      setShowAIModal(false);
      setPrompt('');
      setPreviewData(null);
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể lưu checklist');
    } finally { setConfirming(false); }
  };

  const renderItem = ({ item }: { item: Checklist }) => {
    const total = item.items?.length || 0;
    const done = item.items?.filter(i => i.isDone).length || 0;
    const pct = total > 0 ? done / total : 0;
    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{total} task</Text>
          </View>
        </View>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${pct * 100}%` as any }]} />
        </View>
        <Text style={s.progressLabel}>{done}/{total} hoàn thành · {Math.round(pct * 100)}%</Text>
        {item.items?.slice(0, 3).map((task, i) => (
          <View key={i} style={s.taskRow}>
            <Ionicons
              name={task.isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={task.isDone ? '#10B981' : '#CBD5E1'}
            />
            <Text style={[s.taskText, task.isDone && s.taskDone]} numberOfLines={1}>{task.title}</Text>
          </View>
        ))}
        {total > 3 && <Text style={s.moreText}>+{total - 3} task khác</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.hTitle}>Checklist</Text>
          <TouchableOpacity style={s.aiBtn} onPress={() => setShowAIModal(true)} activeOpacity={0.8}>
            <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
            <Text style={s.aiBtnText}>AI Tạo mới</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={checklists}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#3B82F6" />}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <View style={s.emptyIconBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color="#94A3B8" />
                </View>
                <Text style={s.emptyTitle}>Chưa có checklist nào</Text>
                <Text style={s.emptySub}>Nhấn "AI Tạo mới" để AI phân tích hội thoại và tự động tạo checklist cho bạn!</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setShowAIModal(true)} activeOpacity={0.8}>
                  <Ionicons name="hardware-chip-outline" size={20} color="#FFFFFF" />
                  <Text style={s.emptyBtnText}>Dùng AI Tạo ngay</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />

        {/* AI Modal */}
        <Modal visible={showAIModal} animationType="slide" transparent>
          <View style={s.mOverlay}>
            <View style={s.mCard}>
              {/* Drag Handle */}
              <View style={s.dragHandleContainer}>
                <View style={s.dragHandle} />
              </View>

              <View style={s.mHeader}>
                <View style={s.mTitleRow}>
                  <View style={s.mIconWrapper}>
                    <Ionicons name="hardware-chip-outline" size={22} color="#8B5CF6" />
                  </View>
                  <Text style={s.mTitle}>Tạo Checklist AI</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowAIModal(false); setPreviewData(null); setPrompt(''); }} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={26} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {!previewData ? (
                <>
                  <Text style={s.mDesc}>Dán nội dung đoạn hội thoại nhóm hoặc mô tả kế hoạch. AI sẽ tự động trích xuất checklist cho bạn:</Text>
                  <View style={s.mTextareaWrapper}>
                    <TextInput
                      style={s.mTextarea}
                      placeholder="Ví dụ: 'Mình cần chuẩn bị slide cho buổi họp thứ 6, Linh lo phần thiết kế, Nam làm nội dung...'"
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={6}
                      value={prompt}
                      onChangeText={setPrompt}
                      textAlignVertical="top"
                    />
                  </View>
                  <TouchableOpacity style={s.mBtn} onPress={handlePreview} disabled={previewing} activeOpacity={0.85}>
                    {previewing ? <ActivityIndicator color="#FFFFFF" /> : <>
                      <Ionicons name="flash" size={18} color="#FFFFFF" />
                      <Text style={s.mBtnText}>Phân tích & Xem trước</Text>
                    </>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.previewTitle}>✅ AI đã đề xuất checklist:</Text>
                  <View style={s.previewCard}>
                    <Text style={s.previewChecklistTitle}>{previewData.title}</Text>
                    {previewData.items?.map((item, i) => (
                      <View key={i} style={s.previewTask}>
                        <Ionicons name="ellipse" size={12} color="#8B5CF6" style={{ marginRight: 6 }} />
                        <Text style={s.previewTaskText}>{item.title}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                    <TouchableOpacity style={[s.mBtnOutline, { flex: 1 }]} onPress={() => setPreviewData(null)} activeOpacity={0.8}>
                      <Text style={s.mBtnOutlineText}>Làm lại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.mBtn, { flex: 1, backgroundColor: '#3B82F6', shadowColor: '#3B82F6' }]} onPress={handleConfirm} disabled={confirming} activeOpacity={0.85}>
                      {confirming ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.mBtnText}>Lưu checklist</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  hTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, gap: 6, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  aiBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 16, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12 },
  badge: { backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  progressBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  taskText: { fontSize: 14, color: '#334155', flex: 1, fontWeight: '500' },
  taskDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  moreText: { fontSize: 13, color: '#3B82F6', fontWeight: '700', marginTop: 8 },
  
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 16 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  emptySub: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, gap: 8, marginTop: 12, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  
  mOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  mCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 48 : 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  mTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mIconWrapper: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  mTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  mDesc: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 },
  mTextareaWrapper: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  mTextarea: { padding: 16, fontSize: 15, color: '#0F172A', minHeight: 120 },
  mBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B5CF6', borderRadius: 16, paddingVertical: 16, gap: 8, shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4 },
  mBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  
  mBtnOutline: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, borderWidth: 1.5, borderColor: '#E2E8F0' },
  mBtnOutlineText: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  
  previewTitle: { fontSize: 15, color: '#0F172A', fontWeight: '700', marginBottom: 12 },
  previewCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  previewChecklistTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  previewTask: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  previewTaskText: { fontSize: 15, color: '#334155', flex: 1, lineHeight: 22, fontWeight: '500' },
});
