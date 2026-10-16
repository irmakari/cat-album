import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';

import { insertCat, listCats, markCatDeleted, removeAllCatRows } from './db';
import { removePhoto } from './photos';
import { forgetSticker } from './sticker';
import { syncCats } from './sync';
import type { Cat } from './types';

type CatsContextValue = {
  // Newest first. Null until the first read.
  cats: Cat[] | null;
  addCat: (cat: Cat) => Promise<void>;
  removeCat: (cat: Cat) => Promise<void>;
  // Forgets every cat on this phone, once the account behind them is gone.
  clearAll: () => Promise<void>;
};

const CatsContext = createContext<CatsContextValue | null>(null);

// Holds every cat in memory, read once from the database. The whole
// collection is small, and the album is worked out from it on each change.
// The phone's database is the one the app reads, so it works offline; the
// server gets a copy whenever there is a session to send it with.
export function CatsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const userId = useAuth().session?.user.id ?? null;
  const [cats, setCats] = useState<Cat[] | null>(null);

  const sync = useCallback(() => {
    if (userId) syncCats(db, userId).catch(() => {});
  }, [db, userId]);

  useEffect(() => {
    listCats(db).then(setCats);
  }, [db]);

  // On signing in, and on coming back to the app, which is when a lost
  // connection has most likely returned.
  useEffect(() => {
    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, [sync]);

  const addCat = useCallback(
    async (cat: Cat) => {
      await insertCat(db, cat);
      setCats(await listCats(db));
      sync();
    },
    [db, sync],
  );

  const removeCat = useCallback(
    async (cat: Cat) => {
      await markCatDeleted(db, cat.id);
      removePhoto(cat.photo);
      forgetSticker(cat.id);
      setCats(await listCats(db));
      sync();
    },
    [db, sync],
  );

  const clearAll = useCallback(async () => {
    for (const cat of await removeAllCatRows(db)) {
      removePhoto(cat.photo);
      forgetSticker(cat.id);
    }
    setCats([]);
  }, [db]);

  const value = useMemo(() => ({ cats, addCat, removeCat, clearAll }), [cats, addCat, removeCat, clearAll]);
  return <CatsContext.Provider value={value}>{children}</CatsContext.Provider>;
}

export function useCats() {
  const value = useContext(CatsContext);
  if (!value) throw new Error('useCats must be used inside CatsProvider');
  return value;
}
