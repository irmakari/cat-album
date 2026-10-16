import { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useColors } from '@/theme';

type Props = {
  // Where the light comes from, as fractions of the box.
  x?: number;
  y?: number;
  // How far it reaches, as a fraction of the box.
  reach?: number;
  // A solid colour; SVG stops ignore the alpha of an rgba() one.
  color?: string;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

// A soft haze of the accent, drawn behind content: the light that lifts a
// header or a hero card off the dark page. Fills its parent unless styled.
export function Glow({ x = 0.5, y = 0, reach = 0.75, color, opacity = 0.18, style }: Props) {
  const colors = useColors();
  const id = `glow${useId().replace(/:/g, '')}`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" accessible={false}>
        <Defs>
          <RadialGradient id={id} cx={`${x * 100}%`} cy={`${y * 100}%`} r={`${reach * 100}%`}>
            <Stop offset="0" stopColor={color ?? colors.accent} stopOpacity={opacity} />
            <Stop offset="1" stopColor={color ?? colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
