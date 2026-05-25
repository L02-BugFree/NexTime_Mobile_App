import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

const slides = [
  {
    icon: 'calendar' as const,
    title: 'Quản lý thời gian thông minh',
    subtitle: 'Sắp xếp lịch trình cá nhân và nhóm một cách tự động và thông minh.',
  },
  {
    icon: 'hardware-chip' as const,
    title: 'AI tự động trích xuất',
    subtitle: 'Tạo checklist và tác vụ từ đoạn hội thoại\nchỉ với một thao tác.',
  },
];

export const LandingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [lang, setLang] = useState<'vi' | 'en'>('vi');

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveSlide(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0F172A', '#1E3A8A', '#3B82F6']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="time" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.logoText}>NexTime</Text>
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slideScroll}
        >
          {slides.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <View style={styles.slideIconBox}>
                <Ionicons name={slide.icon} size={70} color="#FFFFFF" />
              </View>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeSlide ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnLogin}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnLoginText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnRegister}
            onPress={() => navigation.navigate('Register' as any)} // Will add to navigator later
            activeOpacity={0.85}
          >
            <Text style={styles.btnRegisterText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.langSwitch}>
            <TouchableOpacity onPress={() => setLang('vi')}>
              <Text style={[styles.langText, lang === 'vi' && styles.langActive]}>TIẾNG VIỆT</Text>
            </TouchableOpacity>
            <Text style={styles.langDivider}> / </Text>
            <TouchableOpacity onPress={() => setLang('en')}>
              <Text style={[styles.langText, lang === 'en' && styles.langActive]}>ENGLISH</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  gradient: { flex: 1, alignItems: 'center' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 48, marginBottom: 20, gap: 12 },
  logoBox: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  slideScroll: { flex: 1, flexGrow: 0, height: 320 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  slideIconBox: {
    width: 150, height: 150, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20
  },
  slideTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  slideSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 28, backgroundColor: '#FFFFFF', shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 5 },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  buttons: { width: '100%', paddingHorizontal: 28, gap: 16, marginBottom: 40 },
  btnLogin: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  btnLoginText: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
  btnRegister: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  btnRegisterText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  footer: { paddingBottom: 32, alignItems: 'center', gap: 12 },
  langSwitch: { flexDirection: 'row', alignItems: 'center' },
  langText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  langActive: { color: '#FFFFFF', textDecorationLine: 'none' },
  langDivider: { color: 'rgba(255,255,255,0.3)', marginHorizontal: 8 },
});
