import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow, typeColor } from '../../lib/theme'

const SESSION_TYPES = ['Gym', 'Cardio', 'Drills', 'Skills', 'Recovery', 'Other']

const TYPE_EMOJI: Record<string, string> = {
  Gym: '🏋️', Cardio: '🏃', Drills: '🏐', Skills: '🎯', Recovery: '🧘', Other: '⚡️',
}

function RatingRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          style={[styles.ratingBtn, i <= value && styles.ratingBtnActive]}
          onPress={() => onChange(i)}
        >
          <Text style={[styles.ratingNum, i <= value && styles.ratingNumActive]}>{i}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default function LogTrainingScreen() {
  const insets = useSafeAreaInsets()
  const [type, setType] = useState('Gym')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [bodyFeel, setBodyFeel] = useState(3)
  const [notes, setNotes] = useState('')
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    })
    if (!result.canceled) setPhotoUri(result.assets[0].uri)
  }

  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoUri) return null
    setUploadingPhoto(true)
    const ext = photoUri.split('.').pop() ?? 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`

    try {
      const response = await fetch(photoUri)
      const blob = await response.blob()
      const { error } = await supabase.storage
        .from('training-media')
        .upload(path, blob, { contentType: `image/${ext}` })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('training-media').getPublicUrl(path)
      return publicUrl
    } catch (e: any) {
      Alert.alert('Photo upload failed', e.message)
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!duration || parseInt(duration) <= 0) {
      return Alert.alert('Missing duration', 'How long did you train?')
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const mediaUrl = await uploadPhoto(user!.id)

    const { error } = await supabase.from('training_sessions').insert({
      player_id: user!.id,
      type,
      duration_minutes: parseInt(duration),
      intensity,
      body_feel: bodyFeel,
      notes: notes.trim() || null,
      media_url: mediaUrl,
    })

    setSaving(false)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      // Reset
      setDuration('')
      setNotes('')
      setType('Gym')
      setIntensity(3)
      setBodyFeel(3)
      setPhotoUri(null)
      Alert.alert('Logged! 💪', 'Session saved to your activity feed.')
    }
  }

  const accent = typeColor[type] ?? colors.primary

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp['4xl'] }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Log Training</Text>

      {/* Type picker */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionLabel}>Session Type</Text>
        <View style={styles.typeGrid}>
          {SESSION_TYPES.map((tp) => {
            const col = typeColor[tp] ?? colors.textMuted
            const active = type === tp
            return (
              <TouchableOpacity
                key={tp}
                style={[styles.typeBtn, active && { backgroundColor: col + '18', borderColor: col }]}
                onPress={() => setType(tp)}
              >
                <Text style={styles.typeEmoji}>{TYPE_EMOJI[tp]}</Text>
                <Text style={[styles.typeName, active && { color: col, fontWeight: '700' }]}>{tp}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Duration */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.durationRow}>
          <TextInput
            style={styles.durationInput}
            keyboardType="number-pad"
            placeholder="60"
            value={duration}
            onChangeText={setDuration}
          />
          <Text style={styles.durationUnit}>minutes</Text>
        </View>
        {/* Quick select */}
        <View style={styles.quickRow}>
          {[30, 45, 60, 90, 120].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.quickChip, duration === String(m) && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
              onPress={() => setDuration(String(m))}
            >
              <Text style={[styles.quickChipText, duration === String(m) && { color: colors.primary, fontWeight: '700' }]}>{m}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Intensity & feel */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionLabel}>How hard? <Text style={styles.sectionSub}>(Intensity)</Text></Text>
        <RatingRow value={intensity} onChange={setIntensity} />
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabelLeft}>Easy</Text>
          <Text style={styles.ratingLabelRight}>Max effort</Text>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: sp.lg }]}>Body feel <Text style={styles.sectionSub}>(Recovery)</Text></Text>
        <RatingRow value={bodyFeel} onChange={setBodyFeel} />
        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabelLeft}>Rough</Text>
          <Text style={styles.ratingLabelRight}>Great</Text>
        </View>
      </View>

      {/* Notes + photo */}
      <View style={[styles.card, shadow.sm]}>
        <Text style={styles.sectionLabel}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="What did you work on? Any PRs? How did it feel?"
          placeholderTextColor={colors.textMuted}
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <Text style={[styles.sectionLabel, { marginTop: sp.lg }]}>Photo</Text>
        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
            <Text style={styles.photoBtnText}>📷  Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: accent }, (saving || uploadingPhoto) && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving || uploadingPhoto}
      >
        {(saving || uploadingPhoto) ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Session</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: sp.xl, gap: sp.lg },
  title: { ...t.h1, color: colors.text },

  card: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: sp.lg },
  sectionLabel: { ...t.label, color: colors.textSub, letterSpacing: 0.3, marginBottom: sp.md },
  sectionSub: { fontWeight: '400', color: colors.textMuted },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm },
  typeBtn: {
    width: '30.5%', borderRadius: radius.lg, padding: sp.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bg, gap: sp.xs,
  },
  typeEmoji: { fontSize: 24 },
  typeName: { ...t.sm, color: colors.textSub },

  durationRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.md },
  durationInput: {
    width: 100, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: sp.lg, paddingVertical: sp.md,
    fontSize: 28, fontWeight: '800', color: colors.text, textAlign: 'center',
  },
  durationUnit: { ...t.h3, color: colors.textMuted },
  quickRow: { flexDirection: 'row', gap: sp.sm },
  quickChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: sp.md, paddingVertical: sp.xs },
  quickChipText: { ...t.sm, color: colors.textSub },

  ratingRow: { flexDirection: 'row', gap: sp.sm },
  ratingBtn: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  ratingBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ratingNum: { ...t.h4, color: colors.textMuted },
  ratingNumActive: { color: '#fff' },
  ratingLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: sp.xs },
  ratingLabelLeft: { ...t.xs, color: colors.textMuted },
  ratingLabelRight: { ...t.xs, color: colors.textMuted },

  notesInput: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    padding: sp.md, ...t.body, color: colors.text, height: 100,
    textAlignVertical: 'top',
  },
  photoBtn: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg,
    borderStyle: 'dashed', padding: sp.xl, alignItems: 'center',
  },
  photoBtnText: { ...t.body, color: colors.textMuted },
  photoPreview: { position: 'relative' },
  photo: { width: '100%', height: 200, borderRadius: radius.lg },
  removePhoto: { position: 'absolute', top: sp.sm, right: sp.sm, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.md, paddingHorizontal: sp.md, paddingVertical: sp.xs },

  saveBtn: { borderRadius: radius.xl, padding: sp.lg + 2, alignItems: 'center', ...shadow.md },
  saveBtnText: { ...t.h3, color: '#fff' },
})
