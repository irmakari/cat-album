import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PAGE_GUTTER, spacing, useColors } from '@/theme';

import { Text } from './Text';

type Props = Omit<ScrollViewProps, 'children'> & {
  // A tab's large title, drawn in the page rather than in a navigation bar.
  title?: string;
  subtitle?: string;
  // Beside the title, such as a round add button.
  trailing?: ReactNode;
  children: ReactNode;
  // Room kept clear at the bottom, for a floating button.
  bottomInset?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  title,
  subtitle,
  trailing,
  children,
  bottomInset = 0,
  refreshing,
  onRefresh,
  ...rest
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.page}
        // A tab page has no navigation bar, so it keeps clear of the status
        // bar itself; letting iOS add the inset too doubled the gap. Pages
        // under a navigation bar leave that to iOS.
        contentInsetAdjustmentBehavior={title ? 'never' : 'automatic'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.textMuted} />
          ) : undefined
        }
        {...rest}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: title ? insets.top + spacing.md : spacing.lg,
            paddingBottom: insets.bottom + spacing.xxxl + bottomInset,
          },
        ]}
      >
        {title ? (
          <View style={styles.header}>
            <View style={styles.titles}>
              <Text variant="largeTitle" accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="body" color="textSecondary">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {trailing}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </View>
  );
}

// A small uppercase title over a group, with an optional action at its end.
export function SectionTitle({ title, trailing }: { title: string; trailing?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="eyebrow" color="textSecondary" accessibilityRole="header">
        {title}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PAGE_GUTTER,
    gap: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -spacing.md,
    paddingHorizontal: spacing.xs,
  },
});
