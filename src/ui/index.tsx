// Components bàsics. Només fan servir tokens (cap color cru).
import Ionicons from '@expo/vector-icons/Ionicons'
import { Image } from 'expo-image'
import { useState, type ComponentProps, type ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'

import { gifSource } from '@/catalog/gif'
import { colors, fontSize, radius, space } from '@/theme/tokens'

export type IconName = ComponentProps<typeof Ionicons>['name']

// ---------- Text ----------

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number }

export function Title({ children, style }: TextProps) {
  return <Text style={[styles.title, style]}>{children}</Text>
}
export function Heading({ children, style, numberOfLines }: TextProps) {
  return (
    <Text style={[styles.heading, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  )
}
export function Body({ children, style, numberOfLines }: TextProps) {
  return (
    <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  )
}
export function Muted({ children, style, numberOfLines }: TextProps) {
  return (
    <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  )
}
export function SectionLabel({ children, style }: TextProps) {
  return <Text style={[styles.sectionLabel, style]}>{children}</Text>
}

// ---------- Contenidors ----------

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  if (!scroll) return <View style={[styles.screen, styles.screenPad, style]}>{children}</View>
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenPad, styles.scrollEnd, style]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  )
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, style]}>{children}</View>
}

export function Row({ children, style, gap = space[3] }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>
}

export function EmptyState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={40} color={colors.faint} />
      <Muted style={{ textAlign: 'center' }}>{text}</Muted>
    </View>
  )
}

// ---------- Botons ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  label,
  onPress,
  variant = 'secondary',
  icon,
  style,
  disabled,
  compact,
}: {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  icon?: IconName
  style?: StyleProp<ViewStyle>
  disabled?: boolean
  compact?: boolean
}) {
  const fg =
    variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.primary : colors.body
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surface2, borderColor: colors.line, borderWidth: 1 },
        variant === 'danger' && { borderColor: colors.danger, borderWidth: 1 },
        pressed && styles.pressed,
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={fg} /> : null}
      <Text style={[styles.buttonText, compact && { fontSize: fontSize.sm }, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

export function IconButton({
  icon,
  onPress,
  color = colors.subtle,
  label,
  size = 22,
}: {
  icon: IconName
  onPress: () => void
  color?: string
  label: string
  size?: number
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  )
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: colors.primarySoftFg }]}>{label}</Text>
    </Pressable>
  )
}

/** − 3 + */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  format = String,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  format?: (v: number) => string
}) {
  return (
    <Row gap={space[1]}>
      <IconButton icon="remove-circle-outline" label="−" onPress={() => onChange(Math.max(min, value - step))} />
      <Text style={styles.stepperValue}>{format(value)}</Text>
      <IconButton icon="add-circle-outline" label="+" onPress={() => onChange(Math.min(max, value + step))} />
    </Row>
  )
}

export function Field(props: TextInputProps & { style?: StyleProp<TextStyle> }) {
  return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.field, props.style]} />
}

/**
 * Camp que es desa en sortir-ne (o en prémer «fet»). Guarda el text mentre s'escriu.
 * Per reiniciar-lo amb un valor nou de la BD, canvia-li la `key`.
 * Si `onSave` retorna un text, el camp passa a mostrar-lo (p. ex. per desfer un nom buit).
 */
export function SavedField({
  initial,
  onSave,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'onSubmitEditing'> & {
  initial: string
  onSave: (text: string) => Promise<string | void>
  style?: StyleProp<TextStyle>
}) {
  const [value, setValue] = useState(initial)
  const save = async () => {
    const replacement = await onSave(value)
    if (typeof replacement === 'string') setValue(replacement)
  }
  return <Field {...props} value={value} onChangeText={setValue} onBlur={save} onSubmitEditing={save} />
}

// ---------- Exercici ----------

/** GIF de l'exercici. En llistes, `still` mostra només el primer fotograma. */
export function ExerciseImage({ id, size, still }: { id: string; size: number; still?: boolean }) {
  const source = gifSource(id)
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {source ? (
        <Image source={source} style={{ width: size, height: size }} contentFit="cover" autoplay={!still} transition={100} />
      ) : (
        <Ionicons name="barbell-outline" size={size / 2} color={colors.faint} />
      )}
    </View>
  )
}

/** Xifra gran amb etiqueta (rècords, totals). */
export function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[styles.statValue, accent && { color: colors.primary }]}>{value}</Text>
      <Muted style={{ fontSize: fontSize.xs }}>{label}</Muted>
    </View>
  )
}

export const styles = StyleSheet.create({
  title: { color: colors.heading, fontSize: fontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
  heading: { color: colors.heading, fontSize: fontSize.lg, fontWeight: '700' },
  body: { color: colors.body, fontSize: fontSize.md },
  muted: { color: colors.muted, fontSize: fontSize.sm },
  sectionLabel: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: space[4],
  },
  screen: { flex: 1, backgroundColor: colors.canvas },
  screenPad: { padding: space[4], gap: space[3] },
  scrollEnd: { paddingBottom: space[10] * 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space[4],
    gap: space[2],
  },
  pressed: { opacity: 0.7 },
  empty: { alignItems: 'center', gap: space[3], paddingVertical: space[10], paddingHorizontal: space[6] },
  button: {
    minHeight: 48,
    borderRadius: radius.control,
    paddingHorizontal: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: space[3] },
  buttonText: { fontSize: fontSize.md, fontWeight: '700' },
  iconButton: { padding: space[1], borderRadius: radius.pill },
  chip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.subtle, fontSize: fontSize.sm, fontWeight: '600' },
  stepperValue: {
    color: colors.heading,
    fontSize: fontSize.md,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  field: {
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.control,
    color: colors.heading,
    fontSize: fontSize.md,
    paddingHorizontal: space[3],
    minHeight: 48,
  },
  thumb: {
    borderRadius: radius.control,
    overflow: 'hidden',
    backgroundColor: colors.imageBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: colors.heading, fontSize: fontSize.xl, fontWeight: '800', fontVariant: ['tabular-nums'] },
})
