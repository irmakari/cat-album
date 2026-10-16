import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useFriends } from '@/features/friends/FriendsProvider';
import { fonts, useColors } from '@/theme';

export default function TabsLayout() {
  const colors = useColors();
  const { incomingCount } = useFriends();

  return (
    <NativeTabs tintColor={colors.accent} labelStyle={{ fontFamily: fonts.medium, fontSize: 10 }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Album</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        {incomingCount > 0 ? <NativeTabs.Trigger.Badge>{String(incomingCount)}</NativeTabs.Trigger.Badge> : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
