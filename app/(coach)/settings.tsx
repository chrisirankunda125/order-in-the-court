import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function SettingsScreen() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Error', error.message)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb', paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 32 },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 16, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 16 },
})
