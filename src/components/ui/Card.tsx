import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radii, spacing, useColors } from '@/theme';

import { Glow } from './Glow';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  // Edge to edge content, such as a list of rows.
  flush?: boolean;
  // Lit from the top by the accent, for the one card a page leads with.
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// A card a step lighter than the page, edged by a faint hairline, since a
// shadow barely shows on a dark page.
export function Card({ children, onPress, flush, glow, style, accessibilityLabel }: Props) {
  const colors = useColors();
  const base = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: glow ? colors.borderStrong : colors.border,
      boxShadow: `0 10px 30px ${colors.shadow}`,
    },
    !flush && styles.padded,
    style,
  ];
  const content = glow ? (
    <>
      <Glow x={0.15} y={0} reach={1} opacity={0.14} />
      {children}
    </>
  ) : (
    children
  );
  if (!onPress) return <View style={base}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
});
