import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Player = { id: string; name: string; jersey_number: number | null; position: string | null }
type Lineup = { id: string; title: string; slots: { position_number: number; player: Player }[] }

// Volleyball court positions (serve-receive order 1-6)
//  Pos layout on court diagram:
//  [4]  [3]  [2]   ← back row
//  [5]  [6]  [1]   ← front row
const COURT_POSITIONS = [
  { pos: 4, row: 0, col: 0 },
  { pos: 3, row: 0, col: 1 },
  { pos: 2, row: 0, col: 2 },
  { pos: 5, row: 1, col: 0 },
  { pos: 6, row: 1, col: 1 },
  { pos: 1, row: 1, col: 2 },
]

export default function LineupsScreen() {
  const [lineups, setLineups] = useState<Lineup[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [builderVisible, setBuilderVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<Lineup | null>(null)

  // Builder state
  const [title, setTitle] = useState('')
  const [slots, setSlots] = useState<Record<number, Player | null>>({
    1: null, 2: null, 3: null, 4: null, 5: null, 6: null,
  })
  const [pickingSlot, setPickingSlot] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const [{ data: lineupsData }, { data: playersData }] = await Promise.all([
      supabase
        .from('lineups')
        .select('id, title, lineup_slots(position_number, players(id, name, jersey_number, position))')
        .eq('coach_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('players')
        .select('id, name, jersey_number, position')
        .eq('coach_id', user!.id)
        .order('name'),
    ])

    if (playersData) setPlayers(playersData)
    if (lineupsData) {
      setLineups(
        lineupsData.map((l: any) => ({
          id: l.id,
          title: l.title,
          slots: (l.lineup_slots ?? []).map((s: any) => ({
            position_number: s.position_number,
            player: s.players,
          })),
        }))
      )
    }
    setLoading(false)
  }

  const openBuilder = (lineup?: Lineup) => {
    setEditTarget(lineup ?? null)
    setTitle(lineup?.title ?? '')
    const initial: Record<number, Player | null> = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null }
    lineup?.slots.forEach((s) => { initial[s.position_number] = s.player })
    setSlots(initial)
    setPickingSlot(null)
    setBuilderVisible(true)
  }

  const assignPlayer = (player: Player) => {
    if (pickingSlot === null) return
    // If player already in another slot, clear that slot
    const newSlots = { ...slots }
    Object.entries(newSlots).forEach(([pos, p]) => {
      if (p?.id === player.id) newSlots[parseInt(pos)] = null
    })
    newSlots[pickingSlot] = player
    setSlots(newSlots)
    setPickingSlot(null)
  }

  const clearSlot = (pos: number) => {
    setSlots((s) => ({ ...s, [pos]: null }))
  }

  const handleSave = async () => {
    if (!title.trim()) return Alert.alert('Title required', 'Give this lineup a name.')
    const filled = Object.values(slots).filter(Boolean).length
    if (filled === 0) return Alert.alert('Empty lineup', 'Assign at least one player.')

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    let lineupId = editTarget?.id
    if (editTarget) {
      await supabase.from('lineups').update({ title: title.trim() }).eq('id', lineupId)
      await supabase.from('lineup_slots').delete().eq('lineup_id', lineupId)
    } else {
      const { data, error } = await supabase
        .from('lineups')
        .insert({ coach_id: user!.id, title: title.trim() })
        .select('id')
        .single()
      if (error) { Alert.alert('Error', error.message); setSaving(false); return }
      lineupId = data.id
    }

    const slotRows = Object.entries(slots)
      .filter(([, p]) => p !== null)
      .map(([pos, p]) => ({ lineup_id: lineupId, player_id: p!.id, position_number: parseInt(pos) }))

    if (slotRows.length > 0) {
      const { error } = await supabase.from('lineup_slots').insert(slotRows)
      if (error) Alert.alert('Error', error.message)
    }

    setSaving(false)
    setBuilderVisible(false)
    loadData()
  }

  const handleDelete = (lineup: Lineup) => {
    Alert.alert('Delete Lineup', `Delete "${lineup.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('lineups').delete().eq('id', lineup.id)
          loadData()
        }
      },
    ])
  }

  const usedPlayerIds = new Set(Object.values(slots).filter(Boolean).map((p) => p!.id))

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lineups</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openBuilder()}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <FlatList
          data={lineups}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>No lineups yet. Build one!</Text>}
          renderItem={({ item }) => (
            <View style={styles.lineupCard}>
              <View style={styles.lineupCardHeader}>
                <Text style={styles.lineupTitle}>{item.title}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={() => openBuilder(item)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteLink}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.miniCourt}>
                {COURT_POSITIONS.map(({ pos, row, col }) => {
                  const slot = item.slots.find((s) => s.position_number === pos)
                  return (
                    <View key={pos} style={[styles.miniSlot, { top: row * 44, left: col * 80 }]}>
                      <Text style={styles.miniSlotPos}>{pos}</Text>
                      <Text style={styles.miniSlotName} numberOfLines={1}>
                        {slot ? slot.player.name.split(' ')[0] : '—'}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}
        />
      )}

      {/* Builder modal */}
      <Modal visible={builderVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{editTarget ? 'Edit Lineup' : 'New Lineup'}</Text>

          <TextInput
            style={styles.titleInput}
            placeholder="Lineup name (e.g. Serve Receive A)"
            value={title}
            onChangeText={setTitle}
          />

          {/* Court diagram */}
          <Text style={styles.sectionLabel}>Court — tap a position to assign</Text>
          <View style={styles.court}>
            {/* Net line */}
            <View style={styles.net} />
            {COURT_POSITIONS.map(({ pos, row, col }) => {
              const player = slots[pos]
              const isPicking = pickingSlot === pos
              return (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.courtSlot,
                    { top: row * 80 + 8, left: col * 100 + 8 },
                    isPicking && styles.courtSlotPicking,
                    player && styles.courtSlotFilled,
                  ]}
                  onPress={() => player ? clearSlot(pos) : setPickingSlot(isPicking ? null : pos)}
                  onLongPress={() => clearSlot(pos)}
                >
                  <Text style={styles.courtSlotPos}>{pos}</Text>
                  {player ? (
                    <Text style={styles.courtSlotName} numberOfLines={1}>
                      {player.name.split(' ')[0]}
                    </Text>
                  ) : (
                    <Text style={styles.courtSlotEmpty}>tap</Text>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {pickingSlot !== null && (
            <View style={styles.pickerSection}>
              <Text style={styles.sectionLabel}>Assign to position {pickingSlot}</Text>
              {players.length === 0 ? (
                <Text style={styles.empty}>No players on roster. Add some first.</Text>
              ) : (
                players.map((p) => {
                  const isUsed = usedPlayerIds.has(p.id) && slots[pickingSlot]?.id !== p.id
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.playerPickRow, isUsed && styles.playerPickRowUsed]}
                      onPress={() => !isUsed && assignPlayer(p)}
                      disabled={isUsed}
                    >
                      <Text style={styles.playerPickJersey}>#{p.jersey_number ?? '—'}</Text>
                      <Text style={[styles.playerPickName, isUsed && { color: '#9ca3af' }]}>
                        {p.name}
                      </Text>
                      <Text style={styles.playerPickPos}>{p.position ?? ''}</Text>
                    </TouchableOpacity>
                  )
                })
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setBuilderVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Lineup'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  addBtn: { backgroundColor: '#1a56db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 40 },
  lineupCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  lineupCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  lineupTitle: { fontSize: 17, fontWeight: '700' },
  editLink: { color: '#1a56db', fontWeight: '600', fontSize: 14 },
  deleteLink: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  miniCourt: { height: 88, position: 'relative' },
  miniSlot: { position: 'absolute', width: 70, height: 36, backgroundColor: '#eff6ff', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  miniSlotPos: { fontSize: 9, color: '#6b7280', position: 'absolute', top: 2, left: 4 },
  miniSlotName: { fontSize: 12, fontWeight: '600', color: '#1e3a5f' },
  // Builder modal
  modal: { flex: 1, backgroundColor: '#fff' },
  modalContent: { padding: 24, paddingTop: 48, paddingBottom: 60 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  titleInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 8 },
  court: { backgroundColor: '#15803d', borderRadius: 12, height: 180, position: 'relative', marginBottom: 24 },
  net: { position: 'absolute', top: 88, left: 0, right: 0, height: 3, backgroundColor: '#fff', opacity: 0.5, zIndex: 1 },
  courtSlot: { position: 'absolute', width: 88, height: 70, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  courtSlotPicking: { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: '#fff' },
  courtSlotFilled: { backgroundColor: 'rgba(26,86,219,0.7)', borderColor: '#93c5fd' },
  courtSlotPos: { fontSize: 10, color: 'rgba(255,255,255,0.6)', position: 'absolute', top: 4, left: 6 },
  courtSlotName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  courtSlotEmpty: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  pickerSection: { marginBottom: 16 },
  playerPickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#f9fafb', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  playerPickRowUsed: { opacity: 0.4 },
  playerPickJersey: { color: '#1a56db', fontWeight: '700', width: 32 },
  playerPickName: { flex: 1, fontSize: 15, fontWeight: '600' },
  playerPickPos: { color: '#6b7280', fontSize: 13 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontSize: 16 },
  saveBtn: { flex: 1, backgroundColor: '#1a56db', borderRadius: 10, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
