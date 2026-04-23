import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow } from '../../lib/theme'

type QuickStat = { label: string; value: string | number }

const QUICK_ACTIONS = [
  { label: 'Roster',    emoji: '👥', route: '/(coach)/roster' },
  { label: 'Lineups',   emoji: '📐', route: '/(coach)/lineups' },
  { label: 'Game',      emoji: '🏐', route: '/(coach)/game' },
  { label: 'Training',  emoji: '📈', route: '/(coach)/training-load' },
  { label: 'Settings',  emoji: '⚙️',  route: '/(coach)/settings' },
]

export default function CoachDashboard() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [teamName, setTeamName] = useState('My Team')
  const [stats, setStats] = useState<QuickStat[]>([])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, playersRes, lineupsRes] = await Promise.all([
        supabase.from('coach_profiles').select('team_name, invite_code').eq('id', user.id).single(),
        supabase.from('players').select('id', { count: 'exact' }).eq('coach_id', user.id),
        supabase.from('lineups').select('id', { count: 'exact' }).eq('coach_id', user.id),
      ])

      if (profileRes.data?.team_name) setTeamName(profileRes.data.team_name)
      setStats([
        { label: 'Players',  value: playersRes.count ?? 0 },
        { label: 'Lineups',  value: lineupsRes.count ?? 0 },
        { label: 'Invite',   value: profileRes.data?.invite_code?.toUpperCase() ?? '—' },
      ])
    })()
  }, [])

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.xxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Coach</Text>
          <Text style={styles.teamName}>{teamName}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/(coach)/settings')}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Quick stats */}
      {stats.length > 0 && (
        <View style={[styles.statsCard, shadow.md]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < stats.length - 1 && styles.statItemBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Start game CTA */}
      <TouchableOpacity style={[styles.gameCard, shadow.lg]} onPress={() => router.push('/(coach)/game')}>
        <View>
          <Text style={styles.gameCardTitle}>Start a Game</Text>
          <Text style={styles.gameCardSub}>Load a lineup and go live</Text>
        </View>
        <View style={styles.gameCardIcon}>
          <Text style={{ fontSize: 28 }}>🏐</Text>
        </View>
      </TouchableOpacity>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.filter((a) => a.label !== 'Game' && a.label !== 'Settings').map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.actionCard, shadow.sm]}
            onPress={() => router.push(action.route as any)}
          >
            <Text style={styles.actionEmoji}>{action.emoji}</Text>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: sp.xl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.xxl },
  greeting: { ...t.sm, color: colors.textMuted, marginBottom: 2 },
  teamName: { ...t.h1, color: colors.text },
  settingsBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', ...shadow.sm },

  // Stats row
  statsCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, flexDirection: 'row', padding: sp.xl, marginBottom: sp.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statItemBorder: { borderRightWidth: 1, borderRightColor: colors.bg },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 28 },
  statLabel: { ...t.xs, color: colors.textMuted, marginTop: 2 },

  // Game CTA
  gameCard: {
    backgroundColor: colors.primary, borderRadius: radius.xxl,
    padding: sp.xl, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: sp.xxl,
  },
  gameCardTitle: { ...t.h2, color: '#fff', marginBottom: sp.xs },
  gameCardSub: { ...t.sm, color: 'rgba(255,255,255,0.7)' },
  gameCardIcon: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },

  // Quick actions
  sectionTitle: { ...t.h3, color: colors.text, marginBottom: sp.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.md },
  actionCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    padding: sp.lg, alignItems: 'flex-start', gap: sp.sm,
    width: '47%',
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { ...t.h4, color: colors.text },
})
