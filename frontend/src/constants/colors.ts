// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary palette (Figma #0066FF)
  primary: '#0066FF',
  primaryLight: '#4D94FF',
  primaryDark: '#004CCC',

  // Heatmap palette (Lavender -> Deep Purple)
  heatmap: {
    level1: '#E6F0FF', // Very light / low density
    level2: '#B3D1FF',
    level3: '#80B2FF',
    level4: '#4D94FF',
    level5: '#0066FF', // High density
  },

  // Secondary palette
  secondary: '#FF6584',
  secondaryLight: '#FF9AAF',
  secondaryDark: '#CC3359',

  // Accent
  accent: '#43E97B',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F6FA',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#1A1D2E',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',

  // Feedback
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Borders & Dividers
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Dark mode surfaces
  dark: {
    background: '#0F0F1A',
    surface: '#1A1B2E',
    card: '#252640',
    border: '#2D2E4A',
  },
} as const;
