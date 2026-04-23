import { Dimensions } from 'react-native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

export const screen = { width: SCREEN_W, height: SCREEN_H }

// ── Palette ────────────────────────────────────────────────
export const colors = {
  // Brand
  primary:       '#2563EB',
  primaryLight:  '#EFF6FF',
  primaryDark:   '#1D4ED8',

  // Backgrounds
  bg:            '#F1F5F9',
  bgCard:        '#FFFFFF',
  bgDark:        '#0B1120',
  bgDarkCard:    '#162035',
  bgDarkBorder:  '#263352',

  // Accent
  live:          '#EF4444',
  liveGlow:      'rgba(239,68,68,0.15)',
  success:       '#10B981',
  warning:       '#F59E0B',

  // Text
  text:          '#0F172A',
  textSub:       '#475569',
  textMuted:     '#94A3B8',
  textOnDark:    '#F8FAFC',
  textMutedDark: '#64748B',

  // Court
  courtGreen:    '#166534',
  courtNet:      'rgba(255,255,255,0.45)',

  // Training type pill colors
  typeGym:       '#7C3AED',
  typeCardio:    '#F97316',
  typeDrills:    '#2563EB',
  typeSkills:    '#0891B2',
  typeRecovery:  '#10B981',
  typeOther:     '#64748B',
}

export const typeColor: Record<string, string> = {
  Gym:      colors.typeGym,
  Cardio:   colors.typeCardio,
  Drills:   colors.typeDrills,
  Skills:   colors.typeSkills,
  Recovery: colors.typeRecovery,
  Other:    colors.typeOther,
}

// ── Spacing ────────────────────────────────────────────────
export const sp = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  '3xl': 32,
  '4xl': 40,
}

// ── Radius ─────────────────────────────────────────────────
export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
}

// ── Typography ─────────────────────────────────────────────
export const type = {
  scoreHero: { fontSize: Math.min(80, SCREEN_W * 0.19), fontWeight: '800' as const, letterSpacing: -2 },
  h1:  { fontSize: 26, fontWeight: '700' as const },
  h2:  { fontSize: 21, fontWeight: '700' as const },
  h3:  { fontSize: 17, fontWeight: '600' as const },
  h4:  { fontSize: 15, fontWeight: '600' as const },
  body:{ fontSize: 15, fontWeight: '400' as const },
  sm:  { fontSize: 13, fontWeight: '400' as const },
  xs:  { fontSize: 11, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
}

// ── Shadows ────────────────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
}
