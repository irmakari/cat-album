import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

import { fetchConnections, fetchMyProfile, type Connection, type MyProfile } from './friendsApi';

type FriendsState = {
  // Null until read, and always for an anonymous account.
  profile: MyProfile | null;
  connections: Connection[];
  incomingCount: number;
  refresh: () => Promise<void>;
};

const FriendsContext = createContext<FriendsState>({
  profile: null,
  connections: [],
  incomingCount: 0,
  refresh: async () => {},
});

// The user's own profile and their friends, read when the account is
// permanent and again on coming back to the app, so a request that arrived
// meanwhile shows on the tab.
export function FriendsProvider({ children }: { children: ReactNode }) {
  const { session, permanent } = useAuth();
  const userId = session?.user.id ?? null;
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Reads without touching state; the caller decides whether the answer is
  // still wanted.
  const read = useCallback(async () => {
    if (!userId || !permanent) return null;
    const [nextProfile, nextConnections] = await Promise.all([
      fetchMyProfile(userId),
      fetchConnections().catch(() => [] as Connection[]),
    ]);
    return { profile: nextProfile, connections: nextConnections };
  }, [userId, permanent]);

  const apply = (next: { profile: MyProfile; connections: Connection[] } | null) => {
    if (!next) return;
    setProfile(next.profile);
    setConnections(next.connections);
  };

  const refresh = useCallback(async () => apply(await read()), [read]);

  useEffect(() => {
    let current = true;
    const load = () =>
      read()
        .then((next) => current && apply(next))
        .catch(() => {});
    load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      current = false;
      subscription.remove();
    };
  }, [read]);

  // An anonymous account has no friends to show, whatever was read before
  // (an account deleted on this phone, for one).
  const value = useMemo(() => {
    const visible = permanent ? connections : [];
    return {
      profile: permanent ? profile : null,
      connections: visible,
      incomingCount: visible.filter((c) => c.relation === 'incoming').length,
      refresh,
    };
  }, [permanent, profile, connections, refresh]);
  return <FriendsContext value={value}>{children}</FriendsContext>;
}

export function useFriends() {
  return use(FriendsContext);
}
