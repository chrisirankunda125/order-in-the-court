import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// During static SSR export, Node.js has no `window` — use a no-op storage.
// In the browser, use localStorage (faster than AsyncStorage on web).
// On native (iOS/Android), use AsyncStorage.
function getStorage() {
  if (Platform.OS !== 'web') return AsyncStorage
  if (typeof window === 'undefined') {
    // SSR / static render — no-op so Supabase doesn't crash Node
    return {
      getItem: (_key: string) => Promise.resolve(null),
      setItem: (_key: string, _value: string) => Promise.resolve(),
      removeItem: (_key: string) => Promise.resolve(),
    }
  }
  return window.localStorage
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
})
