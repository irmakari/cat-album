import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radii, spacing, typography, useColors } from '@/theme';

import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  error?: string | null;
  hint?: string;
  // Text fixed at the start of the field, such as "@".
  prefix?: string;
};

// A filled block with a faint edge, so a form reads as a few calm blocks;
// the edge turns turquoise on focus.
export function TextField({ label, error, hint, prefix, style, onFocus, onBlur, ...rest }: Props) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="caption" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : focused ? colors.accent : colors.border,
          },
        ]}
      >
        {prefix ? (
          <Text variant="body" color="textMuted">
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          maxFontSizeMultiplier={1.4}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }, style]}
        />
      </View>
      {error ? (
        <Text variant="callout" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="callout" color="textMuted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs + 2,
  },
  label: {
    marginLeft: spacing.xs,
  },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
  },
});
