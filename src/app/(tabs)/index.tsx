import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, SectionTitle, Icon, Text } from '@/components/ui';
import { buildAlbum, collectedCount } from '@/features/album/album';
import { AlbumGrid } from '@/features/album/AlbumGrid';
import { groupTitles } from '@/features/breeds/breeds';
import { useCats } from '@/features/cats/CatsProvider';
import { startAddingCat } from '@/features/photos/startAddingCat';
import { radii, spacing, useColors } from '@/theme';

function AddButton() {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a cat"
      onPress={startAddingCat}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: colors.accent, boxShadow: `0 8px 24px ${colors.glow}` },
        pressed && styles.pressed,
      ]}
    >
      <Icon name="camera.fill" size={20} color="onAccent" />
    </Pressable>
  );
}

function Progress({ collected, total, cats }: { collected: number; total: number; cats: number }) {
  const colors = useColors();
  const percent = Math.round((collected / total) * 100);
  return (
    <Card glow style={styles.progress}>
      <View style={styles.progressTop}>
        <View style={styles.progressText}>
          <Text variant="eyebrow" color="accent">
            Your collection
          </Text>
          <Text variant="display">
            {collected}
            <Text variant="title" color="textMuted">
              {' '}
              / {total}
            </Text>
          </Text>
          <Text variant="callout" color="textSecondary">
            kinds collected · {percent}%
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
          <Icon name="pawprint.fill" size={12} color="accent" />
          <Text variant="caption" color="accent">
            {cats} {cats === 1 ? 'cat' : 'cats'}
          </Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.accent,
              boxShadow: `0 0 12px ${colors.accent}`,
              width: `${Math.max(2, (collected / total) * 100)}%`,
            },
          ]}
        />
      </View>
    </Card>
  );
}

function Empty() {
  return (
    <Card glow style={styles.empty}>
      <View style={styles.emptyText}>
        <Text variant="headline">Start your collection</Text>
        <Text variant="body" color="textSecondary">
          Photograph a cat you meet. We’ll cut it out as a sticker and give it a slot in your album.
        </Text>
      </View>
      <Button label="Add Your First Cat" icon="camera.fill" onPress={startAddingCat} />
    </Card>
  );
}

export default function AlbumScreen() {
  const { cats } = useCats();
  const album = useMemo(() => buildAlbum(cats ?? []), [cats]);
  const street = album.filter((card) => card.breed.group === 'street');
  const pedigree = album.filter((card) => card.breed.group === 'breed');

  if (!cats) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Screen title="Album" trailing={<AddButton />}>
      {cats.length === 0 ? (
        <Empty />
      ) : (
        <Progress collected={collectedCount(album)} total={album.length} cats={cats.length} />
      )}
      <SectionTitle title={groupTitles.street} />
      <AlbumGrid cards={street} />
      <SectionTitle title={groupTitles.breed} />
      <AlbumGrid cards={pedigree} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  progress: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  progressText: {
    gap: spacing.xxs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  track: {
    height: 10,
    borderRadius: 5,
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  empty: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  emptyText: {
    gap: spacing.xs,
  },
});
