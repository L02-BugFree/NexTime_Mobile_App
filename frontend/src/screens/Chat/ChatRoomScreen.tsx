import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { getRoomMessages, sendMessage } from '../../services/roomService';
import { Message } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { PollCard } from '../../components/chat/PollCard';
import { ChecklistCard } from '../../components/chat/ChecklistCard';
import { getMe } from '../../services/userService';
import { User } from '../../types';

type Route = RouteProp<RootStackParamList, 'ChatRoom'>;

interface ExtendedMessage extends Message {
  uiType?: 'text' | 'poll' | 'checklist';
  pollData?: any;
  checklistData?: any;
}

export const ChatRoomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { roomId = '', roomName = 'Cuộc trò chuyện' } = route.params || {};
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const listRef = useRef<FlatList>(null);

  const loadData = async () => {
    if (!roomId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      let userData = null;
      let data: Message[] = [];
      
      try {
        userData = await getMe();
      } catch (e) {
        console.log('Error fetching user', e);
      }
      
      try {
        data = await getRoomMessages(roomId);
      } catch (e) {
        console.log('Error fetching messages', e);
      }
      
      setCurrentUser(userData);
      setMessages(data || []);
    } catch (err) { 
      console.log('Error loading messages', err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, [roomId]);

  const handleSend = async () => {
    if (!roomId) return;
    if (!text.trim()) return;
    const content = text.trim();
    setText('');
    try {
      setSending(true);
      const msg = await sendMessage(roomId, content);
      setMessages(prev => [...prev, { ...msg, uiType: 'text', isOwn: true, senderId: currentUser?.id || 'me' }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { } finally { setSending(false); }
  };

  const renderMessage = ({ item }: { item: ExtendedMessage }) => {
    const isMine = item.isOwn !== undefined ? item.isOwn : (currentUser && item.senderId === currentUser.id) || false;
    
    let customContent = null;
    if (item.uiType === 'poll' && item.pollData) {
      customContent = <PollCard {...item.pollData} />;
    } else if (item.uiType === 'checklist' && item.checklistData) {
      customContent = <ChecklistCard {...item.checklistData} />;
    }

    return (
      <View style={[s.msgRow, isMine && s.msgRowMine]}>
        {!isMine && (
          <Avatar size={32} name={item.senderName || 'U'} style={{ marginBottom: 4 }} />
        )}
        <View style={[s.msgContentArea, isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {!isMine && <Text style={s.msgSender}>{item.senderName || 'Người dùng'}</Text>}
          
          {customContent ? (
            customContent
          ) : (
            <View style={[s.msgBubble, isMine ? s.msgBubbleMine : s.msgBubbleOther]}>
              <Text style={[s.msgText, isMine && s.msgTextMine]}>{item.content}</Text>
            </View>
          )}

          <Text style={[s.msgTime, isMine && s.msgTimeMine]}>
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '16:50'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Avatar size={40} name={roomName} />
          <View>
            <Text style={s.hName} numberOfLines={1}>{roomName}</Text>
            <Text style={s.hStatus}>Đang hoạt động</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={s.hBtn} onPress={() => { if (roomId) navigation.navigate('GroupHeatmap', { roomId, roomName }) }} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={s.hBtn} activeOpacity={0.8}>
            <Ionicons name="ellipsis-vertical" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m, i) => m.id || String(i)}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <View style={s.emptyIconBox}>
                <Ionicons name="chatbubbles-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={s.emptyTxt}>Hãy bắt đầu cuộc trò chuyện!</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Floating Input Bar */}
      <View style={s.inputWrapper}>
        <View style={s.inputBar}>
          <TouchableOpacity style={s.inputActionBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={26} color="#64748B" />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            placeholder="Nhắn tin..."
            placeholderTextColor="#94A3B8"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          {text.trim() ? (
            <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending} activeOpacity={0.8}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.inputActionBtn} activeOpacity={0.8}>
              <Ionicons name="mic-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingTop: Platform.OS === 'ios' ? 52 : 30, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 4 },
  hName: { fontSize: 17, fontWeight: '700', color: '#0F172A', maxWidth: 180 },
  hStatus: { fontSize: 13, color: '#10B981', fontWeight: '600' },
  hBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 20, gap: 20, paddingBottom: 24 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgContentArea: { maxWidth: '82%' },
  msgBubble: { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24 },
  msgBubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  msgBubbleMine: { backgroundColor: '#3B82F6', borderBottomRightRadius: 6, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  msgSender: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginLeft: 6 },
  msgText: { fontSize: 15, color: '#0F172A', lineHeight: 22 },
  msgTextMine: { color: '#FFFFFF' },
  msgTime: { fontSize: 11, color: '#94A3B8', marginTop: 6, alignSelf: 'flex-start', marginLeft: 6, fontWeight: '500' },
  msgTimeMine: { alignSelf: 'flex-end', marginRight: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 100 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { fontSize: 15, color: '#64748B', textAlign: 'center', fontWeight: '500' },
  
  inputWrapper: { paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 8, backgroundColor: '#F8FAFC' },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  inputActionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderRadius: 22 },
  input: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: '#0F172A', maxHeight: 100, minHeight: 44 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginLeft: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
});
