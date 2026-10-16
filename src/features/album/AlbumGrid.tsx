import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, Text as SvgText } from 'react-native-svg';

import { Text } from '@/components/ui';
import { SavedCatArt } from '@/features/cats/CatArt';
import { radii, spacing, typography, useColors } from '@/theme';

import { slotNumber, type AlbumCard } from './album';
import { Silhouette } from './Silhouette';

export const ART = 92;

// A soft shadow under whatever is drawn, following its outline rather than a
// box: iOS shades a transparent view by the alpha of its content, Android
// needs the drop-shadow filter for the same.
function stickerShadow(color: string): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: { shadowColor: color, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
    default: { filter: [{ dropShadow: { offsetX: 0, offsetY: 4, standardDeviation: 6, color } }] },
  });
}

// The breed name, blurred until it is collected: there is something to find,
// not a spoiler of what. Drawn in SVG, which blurs the same on both platforms.
function HiddenName({ name }: { name: string }) {
  const colors = useColors();
  const { fontFamily, fontSize, lineHeight } = typography.callout;
  return (
    <Svg width="100%" height={lineHeight} accessible={false}>
      <Defs>
        <Filter id="hidden-name" x="-10%" y="-60%" width="120%" height="220%">
          <FeGaussianBlur stdDeviation={3} />
        </Filter>
      </Defs>
      <SvgText
        x="50%"
        y={fontSize}
        textAnchor="middle"
        fontFamily={fontFamily}
        fontSize={fontSize}
        fill={colors.textSecondary}
        filter="url(#hidden-name)"
      >
        {name}
      </SvgText>
    </Svg>
  );
}

type TileProps = {
  number: number;
  name: string;
  count: number;
  // The collected cat's art, or nothing while the slot is still to collect.
  art: ReactNode | null;
  onPress?: () => void;
};

// One slot of an album: a sticker, or the silhouette of one still to find,
// with its number and name underneath.
export function AlbumTile({ number, name, count, art, onPress }: TileProps) {
  const colors = useColors();
  const collected = art != null;

  const body = (
    <>
      <View style={[styles.art, stickerShadow(colors.stickerShadow)]}>
        {art ?? <Silhouette size={ART} color={colors.silhouette} edge={colors.stickerEdge} />}
        {count > 1 ? (
          <View style={[styles.count, { backgroundColor: colors.accent, borderColor: colors.background }]}>
            <Text variant="caption" color="onAccent">
              ×{count}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.caption}>
        <Text variant="callout" color="textSecondary" align="center" style={styles.number}>
          {slotNumber(number)}
        </Text>
        {collected ? (
          <Text variant="callout" color="text" numberOfLines={1} align="center" style={styles.name}>
            {name}
          </Text>
        ) : (
          <HiddenName name={name} />
        )}
      </View>
    </>
  );

  if (!collected || !onPress) {
    return (
      <View
        style={styles.tile}
        accessible
        accessibilityLabel={collected ? `${slotNumber(number)}, ${name}` : `${slotNumber(number)}, not collected yet`}
      >
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${count} ${count === 1 ? 'cat' : 'cats'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

export function AlbumTiles({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function AlbumGrid({ cards }: { cards: AlbumCard[] }) {
  return (
    <AlbumTiles>
      {cards.map((card) => (
        <AlbumTile
          key={card.breed.id}
          number={card.number}
          name={card.breed.name}
          count={card.count}
          art={card.latest ? <SavedCatArt cat={card.latest} size={ART} /> : null}
          onPress={() => router.push({ pathname: '/breed/[id]', params: { id: card.breed.id } })}
        />
      ))}
    </AlbumTiles>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    rowGap: spacing.xxl,
  },
  tile: {
    width: '33.333%',
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: spacing.md,
  },
  art: {
    width: ART,
    height: ART,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  number: {
    fontFamily: typography.headline.fontFamily,
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  name: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.xs,
  },
  count: {
    position: 'absolute',
    top: -2,
    right: -6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 2,
    borderRadius: radii.pill,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});
