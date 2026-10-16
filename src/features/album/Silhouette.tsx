import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

// How far the white sticker edge reaches past the shape, in viewBox units.
const EDGE = 7;

function Shape({ fill, grow }: { fill: string; grow: number }) {
  const stroke = grow > 0 ? fill : undefined;
  return (
    <G stroke={stroke} strokeWidth={grow} strokeLinejoin="round" strokeLinecap="round">
      <Path d="M68 84 C88 84 92 66 82 58" stroke={fill} strokeWidth={7 + grow} fill="none" />
      <Ellipse cx={50} cy={70} rx={24} ry={20} fill={fill} />
      <Circle cx={50} cy={40} r={17} fill={fill} />
      <Path d="M35 34 L36 14 L49 27 Z" fill={fill} />
      <Path d="M65 34 L64 14 L51 27 Z" fill={fill} />
    </G>
  );
}

// A sitting cat in one flat colour, cut out like a sticker with a white edge:
// the shape of what is still to collect, without giving away which cat it is.
export function Silhouette({ size, color, edge }: { size: number; color: string; edge?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      {edge ? <Shape fill={edge} grow={EDGE} /> : null}
      <Shape fill={color} grow={0} />
    </Svg>
  );
}
