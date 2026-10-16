import { SymbolView, type SFSymbol } from 'expo-symbols';

import { useColors, type ColorName } from '@/theme';

type Props = {
  name: SFSymbol;
  size?: number;
  color?: ColorName;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

// SF Symbols, so icons match the system's own. Elsewhere (Android, the web)
// they are left out; every icon here sits beside a label that says the same.
export function Icon({ name, size = 20, color = 'text', weight = 'medium' }: Props) {
  const colors = useColors();
  return <SymbolView name={name} size={size} tintColor={colors[color]} weight={weight} fallback={null} />;
}
