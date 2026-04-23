import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

export default function Index() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/(auth)/login')
        return
      }

      // Read role from user metadata
      const role = user.user_metadata?.role
      if (role === 'coach') {
        router.replace('/(coach)/dashboard')
      } else if (role === 'player') {
        router.replace('/(player)/dashboard')
      } else {
        // No role assigned yet — send back to auth
        router.replace('/(auth)/login')
      }
    })
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  )
}
