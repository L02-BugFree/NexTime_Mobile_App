import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFriendsList } from '../../services/userService';
import { createGroup } from '../../services/groupService';
import { createRoom } from '../../services/roomService';
import { User } from '../../types';
import { Avatar } from '../../components/ui/Avatar';

interface CreateChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateChatModal: React.FC<CreateChatModalProps> = ({ visible, onClose, onSuccess }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setGroupName('');
      setSelectedIds([]);
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const data = await getFriendsList();
      setFriends(data || []);
    } catch (e) {
      console.log('Error loading friends', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    try {
      setSubmitting(true);
      // Create Group first
      const group = await createGroup({ name: groupName.trim(), members: selectedIds });
      // Create Room tied to the group
      await createRoom({ type: 'GROUP', groupId: group._id || group.id } as any);
      
      Alert.alert('Thành công', 'Tạo nhóm chat thành công!');
      onSuccess();
      onClose();
    } catch (e: any) {
      console.log(e);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFriend = ({ item }: { item: User }) => {
    const isSelected = selectedIds.includes(item._id);
    return (
      <TouchableOpacity style={s.friendItem} onPress={() => toggleSelect(item._id)} activeOpacity={0.7}>
        <Avatar size={44} name={item.displayName || item.email || 'U'} />
        <View style={s.friendInfo}>
          <Text style={s.friendName}>{item.displayName || 'Người dùng'}</Text>
          <Text style={s.friendEmail}>{item.email}</Text>
        </View>
        <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>Hủy</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Tạo nhóm mới</Text>
          <TouchableOpacity onPress={handleCreate} disabled={submitting || selectedIds.length === 0}>
            <Text style={[s.createText, (submitting || selectedIds.length === 0) && { color: '#94A3B8' }]}>
              Tạo
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.container}>
          <View style={s.inputContainer}>
            <Text style={s.label}>Tên nhóm</Text>
            <TextInput
              style={s.input}
              placeholder="Nhập tên nhóm..."
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>

          <Text style={s.sectionTitle}>Chọn thành viên ({selectedIds.length} đã chọn)</Text>
          
          {loading ? (
            <View style={s.center}>
              <ActivityIndicator color="#3B82F6" />
            </View>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={item => item._id}
              renderItem={renderFriend}
              contentContainerStyle={s.list}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={s.emptyText}>Bạn chưa có bạn bè nào.</Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 16, color: '#64748B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  createText: { fontSize: 16, fontWeight: '700', color: '#3B82F6' },
  container: { flex: 1, padding: 20 },
  inputContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  list: { paddingBottom: 40 },
  friendItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  friendEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
});
