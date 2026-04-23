import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, ScrollView, RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow, typeColor } from '../../lib/theme'

type Session = {
  id: string
  type: string
  duration_minutes: number
  intensity: number
  body_feel: number
  notes: string | null
  inserted_at: string
}

type PlayerLoad = {
  playerId: string   // auth user id
  rosterId: string   // players table id
  name: string
  position: string | null
  jerseyNumber: number | null
  weekMins: number
  weekSessions: number
  avgIntensity: number
  lastSession: string | null
  sessions: Session[]
}

const TYPE_EMOJI: Record<string, string> = {
  Gym: '🏋️', Cardio: '🏃', Drills: '🏐', Skills: '🎯', Recovery: '🧘', Other: '⚡️',
}

function LoadBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const color = pct > 0.8 ? colors.live : pct > 0.5 ? colors.warning : colors.success
  return (
    <View style={bar.track}>
      <View style={[bar.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  )
}
const bar = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: colors.bg, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
})

export default function TrainingLoadScreen() {
  const insets = useSafeAreaInsets()
  const [players, setPlayers] = useState<PlayerLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<PlayerLoad | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get all roster entries that have been claimed (have a user_id)
    const { data: roster } = await supabase
      .from('players')
      .select('id, name, position, jersey_number, user_id')
      .eq('coach_id', user.id)
      .not('user_id', 'is', null)

    if (!roster || roster.length === 0) { setLoading(false); return }

    // For each player, fetch their training sessions
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const playerLoads: PlayerLoad[] = await Promise.all(
      roster.map(async (p) => {
        const { data: sessions } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('player_id', p.user_id)
          .order('inserted_at', { ascending: false })

        const all: Session[] = sessions ?? []
        const thisWeek = all.filter((s) => s.inserted_at >= weekAgo)
        const weekMins = thisWeek.reduce((sum, s) => sum + s.duration_minutes, 0)
        const avgIntensity = thisWeek.length > 0
          ? Math.round(thisWeek.reduce((sum, s) => sum + s.intensity, 0) / thisWeek.length * 10) / 10
          : 0

        return {
          playerId: p.user_id,
          rosterId: p.id,
          name: p.name,
          position: p.position,
          jerseyNumber: p.jersey_number,
          weekMins,
          weekSessions: thisWeek.length,
          avgIntensity,
          lastSession: all[0]?.inserted_at ?? null,
          sessions: all.slice(0, 10),
        }
      })
    )

    // Sort by weekly load descending
    playerLoads.sort((a, b) => b.weekMins - a.weekMins)
    setPlayers(playerLoads)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const maxWeekMins = Math.max(...players.map((p) => p.weekMins), 1)

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={players}
        keyExtractor={(p) => p.rosterId}
        contentContainerStyle={{ paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.xxl, paddingHorizontal: sp.xl, gap: sp.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={() => (
          <View style={{ marginBottom: sp.sm }}>
            <Text style={styles.title}>Training Load</Text>
            <Text style={styles.subtitle}>This week · {players.length} players tracked</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={[styles.emptyCard, shadow.sm]}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>No training data yet</Text>
            <Text style={styles.emptySub}>
              Players need to join your team via invite code and log sessions for their load to appear here.
            </Text>
          </View>
        )}
        renderItem={({ item: p }) => {
          const daysSince = p.lastSession
            ? Math.floor((Date.now() - new Date(p.lastSession).getTime()) / 86400000)
            : null

          return (
            <TouchableOpacity style={[styles.playerCard, shadow.sm]} onPress={() => setSelected(p)}>
              {/* Player identity */}
              <View style={styles.playerHeader}>
                <View style={styles.jerseyBadge}>
                  <Text style={styles.jerseyNum}>#{p.jerseyNumber ?? '—'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.playerName}>{p.name}</Text>
                  <Text style={styles.playerPos}>{p.position ?? 'No position'}</Text>
                </View>
                {daysSince !== null && (
                  <View style={[styles.lastSessionBadge, daysSince > 4 && styles.lastSessionWarning]}>
                    <Text style={[styles.lastSessionText, daysSince > 4 && { color: colors.warning }]}>
                      {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Load bar */}
              <View style={styles.loadRow}>
                <LoadBar value={p.weekMins} max={maxWeekMins} />
                <Text style={styles.loadMins}>{p.weekMins}m</Text>
              </View>

              {/* Metrics */}
              <View style={styles.metricsRow}>
                <Metric label="Sessions" value={String(p.weekSessions)} />
                <Metric label="Avg intensity" value={p.avgIntensity > 0 ? `${p.avgIntensity}/5` : '—'} />
                <Metric label="Hours" value={p.weekMins > 0 ? `${(p.weekMins / 60).toFixed(1)}h` : '—'} />
              </View>
            </TouchableOpacity>
          )
        }}
      />

      {/* Player detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.bg }}
            contentContainerStyle={{ padding: sp.xl, paddingTop: sp.xxl, paddingBottom: sp['4xl'] }}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalSub}>{selected.position} · #{selected.jerseyNumber ?? '—'}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Week summary */}
            <View style={[styles.summaryCard, shadow.md]}>
              <Text style={styles.summaryCardLabel}>This week</Text>
              <View style={styles.summaryRow}>
                <SummaryMetric label="Minutes" value={String(selected.weekMins)} />
                <SummaryMetric label="Sessions" value={String(selected.weekSessions)} />
                <SummaryMetric label="Avg feel" value={selected.avgIntensity > 0 ? `${selected.avgIntensity}` : '—'} />
              </View>
            </View>

            <Text style={[styles.modalSection, { marginTop: sp.lg }]}>Recent Sessions</Text>
            {selected.sessions.length === 0 ? (
              <Text style={{ color: colors.textMuted, ...t.body }}>No sessions logged yet.</Text>
            ) : selected.sessions.map((s) => {
              const accent = typeColor[s.type] ?? colors.textMuted
              return (
                <View key={s.id} style={[styles.sessionRow, shadow.sm]}>
                  <View style={[styles.sessionAccent, { backgroundColor: accent }]} />
                  <View style={styles.sessionBody}>
                    <View style={styles.sessionTop}>
                      <Text style={styles.sessionType}>{TYPE_EMOJI[s.type]} {s.type}</Text>
                      <Text style={styles.sessionDate}>
                        {new Date(s.inserted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.sessionMeta}>{s.duration_minutes}min · Intensity {s.intensity}/5 · Feel {s.body_feel}/5</Text>
                    {s.notes && <Text style={styles.sessionNotes} numberOfLines={2}>{s.notes}</Text>}
                  </View>
                </View>
              )
            })}
          </ScrollView>
        )}
      </Modal>
    </View>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ ...t.h4, color: colors.text }}>{value}</Text>
      <Text style={{ ...t.xs, color: colors.textMuted }}>{label}</Text>
    </View>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={{ ...t.xs, color: colors.textMuted, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...t.h1, color: colors.text },
  subtitle: { ...t.sm, color: colors.textMuted, marginTop: 2 },

  playerCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.lg, gap: sp.md },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  jerseyBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { ...t.label, color: colors.primary },
  playerName: { ...t.h4, color: colors.text },
  playerPos: { ...t.sm, color: colors.textMuted },
  lastSessionBadge: { backgroundColor: colors.bg, borderRadius: radius.full, paddingHorizontal: sp.sm, paddingVertical: 2 },
  lastSessionWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  lastSessionText: { ...t.xs, color: colors.textMuted, fontWeight: '600' },

  loadRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  loadMins: { ...t.label, color: colors.textSub, width: 40, textAlign: 'right' },
  metricsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.bg, paddingTop: sp.md },

  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.xxl, alignItems: 'center', gap: sp.md },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...t.h3, color: colors.text },
  emptySub: { ...t.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

  // Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.xl },
  modalName: { ...t.h1, color: colors.text },
  modalSub: { ...t.body, color: colors.textMuted, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: colors.textSub, fontSize: 16, fontWeight: '600' },
  modalSection: { ...t.h3, color: colors.text, marginBottom: sp.md },

  summaryCard: { backgroundColor: colors.bgDark, borderRadius: radius.xl, padding: sp.xl },
  summaryCardLabel: { ...t.label, color: colors.textMutedDark, letterSpacing: 1, marginBottom: sp.lg },
  summaryRow: { flexDirection: 'row' },

  sessionRow: { backgroundColor: colors.bgCard, borderRadius: radius.lg, flexDirection: 'row', overflow: 'hidden', marginBottom: sp.sm },
  sessionAccent: { width: 4 },
  sessionBody: { flex: 1, padding: sp.md, gap: sp.xs },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionType: { ...t.h4, color: colors.text },
  sessionDate: { ...t.sm, color: colors.textMuted },
  sessionMeta: { ...t.sm, color: colors.textMuted },
  sessionNotes: { ...t.sm, color: colors.textSub },
})
