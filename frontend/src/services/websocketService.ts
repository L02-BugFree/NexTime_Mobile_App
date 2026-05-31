import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/env';
import { getToken } from '../utils/tokenStorage';

type MessageHandler = (message: any) => void;
type EventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private isConnecting = false;

  async connect(roomId: string) {
    if (this.socket?.connected && this.roomId === roomId) {
      console.log('Already connected to room:', roomId);
      return;
    }

    if (this.isConnecting) {
      console.log('Connection in progress, waiting...');
      return;
    }

    // Clear handlers cũ trước khi disconnect
    this.eventHandlers.clear();
    this.disconnect();

    this.isConnecting = true;
    this.disconnect();

    try {
      const token = await getToken();
      if (!token) {
        console.error('No token found');
        this.isConnecting = false;
        return;
      }

      this.roomId = roomId;
      
      // Connect to WebSocket server
      this.socket = io(`${API_BASE_URL}chat`, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupEventListeners();
      
      // Join room after connection
      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.joinRoom(roomId);
        this.isConnecting = false;
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.isConnecting = false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('new-message', (message) => {
      console.log('📨 New message received:', message);
      this.emit('new_message', message);
    });

    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data);
      this.emit('user_joined', data);
    });

    this.socket.on('user-left', (data) => {
      console.log('User left:', data);
      this.emit('user_left', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('room-info', (data) => {
      console.log('Room info:', data);
      this.emit('room_info', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  private joinRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-room', { roomId });
      console.log('Joined room:', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-room', { roomId });
      console.log('Left room:', roomId);
    }
  }

  sendMessage(content: string) {
    if (this.socket && this.socket.connected && this.roomId) {
      this.socket.emit('send-message', {
        roomId: this.roomId,
        content,
      });
      return true;
    }
    console.warn('Cannot send message: WebSocket not connected');
    return false;
  }

  sendTyping(isTyping: boolean) {
    if (this.socket && this.socket.connected && this.roomId) {
      this.socket.emit('typing', {
        roomId: this.roomId,
        isTyping,
      });
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    this.eventHandlers.get(event)?.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.roomId) {
        this.leaveRoom(this.roomId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
    // this.eventHandlers.clear();
    this.isConnecting = false;
    console.log('WebSocket disconnected');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();