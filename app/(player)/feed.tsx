import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow, typeColor } from '../../lib/theme'

type Session = {
  id: string
  type: string
  duration_minutes: number
  intensity: number
  body_feel: number
  notes: string
  inserted_at: string
}

const TYPE_EMOJI: Record<string, string> = {
  Gym: '🏋️', Cardio: '🏃', Drills: '🏐', Skills: '🎯', Recovery: '🧘', Other: '⚡️',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function IntensityBar({ value }: { value: number }) {
  return (
    <View style={bar.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={[bar.seg, i <= value && bar.segFilled]} />
      ))}
    </View>
  )
}
const bar = StyleSheet.create({
  row: { flexDirection: 'row', gap: 3 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segFilled: { backgroundColor: colors.primary },
})

export default function FeedScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [weekTotal, setWeekTotal] = useState(0)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('player_id', user?.id)
      .order('inserted_at', { ascending: false })
    if (data) {
      setSessions(data)
      const weekAgo = Date.now() - 7 * 86400000
      const mins = data
        .filter((s) => new Date(s.inserted_at).getTime() > weekAgo)
        .reduce((sum, s) => sum + s.duration_minutes, 0)
      setWeekTotal(mins)
    }
  }, [])

  useEffect(() => { load() }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.screenTitle}>Activity</Text>

      {/* Weekly summary card */}
      {sessions.length > 0 && (
        <View style={[styles.summaryCard, shadow.md]}>
          <Text style={styles.summaryLabel}>This week</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNum}>{weekTotal}</Text>
              <Text style={styles.summaryUnit}>mins</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNum}>
                {sessions.filter((s) => new Date(s.inserted_at).getTime() > Date.now() - 7 * 86400000).length}
              </Text>
              <Text style={styles.summaryUnit}>sessions</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryNum}>
                {Math.round(weekTotal / 60 * 10) / 10}
              </Text>
              <Text style={styles.summaryUnit}>hours</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingHorizontal: sp.xl, paddingBottom: insets.bottom + sp.xxl, gap: sp.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏐</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySub}>Log your first training session to start tracking your progress.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(player)/log-training')}>
              <Text style={styles.emptyBtnText}>Log a session</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const accent = typeColor[item.type] ?? colors.textMuted
          return (
            <View style={[styles.card, shadow.sm]}>
              {/* Left accent bar */}
              <View style={[styles.cardAccent, { backgroundColor: accent }]} />

              <View style={styles.cardBody}>
                {/* Top row */}
                <View style={styles.cardTop}>
                  <View style={[styles.typeIcon, { backgroundColor: accent + '18' }]}>
                    <Text style={styles.typeEmoji}>{TYPE_EMOJI[item.type] ?? '⚡️'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardType}>{item.type}</Text>
                    <Text style={styles.cardDate}>{formatDate(item.inserted_at)}</Text>
                  </View>
                  <Text style={styles.cardDuration}>{item.duration_minutes}<Text style={styles.cardDurationUnit}> min</Text></Text>
                </View>

                {/* Metrics row */}
                <View style={styles.metricsRow}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Intensity</Text>
                    <IntensityBar value={item.intensity} />
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Body feel</Text>
                    <IntensityBar value={item.body_feel} />
                  </View>
                </View>

                {/* Notes */}
                {!!item.notes && (
                  <Text style={styles.cardNotes} numberOfLines={2}>{item.notes}</Text>
                )}
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  headerSection: { marginBottom: sp.md },
  screenTitle: { ...t.h1, color: colors.text, marginBottom: sp.lg },

  // Summary card
  summaryCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.xl, marginBottom: sp.sm },
  summaryLabel: { ...t.label, color: colors.textMuted, letterSpacing: 1, marginBottom: sp.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryMetric: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 28, fontWeight: '800', color: colors.text, lineHeight: 32 },
  summaryUnit: { ...t.xs, color: colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.bg },

  // Activity card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: sp.lg },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.md },
  typeIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  typeEmoji: { fontSize: 22 },
  cardType: { ...t.h4, color: colors.text },
  cardDate: { ...t.sm, color: colors.textMuted, marginTop: 1 },
  cardDuration: { fontSize: 22, fontWeight: '800', color: colors.text },
  cardDurationUnit: { fontSize: 13, fontWeight: '400', color: colors.textMuted },

  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.sm },
  metric: { flex: 1, gap: sp.xs },
  metricLabel: { ...t.xs, color: colors.textMuted },
  metricDivider: { width: 1, height: 28, backgroundColor: colors.bg },

  cardNotes: { ...t.sm, color: colors.textSub, lineHeight: 20 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: sp.xxl },
  emptyEmoji: { fontSize: 52, marginBottom: sp.lg },
  emptyTitle: { ...t.h2, color: colors.text, marginBottom: sp.sm },
  emptySub: { ...t.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: sp['3xl'] },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: radius.xl, paddingHorizontal: sp['3xl'], paddingVertical: sp.md },
  emptyBtnText: { ...t.h4, color: '#fff' },
})
