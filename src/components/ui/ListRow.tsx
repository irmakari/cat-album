import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useColors } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  // Shown at the end; a chevron is added when the row is a button.
  trailing?: ReactNode;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  // Hides the hairline under the last row of a card.
  last?: boolean;
};

// A row inside a flush card, as in Settings.
export function ListRow({ title, subtitle, leading, trailing, value, onPress, destructive, last }: Props) {
  const colors = useColors();
  const content = (
    <>
      {leading}
      <View style={[styles.body, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
        <View style={styles.texts}>
          <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="callout" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {value ? (
          <Text variant="body" color="textSecondary" numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        ) : null}
        {trailing}
        {onPress && !trailing && !destructive ? (
          <Icon name="chevron.right" size={13} color="textMuted" weight="semibold" />
        ) : null}
      </View>
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
  },
  body: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
  },
  texts: {
    flex: 1,
  },
  value: {
    flexShrink: 1,
  },
});
