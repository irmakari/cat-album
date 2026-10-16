import { StyleSheet, useColorScheme, View } from 'react-native';

import { fonts } from '@/theme';

import { Text } from './Text';

// Warm, quiet pastels on the light page; on the dark one, deep jewel tints
// with their own bright initial. Each username always gets the same one.
const ink = '#3A2E26';
const lightTones = [
  { fill: '#F2C6A8', ink },
  { fill: '#E9D3A1', ink },
  { fill: '#BFD8C2', ink },
  { fill: '#B9CFE3', ink },
  { fill: '#D7C2E6', ink },
  { fill: '#EDBFC6', ink },
];
const darkTones = [
  { fill: '#11393A', ink: '#5EEAD4' },
  { fill: '#1A2B4D', ink: '#93B4FF' },
  { fill: '#2B2148', ink: '#C4A8FF' },
  { fill: '#3D1F31', ink: '#FF9EC0' },
  { fill: '#3A2E15', ink: '#F8CF6E' },
  { fill: '#11334A', ink: '#7DD3FC' },
];

function toneFor(name: string, tones: typeof lightTones) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

type Props = {
  name: string;
  size?: number;
  // A coloured ring around it, such as a medal's.
  ring?: string;
};

export function Avatar({ name, size = 44, ring }: Props) {
  const initial = name.replace(/^@/, '').charAt(0).toUpperCase() || '?';
  const tone = toneFor(name, useColorScheme() === 'dark' ? darkTones : lightTones);
  return (
    <View
      accessible={false}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tone.fill,
          borderColor: ring ?? `${tone.ink}33`,
          borderWidth: ring ? Math.max(2, size * 0.045) : 1,
        },
      ]}
    >
      <Text style={{ fontFamily: fonts.semibold, fontSize: size * 0.42, lineHeight: size * 0.56, color: tone.ink }}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
