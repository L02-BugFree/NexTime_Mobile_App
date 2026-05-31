// ─── Auth & User Types ────────────────────────────────────────────────────────

export type Gender = 'Male' | 'Female' | 'Other' | 'NotSpecified';
export type Theme = 'light' | 'dark';
export type Language = 'vi' | 'en';
export type VisibilitySetting = 'everyone' | 'friends' | 'contacts';

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  friendCode: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  theme?: Theme;
  language?: Language;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  friendCode: string;
  avatarUrl?: string;
  language?: Language;
  theme?: Theme;
  birthdate?: string;
  gender?: Gender;
}

export interface AuthResponse {
  user: User;
  token: string; // From standard login response, or custom structure
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  gender?: Gender;
  birthdate?: string;
  theme?: Theme;
  language?: Language;
}

export interface UpdatePrivacyRequest {
  showBirthday?: boolean;
  isActiveStatus?: boolean;
  anonymousOnGroupCalendar?: boolean;
}

export interface UpdateVisibilityRequest {
  visibilitySetting: VisibilitySetting;
}

export interface FriendRequest {
  _id: string;
  requesterId: string;
  targetUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// ─── Schedule & Calendar Types ────────────────────────────────────────────────

export interface CreateWeeklyEventRequest {
  title: string;
  description?: string;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "10:00"
  dayOfWeek: number; // 1=Monday, 7=Sunday
  colorHex?: string;  // e.g., "#FF5733"
  tag?: string;
  remindBefore?: number;
}

export interface CreateOneshotEventRequest {
  title: string;
  description?: string;
  date: string;       // e.g., "2024-04-27"
  startTime: string;  // e.g., "09:00"
  endTime: string;    // e.g., "10:00"
  colorHex?: string;   // e.g., "#33FF57"
  tag?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  date?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  colorHex?: string;
  tag?: string;
  type?: string;
}

export interface CalendarEvent {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  date?: string; // For oneshot
  dayOfWeek?: number; // For weekly
  startTime: string;
  endTime: string;
  colorHex: string;
  tag: string;
  isWeekly: boolean;
  createdAt: string;
}

export interface HeatmapData {
  [key: string]: {
    busyCount: number;
    users: string[]; // List of user IDs or display names who are busy
  };
}

// ─── Checklist & AI-Prompt Types ──────────────────────────────────────────────

export interface ChecklistItem {
  _id: string;
  title: string;
  isDone: boolean;
  isChecked?: boolean;
  assignedTo?: string; // User ID
}

export interface Checklist {
  _id: string;
  title: string;
  items: ChecklistItem[];
  roomId?: string;
  createdAt: string;
}

export interface AIPreviewRequest {
  prompt: string;
}

// ─── Rooms & Messages Types ──────────────────────────────────────────────────

export type RoomType = 'SELF' | 'DIRECT' | 'GROUP';

export interface Room {
  _id: string;
  type: RoomType;
  ownerId: string;
  userA?: string;
  userB?: string;
  groupId?: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CreateRoomRequest {
  type: RoomType;
  ownerId: string;
  userA?: string;
  userB?: string;
  groupId?: string;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
  isOwn?: boolean;
}

export interface CreateMessageRequest {
  content: string;
}

// ─── Polls Types ─────────────────────────────────────────────────────────────

export interface PollOption {
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  votes: {
    userId: string;
    value: 'YES' | 'NO';
  }[];
}

export interface Poll {
  _id: string;
  roomId: string;
  createdBy: string;
  options: PollOption[];
  createdAt: string;
}

export interface CreatePollRequest {
  roomId: string;
  members: string[];
  options: {
    startTime: string;
    endTime: string;
  }[];
}

export interface VoteRequest {
  optionIndex: number;
  value: 'YES' | 'NO';
}

// ─── AI Assistant Types ───────────────────────────────────────────────────────

export interface AIAssistantRequest {
  prompt: string;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  limit: number;
  page: number;
  total: number;
}

// ─── Group Types ──────────────────────────────────────────────────────────────
export interface Group {
  _id: string;
  name: string;
  members: User[];
  createdAt: string;
}

export interface GroupHeatmapResponse {
  groupId: string;
  month: string;
  timeSlots: HeatmapSlot[];
}

export interface HeatmapSlot {
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:mm
  endTime: string;     // HH:mm
  busyCount: number;   // Số người bận trong khung giờ này
}

export interface RoomHeatmapResponse {
  roomId: string;
  month: string;
  timeSlots: HeatmapSlot[];
}