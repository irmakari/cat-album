import { Alert, Share } from 'react-native';

import { blockUser, removeFriend, respondToFriendRequest, sendFriendRequest, type Person } from './friendsApi';
import { inviteLink } from './username';

// Every change to a friendship goes through here, so the screens only ask
// FriendsProvider to read the result again.
export async function act(action: () => Promise<unknown>, refresh: () => Promise<void>) {
  try {
    await action();
  } catch {
    Alert.alert('That didn’t work', 'Check your connection and try again.');
  }
  await refresh().catch(() => {});
}

export const addFriend = (person: Person) => () => sendFriendRequest(person.id);
export const accept = (person: Person) => () => respondToFriendRequest(person.id, true);
export const decline = (person: Person) => () => respondToFriendRequest(person.id, false);

// Unfriend, or block, from a friend's page.
export function friendMenu(person: Person, refresh: () => Promise<void>, onDone: () => void) {
  Alert.alert(`@${person.username}`, undefined, [
    {
      text: 'Remove Friend',
      style: 'destructive',
      onPress: () => act(() => removeFriend(person.id), refresh).then(onDone),
    },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () =>
        Alert.alert(
          `Block @${person.username}?`,
          'They won’t be able to find you or see your cats. They aren’t told.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: () => act(() => blockUser(person.id), refresh).then(onDone),
            },
          ],
        ),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function shareInvite(username: string) {
  return Share.share({ message: `Add me on Cat Album, I’m @${username}: ${inviteLink(username)}` });
}
