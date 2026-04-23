import { Tabs } from 'expo-router'

export default function CoachLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
      <Tabs.Screen name="roster" options={{ title: 'Roster' }} />
      <Tabs.Screen name="lineups" options={{ title: 'Lineups' }} />
      <Tabs.Screen name="game" options={{ title: 'Game' }} />
      <Tabs.Screen name="training-load" options={{ title: 'Training' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
