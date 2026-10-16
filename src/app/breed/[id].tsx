import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { findBreed } from '@/features/breeds/breeds';
import { SavedCatArt } from '@/features/cats/CatArt';
import { useCats } from '@/features/cats/CatsProvider';
import { formatSeenAt } from '@/features/cats/format';
import { radii, spacing, useColors } from '@/theme';

const ART = 120;

// Every cat of one kind, newest first.
export default function BreedScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const breed = findBreed(id);
  const { cats } = useCats();
  const ofBreed = useMemo(() => (cats ?? []).filter((cat) => cat.breed === id), [cats, id]);

  return (
    <>
      <Stack.Screen options={{ title: breed?.name ?? '' }} />
      <Screen>
        <View style={styles.intro}>
          <Text variant="largeTitle">{breed?.name}</Text>
          <Text variant="body" color="textSecondary">
            {breed?.hint} · {ofBreed.length} {ofBreed.length === 1 ? 'cat' : 'cats'}
          </Text>
        </View>
        <View style={styles.grid}>
          {ofBreed.map((cat) => (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              accessibilityLabel={cat.name ?? 'Unnamed cat'}
              onPress={() => router.push({ pathname: '/cat/[id]', params: { id: cat.id } })}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            >
              <View style={[styles.art, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SavedCatArt cat={cat} size={ART} />
              </View>
              <View style={styles.caption}>
                <Text variant="headline" numberOfLines={1}>
                  {cat.name ?? 'Unnamed'}
                </Text>
                <Text variant="callout" color="textSecondary">
                  {formatSeenAt(cat.seenAt)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  intro: {
    gap: spacing.xxs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
    rowGap: spacing.xl,
  },
  tile: {
    width: '50%',
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  art: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  caption: {
    paddingHorizontal: spacing.xs,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
