import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Card, Screen, SectionTitle, Icon, Text } from '@/components/ui';
import { AlbumTile, AlbumTiles, ART } from '@/features/album/AlbumGrid';
import { breeds, groupTitles, type Breed } from '@/features/breeds/breeds';
import { friendMenu } from '@/features/friends/actions';
import { fetchFriendCats, type FriendCat } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { spacing, useColors } from '@/theme';

type Slot = { number: number; breed: Breed; latest: FriendCat | null; count: number };

function slotsFor(cats: FriendCat[]): Slot[] {
  return breeds.map((breed, index) => {
    const ofBreed = cats.filter((cat) => cat.breed === breed.id);
    return { number: index + 1, breed, latest: ofBreed[0] ?? null, count: ofBreed.length };
  });
}

function FriendArt({ cat }: { cat: FriendCat }) {
  const colors = useColors();
  if (!cat.imageUrl) return <Icon name="pawprint.fill" size={28} color="textMuted" />;
  const round = cat.imageKind === 'photo';
  return (
    <Image
      source={{ uri: cat.imageUrl }}
      contentFit={round ? 'cover' : 'contain'}
      transition={200}
      style={[
        { width: ART, height: ART },
        round && { borderRadius: ART / 2, borderWidth: 2, borderColor: colors.surface },
      ]}
      accessibilityIgnoresInvertColors
    />
  );
}

function Grid({ slots }: { slots: Slot[] }) {
  return (
    <AlbumTiles>
      {slots.map((slot) => (
        <AlbumTile
          key={slot.breed.id}
          number={slot.number}
          name={slot.breed.name}
          count={slot.count}
          art={slot.latest ? <FriendArt cat={slot.latest} /> : null}
        />
      ))}
    </AlbumTiles>
  );
}

// A friend's album, read from the server: their stickers, never their photos.
export default function FriendScreen() {
  const colors = useColors();
  const { id, username } = useLocalSearchParams<{ id: string; username: string }>();
  const { refresh } = useFriends();
  const [cats, setCats] = useState<FriendCat[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetchFriendCats(id)
      .then(setCats)
      .catch(() => setFailed(true));
  }, [id]);

  const slots = useMemo(() => slotsFor(cats ?? []), [cats]);
  const kinds = slots.filter((slot) => slot.latest).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: `@${username}`,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More"
              hitSlop={10}
              onPress={() => friendMenu({ id, username, relation: 'friend' }, refresh, () => router.back())}
            >
              <Icon name="ellipsis.circle" size={22} color="text" />
            </Pressable>
          ),
        }}
      />
      <Screen>
        <View style={styles.identity}>
          <Avatar name={username} size={64} ring={colors.accent} />
          <View style={styles.identityText}>
            <Text variant="title">@{username}</Text>
            <Text variant="callout" color="textSecondary">
              {cats ? `${kinds} of ${breeds.length} kinds · ${cats.length} ${cats.length === 1 ? 'cat' : 'cats'}` : ' '}
            </Text>
          </View>
        </View>

        {failed ? (
          <Card>
            <Text variant="body" color="textSecondary" align="center">
              Couldn’t load this album. Check your connection.
            </Text>
          </Card>
        ) : !cats ? (
          <ActivityIndicator />
        ) : (
          <>
            <SectionTitle title={groupTitles.street} />
            <Grid slots={slots.filter((slot) => slot.breed.group === 'street')} />
            <SectionTitle title={groupTitles.breed} />
            <Grid slots={slots.filter((slot) => slot.breed.group === 'breed')} />
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  identityText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
