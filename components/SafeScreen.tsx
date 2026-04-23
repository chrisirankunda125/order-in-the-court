import { ReactNode } from 'react'
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../lib/theme'

type Props = {
  children: ReactNode
  dark?: boolean
  style?: ViewStyle
  noBottom?: boolean
}

export function SafeScreen({ children, dark = false, style, noBottom = false }: Props) {
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.base,
        dark ? styles.dark : styles.light,
        {
          paddingTop: insets.top,
          paddingBottom: noBottom ? 0 : insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      <StatusBar barStyle={dark ? 'light-content' : 'dark-content'} />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  base:  { flex: 1 },
  light: { backgroundColor: colors.bg },
  dark:  { backgroundColor: colors.bgDark },
})
