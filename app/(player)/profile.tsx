import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Image, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow } from '../../lib/theme'

const POSITIONS = ['S', 'OH', 'MB', 'OPP', 'L', 'DS']

type Profile = {
  jersey_number: number | null
  position: string | null
  height: string | null
  bio: string | null
  profile_photo_url: string | null
}

type RosterEntry = { id: string; name: string; coach_id: string }

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile>({ jersey_number: null, position: null, height: null, bio: null, profile_photo_url: null })
  const [rosterEntry, setRosterEntry] = useState<RosterEntry | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Invite / join flow
  const [inviteCode, setInviteCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [unclaimed, setUnclaimed] = useState<{ id: string; name: string; jersey_number: number | null }[]>([])
  const [showRosterPicker, setShowRosterPicker] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setEmail(user.email ?? '')

    const [profileRes, rosterRes] = await Promise.all([
      supabase.from('player_profiles').select('*').eq('id', user.id).single(),
      supabase.from('players').select('id, name, coach_id').eq('user_id', user.id).single(),
    ])

    if (profileRes.data) setProfile(profileRes.data)
    if (rosterRes.data) setRosterEntry(rosterRes.data)
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('player_profiles').upsert({
      id: user!.id,
      jersey_number: profile.jersey_number,
      position: profile.position,
      height: profile.height,
      bio: profile.bio,
      profile_photo_url: profile.profile_photo_url,
    })
    setSaving(false)
    if (error) Alert.alert('Error', error.message)
    else setEditing(false)
  }

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled) return

    const uri = result.assets[0].uri
    const ext = uri.split('.').pop() ?? 'jpg'
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user!.id}/avatar.${ext}`

    const response = await fetch(uri)
    const blob = await response.blob()
    const { error } = await supabase.storage.from('training-media').upload(path, blob, { upsert: true, contentType: `image/${ext}` })
    if (error) { Alert.alert('Upload failed', error.message); return }

    const { data: { publicUrl } } = supabase.storage.from('training-media').getPublicUrl(path)
    setProfile((p) => ({ ...p, profile_photo_url: publicUrl }))
  }

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) return Alert.alert('Enter a code', 'Ask your coach for the invite code.')
    setJoinLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Find coach with this invite code
    const { data: coach, error } = await supabase
      .from('coach_profiles')
      .select('id')
      .ilike('invite_code', inviteCode.trim())
      .single()

    if (error || !coach) {
      setJoinLoading(false)
      return Alert.alert('Code not found', 'Double-check the invite code with your coach.')
    }

    // Check if already on team
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('coach_id', coach.id)
      .eq('player_id', user!.id)
      .single()

    if (existing) {
      setJoinLoading(false)
      return Alert.alert('Already on team', 'You\'re already a member of this team.')
    }

    // Add to team_members
    await supabase.from('team_members').insert({ coach_id: coach.id, player_id: user!.id })

    // Load unclaimed roster entries so player can claim their spot
    const { data: roster } = await supabase
      .from('players')
      .select('id, name, jersey_number')
      .eq('coach_id', coach.id)
      .is('user_id', null)

    setJoinLoading(false)

    if (roster && roster.length > 0) {
      setUnclaimed(roster)
      setShowRosterPicker(true)
    } else {
      Alert.alert('Joined!', 'You\'ve joined the team. Ask your coach to add you to the roster.')
      loadProfile()
    }
  }

  const handleClaimSpot = async (playerId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('players')
      .update({ user_id: user!.id })
      .eq('id', playerId)

    if (error) { Alert.alert('Error', error.message); return }
    setShowRosterPicker(false)
    Alert.alert('Claimed!', 'Your roster spot is set. Your stats will now appear here.')
    loadProfile()
  }

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp['4xl'] }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarRow}>
        <TouchableOpacity onPress={editing ? handlePickPhoto : undefined} style={styles.avatarWrap}>
          {profile.profile_photo_url ? (
            <Image source={{ uri: profile.profile_photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{email[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          {editing && <View style={styles.avatarEdit}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>EDIT</Text></View>}
        </TouchableOpacity>
        <View>
          <Text style={styles.emailText}>{email}</Text>
          {rosterEntry && <Text style={styles.rosterTag}>#{profile.jersey_number ?? '—'} · {rosterEntry.name}</Text>}
        </View>
      </View>

      {/* Profile card */}
      <View style={[styles.card, shadow.sm]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>My Info</Text>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)}><Text style={styles.editLink}>Edit</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={styles.editLink}>{saving ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Field label="Jersey #" editing={editing}>
          {editing ? (
            <TextInput style={styles.fieldInput} keyboardType="number-pad" value={profile.jersey_number?.toString() ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, jersey_number: v ? parseInt(v) : null }))} placeholder="7" />
          ) : (
            <Text style={styles.fieldValue}>#{profile.jersey_number ?? '—'}</Text>
          )}
        </Field>

        <Field label="Position" editing={editing}>
          {editing ? (
            <View style={styles.chipRow}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity key={pos} style={[styles.chip, profile.position === pos && styles.chipActive]} onPress={() => setProfile((p) => ({ ...p, position: p.position === pos ? null : pos }))}>
                  <Text style={[styles.chipText, profile.position === pos && styles.chipTextActive]}>{pos}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.fieldValue}>{profile.position ?? '—'}</Text>
          )}
        </Field>

        <Field label="Height" editing={editing}>
          {editing ? (
            <TextInput style={styles.fieldInput} value={profile.height ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, height: v }))} placeholder="6'2&quot;" />
          ) : (
            <Text style={styles.fieldValue}>{profile.height ?? '—'}</Text>
          )}
        </Field>

        <Field label="Bio" editing={editing} last>
          {editing ? (
            <TextInput style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]} value={profile.bio ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, bio: v }))} placeholder="Tell your team about yourself…" multiline />
          ) : (
            <Text style={styles.fieldValue}>{profile.bio || '—'}</Text>
          )}
        </Field>
      </View>

      {/* Join team */}
      {!rosterEntry && !showRosterPicker && (
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Join a Team</Text>
          <Text style={styles.joinSub}>Enter the invite code from your coach</Text>
          <View style={styles.joinRow}>
            <TextInput
              style={[styles.fieldInput, { flex: 1, textTransform: 'uppercase', letterSpacing: 4 }]}
              placeholder="e.g. DANNY7"
              autoCapitalize="characters"
              maxLength={8}
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            <TouchableOpacity style={styles.joinBtn} onPress={handleJoinTeam} disabled={joinLoading}>
              <Text style={styles.joinBtnText}>{joinLoading ? '…' : 'Join'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Claim roster spot */}
      {showRosterPicker && unclaimed.length > 0 && (
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.cardTitle}>Which one is you?</Text>
          <Text style={styles.joinSub}>Your coach has added these players — tap your name</Text>
          {unclaimed.map((p) => (
            <TouchableOpacity key={p.id} style={styles.rosterRow} onPress={() => handleClaimSpot(p.id)}>
              <View style={styles.rosterJersey}><Text style={styles.rosterJerseyNum}>#{p.jersey_number ?? '?'}</Text></View>
              <Text style={styles.rosterName}>{p.name}</Text>
              <Text style={{ color: colors.primary }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutBtn, shadow.sm]} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({ label, children, editing, last }: { label: string; children: React.ReactNode; editing: boolean; last?: boolean }) {
  return (
    <View style={[styles.fieldRow, !last && styles.fieldBorder]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: sp.xl, gap: sp.lg },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: sp.lg, marginBottom: sp.sm },
  avatarWrap: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: colors.primary },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 4, paddingVertical: 2 },
  emailText: { ...t.h4, color: colors.text },
  rosterTag: { ...t.sm, color: colors.textMuted, marginTop: 2 },

  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.lg },
  cardTitle: { ...t.h3, color: colors.text },
  editLink: { ...t.body, color: colors.primary, fontWeight: '600' },

  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: sp.md, gap: sp.md },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: colors.bg },
  fieldLabel: { ...t.label, color: colors.textMuted, width: 80 },
  fieldValue: { ...t.body, color: colors.text },
  fieldInput: { ...t.body, color: colors.text, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: radius.md, paddingHorizontal: sp.md, paddingVertical: sp.sm, backgroundColor: colors.bg },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs, justifyContent: 'flex-end' },
  chip: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: radius.full, paddingHorizontal: sp.md, paddingVertical: sp.xs },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { ...t.sm, color: colors.textSub },
  chipTextActive: { color: colors.primary, fontWeight: '700' },

  joinSub: { ...t.sm, color: colors.textMuted, marginBottom: sp.md },
  joinRow: { flexDirection: 'row', gap: sp.sm, alignItems: 'center' },
  joinBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: sp.lg, paddingVertical: sp.md },
  joinBtnText: { ...t.h4, color: '#fff' },

  rosterRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: sp.md, gap: sp.md, borderTopWidth: 1, borderTopColor: colors.bg },
  rosterJersey: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  rosterJerseyNum: { ...t.label, color: colors.primary },
  rosterName: { ...t.h4, color: colors.text, flex: 1 },

  logoutBtn: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.lg, alignItems: 'center' },
  logoutText: { ...t.h4, color: colors.live },
})
