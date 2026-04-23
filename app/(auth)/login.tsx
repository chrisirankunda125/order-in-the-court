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

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Missing fields', 'Enter your email and password.')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) Alert.alert('Login failed', error.message)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + sp['4xl'], paddingBottom: insets.bottom + sp.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Text style={styles.logoEmoji}>🏐</Text>
        </View>

        <Text style={styles.appName}>Order in the Court</Text>
        <Text style={styles.tagline}>Track your game. Own your training.</Text>

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
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.footerLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: sp.xl, alignItems: 'stretch' },

  logoMark: {
    width: 72, height: 72, borderRadius: radius.xxl,
    backgroundColor: colors.primaryLight, justifyContent: 'center',
    alignItems: 'center', alignSelf: 'center', marginBottom: sp.xl,
    ...shadow.md,
  },
  logoEmoji: { fontSize: 36 },

  appName: { ...t.h1, color: colors.text, textAlign: 'center', marginBottom: sp.xs },
  tagline: { ...t.body, color: colors.textMuted, textAlign: 'center', marginBottom: sp['3xl'] * 1.5 },

  form: { gap: sp.lg, marginBottom: sp['3xl'] },
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
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: sp.lg,
    alignItems: 'center',
    marginTop: sp.sm,
    ...shadow.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...t.h3, color: '#fff' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...t.body, color: colors.textMuted },
  footerLink: { ...t.body, color: colors.primary, fontWeight: '600' },
})
