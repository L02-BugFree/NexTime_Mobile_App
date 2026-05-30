import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFriendsList, searchUsers, sendFriendRequest, removeFriend } from '../../services/userService';
import { User } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { colors } from '../../theme/colors';

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tab, setTab] = useState<'friends' | 'search'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'friends') {
      loadFriends();
    }
  }, [tab]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      const data = await searchUsers(searchQuery.trim());
      setSearchResults(data || []);
      console.log('Search results:', data);
    } catch (e) {
      console.log('Error searching users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể gửi lời mời');
    }
  };

  const handleRemoveFriend = (userId: string, name: string) => {
    Alert.alert('Xóa bạn bè', `Bạn có chắc muốn xóa ${name} khỏi danh sách bạn bè?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await removeFriend(userId);
            loadFriends();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa bạn bè');
          }
        } 
      }
    ]);
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={s.userItem}>
      <Avatar size={50} name={item.displayName || item.email || 'U'} />
      <View style={s.userInfo}>
        <Text style={s.userName}>{item.displayName || 'Người dùng'}</Text>
        <Text style={s.userEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity style={s.actionBtnDanger} onPress={() => handleRemoveFriend(item._id, item.displayName || 'Người dùng')}>
        <Ionicons name="person-remove" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  const renderSearchItem = ({ item }: { item: User }) => {
    const isFriend = friends.some(f => f._id === item._id);
    return (
      <View style={s.userItem}>
        <Avatar size={50} name={item.displayName || item.email || 'U'} />
        <View style={s.userInfo}>
          <Text style={s.userName}>{item.displayName || 'Người dùng'}</Text>
          <Text style={s.userEmail}>{item.email}</Text>
        </View>
        {!isFriend ? (
          <TouchableOpacity style={s.actionBtnPrimary} onPress={() => handleAddFriend(item._id)}>
            <Ionicons name="person-add" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={s.actionBtnDisabled}>
            <Ionicons name="checkmark" size={18} color="#94A3B8" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Bạn bè & Kết nối</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'friends' && s.activeTab]} onPress={() => setTab('friends')}>
            <Text style={[s.tabText, tab === 'friends' && s.activeTabText]}>Bạn bè ({friends.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'search' && s.activeTab]} onPress={() => setTab('search')}>
            <Text style={[s.tabText, tab === 'search' && s.activeTabText]}>Tìm kiếm</Text>
          </TouchableOpacity>
        </View>

        {tab === 'search' && (
          <View style={s.searchBarContainer}>
            <View style={s.searchBar}>
              <Ionicons name="search" size={20} color="#94A3B8" style={s.searchIcon} />
              <TextInput
                style={s.searchInput}
                placeholder="Tìm bạn bè qua email hoặc tên..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
          </View>
        )}

        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : tab === 'friends' ? (
          <FlatList
            data={friends}
            keyExtractor={item => item._id}
            renderItem={renderFriendItem}
            contentContainerStyle={s.listContent}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                <Text style={s.emptyText}>Bạn chưa có bạn bè nào.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item._id}
            renderItem={renderSearchItem}
            contentContainerStyle={s.listContent}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                <Text style={s.emptyText}>Nhập tên hoặc email để tìm kiếm.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#3B82F6' },
  searchBarContainer: { padding: 20, backgroundColor: '#FFFFFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  listContent: { padding: 20, gap: 16 },
  userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  userEmail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  actionBtnPrimary: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  actionBtnDanger: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  actionBtnDisabled: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#94A3B8' },
});
