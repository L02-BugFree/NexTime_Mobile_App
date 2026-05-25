import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getRooms } from '../../services/roomService';
import { Room } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { CreateChatModal } from './CreateChatModal';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setRooms(await getRooms());
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadRooms(); }, []);

  const getFirstName = (name?: string) => (name || 'User').split(' ')[0];

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.hTitle}>Trò chuyện</Text>
          <View style={s.hActions}>
            <TouchableOpacity style={s.hBtn} activeOpacity={0.8}>
              <Ionicons name="search-outline" size={22} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity style={s.hBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stories row */}
        {rooms.length > 0 && (
          <View style={s.storiesBox}>
            <FlatList
              data={rooms.slice(0, 8)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(r, index) => r.id || String(index)}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 20 }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={s.storyItem}
                  onPress={() => navigation.navigate('ChatRoom', { roomId: item.id || '', roomName: item.name || 'Chat' })}
                  activeOpacity={0.8}
                >
                  <View style={s.storyAvatarWrapper}>
                    <Avatar size={60} name={item.name || 'U'} />
                  </View>
                  <Text style={s.storyName} numberOfLines={1}>{getFirstName(item.name)}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Conversations list */}
        <FlatList
          data={rooms}
          keyExtractor={(r, index) => r.id || String(index)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRooms} tintColor="#3B82F6" />}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={s.roomItem}
              onPress={() => navigation.navigate('ChatRoom', { roomId: item.id || '', roomName: item.name || 'Chat' })}
              activeOpacity={0.7}
            >
              <Avatar size={56} name={item.name || 'U'} style={{ marginRight: 16 }} />
              <View style={s.roomInfo}>
                <View style={s.roomInfoTop}>
                  <Text style={s.roomName} numberOfLines={1}>{item.name || 'Cuộc trò chuyện'}</Text>
                  <Text style={s.roomTime}>vừa xong</Text>
                </View>
                <View style={s.roomInfoBottom}>
                  <Text style={s.roomLast} numberOfLines={1}>
                    {item.type === 'GROUP' ? 'Nhóm · Nhấn để mở chat' : 'Nhấn để mở chat'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !loading ? (
              <View style={s.empty}>
                <View style={s.emptyIconBox}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#94A3B8" />
                </View>
                <Text style={s.emptyTitle}>Chưa có cuộc hội thoại nào</Text>
                <Text style={s.emptySubtitle}>Bắt đầu chat với bạn bè hoặc tạo nhóm mới để cùng nhau sắp xếp công việc.</Text>
                <TouchableOpacity style={s.btnNewChat} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                  <Text style={s.btnNewChatText}>Tạo nhóm mới</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>
      <CreateChatModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onSuccess={() => loadRooms()} 
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, backgroundColor: '#FFFFFF',
  },
  hTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  hActions: { flexDirection: 'row', gap: 12 },
  hBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  storiesBox: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  storyItem: { alignItems: 'center', gap: 8, width: 68 },
  storyAvatarWrapper: {
    padding: 3, borderRadius: 36, borderWidth: 2, borderColor: '#3B82F6',
  },
  storyName: { fontSize: 13, fontWeight: '600', color: '#475569', width: 68, textAlign: 'center' },
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  roomInfo: { flex: 1 },
  roomInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  roomName: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12 },
  roomTime: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  roomInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roomLast: { fontSize: 14, color: '#64748B', flex: 1, marginRight: 12 },
  unreadBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center', justifyContent: 'center' },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16, paddingHorizontal: 40 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },
  btnNewChat: { marginTop: 12, backgroundColor: '#EFF6FF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  btnNewChatText: { color: '#3B82F6', fontWeight: '700', fontSize: 15 },
});
