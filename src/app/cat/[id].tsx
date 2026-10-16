import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card, Glow, ListRow, Screen, SegmentedControl, Text } from '@/components/ui';
import { findBreed } from '@/features/breeds/breeds';
import { SavedCatArt } from '@/features/cats/CatArt';
import { useCats } from '@/features/cats/CatsProvider';
import { formatSeenAt } from '@/features/cats/format';
import { photoUri } from '@/features/cats/photos';
import { useSticker } from '@/features/cats/sticker';
import { radii, spacing, useColors } from '@/theme';

const ART = 260;

export default function CatScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cats, removeCat } = useCats();
  const cat = cats?.find((c) => c.id === id);
  const [view, setView] = useState<'sticker' | 'photo'>('sticker');
  const sticker = useSticker(cat ? photoUri(cat.photo) : null, cat?.id ?? null);

  if (!cat) return null;
  const breed = findBreed(cat.breed);

  const confirmDelete = () => {
    Alert.alert('Delete this cat?', 'It will be removed from your album and from your friends’ view.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          router.back();
          await removeCat(cat);
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: cat.name ?? breed?.name ?? '' }} />
      <Screen>
        <View style={[styles.stage, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <Glow x={0.5} y={0.45} reach={0.65} />
          <SavedCatArt cat={cat} size={ART} photo={view === 'photo'} />
        </View>
        {sticker ? (
          <SegmentedControl
            options={[
              { value: 'sticker', label: 'Sticker' },
              { value: 'photo', label: 'Photo' },
            ]}
            value={view}
            onChange={setView}
          />
        ) : null}

        <View style={styles.titles}>
          <Text variant="largeTitle">{cat.name ?? 'Unnamed'}</Text>
          <Text variant="body" color="textSecondary">
            {breed?.name ?? 'Unknown kind'} · met {formatSeenAt(cat.seenAt)}
          </Text>
        </View>

        <Card flush>
          <ListRow title="Kind" value={breed?.name ?? 'Unknown'} />
          <ListRow title="Met" value={formatSeenAt(cat.seenAt)} />
          <ListRow
            title="Leaderboard"
            value={cat.hasCat ? 'Counts' : cat.hasCat === false ? 'No cat spotted' : 'Not checked'}
            last
          />
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={confirmDelete}
          style={({ pressed }) => [
            styles.delete,
            { backgroundColor: colors.surface, borderColor: `${colors.danger}33` },
            pressed && styles.pressed,
          ]}
        >
          <Text variant="button" color="danger">
            Delete Cat
          </Text>
        </Pressable>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  titles: {
    gap: spacing.xxs,
  },
  delete: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
