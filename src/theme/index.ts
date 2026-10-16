import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { useColorScheme, type TextStyle } from 'react-native';

// Passed to useFonts in the root layout. Keys double as fontFamily names:
// a custom font has one family per weight, so weight is chosen by family,
// never by fontWeight.
export const fontAssets = {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

// One family; hierarchy comes from size, weight and tighter tracking on the
// large sizes. Poppins runs wide, so sizes sit a step below the iOS ones.
export const typography = {
  largeTitle: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.9 },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30, letterSpacing: -0.5 },
  headline: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22, letterSpacing: -0.1 },
  callout: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  number: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.8 },
  display: { fontFamily: fonts.bold, fontSize: 44, lineHeight: 50, letterSpacing: -1.6 },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typography;

// A warm paper page with white cards on it, one turquoise accent, and
// greys with a touch of warmth so nothing reads as cold grey.
const light = {
  background: '#F6F4F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EEEBE6',
  surfacePressed: '#E6E2DC',
  text: '#1B1A19',
  textSecondary: '#6F6A63',
  textMuted: '#A8A39B',
  border: 'rgba(27, 26, 25, 0.08)',
  borderStrong: 'rgba(27, 26, 25, 0.14)',
  accent: '#14B8A6',
  accentPressed: '#0FA394',
  accentSoft: '#DDF4F1',
  // The turquoise light around the main button and lit avatars.
  glow: 'rgba(20, 184, 166, 0.32)',
  onAccent: '#FFFFFF',
  danger: '#E5484D',
  success: '#2F9E62',
  gold: '#E8B43A',
  silver: '#A9B1BB',
  bronze: '#C98A55',
  shadow: 'rgba(60, 40, 20, 0.08)',
  // Album slots still to collect: a grey cut-out with a white sticker edge.
  silhouette: '#D5D1CB',
  stickerEdge: '#FFFFFF',
  stickerShadow: 'rgba(60, 40, 20, 0.22)',
};

const dark: typeof light = {
  background: '#0F0E0D',
  surface: '#1B1A19',
  surfaceMuted: '#252321',
  surfacePressed: '#2E2B29',
  text: '#F5F2EE',
  textSecondary: '#ABA59D',
  textMuted: '#6E6963',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  accent: '#2FD8C6',
  accentPressed: '#22BFAF',
  accentSoft: '#163331',
  glow: 'rgba(47, 216, 198, 0.28)',
  onAccent: '#062724',
  danger: '#FF6369',
  success: '#4CC38A',
  gold: '#F0C24F',
  silver: '#B9C0C8',
  bronze: '#D69A66',
  shadow: 'rgba(0, 0, 0, 0.4)',
  silhouette: '#3A3734',
  stickerEdge: '#5A5652',
  stickerShadow: 'rgba(0, 0, 0, 0.6)',
};

export type Colors = typeof light;
export type ColorName = keyof Colors;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

// Side padding of every page.
export const PAGE_GUTTER = spacing.xl;
