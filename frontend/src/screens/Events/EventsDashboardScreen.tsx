import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PollCard } from '../../components/chat/PollCard';
import { ChecklistCard } from '../../components/chat/ChecklistCard';
import { getChecklists } from '../../services/checklistService';
import { getPolls } from '../../services/pollService';
import { Checklist, Poll } from '../../types';

export const EventsDashboardScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');
  const [polls, setPolls] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedChecklists, fetchedPolls] = await Promise.all([
        getChecklists().catch(() => []),
        getPolls().catch(() => [])
      ]);
      setChecklists(fetchedChecklists);
      setPolls(fetchedPolls);
    } catch (e) {
      console.log('Error loading events data', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Sự kiện & Công cụ</Text>
            <Text style={styles.headerSubtitle}>Quản lý các hoạt động nhóm</Text>
          </View>
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list" size={18} color={viewMode === 'list' ? '#3B82F6' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, viewMode === 'week' && styles.toggleBtnActive]}
              onPress={() => setViewMode('week')}
            >
              <Ionicons name="calendar-outline" size={18} color={viewMode === 'week' ? '#3B82F6' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {viewMode === 'week' ? (
            <View style={styles.weekViewContainer}>
              <View style={styles.emptyWeekState}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>Chế độ xem tuần</Text>
                <Text style={styles.emptyText}>Tính năng xem lịch sự kiện dạng tuần đang được hoàn thiện và sẽ sớm ra mắt.</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Bình chọn đang mở */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bình chọn đang mở</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {polls.length > 0 ? polls.map((poll, index) => (
                    <View key={poll._id || poll.id || index.toString()} style={styles.cardWrapper}>
                      <View style={styles.groupBadge}>
                        <Ionicons name="people" size={14} color="#3B82F6" />
                        <Text style={styles.groupContext}>{poll.groupName || 'Nhóm chung'}</Text>
                      </View>
                      <PollCard 
                        question={poll.question || 'Bình chọn'}
                        options={(poll.options || []).map((opt: any, idx: number) => ({
                          _id: opt.id || idx.toString(),
                          text: opt.text || `${opt.startTime || ''} - ${opt.endTime || ''}`,
                          votes: Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0),
                        }))}
                        totalVotes={poll.totalVotes || (poll.options || []).reduce((acc: number, opt: any) => acc + (Array.isArray(opt.votes) ? opt.votes.length : (opt.votes || 0)), 0)}
                      />
                    </View>
                  )) : <Text style={styles.emptyListText}>Không có bình chọn nào đang mở.</Text>}
                </ScrollView>
              </View>

              {/* Checklist chung */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Checklist chung</Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {checklists.length > 0 ? checklists.map((checklist, index) => (
                    <View key={checklist._id || (checklist as any).id || index.toString()} style={styles.cardWrapper}>
                      <View style={styles.groupBadge}>
                        <Ionicons name="people" size={14} color="#10B981" />
                        <Text style={[styles.groupContext, { color: '#10B981' }]}>{checklist.roomId || 'Nhóm chung'}</Text>
                      </View>
                      <ChecklistCard 
                        title={checklist.title}
                        items={checklist.items as any}
                      />
                    </View>
                  )) : <Text style={styles.emptyListText}>Không có checklist chung.</Text>}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20, backgroundColor: '#F8FAFC',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: '500' },
  viewToggleContainer: {
    flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  toggleBtnActive: Platform.select({
    web: {
      backgroundColor: '#FFFFFF',
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' as any,
    },
    default: {
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }
  }),
  
  scrollContent: { paddingBottom: 100 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  horizontalScroll: { paddingHorizontal: 24, gap: 16 },
  cardWrapper: { gap: 8, width: 280 },
  groupBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  groupContext: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  
  weekViewContainer: { padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyWeekState: Platform.select({
    web: {
      backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%',
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.05)' as any,
    },
    default: {
      backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4
    }
  }),
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  emptyListText: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic', paddingVertical: 20 },
});
