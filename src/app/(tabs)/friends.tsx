import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, ListRow, Screen, SectionTitle, Icon, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { accept, act, addFriend, decline, shareInvite } from '@/features/friends/actions';
import { removeFriend, searchPeople, type Person } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { Leaderboard } from '@/features/friends/Leaderboard';
import { normalizeUsername } from '@/features/friends/username';
import { radii, spacing, useColors } from '@/theme';

function openFriend(person: Person) {
  router.push({ pathname: '/friend/[id]', params: { id: person.id, username: person.username } });
}

// What can be done with someone found by search, as one small button.
function RelationButton({ person, onChanged }: { person: Person; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const run = (action: () => Promise<unknown>) => async () => {
    setBusy(true);
    await act(action, onChanged);
    setBusy(false);
  };
  switch (person.relation) {
    case 'friend':
      return <Button small variant="secondary" label="Friends" icon="checkmark" onPress={() => openFriend(person)} />;
    case 'outgoing':
      return (
        <Button
          small
          variant="secondary"
          label="Requested"
          loading={busy}
          onPress={run(() => removeFriend(person.id))}
        />
      );
    case 'incoming':
      return <Button small label="Accept" loading={busy} onPress={run(accept(person))} />;
    default:
      return <Button small label="Add" icon="plus" loading={busy} onPress={run(addFriend(person))} />;
  }
}

function Search({ onChanged }: { onChanged: () => Promise<void> }) {
  const [query, setQuery] = useState('');
  // Kept with the query they answer, so results for an older query never show.
  const [found, setFound] = useState<{ needle: string; people: Person[] } | null>(null);
  const needle = normalizeUsername(query);
  const results = needle.length >= 2 && found?.needle === needle ? found.people : null;

  useEffect(() => {
    if (needle.length < 2) return;
    let current = true;
    // Waits for a pause in typing before asking.
    const timer = setTimeout(() => {
      searchPeople(needle)
        .catch(() => [] as Person[])
        .then((people) => current && setFound({ needle, people }));
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [needle]);

  const refreshBoth = async () => {
    await onChanged();
    setFound({ needle, people: await searchPeople(needle).catch(() => []) });
  };

  return (
    <View style={styles.search}>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Find friends by username"
        prefix="@"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      {results === null ? null : results.length === 0 ? (
        <Text variant="callout" color="textMuted" align="center">
          No one goes by @{needle} yet.
        </Text>
      ) : (
        <Card flush>
          {results.map((person, i) => (
            <ListRow
              key={person.id}
              title={`@${person.username}`}
              leading={<Avatar name={person.username} size={36} />}
              trailing={<RelationButton person={person} onChanged={refreshBoth} />}
              last={i === results.length - 1}
            />
          ))}
        </Card>
      )}
    </View>
  );
}

function SignedOut({ hasAccount }: { hasAccount: boolean }) {
  const colors = useColors();
  return (
    <Card glow style={styles.signedOut}>
      <View style={[styles.signedOutIcon, { backgroundColor: colors.accentSoft }]}>
        <Icon name="person.2.fill" size={26} color="accent" />
      </View>
      <View style={styles.signedOutText}>
        <Text variant="title">Collect with friends</Text>
        <Text variant="body" color="textSecondary">
          See your friends’ albums and race them on a weekly leaderboard. It starts with an account.
        </Text>
      </View>
      <Button label={hasAccount ? 'Choose a Username' : 'Create Account'} onPress={() => router.push('/account')} />
    </Card>
  );
}

export default function FriendsScreen() {
  const { permanent } = useAuth();
  const { profile, connections, refresh } = useFriends();
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  if (!permanent || !profile?.username) {
    return (
      <Screen title="Friends">
        {permanent && !profile ? <ActivityIndicator /> : <SignedOut hasAccount={permanent} />}
      </Screen>
    );
  }

  const incoming = connections.filter((c) => c.relation === 'incoming');
  const friends = connections.filter((c) => c.relation === 'friend');
  const outgoing = connections.filter((c) => c.relation === 'outgoing');

  const onRefresh = async () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
    await refresh().catch(() => {});
    setRefreshing(false);
  };

  return (
    <Screen
      title="Friends"
      refreshing={refreshing}
      onRefresh={onRefresh}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invite friends"
          onPress={() => shareInvite(profile.username!)}
          hitSlop={8}
          style={({ pressed }) => [styles.invite, pressed && styles.pressed]}
        >
          <Icon name="square.and.arrow.up" size={20} color="accent" />
        </Pressable>
      }
    >
      <View>
        <SectionTitle title="Leaderboard" />
        <View style={styles.sectionBody}>
          <Leaderboard reloadKey={reloadKey} />
        </View>
      </View>

      {incoming.length > 0 ? (
        <View>
          <SectionTitle title={`Requests · ${incoming.length}`} />
          <Card flush style={styles.sectionBody}>
            {incoming.map((person, i) => (
              <ListRow
                key={person.id}
                title={`@${person.username}`}
                subtitle="Wants to be friends"
                leading={<Avatar name={person.username} size={40} />}
                trailing={
                  <View style={styles.requestActions}>
                    <Button small variant="secondary" label="Decline" onPress={() => act(decline(person), refresh)} />
                    <Button small label="Accept" onPress={() => act(accept(person), refresh)} />
                  </View>
                }
                last={i === incoming.length - 1}
              />
            ))}
          </Card>
        </View>
      ) : null}

      <Search onChanged={refresh} />

      <View>
        <SectionTitle title={friends.length > 0 ? `Friends · ${friends.length}` : 'Friends'} />
        {friends.length === 0 ? (
          <Card style={[styles.sectionBody, styles.empty]}>
            <Text variant="body" color="textSecondary" align="center">
              No friends yet. Search above, or send your link.
            </Text>
            <Button
              variant="secondary"
              label="Invite Friends"
              icon="square.and.arrow.up"
              onPress={() => shareInvite(profile.username!)}
            />
          </Card>
        ) : (
          <Card flush style={styles.sectionBody}>
            {friends.map((person, i) => (
              <ListRow
                key={person.id}
                title={`@${person.username}`}
                subtitle="See their album"
                leading={<Avatar name={person.username} size={40} />}
                onPress={() => openFriend(person)}
                last={i === friends.length - 1}
              />
            ))}
          </Card>
        )}
      </View>

      {outgoing.length > 0 ? (
        <View>
          <SectionTitle title="Sent" />
          <Card flush style={styles.sectionBody}>
            {outgoing.map((person, i) => (
              <ListRow
                key={person.id}
                title={`@${person.username}`}
                subtitle="Waiting for them"
                leading={<Avatar name={person.username} size={40} />}
                trailing={
                  <Button
                    small
                    variant="plain"
                    label="Cancel"
                    onPress={() => act(() => removeFriend(person.id), refresh)}
                  />
                }
                last={i === outgoing.length - 1}
              />
            ))}
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  invite: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
  sectionBody: {
    marginTop: spacing.xl,
  },
  search: {
    gap: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  empty: {
    gap: spacing.lg,
    padding: spacing.xl,
  },
  signedOut: {
    gap: spacing.xl,
    padding: spacing.xl,
  },
  signedOutIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedOutText: {
    gap: spacing.xs,
  },
});
