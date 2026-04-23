import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  Animated, Easing, ScrollView,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow, screen } from '../../lib/theme'

type GameData = {
  home_score: number
  away_score: number
  set_number: number
}

// Court layout for display
const COURT_GRID = [
  { pos: 4, row: 0, col: 0 },
  { pos: 3, row: 0, col: 1 },
  { pos: 2, row: 0, col: 2 },
  { pos: 5, row: 1, col: 0 },
  { pos: 6, row: 1, col: 1 },
  { pos: 1, row: 1, col: 2 },
]

function LivePulse() {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start()
  }, [])

  return (
    <View style={styles.liveRow}>
      <Animated.View style={[styles.liveDot, { opacity: anim }]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  )
}

function ScoreFlash({ score }: { score: number }) {
  const scale = useRef(new Animated.Value(1)).current
  const prevScore = useRef(score)

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, useNativeDriver: true, speed: 50 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]).start()
    }
  }, [score])

  return (
    <Animated.Text style={[styles.score, { transform: [{ scale }] }]}>
      {score}
    </Animated.Text>
  )
}

export default function LiveGamePage() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const insets = useSafeAreaInsets()
  const [game, setGame] = useState<GameData | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return

    supabase
      .from('games')
      .select('home_score, away_score, set_number')
      .eq('share_token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setGame(data)
      })

    // Real-time: listen for DB changes on this game row
    const channel = supabase
      .channel(`live-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `share_token=eq.${token}`,
        },
        (payload) => {
          const { home_score, away_score, set_number } = payload.new as any
          setGame({ home_score, away_score, set_number })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [token])

  if (notFound) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + sp.xl }]}>
        <Text style={styles.errorText}>Game not found</Text>
        <Text style={styles.errorSub}>This link may have expired.</Text>
      </View>
    )
  }

  if (!game) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const setDots = Array.from({ length: game.set_number }, (_, i) => i)

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Live badge + set */}
      <View style={styles.topRow}>
        <LivePulse />
        <View style={styles.setRow}>
          {setDots.map((_, i) => (
            <View key={i} style={[styles.setDot, i === game.set_number - 1 && styles.setDotActive]} />
          ))}
          <Text style={styles.setLabel}>Set {game.set_number}</Text>
        </View>
      </View>

      {/* Main scoreboard card */}
      <View style={[styles.scoreCard, shadow.lg]}>
        {/* Home */}
        <View style={styles.teamBlock}>
          <Text style={styles.teamName}>Home</Text>
          <ScoreFlash score={game.home_score} />
        </View>

        {/* Divider */}
        <View style={styles.dashCol}>
          <View style={styles.dashLine} />
          <Text style={styles.dashText}>–</Text>
          <View style={styles.dashLine} />
        </View>

        {/* Away */}
        <View style={styles.teamBlock}>
          <Text style={styles.teamName}>Away</Text>
          <ScoreFlash score={game.away_score} />
        </View>
      </View>

      {/* Score total indicator */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>
          Total points this set: {game.home_score + game.away_score}
        </Text>
      </View>

      {/* Mini court (decorative) */}
      <View style={styles.courtCard}>
        <Text style={styles.courtLabel}>Court</Text>
        <View style={styles.court}>
          <View style={styles.courtNet} />
          {COURT_GRID.map(({ pos, row, col }) => (
            <View
              key={pos}
              style={[
                styles.courtSlot,
                {
                  top: row * 44 + 6,
                  left: col * ((screen.width - sp.xl * 2 - sp.xxl * 2) / 3) + 6,
                },
              ]}
            >
              <Text style={styles.courtSlotPos}>{pos}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Branding */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>Order in the Court</Text>
        <Text style={styles.brandSub}>Live match updates</Text>
      </View>
    </ScrollView>
  )
}

const CARD_W = screen.width - sp.xl * 2

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bgDark },
  container: { flex: 1, backgroundColor: colors.bgDark, alignItems: 'center' },
  content: { paddingHorizontal: sp.xl },

  // Top row
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.xxl },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: sp.xs, backgroundColor: colors.liveGlow, paddingHorizontal: sp.md, paddingVertical: sp.xs, borderRadius: radius.full },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  liveText: { color: colors.live, ...t.label, letterSpacing: 1.5 },

  // Set dots
  setRow: { flexDirection: 'row', alignItems: 'center', gap: sp.xs },
  setDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bgDarkBorder },
  setDotActive: { backgroundColor: colors.primary, width: 16 },
  setLabel: { color: colors.textMutedDark, ...t.sm, marginLeft: sp.xs },

  // Score card
  scoreCard: {
    width: CARD_W,
    backgroundColor: colors.bgDarkCard,
    borderRadius: radius.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp['3xl'],
    paddingHorizontal: sp.xl,
    borderWidth: 1,
    borderColor: colors.bgDarkBorder,
    marginBottom: sp.lg,
  },
  teamBlock: { flex: 1, alignItems: 'center', gap: sp.sm },
  teamName: { color: colors.textMutedDark, ...t.label, letterSpacing: 1, textTransform: 'uppercase' },
  score: { ...t.scoreHero, color: colors.textOnDark },

  dashCol: { alignItems: 'center', gap: sp.sm, paddingHorizontal: sp.lg },
  dashLine: { width: 1, height: 24, backgroundColor: colors.bgDarkBorder },
  dashText: { color: colors.bgDarkBorder, fontSize: 28, fontWeight: '300' },

  // Total row
  totalRow: { alignItems: 'center', marginBottom: sp.xxl },
  totalText: { color: colors.textMutedDark, ...t.sm },

  // Court card
  courtCard: {
    backgroundColor: colors.bgDarkCard,
    borderRadius: radius.xl,
    padding: sp.lg,
    borderWidth: 1,
    borderColor: colors.bgDarkBorder,
    marginBottom: sp.xxl,
  },
  courtLabel: { color: colors.textMutedDark, ...t.label, marginBottom: sp.md, letterSpacing: 1 },
  court: { backgroundColor: colors.courtGreen, borderRadius: radius.md, height: 104, position: 'relative' },
  courtNet: { position: 'absolute', top: 50, left: 0, right: 0, height: 2, backgroundColor: colors.courtNet, zIndex: 1 },
  courtSlot: {
    position: 'absolute',
    width: (screen.width - sp.xl * 2 - sp.xxl * 2) / 3 - 12,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courtSlotPos: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },

  // Brand
  brandRow: { alignItems: 'center', gap: sp.xs },
  brandText: { color: colors.textMutedDark, ...t.h4 },
  brandSub: { color: colors.bgDarkBorder, ...t.xs },

  // Error
  errorText: { color: colors.textOnDark, ...t.h2, marginBottom: sp.sm },
  errorSub: { color: colors.textMutedDark, ...t.body },
})
