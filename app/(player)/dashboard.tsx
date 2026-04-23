import { View, Text, StyleSheet } from 'react-native'

export default function PlayerDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Dashboard</Text>
      <Text style={styles.placeholder}>Upcoming matches and recent activity.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f9fafb', paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16 },
  placeholder: { color: '#6b7280', fontSize: 16 },
})
