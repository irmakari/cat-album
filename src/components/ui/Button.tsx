import type { SFSymbol } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';

import { radii, spacing, useColors, type ColorName } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'plain' | 'destructive';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: Variant;
  icon?: SFSymbol;
  loading?: boolean;
  small?: boolean;
  style?: ViewStyle;
};

const labelColor: Record<Variant, ColorName> = {
  primary: 'onAccent',
  secondary: 'text',
  plain: 'accent',
  destructive: 'danger',
};

// Pills: a glowing turquoise one for the screen's main action, an outlined
// one beside it, and text-only ones for everything quieter.
export function Button({ label, variant = 'primary', icon, loading, small, disabled, style, ...rest }: Props) {
  const colors = useColors();
  const inactive = disabled || loading;
  const background: Record<Variant, string> = {
    primary: colors.accent,
    secondary: colors.surfaceMuted,
    plain: 'transparent',
    destructive: 'transparent',
  };
  const pressedBackground: Record<Variant, string> = {
    primary: colors.accentPressed,
    secondary: colors.surfacePressed,
    plain: 'transparent',
    destructive: 'transparent',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: pressed ? pressedBackground[variant] : background[variant] },
        variant === 'primary' && !disabled && { boxShadow: `0 8px 24px ${colors.glow}` },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.borderStrong },
        pressed && (variant === 'plain' || variant === 'destructive') && styles.pressedText,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors[labelColor[variant]]} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={small ? 14 : 16} color={labelColor[variant]} weight="semibold" /> : null}
          <Text variant="button" color={labelColor[variant]} style={small && styles.smallLabel}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  smallLabel: {
    fontSize: 13,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  pressedText: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.4,
  },
});
