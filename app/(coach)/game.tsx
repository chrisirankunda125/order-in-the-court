import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Share,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useGameStore, CourtPlayer, StatKey } from '../../store/gameStore'
import { colors, type as t, sp, radius, shadow, screen } from '../../lib/theme'

type Lineup = {
  id: string
  title: string
  slots: { position_number: number; player: { id: string; name: string; jersey_number: number | null } }[]
}

const COURT_GRID = [
  { pos: 4, row: 0, col: 0 },
  { pos: 3, row: 0, col: 1 },
  { pos: 2, row: 0, col: 2 },
  { pos: 5, row: 1, col: 0 },
  { pos: 6, row: 1, col: 1 },
  { pos: 1, row: 1, col: 2 },
]

const STATS: { key: StatKey; label: string; short: string; color: string }[] = [
  { key: 'kills',  label: 'Kill',  short: 'K', color: '#16A34A' },
  { key: 'digs',   label: 'Dig',   short: 'D', color: '#2563EB' },
  { key: 'aces',   label: 'Ace',   short: 'A', color: '#7C3AED' },
  { key: 'blocks', label: 'Block', short: 'B', color: '#D97706' },
  { key: 'errors', label: 'Error', short: 'E', color: '#DC2626' },
]

// ── Setup ──────────────────────────────────────────────────────
function SetupScreen() {
  const insets = useSafeAreaInsets()
  const { initGame } = useGameStore()
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('lineups')
        .select('id, title, lineup_slots(position_number, players(id, name, jersey_number))')
        .eq('coach_id', user!.id)
        .order('created_at', { ascending: false })
      if (data) setLineups(
        data.map((l: any) => ({
          id: l.id,
          title: l.title,
          slots: (l.lineup_slots ?? []).map((s: any) => ({
            position_number: s.position_number,
            player: s.players,
          })),
        }))
      )
      setLoading(false)
    })()
  }, [])

  const handleStart = async (lineup: Lineup) => {
    if (!lineup.slots.length) return Alert.alert('Empty lineup', 'Add players to this lineup first.')
    setStarting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('games')
      .insert({ coach_id: user!.id, active_lineup_id: lineup.id })
      .select('id, share_token')
      .single()

    if (error || !data) { Alert.alert('Error', error?.message); setStarting(false); return }

    const courtPlayers: CourtPlayer[] = lineup.slots.map((s) => ({
      id: s.player.id, name: s.player.name,
      jerseyNumber: s.player.jersey_number, position: s.position_number,
    }))
    initGame(data.id, data.share_token, courtPlayers)
    setStarting(false)
  }

  return (
    <View style={[s.darkFill, { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.lg }]}>
      <Text style={s.setupTitle}>Start Game</Text>
      <Text style={s.setupSub}>Select a lineup to load onto the court</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: sp.md, paddingBottom: sp.xxl }}>
          {lineups.length === 0 ? (
            <Text style={s.emptyDark}>No lineups yet — build one in the Lineups tab first.</Text>
          ) : lineups.map((l) => (
            <TouchableOpacity key={l.id} style={s.lineupCard} onPress={() => handleStart(l)} disabled={starting}>
              <View>
                <Text style={s.lineupCardTitle}>{l.title}</Text>
                <Text style={s.lineupCardSub}>{l.slots.length} of 6 positions filled</Text>
              </View>
              <View style={s.lineupChevron}>
                <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

// ── Playing ────────────────────────────────────────────────────
function PlayingScreen() {
  const insets = useSafeAreaInsets()
  const {
    gameId, shareToken,
    homeScore, awayScore, setNumber,
    courtPlayers, selectedPlayerId, stats,
    incrementHome, decrementHome, incrementAway, decrementAway,
    rotateForward, rotateBackward,
    selectPlayer, recordStat, endSet, endGame,
  } = useGameStore()

  const [flushing, setFlushing] = useState(false)

  const handleEndSet = () => Alert.alert(
    `End Set ${setNumber}`,
    `Home ${homeScore}  –  Away ${awayScore}\n\nSave stats and start the next set?`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Set', onPress: async () => { setFlushing(true); await endSet(); setFlushing(false) } },
    ]
  )

  const handleEndGame = () => Alert.alert('End Game', 'Finish this match?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'End Game', style: 'destructive', onPress: endGame },
  ])

  const handleShare = async () => {
    const url = `https://order-in-the-court.vercel.app/live/${shareToken}`
    await Share.share({ message: `Watch live: ${url}`, url })
  }

  const selectedPlayer = courtPlayers.find((p) => p.id === selectedPlayerId)
  const selectedStats = selectedPlayerId ? stats[selectedPlayerId] : null

  // Slot width based on screen
  const slotW = (screen.width - sp.xl * 2 - sp.md * 2) / 3

  return (
    <ScrollView style={s.darkBg} contentContainerStyle={[s.playingContent, { paddingTop: insets.top + sp.md, paddingBottom: insets.bottom + sp.lg }]} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingHorizontal: sp.xl }]}>
        <TouchableOpacity onPress={handleEndGame}>
          <Text style={s.endLink}>✕ End</Text>
        </TouchableOpacity>
        <View style={s.setChip}>
          <Text style={s.setChipText}>Set {setNumber}</Text>
        </View>
        <TouchableOpacity onPress={handleShare}>
          <Text style={s.shareLink}>⎘ Share</Text>
        </TouchableOpacity>
      </View>

      {/* Scoreboard */}
      <View style={s.scoreboard}>
        <View style={s.teamCol}>
          <Text style={s.teamLabel}>HOME</Text>
          <Text style={s.scoreNum}>{homeScore}</Text>
          <View style={s.scoreBtnRow}>
            <TouchableOpacity style={s.scoreBtn} onPress={incrementHome}>
              <Text style={s.scoreBtnPlus}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.scoreBtnMinus} onPress={decrementHome}>
              <Text style={s.scoreBtnMinusText}>−</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.scoreSep}>
          <View style={s.sepLine} />
          <Text style={s.sepDash}>–</Text>
          <View style={s.sepLine} />
        </View>

        <View style={s.teamCol}>
          <Text style={s.teamLabel}>AWAY</Text>
          <Text style={s.scoreNum}>{awayScore}</Text>
          <View style={s.scoreBtnRow}>
            <TouchableOpacity style={s.scoreBtn} onPress={incrementAway}>
              <Text style={s.scoreBtnPlus}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.scoreBtnMinus} onPress={decrementAway}>
              <Text style={s.scoreBtnMinusText}>−</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Rotation bar */}
      <View style={[s.rotationRow, { paddingHorizontal: sp.xl }]}>
        <TouchableOpacity style={s.rotateBtn} onPress={rotateBackward}>
          <Text style={s.rotateBtnText}>↺  Back</Text>
        </TouchableOpacity>
        <Text style={s.rotationHint}>Rotate</Text>
        <TouchableOpacity style={s.rotateBtn} onPress={rotateForward}>
          <Text style={s.rotateBtnText}>Forward  ↻</Text>
        </TouchableOpacity>
      </View>

      {/* Court */}
      <View style={[s.court, { marginHorizontal: sp.xl, height: slotW * 2 + sp.md * 3 }]}>
        <View style={s.courtNet} />
        {COURT_GRID.map(({ pos, row, col }) => {
          const player = courtPlayers.find((p) => p.position === pos)
          const isSel = player?.id === selectedPlayerId
          return (
            <TouchableOpacity
              key={pos}
              style={[
                s.courtSlot,
                {
                  width: slotW,
                  height: slotW,
                  top: row * (slotW + sp.md) + sp.md,
                  left: col * (slotW + sp.md) + sp.md,
                },
                player && s.courtSlotFilled,
                isSel && s.courtSlotSelected,
              ]}
              onPress={() => player && selectPlayer(player.id)}
              disabled={!player}
            >
              <Text style={s.courtSlotPosLabel}>{pos}</Text>
              {player ? (
                <>
                  <Text style={s.courtJersey}>#{player.jerseyNumber ?? '—'}</Text>
                  <Text style={s.courtName} numberOfLines={1}>{player.name.split(' ')[0]}</Text>
                </>
              ) : (
                <Text style={s.courtEmpty}>—</Text>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Stat panel */}
      <View style={[s.statArea, { paddingHorizontal: sp.xl }]}>
        {selectedPlayer ? (
          <View style={s.statPanel}>
            <View style={s.statPanelHeader}>
              <Text style={s.statPanelName}>{selectedPlayer.name}</Text>
              <TouchableOpacity onPress={() => selectPlayer(null)}>
                <Text style={s.statClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedStats && (
              <View style={s.statTotalsRow}>
                {STATS.map(({ key, short }) => (
                  <View key={key} style={s.statTotalChip}>
                    <Text style={s.statTotalNum}>{selectedStats[key as keyof typeof selectedStats] ?? 0}</Text>
                    <Text style={s.statTotalLabel}>{short}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={s.statBtns}>
              {STATS.map(({ key, label, color }) => (
                <TouchableOpacity
                  key={key}
                  style={[s.statBtn, { backgroundColor: color }]}
                  onPress={() => recordStat(selectedPlayer.id, key)}
                >
                  <Text style={s.statBtnText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <Text style={s.tapHint}>Tap a player on the court to log stats</Text>
        )}
      </View>

      {/* Bottom actions */}
      <View style={[s.bottomBar, { paddingHorizontal: sp.xl }]}>
        <TouchableOpacity style={s.endSetBtn} onPress={handleEndSet} disabled={flushing}>
          <Text style={s.endSetText}>{flushing ? 'Saving…' : `End Set ${setNumber}  →`}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ── Root ──────────────────────────────────────────────────────
export default function GameScreen() {
  const insets = useSafeAreaInsets()
  const phase = useGameStore((s) => s.phase)
  const startSetup = useGameStore((s) => s.startSetup)

  if (phase === 'setup') return <SetupScreen />
  if (phase === 'playing') return <PlayingScreen />

  return (
    <View style={[s.darkFill, { paddingTop: insets.top + sp['3xl'], paddingHorizontal: sp.xl }]}>
      <Text style={s.idleTitle}>Game</Text>
      <Text style={s.idleSub}>Track score, rotations, and player stats live.</Text>
      <TouchableOpacity style={s.startBtn} onPress={startSetup}>
        <Text style={s.startBtnText}>Start New Game</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  darkFill: { flex: 1, backgroundColor: colors.bgDark },
  darkBg: { flex: 1, backgroundColor: colors.bgDark },
  playingContent: { paddingHorizontal: 0, gap: 0 },

  // Idle
  idleTitle: { ...t.h1, color: colors.textOnDark, marginBottom: sp.sm },
  idleSub: { ...t.body, color: colors.textMutedDark, marginBottom: sp['3xl'] },
  startBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: sp.lg + 2, alignItems: 'center', ...shadow.md },
  startBtnText: { ...t.h3, color: '#fff' },

  // Setup
  setupTitle: { ...t.h1, color: colors.textOnDark, marginBottom: sp.xs, paddingHorizontal: sp.xl },
  setupSub: { ...t.body, color: colors.textMutedDark, marginBottom: sp.xxl, paddingHorizontal: sp.xl },
  emptyDark: { color: colors.textMutedDark, ...t.body, textAlign: 'center', marginTop: 48 },
  lineupCard: {
    backgroundColor: colors.bgDarkCard,
    borderRadius: radius.lg,
    padding: sp.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.bgDarkBorder,
    marginHorizontal: sp.xl,
  },
  lineupCardTitle: { ...t.h3, color: colors.textOnDark },
  lineupCardSub: { ...t.sm, color: colors.textMutedDark, marginTop: 2 },
  lineupChevron: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },

  // Top bar
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.sm },
  endLink: { ...t.sm, color: colors.textMutedDark, fontWeight: '600' },
  setChip: { backgroundColor: colors.bgDarkCard, borderRadius: radius.full, paddingHorizontal: sp.lg, paddingVertical: sp.xs, borderWidth: 1, borderColor: colors.bgDarkBorder },
  setChipText: { ...t.label, color: colors.textOnDark },
  shareLink: { ...t.sm, color: colors.primary, fontWeight: '600' },

  // Scoreboard
  scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.lg, paddingVertical: sp.sm },
  teamCol: { alignItems: 'center', gap: sp.xs },
  teamLabel: { ...t.label, color: colors.textMutedDark, letterSpacing: 1.5, fontSize: 10 },
  scoreNum: { fontSize: 52, fontWeight: '800', color: colors.textOnDark, lineHeight: 56 },
  scoreBtnRow: { flexDirection: 'row', gap: sp.xs },
  scoreBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadow.sm },
  scoreBtnPlus: { color: '#fff', fontSize: 20, fontWeight: '600', lineHeight: 24 },
  scoreBtnMinus: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.bgDarkCard, borderWidth: 1, borderColor: colors.bgDarkBorder, justifyContent: 'center', alignItems: 'center' },
  scoreBtnMinusText: { color: colors.textMutedDark, fontSize: 20, fontWeight: '600', lineHeight: 24 },
  scoreSep: { alignItems: 'center', gap: sp.xs },
  sepLine: { width: 1, height: 20, backgroundColor: colors.bgDarkBorder },
  sepDash: { color: colors.bgDarkBorder, fontSize: 24, fontWeight: '300' },

  // Rotation
  rotationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md },
  rotateBtn: { backgroundColor: colors.bgDarkCard, borderRadius: radius.md, paddingHorizontal: sp.md, paddingVertical: sp.sm, borderWidth: 1, borderColor: colors.bgDarkBorder },
  rotateBtnText: { ...t.sm, color: colors.textOnDark, fontWeight: '600' },
  rotationHint: { ...t.xs, color: colors.textMutedDark },

  // Court
  court: { backgroundColor: colors.courtGreen, borderRadius: radius.xl, position: 'relative', marginBottom: sp.md, ...shadow.sm },
  courtNet: { position: 'absolute', zIndex: 1, left: sp.md, right: sp.md, backgroundColor: colors.courtNet, height: 2, top: '50%' },
  courtSlot: { position: 'absolute', borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  courtSlotFilled: { backgroundColor: 'rgba(255,255,255,0.13)' },
  courtSlotSelected: { backgroundColor: 'rgba(37,99,235,0.7)', borderColor: '#93C5FD', borderWidth: 2 },
  courtSlotPosLabel: { position: 'absolute', top: 4, left: 6, ...t.xs, color: 'rgba(255,255,255,0.35)', fontWeight: '700' },
  courtJersey: { ...t.xs, color: 'rgba(255,255,255,0.5)' },
  courtName: { ...t.h4, color: '#fff' },
  courtEmpty: { color: 'rgba(255,255,255,0.15)', fontSize: 22 },

  // Stat area
  statArea: { paddingHorizontal: sp.xl, paddingVertical: sp.md, minHeight: 140 },
  tapHint: { ...t.sm, color: colors.textMutedDark, textAlign: 'center', paddingVertical: sp.lg },
  statPanel: { backgroundColor: colors.bgDarkCard, borderRadius: radius.xl, padding: sp.lg, borderWidth: 1, borderColor: colors.bgDarkBorder },
  statPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md },
  statPanelName: { ...t.h3, color: colors.textOnDark },
  statClose: { color: colors.textMutedDark, fontSize: 16, padding: sp.xs },
  statTotalsRow: { flexDirection: 'row', gap: sp.sm, marginBottom: sp.md },
  statTotalChip: { flex: 1, backgroundColor: colors.bgDark, borderRadius: radius.md, paddingVertical: sp.sm, alignItems: 'center' },
  statTotalNum: { ...t.h2, color: colors.textOnDark },
  statTotalLabel: { ...t.xs, color: colors.textMutedDark, marginTop: 2 },
  statBtns: { flexDirection: 'row', gap: sp.sm },
  statBtn: { flex: 1, borderRadius: radius.md, paddingVertical: sp.md, alignItems: 'center', ...shadow.sm },
  statBtnText: { ...t.label, color: '#fff' },

  // Bottom bar
  bottomBar: { paddingTop: sp.md, paddingHorizontal: sp.xl },
  endSetBtn: { backgroundColor: '#065F46', borderRadius: radius.xl, padding: sp.md, alignItems: 'center', ...shadow.md },
  endSetText: { ...t.h3, color: '#fff', fontSize: 14 },
})
