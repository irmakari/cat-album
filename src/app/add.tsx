import { randomUUID } from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Glow, Icon, Text, TextField } from '@/components/ui';
import { breeds, groupTitles, type Breed, type BreedGroup } from '@/features/breeds/breeds';
import { CatArt } from '@/features/cats/CatArt';
import { useCats } from '@/features/cats/CatsProvider';
import { keepPhoto } from '@/features/cats/photos';
import { detectCat, useSticker } from '@/features/cats/sticker';
import { PAGE_GUTTER, radii, spacing, useColors } from '@/theme';

const PREVIEW = 200;

function matches(breed: Breed, query: string) {
  const q = query.trim().toLowerCase();
  return !q || breed.name.toLowerCase().includes(q) || breed.hint.toLowerCase().includes(q);
}

// A picked photo becomes a cat: its sticker is cut while the user chooses
// what kind of cat it is. The photo stays in the picker's cache until it is
// saved; a cat never saved leaves nothing in the collection.
export default function AddCatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { photo } = useLocalSearchParams<{ photo: string }>();
  const { cats, addCat } = useCats();
  // Also the sticker's key, so the sticker cut here is the one the album shows.
  const [id] = useState(() => randomUUID());
  const [breed, setBreed] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const sticker = useSticker(photo ?? null, id);
  // Started with the screen, so it is usually done by the time the kind is
  // chosen; saving waits for it otherwise.
  const [catCheck] = useState(() => (photo ? detectCat(photo) : Promise.resolve(null)));

  const collected = useMemo(() => new Set((cats ?? []).map((cat) => cat.breed)), [cats]);
  const sections = useMemo(
    () =>
      (['street', 'breed'] as BreedGroup[])
        .map((group) => ({
          title: groupTitles[group],
          data: breeds.filter((b) => b.group === group && matches(b, query)),
        }))
        .filter((section) => section.data.length > 0),
    [query],
  );

  const save = async () => {
    if (!breed || !photo || saving) return;
    setSaving(true);
    const hasCat = await catCheck;
    // Vision misses cats in the dark or half out of frame, so this asks
    // rather than refuses. Only cats it saw count on the leaderboard.
    if (hasCat === false) {
      const addAnyway = await new Promise<boolean>((resolve) =>
        Alert.alert(
          'No cat spotted',
          "We couldn't find a cat in this photo. You can still add it, but it won't count on the leaderboard.",
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Add Anyway', onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        ),
      );
      if (!addAnyway) {
        setSaving(false);
        return;
      }
    }
    try {
      const file = await keepPhoto(photo, id);
      await addCat({ id, breed, name: name.trim() || null, photo: file, seenAt: new Date().toISOString(), hasCat });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setSaving(false);
      Alert.alert('Could not save this cat', 'Please try again.');
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Glow x={0.5} y={0.4} reach={0.6} />
        {photo ? <CatArt uri={photo} stickerKey={id} size={PREVIEW} /> : null}
        <Text variant="callout" color="textSecondary" align="center">
          {sticker === undefined
            ? 'Cutting out your cat…'
            : sticker === null
              ? 'No sticker for this one — the photo will do.'
              : 'Looking good.'}
        </Text>
      </View>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Optional"
        maxLength={40}
        returnKeyType="done"
      />
      <View style={styles.question}>
        <Text variant="title">What kind of cat?</Text>
        <Text variant="callout" color="textSecondary">
          Street cats go by their coat. Pick the closest.
        </Text>
      </View>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search kinds"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        renderSectionHeader={({ section }) => (
          <Text variant="eyebrow" color="textSecondary" style={styles.sectionTitle}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => {
          const selected = item.id === breed;
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                Haptics.selectionAsync();
                setBreed(item.id);
              }}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfacePressed : colors.surface },
                first && styles.rowFirst,
                last && styles.rowLast,
              ]}
            >
              <View
                style={[
                  styles.rowBody,
                  !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
                ]}
              >
                <View style={styles.rowText}>
                  <View style={styles.rowTitle}>
                    <Text variant="bodyStrong">{item.name}</Text>
                    {!collected.has(item.id) ? (
                      <View style={[styles.newBadge, { backgroundColor: colors.accentSoft }]}>
                        <Text variant="caption" color="accent">
                          New
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="callout" color="textSecondary">
                    {item.hint}
                  </Text>
                </View>
                {selected ? (
                  <Icon name="checkmark.circle.fill" size={22} color="accent" />
                ) : (
                  <View style={[styles.radio, { borderColor: colors.borderStrong }]} />
                )}
              </View>
            </Pressable>
          );
        }}
      />
      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
        ]}
      >
        <Button label={breed ? 'Add to Album' : 'Choose a kind'} disabled={!breed} loading={saving} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  preview: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  question: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: PAGE_GUTTER + spacing.xs,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
  },
  row: {
    marginHorizontal: PAGE_GUTTER,
    paddingLeft: spacing.lg,
  },
  rowFirst: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  rowLast: {
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.pill,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PAGE_GUTTER,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
