import { Pressable, StyleSheet, View } from 'react-native';

import { radii, spacing, useColors } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const colors = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && {
                backgroundColor: colors.accentSoft,
                borderColor: colors.borderStrong,
              },
            ]}
          >
            <Text variant="button" color={selected ? 'accent' : 'textSecondary'} style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: 13,
  },
});
