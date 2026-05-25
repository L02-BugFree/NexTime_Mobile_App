import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getMe } from '../../services/authService';
import { logout } from '../../services/authService';
import { User } from '../../types';
import { ConfirmModal } from '../../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MENU_ITEMS = [
  { icon: 'calendar-outline' as const, label: 'Lập lịch thường xuyên', desc: 'Quản lý lịch trình cố định', color: '#3B82F6' },
  { icon: 'add-circle-outline' as const, label: 'Thêm sự kiện mới', desc: 'Tạo sự kiện một lần hoặc hàng tuần', color: '#10B981' },
  { icon: 'color-palette-outline' as const, label: 'Giao diện và ngôn ngữ', desc: 'Tùy chỉnh giao diện & ngôn ngữ', color: '#F59E0B' },
  { icon: 'shield-checkmark-outline' as const, label: 'Bảo mật', desc: 'Cài đặt quyền riêng tư & bảo mật', color: '#8B5CF6' },
  { icon: 'people-outline' as const, label: 'Bạn bè & Kết nối', desc: 'Quản lý danh sách bạn bè', color: '#EC4899' },
  { icon: 'qr-code-outline' as const, label: 'Mã QR cá nhân', desc: 'Chia sẻ QR để kết bạn nhanh', color: '#0EA5E9' },
];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    getMe().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      setShowLogoutModal(false);
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } finally {
      setLoggingOut(false);
    }
  };

  const initials = (name: string) =>
    (name || 'U').split(' ').slice(-2).map(w => w[0]?.toUpperCase()).join('');

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.hTitle}>Cài đặt và hồ sơ</Text>
          <TouchableOpacity style={s.hBtn} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Profile Card */}
          <View style={s.profileCard}>
            {loading ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                <View style={s.avatarBox}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials(user?.displayName || user?.email || 'U')}</Text>
                  </View>
                  <View style={s.onlineIndicator} />
                </View>
                <View style={s.profileInfo}>
                  <Text style={s.profileName}>{user?.displayName || 'Người dùng'}</Text>
                  <Text style={s.profileEmail}>{user?.email || ''}</Text>
                </View>
                <View style={s.profileActions}>
                  <TouchableOpacity style={s.editBtn} activeOpacity={0.8}>
                    <Ionicons name="pencil-outline" size={16} color="#3B82F6" />
                    <Text style={s.editBtnText}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.qrBtn} activeOpacity={0.8}>
                    <Ionicons name="qr-code-outline" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Menu Items */}
          <View style={s.menuSection}>
            {MENU_ITEMS.map((item, i) => (
              <TouchableOpacity 
                key={i} 
                style={s.menuItem} 
                activeOpacity={0.7}
                onPress={() => {
                  if (item.label === 'Bạn bè & Kết nối') {
                    navigation.navigate('Friends');
                  }
                }}
              >
                <View style={[s.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={s.menuInfo}>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  <Text style={s.menuDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <View style={s.logoutSection}>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} disabled={loggingOut} activeOpacity={0.8}>
              {loggingOut ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text style={s.logoutText}>Đăng xuất</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <ConfirmModal
        visible={showLogoutModal}
        title="Đăng xuất"
        message="Bạn chắc chắn muốn đăng xuất?"
        confirmText="Đăng xuất"
        cancelText="Huỷ"
        type="danger"
        loading={loggingOut}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  hTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  hBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  profileCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 24, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  avatarBox: { position: 'relative', alignSelf: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  onlineIndicator: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#FFFFFF', position: 'absolute', bottom: 2, right: 2 },
  profileInfo: { alignItems: 'center', marginBottom: 20 },
  profileName: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  profileActions: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#3B82F6', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },
  qrBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  menuSection: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 24, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC', gap: 16 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  menuDesc: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  logoutSection: { paddingHorizontal: 20, paddingBottom: 24 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});
