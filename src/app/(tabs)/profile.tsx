import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { Avatar, Button, Card, ListRow, Screen, SectionTitle, Icon, Text } from '@/components/ui';
import { buildAlbum, collectedCount } from '@/features/album/album';
import { deleteAccount } from '@/features/auth/accountApi';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCats } from '@/features/cats/CatsProvider';
import { shareInvite } from '@/features/friends/actions';
import { setOnLeaderboard } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { radii, spacing, useColors } from '@/theme';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="number">{value}</Text>
      <Text variant="eyebrow" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function GuestCard() {
  const colors = useColors();
  return (
    <Card glow style={styles.guest}>
      <View style={[styles.guestIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon name="person.crop.circle.badge.plus" size={28} color="accent" />
      </View>
      <View style={styles.guestText}>
        <Text variant="title">You’re collecting as a guest</Text>
        <Text variant="body" color="textSecondary">
          Create an account to add friends, see their albums and climb the weekly leaderboard. Your cats come with you.
        </Text>
      </View>
      <Button label="Create Account" onPress={() => router.push('/account')} />
    </Card>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const { session, permanent } = useAuth();
  const { profile, connections, refresh } = useFriends();
  const { cats, clearAll } = useCats();
  const [deleting, setDeleting] = useState(false);
  const album = useMemo(() => buildAlbum(cats ?? []), [cats]);
  const friends = connections.filter((c) => c.relation === 'friend').length;
  const username = profile?.username ?? null;

  const toggleLeaderboard = async (on: boolean) => {
    if (!session) return;
    await setOnLeaderboard(session.user.id, on).catch(() => Alert.alert('Could not change that', 'Please try again.'));
    await refresh();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'Your account, your cats and their photos will be removed from this phone and our servers. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            if (!session) return;
            setDeleting(true);
            const result = await deleteAccount(session.user.id);
            if (result.ok) await clearAll();
            else Alert.alert('Could not delete your account', result.message);
            setDeleting(false);
          },
        },
      ],
    );
  };

  return (
    <Screen title="Profile">
      {permanent ? (
        <View style={styles.identity}>
          <View style={{ boxShadow: `0 0 32px ${colors.glow}`, borderRadius: 36 }}>
            <Avatar name={username ?? '?'} size={72} ring={colors.accent} />
          </View>
          <View style={styles.identityText}>
            <Text variant="title">{username ? `@${username}` : 'Almost there'}</Text>
            <Text variant="callout" color="textSecondary" numberOfLines={1}>
              {session?.user.email}
            </Text>
          </View>
        </View>
      ) : (
        <GuestCard />
      )}

      {permanent && !username ? (
        <Card style={styles.finish} onPress={() => router.push('/account')}>
          <Icon name="at" size={22} color="accent" />
          <View style={styles.finishText}>
            <Text variant="headline">Choose a username</Text>
            <Text variant="callout" color="textSecondary">
              Friends find you by it.
            </Text>
          </View>
          <Icon name="chevron.right" size={13} color="textMuted" weight="semibold" />
        </Card>
      ) : null}

      <Card style={styles.stats}>
        <Stat value={cats?.length ?? 0} label="Cats" />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat value={collectedCount(album)} label="Kinds" />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Stat value={friends} label="Friends" />
      </Card>

      {permanent && username ? (
        <>
          <SectionTitle title="Friends" />
          <Card flush>
            <ListRow
              title="Invite Friends"
              subtitle="Share a link that adds you"
              leading={<Icon name="square.and.arrow.up" size={18} color="accent" />}
              onPress={() => shareInvite(username)}
            />
            <ListRow
              title="Show Me on Leaderboards"
              subtitle="Friends see your weekly score"
              leading={<Icon name="trophy" size={18} color="accent" />}
              trailing={
                <Switch
                  value={profile?.onLeaderboard ?? true}
                  onValueChange={toggleLeaderboard}
                  trackColor={{ true: colors.accent }}
                />
              }
              last
            />
          </Card>
        </>
      ) : null}

      {permanent ? (
        <>
          <SectionTitle title="Account" />
          <Card flush>
            <ListRow title={deleting ? 'Deleting…' : 'Delete Account'} destructive onPress={confirmDelete} last />
          </Card>
        </>
      ) : null}

      <Text variant="caption" color="textMuted" align="center" style={styles.footnote}>
        Photos stay on your phone. Friends only see your cats’ stickers.
      </Text>
    </Screen>
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
  guest: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  guestIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    gap: spacing.xs,
  },
  finish: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  finishText: {
    flex: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  footnote: {
    paddingHorizontal: spacing.xl,
  },
});
