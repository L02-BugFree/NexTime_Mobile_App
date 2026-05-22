// ─── Store Placeholder ────────────────────────────────────────────────────────
// Thư mục này dành cho State Management (Zustand/Redux Toolkit).
// 
// Cấu trúc đề xuất với Zustand:
//
// store/
// ├── authStore.ts       → Lưu user, token, isAuthenticated
// ├── scheduleStore.ts   → Cache danh sách lịch trình
// └── index.ts           → Export tất cả stores
//
// Ví dụ với Zustand:
// import { create } from 'zustand';
//
// interface AuthStore {
//   user: User | null;
//   setUser: (user: User | null) => void;
// }
//
// export const useAuthStore = create<AuthStore>((set) => ({
//   user: null,
//   setUser: (user) => set({ user }),
// }));

export {};
