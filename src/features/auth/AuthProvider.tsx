import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

type AuthState = {
  // Null until the stored session is read, and while offline on a first
  // launch. The app works without one; only syncing and friends wait for it.
  session: Session | null;
  // An account with an email, which friends can find. Anonymous until then.
  permanent: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, permanent: false });

// Everyone has an account from the first launch: an anonymous one, made
// without asking, so cats are collected and kept on the server right away.
// Adding an email later turns the same account permanent.
let signingIn: Promise<unknown> | null = null;

function signInAnonymously() {
  signingIn ??= supabase.auth.signInAnonymously().finally(() => {
    signingIn = null;
  });
  return signingIn;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let current: Session | null = null;
    // Fires once with the stored session, then on every change.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      current = next;
      setSession(next);
      // Out of the callback: auth calls made inside it can deadlock.
      if (!next) setTimeout(() => signInAnonymously().catch(() => {}), 0);
    });
    // A first launch offline has no session; try again on coming back.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !current) signInAnonymously().catch(() => {});
    });
    return () => {
      data.subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  const permanent = !!session && !session.user.is_anonymous;
  return <AuthContext value={{ session, permanent }}>{children}</AuthContext>;
}

export function useAuth() {
  return use(AuthContext);
}
