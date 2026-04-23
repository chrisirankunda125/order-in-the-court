import { Dimensions } from 'react-native'

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window')

export const screen = { width: SCREEN_W, height: SCREEN_H }

// ── Supabase-style Palette ─────────────────────────────────
export const colors = {
  // Brand — Supabase signature green
  primary:       '#3ECF8E',
  primaryLight:  'rgba(62, 207, 142, 0.12)',
  primaryDark:   '#24B47E',

  // Backgrounds — layered blacks
  bg:            '#1C1C1C',   // Base background
  bgCard:        '#1F1F1F',   // Card surface (slightly lighter than bg)
  bgElevated:   '#262626',    // Elevated surface (hover, input)
  bgDark:        '#0A0A0A',   // Deepest (live page)
  bgDarkCard:    '#171717',
  bgDarkBorder:  '#2E2E2E',

  // Borders
  border:        '#2E2E2E',
  borderSubtle:  '#242424',
  borderStrong:  '#404040',

  // Accent
  live:          '#EF4444',
  liveGlow:      'rgba(239, 68, 68, 0.12)',
  success:       '#3ECF8E',
  warning:       '#F59E0B',

  // Text — high contrast on dark
  text:          '#EDEDED',
  textSub:       '#A3A3A3',
  textMuted:     '#737373',
  textOnDark:    '#F8F8F8',
  textMutedDark: '#737373',

  // Court
  courtGreen:    '#166534',
  courtNet:      'rgba(255,255,255,0.45)',

  // Training type pill colors (keep distinct but muted)
  typeGym:       '#A78BFA',
  typeCardio:    '#FB923C',
  typeDrills:    '#60A5FA',
  typeSkills:    '#22D3EE',
  typeRecovery:  '#3ECF8E',
  typeOther:     '#A3A3A3',
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

// ── Radius — Supabase uses smaller, more precise radii ─────
export const radius = {
  sm:   6,
  md:   8,
  lg:   10,
  xl:   12,
  xxl:  16,
  full: 999,
}

// ── Typography ─────────────────────────────────────────────
export const type = {
  scoreHero: { fontSize: Math.min(80, SCREEN_W * 0.19), fontWeight: '700' as const, letterSpacing: -2 },
  h1:  { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2:  { fontSize: 21, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3:  { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  h4:  { fontSize: 15, fontWeight: '600' as const },
  body:{ fontSize: 15, fontWeight: '400' as const },
  sm:  { fontSize: 13, fontWeight: '400' as const },
  xs:  { fontSize: 11, fontWeight: '500' as const },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  mono:  { fontFamily: 'Menlo, ui-monospace, monospace' as const, fontSize: 13 },
}

// ── Shadows — Supabase uses subtle dark shadows ────────────
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
}
