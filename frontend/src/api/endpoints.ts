// ─── Authentication ───────────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  REGISTER: "/auth/register",
  LOGIN: "/auth/login",
  GOOGLE: "/auth/google",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  LOGOUT: "/auth/logout",
} as const;

// ─── User ──────────────────────────────────────────────────────────────────
export const USER_ENDPOINTS = {
  ME: "/users/me",
  UPDATE_PROFILE: "/users/profile",
  UPDATE_PRIVACY: "/users/privacy",
  UPDATE_VISIBILITY: "/users/visibility",
  GET_QR: "/users/qr",
  DELETE_ACCOUNT: "/users/account",
  SEARCH: "/users/search",
  FRIENDS_REQUEST: "/users/friends/request",
  FRIENDS_ACCEPT: "/users/friends/accept",
  FRIENDS_REMOVE: (friendId: string) => `/users/friends/${friendId}`,
  FRIENDS_LIST: "/users/friends",
  REQUESTS_LIST: "/users/friends/requests", //--------------------------------------
  BLOCKS_ADD: "/users/blocks",
  BLOCKS_LIST: "/users/blocks",
  BLOCKS_REMOVE: (targetUserId: string) => `/users/blocks/${targetUserId}`,
} as const;

// ─── Schedule ─────────────────────────────────────────────────────────────────
export const SCHEDULE_ENDPOINTS = {
  CREATE_WEEKLY: "/schedule/weekly",
  CREATE_ONESHOT: "/schedule/oneshot",
  GET_MONTHLY: "/schedule/monthly",
  GET_HEATMAP: (groupId: string) => `/schedule/heatmap/${groupId}`,
  UPDATE: (eventId: string) => `/schedule/${eventId}`,
  DELETE: (eventId: string) => `/schedule/${eventId}`,
} as const;

// ─── Group ──────────────────────────────────────────────────────────────────
export const GROUP_ENDPOINTS = {
  CREATE: "/group",
  GET: "/group",
  HEATMAP: (id: string) => `/group/heatmap/${id}`,
} as const;

// ─── Rooms ──────────────────────────────────────────────────────────────────
export const ROOM_ENDPOINTS = {
  CREATE: "/rooms",
  GET: "/rooms",
  GET_MESSAGES: (roomId: string) => `/rooms/${roomId}/messages`,
  SEND_MESSAGE: (roomId: string) => `/rooms/${roomId}/messages`,
  HEATMAP: (roomId: string) => `/rooms/${roomId}/heatmap`,
} as const;

// ─── Polls ──────────────────────────────────────────────────────────────────
export const POLL_ENDPOINTS = {
  CREATE: "/polls",
  GET_ALL: "/polls",
  VOTE: (pollId: string) => `/polls/${pollId}/vote`,
} as const;

// ─── Checklist / App ────────────────────────────────────────────────────────
export const APP_ENDPOINTS = {
  ROOT: "/",
} as const;

// ─── Checklists ─────────────────────────────────────────────────────────────
export const CHECKLIST_ENDPOINTS = {
  GET_ALL: "/checklists",
  PREVIEW: "/checklists/preview",
  CONFIRM: "/checklists/confirm",
} as const;
