import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow } from '../../lib/theme'

type SetStats = {
  set_number: number
  kills: number
  digs: number
  aces: number
  blocks: number
  errors: number
}

type GameRecord = {
  game_id: string
  date: string
  sets: SetStats[]
  totals: Omit<SetStats, 'set_number'>
}

const STAT_COLS: { key: keyof Omit<SetStats, 'set_number'>; label: string; color: string }[] = [
  { key: 'kills',  label: 'K',  color: '#16A34A' },
  { key: 'digs',   label: 'D',  color: '#2563EB' },
  { key: 'aces',   label: 'A',  color: '#7C3AED' },
  { key: 'blocks', label: 'B',  color: '#D97706' },
  { key: 'errors', label: 'E',  color: '#DC2626' },
]

export default function StatsScreen() {
  const insets = useSafeAreaInsets()
  const [games, setGames] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [hasRosterEntry, setHasRosterEntry] = useState(false)
  const [totals, setTotals] = useState({ kills: 0, digs: 0, aces: 0, blocks: 0, errors: 0 })

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      // Find roster entry claimed by this auth user
      const { data: playerEntry } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!playerEntry) { setHasRosterEntry(false); setLoading(false); return }
      setHasRosterEntry(true)

      // Fetch all stats for this roster entry
      const { data: statsData } = await supabase
        .from('player_stats')
        .select('game_id, set_number, kills, digs, aces, blocks, errors, games(created_at)')
        .eq('player_id', playerEntry.id)
        .order('set_number')

      if (!statsData || statsData.length === 0) { setLoading(false); return }

      // Group by game
      const gameMap: Record<string, GameRecord> = {}
      for (const row of statsData) {
        const gid = row.game_id
        const game = (row as any).games
        if (!gameMap[gid]) {
          gameMap[gid] = { game_id: gid, date: game?.created_at ?? '', sets: [], totals: { kills: 0, digs: 0, aces: 0, blocks: 0, errors: 0 } }
        }
        gameMap[gid].sets.push({ set_number: row.set_number, kills: row.kills, digs: row.digs, aces: row.aces, blocks: row.blocks, errors: row.errors })
        gameMap[gid].totals.kills  += row.kills
        gameMap[gid].totals.digs   += row.digs
        gameMap[gid].totals.aces   += row.aces
        gameMap[gid].totals.blocks += row.blocks
        gameMap[gid].totals.errors += row.errors
      }

      const records = Object.values(gameMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setGames(records)

      // Career totals
      const career = records.reduce((acc, g) => ({
        kills:  acc.kills  + g.totals.kills,
        digs:   acc.digs   + g.totals.digs,
        aces:   acc.aces   + g.totals.aces,
        blocks: acc.blocks + g.totals.blocks,
        errors: acc.errors + g.totals.errors,
      }), { kills: 0, digs: 0, aces: 0, blocks: 0, errors: 0 })
      setTotals(career)

      setLoading(false)
    })()
  }, [])

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )

  if (!hasRosterEntry) return (
    <View style={[styles.container, { paddingTop: insets.top + sp.xl, paddingHorizontal: sp.xl }]}>
      <Text style={styles.title}>My Stats</Text>
      <View style={[styles.emptyCard, shadow.sm]}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No stats yet</Text>
        <Text style={styles.emptySub}>
          Join your team using your coach's invite code (in your Profile tab), then your coach can log your stats during games.
        </Text>
      </View>
    </View>
  )

  if (games.length === 0) return (
    <View style={[styles.container, { paddingTop: insets.top + sp.xl, paddingHorizontal: sp.xl }]}>
      <Text style={styles.title}>My Stats</Text>
      <View style={[styles.emptyCard, shadow.sm]}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>No games logged yet</Text>
        <Text style={styles.emptySub}>Stats will appear here after your coach runs a live game and logs your performance.</Text>
      </View>
    </View>
  )

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.xxl, paddingHorizontal: sp.xl, gap: sp.lg }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={() => (
        <>
          <Text style={styles.title}>My Stats</Text>
          {/* Career totals */}
          <View style={[styles.careerCard, shadow.md]}>
            <Text style={styles.careerLabel}>Career Totals</Text>
            <View style={styles.statRow}>
              {STAT_COLS.map(({ key, label, color }) => (
                <View key={key} style={styles.statCell}>
                  <Text style={[styles.statNum, { color }]}>{totals[key]}</Text>
                  <Text style={styles.statLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.sectionTitle}>Game History</Text>
        </>
      )}
      data={games}
      keyExtractor={(g) => g.game_id}
      renderItem={({ item: game }) => (
        <View style={[styles.gameCard, shadow.sm]}>
          <View style={styles.gameHeader}>
            <Text style={styles.gameDate}>
              {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={styles.gameSets}>{game.sets.length} set{game.sets.length !== 1 ? 's' : ''}</Text>
          </View>

          {/* Stat header row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellSet]}>Set</Text>
            {STAT_COLS.map(({ label }) => <Text key={label} style={styles.tableCell}>{label}</Text>)}
          </View>

          {/* Per-set rows */}
          {game.sets.map((s) => (
            <View key={s.set_number} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellSet, { color: colors.textMuted }]}>{s.set_number}</Text>
              {STAT_COLS.map(({ key, color }) => (
                <Text key={key} style={[styles.tableCell, { color: s[key] > 0 ? color : colors.textMuted }]}>{s[key]}</Text>
              ))}
            </View>
          ))}

          {/* Totals row */}
          <View style={[styles.tableRow, styles.tableTotals]}>
            <Text style={[styles.tableCell, styles.tableCellSet, { fontWeight: '700', color: colors.textSub }]}>Total</Text>
            {STAT_COLS.map(({ key, color }) => (
              <Text key={key} style={[styles.tableCell, { fontWeight: '700', color }]}>{game.totals[key]}</Text>
            ))}
          </View>
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...t.h1, color: colors.text, marginBottom: sp.lg },
  sectionTitle: { ...t.h3, color: colors.text },

  careerCard: { backgroundColor: colors.bgDark, borderRadius: radius.xl, padding: sp.xl, marginBottom: sp.sm },
  careerLabel: { ...t.label, color: colors.textMutedDark, letterSpacing: 1, marginBottom: sp.lg },
  statRow: { flexDirection: 'row' },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  statLabel: { ...t.xs, color: colors.textMutedDark, marginTop: 2 },

  gameCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, overflow: 'hidden' },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: sp.lg, borderBottomWidth: 1, borderBottomColor: colors.bg },
  gameDate: { ...t.h4, color: colors.text },
  gameSets: { ...t.sm, color: colors.textMuted },

  tableHeader: { flexDirection: 'row', paddingHorizontal: sp.lg, paddingVertical: sp.sm, backgroundColor: colors.bg },
  tableRow: { flexDirection: 'row', paddingHorizontal: sp.lg, paddingVertical: sp.md, borderTopWidth: 1, borderTopColor: colors.bg },
  tableTotals: { backgroundColor: colors.primaryLight },
  tableCell: { flex: 1, textAlign: 'center', ...t.body, color: colors.text },
  tableCellSet: { flex: 0.6, textAlign: 'left', ...t.label, color: colors.textMuted },

  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.xxl, alignItems: 'center', gap: sp.md },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { ...t.h3, color: colors.text },
  emptySub: { ...t.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
