import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, useColors, type ColorName, type TextVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
};

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const colors = useColors();
  return (
    <RNText
      maxFontSizeMultiplier={1.4}
      style={[typography[variant], { color: colors[color] }, align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
