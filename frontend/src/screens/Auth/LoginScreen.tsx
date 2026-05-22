import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { login } from '../../services/authService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Đăng nhập thất bại do người dùng chưa nhập dữ liệu');
      setErrorModal(true);
      return;
    }
    try {
      setIsLoading(true);
      await login({ email: email.trim(), password });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.');
      setErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0047CC', '#0066FF', '#3385FF']} style={styles.bg}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Landing')}>
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="time" size={24} color="#0066FF" />
            </View>
            <Text style={styles.logoText}>NexTime</Text>
          </View>

          {/* Bottom sheet card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardSubtitle}>Chào mừng trở lại 👋</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại hoặc email</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email hoặc số điện thoại"
                  placeholderTextColor="#CBD5E1"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mật khẩu</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#CBD5E1"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
              style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.btnPrimaryText}>Tiếp tục</Text>
              }
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.divider} />
            </View>

            {/* Google button */}
            <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.85}>
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={styles.btnGoogleText}>Tiếp tục với Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <Modal transparent visible={errorModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconBox}>
              <Ionicons name="alert-circle" size={40} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Đăng nhập thất bại</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <View style={styles.errorButtons}>
              <TouchableOpacity style={styles.errorBtnRetry} onPress={() => setErrorModal(false)}>
                <Text style={styles.errorBtnRetryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  backBtn: { position: 'absolute', top: 52, left: 20, zIndex: 10, padding: 8 },
  container: { flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 0 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 10, paddingTop: 80 },
  logoBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 48, elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 20,
  },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSubtitle: { fontSize: 15, color: '#64748B', marginBottom: 28 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotText: { fontSize: 13, fontWeight: '600', color: '#0066FF' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#0F172A', paddingVertical: 12 },
  btnPrimary: {
    backgroundColor: '#0066FF', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    elevation: 4, shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  btnGoogle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14,
    paddingVertical: 14, backgroundColor: '#FFFFFF',
  },
  btnGoogleText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 28, alignItems: 'center',
    width: '100%', maxWidth: 340, elevation: 20,
  },
  errorIconBox: { marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  errorMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  errorButtons: { width: '100%', gap: 10 },
  errorBtnRetry: {
    backgroundColor: '#0066FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  errorBtnRetryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
