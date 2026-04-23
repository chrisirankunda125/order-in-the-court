import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { colors, type as t, sp, radius, shadow } from '../../lib/theme'

type Role = 'coach' | 'player'

const ROLES: { key: Role; emoji: string; title: string; desc: string }[] = [
  { key: 'coach',  emoji: '📋', title: 'Coach',  desc: 'Manage roster, run games, track stats' },
  { key: 'player', emoji: '🏐', title: 'Player', desc: 'Log training, view stats, follow the team' },
]

export default function SignupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('player')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSignup = async () => {
    if (!email || !password) return Alert.alert('Missing fields', 'Fill in all fields.')
    if (password.length < 6) return Alert.alert('Weak password', 'Use at least 6 characters.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    })
    setLoading(false)
    if (error) {
      Alert.alert('Signup failed', error.message)
    } else {
      Alert.alert('Check your email', 'Click the confirmation link, then come back to sign in.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + sp.xl, paddingBottom: insets.bottom + sp.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join your team on Order in the Court.</Text>

        {/* Role picker */}
        <Text style={styles.sectionLabel}>I am a…</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, role === r.key && styles.roleCardActive]}
              onPress={() => setRole(r.key)}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <Text style={[styles.roleTitle, role === r.key && styles.roleTitleActive]}>{r.title}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
              {role === r.key && <View style={styles.roleCheck}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.input, focused === 'email' && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              style={[styles.input, focused === 'password' && styles.inputFocused]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: sp.xl },

  backBtn: { marginBottom: sp.xxl },
  backText: { ...t.body, color: colors.primary, fontWeight: '600' },

  title: { ...t.h1, color: colors.text, marginBottom: sp.xs },
  subtitle: { ...t.body, color: colors.textMuted, marginBottom: sp.xxl },

  sectionLabel: { ...t.label, color: colors.textSub, letterSpacing: 0.3, marginBottom: sp.md },

  roleRow: { flexDirection: 'row', gap: sp.md, marginBottom: sp.xxl },
  roleCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.xl,
    padding: sp.lg, borderWidth: 1.5, borderColor: '#E2E8F0',
    alignItems: 'flex-start', gap: sp.xs, position: 'relative', ...shadow.sm,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleEmoji: { fontSize: 28, marginBottom: sp.xs },
  roleTitle: { ...t.h4, color: colors.text },
  roleTitleActive: { color: colors.primary },
  roleDesc: { ...t.xs, color: colors.textMuted, lineHeight: 16 },
  roleCheck: {
    position: 'absolute', top: sp.md, right: sp.md,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },

  form: { gap: sp.lg },
  fieldGroup: { gap: sp.sm },
  fieldLabel: { ...t.label, color: colors.textSub, letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: sp.lg,
    paddingVertical: sp.md + 2,
    ...t.body,
    color: colors.text,
    ...shadow.sm,
  },
  inputFocused: { borderColor: colors.primary },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: sp.lg, alignItems: 'center',
    marginTop: sp.sm, ...shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...t.h3, color: '#fff' },
})
