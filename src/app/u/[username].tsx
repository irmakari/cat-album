import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Avatar, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { accept, act, addFriend } from '@/features/friends/actions';
import { findByUsername, type Person } from '@/features/friends/friendsApi';
import { useFriends } from '@/features/friends/FriendsProvider';
import { normalizeUsername } from '@/features/friends/username';
import { PAGE_GUTTER, spacing, useColors } from '@/theme';

// Where an invite link lands: the person it names, and one button.
export default function InviteScreen() {
  const colors = useColors();
  const { username: raw } = useLocalSearchParams<{ username: string }>();
  const username = normalizeUsername(raw ?? '');
  const { permanent } = useAuth();
  const { profile, refresh } = useFriends();
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const ready = permanent && !!profile?.username;

  useEffect(() => {
    if (!ready) return;
    findByUsername(username)
      .then(setPerson)
      .catch(() => setPerson(null));
  }, [ready, username]);

  const run = (action: () => Promise<unknown>) => async () => {
    setBusy(true);
    await act(action, refresh);
    setPerson(await findByUsername(username).catch(() => null));
    setBusy(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Avatar name={username} size={96} />
      <View style={styles.text}>
        <Text variant="largeTitle" align="center">
          @{username}
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {!ready
            ? 'Create an account to add friends.'
            : person === undefined
              ? ' '
              : person === null
                ? 'We couldn’t find this person.'
                : person.relation === 'friend'
                  ? 'You’re friends.'
                  : person.relation === 'outgoing'
                    ? 'Request sent. They’ll see it in Friends.'
                    : person.relation === 'incoming'
                      ? 'They’ve asked to be your friend.'
                      : 'Wants to collect cats with you.'}
        </Text>
      </View>
      <View style={styles.actions}>
        {!ready ? (
          <Button label="Create Account" onPress={() => router.replace('/account')} />
        ) : person === undefined ? (
          <ActivityIndicator />
        ) : person === null ? (
          <Button variant="secondary" label="Close" onPress={() => router.back()} />
        ) : person.relation === 'none' ? (
          <Button label="Add Friend" icon="person.badge.plus" loading={busy} onPress={run(addFriend(person))} />
        ) : person.relation === 'incoming' ? (
          <Button label="Accept" loading={busy} onPress={run(accept(person))} />
        ) : (
          <Button variant="secondary" label="Done" onPress={() => router.back()} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: PAGE_GUTTER,
    gap: spacing.xl,
  },
  text: {
    gap: spacing.xs,
  },
  actions: {
    alignSelf: 'stretch',
  },
});
