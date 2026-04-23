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
  Pressable,
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Player = {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
}

const POSITIONS = ['S', 'OH', 'MB', 'OPP', 'L', 'DS']

export default function RosterScreen() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [jersey, setJersey] = useState('')
  const [position, setPosition] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRoster()
    loadInviteCode()
  }, [])

  const loadRoster = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('players')
      .select('*')
      .eq('coach_id', user!.id)
      .order('name')
    if (data) setPlayers(data)
    setLoading(false)
  }

  const loadInviteCode = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('coach_profiles')
      .select('invite_code')
      .eq('id', user!.id)
      .single()
    if (data) setInviteCode(data.invite_code)
  }

  const openAdd = () => {
    setEditTarget(null)
    setName('')
    setJersey('')
    setPosition('')
    setModalVisible(true)
  }

  const openEdit = (player: Player) => {
    setEditTarget(player)
    setName(player.name)
    setJersey(player.jersey_number?.toString() ?? '')
    setPosition(player.position ?? '')
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Enter the player\'s name.')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (editTarget) {
      const { error } = await supabase
        .from('players')
        .update({ name: name.trim(), jersey_number: jersey ? parseInt(jersey) : null, position: position || null })
        .eq('id', editTarget.id)
      if (error) Alert.alert('Error', error.message)
    } else {
      const { error } = await supabase
        .from('players')
        .insert({ coach_id: user!.id, name: name.trim(), jersey_number: jersey ? parseInt(jersey) : null, position: position || null })
      if (error) Alert.alert('Error', error.message)
    }

    setSaving(false)
    setModalVisible(false)
    loadRoster()
  }

  const handleDelete = (player: Player) => {
    Alert.alert('Remove Player', `Remove ${player.name} from the roster?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('players').delete().eq('id', player.id)
          loadRoster()
        }
      },
    ])
  }

  const copyInviteCode = () => {
    Alert.alert('Invite Code', `Share this code with your players:\n\n${inviteCode}`)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Roster</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add Player</Text>
        </TouchableOpacity>
      </View>

      {/* Invite code banner */}
      {inviteCode && (
        <TouchableOpacity style={styles.inviteBanner} onPress={copyInviteCode}>
          <Text style={styles.inviteLabel}>Team Invite Code</Text>
          <Text style={styles.inviteCode}>{inviteCode.toUpperCase()}</Text>
          <Text style={styles.inviteTap}>Tap to share →</Text>
        </TouchableOpacity>
      )}

      {/* Player list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={players}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No players yet. Add one to get started.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.playerRow}>
              <View style={styles.jersey}>
                <Text style={styles.jerseyNum}>{item.jersey_number ?? '—'}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerPos}>{item.position ?? 'No position'}</Text>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{editTarget ? 'Edit Player' : 'Add Player'}</Text>

          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Jordan Smith" />

          <Text style={styles.label}>Jersey Number</Text>
          <TextInput style={styles.input} value={jersey} onChangeText={setJersey} keyboardType="number-pad" placeholder="e.g. 7" />

          <Text style={styles.label}>Position</Text>
          <View style={styles.chipRow}>
            {POSITIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, position === p && styles.chipActive]}
                onPress={() => setPosition(position === p ? '' : p)}
              >
                <Text style={[styles.chipText, position === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  inviteBanner: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteLabel: { color: '#93c5fd', fontSize: 12 },
  inviteCode: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 4, flex: 1, textAlign: 'center' },
  inviteTap: { color: '#93c5fd', fontSize: 12 },
  empty: { color: '#9ca3af', fontSize: 16, textAlign: 'center', marginTop: 48 },
  playerRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  jersey: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  jerseyNum: { color: '#1a56db', fontWeight: '700', fontSize: 14 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600' },
  playerPos: { color: '#6b7280', fontSize: 13 },
  editBtn: { padding: 8 },
  editBtnText: { color: '#1a56db', fontWeight: '600', fontSize: 14 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 16 },
  // Modal
  modal: { flex: 1, padding: 24, paddingTop: 48, backgroundColor: '#fff' },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 14, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  chipText: { color: '#6b7280', fontSize: 14 },
  chipTextActive: { color: '#1a56db', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 16, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontSize: 16 },
  saveBtn: { flex: 1, backgroundColor: '#1a56db', borderRadius: 10, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
