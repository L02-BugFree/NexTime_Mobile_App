// src/components/calendar/ShareEventModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, ActivityIndicator, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRooms } from '../../services/roomService';
import { shareEventToRooms, unshareEventFromRoom } from '../../services/scheduleService';
import { Room } from '../../types';
import { Avatar } from '../ui/Avatar';

interface ShareEventModalProps {
  visible: boolean;
  eventId: string;
  eventTitle: string;
  currentSharedRooms?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareEventModal: React.FC<ShareEventModalProps> = ({
  visible,
  eventId,
  eventTitle,
  currentSharedRooms = [],
  onClose,
  onSuccess,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sharedRoomIds, setSharedRoomIds] = useState<string[]>(currentSharedRooms);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadRooms();
      setSharedRoomIds(currentSharedRooms);
    }
  }, [visible, currentSharedRooms]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms();
      setRooms(data.filter(r => r.type === 'GROUP' || r.type === 'DIRECT'));
    } catch (e) {
      console.log('Error loading rooms:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (roomId: string, isShared: boolean) => {
    try {
      setSubmitting(true);
      if (isShared) {
        await unshareEventFromRoom(eventId, roomId);
        setSharedRoomIds(prev => prev.filter(id => id !== roomId));
      } else {
        await shareEventToRooms(eventId, [roomId]);
        setSharedRoomIds(prev => [...prev, roomId]);
      }
      onSuccess();
    } catch (e: any) {
      console.log('Error sharing event:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const isShared = sharedRoomIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.roomItem}
        onPress={() => handleShare(item.id, isShared)}
        disabled={submitting}
        activeOpacity={0.7}
      >
        <Avatar size={48} name={item.name || 'Room'} />
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{item.name}</Text>
          <Text style={styles.roomType}>
            {item.type === 'GROUP' ? 'Nhóm' : 'Trò chuyện riêng'}
          </Text>
        </View>
        {isShared ? (
          <View style={styles.sharedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        ) : (
          <Ionicons name="share-outline" size={24} color="#3B82F6" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chia sẻ sự kiện</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.eventInfo}>
            <Text style={styles.eventLabel}>Sự kiện:</Text>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
          </View>

          <Text style={styles.sectionTitle}>Chọn phòng để chia sẻ</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          ) : (
            <FlatList
              data={rooms}
              keyExtractor={item => item.id}
              renderItem={renderRoom}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>Bạn chưa có phòng chat nào</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', overflow: 'hidden' },
  dragHandleContainer: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  closeBtn: { padding: 4 },
  eventInfo: { padding: 20, backgroundColor: '#F8FAFC', marginHorizontal: 16, marginVertical: 12, borderRadius: 16 },
  eventLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  eventTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  roomItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  roomInfo: { flex: 1, marginLeft: 12 },
  roomName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  roomType: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sharedBadge: { width: 40, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#94A3B8', fontSize: 14 },
});