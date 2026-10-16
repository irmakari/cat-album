import * as Device from 'expo-device';
import { useEffect, useState } from 'react';

import CatSticker from '../../../modules/cat-sticker';

// The sticker's long edge, in pixels. Sharp in an album slot and on the
// cat's own page, and big enough for the garden to come; still only a few
// hundred kilobytes per cat.
const STICKER_SIZE = 640;

// Stickers are made on the phone and kept in its caches, never uploaded. The
// native side remembers them across launches; these remember them for this
// one, so a page seen before shows without waiting.
const made = new Map<string, string | null>();
const making = new Map<string, Promise<string | null>>();

function makeSticker(source: string, key: string): Promise<string | null> {
  const started = making.get(key);
  if (started) return started;
  const sticker = (CatSticker?.stickerAsync(source, key, STICKER_SIZE) ?? Promise.resolve(null))
    .catch(() => null)
    .then((uri) => {
      made.set(key, uri);
      making.delete(key);
      return uri;
    });
  making.set(key, sticker);
  return sticker;
}

// The sticker outside a component, for uploading: the same one the album
// shows, made now if it has not been yet.
export function stickerFor(source: string, key: string): Promise<string | null> {
  if (!CatSticker) return Promise.resolve(null);
  return made.has(key) ? Promise.resolve(made.get(key) ?? null) : makeSticker(source, key);
}

// Whether there is a cat in a photo; null where the phone cannot tell.
// The Simulator cannot tell, so in development it takes every photo for a
// cat, letting the leaderboard be tried there.
export async function detectCat(source: string): Promise<boolean | null> {
  const seen = await (CatSticker?.detectCatAsync(source) ?? Promise.resolve(null)).catch(() => null);
  if (seen === null && __DEV__ && !Device.isDevice) return true;
  return seen;
}

// For a cat that is deleted.
export function forgetSticker(key: string) {
  made.delete(key);
  CatSticker?.remove(key);
}

// A cat's photo with its background taken away. Undefined while it is being
// made, null where there is none: no clear subject, or a phone that cannot
// make one (Android, the web, Expo Go, iOS before 17).
export function useSticker(photoUri: string | null, key: string | null): string | null | undefined {
  // The sticker made while this was shown. It has to be read from state:
  // the React Compiler treats `made` as unchanging and would keep returning
  // what it held on the first render.
  const [result, setResult] = useState<{ key: string; uri: string | null } | null>(null);

  useEffect(() => {
    if (!photoUri || !key || !CatSticker || made.has(key)) return;
    let current = true;
    makeSticker(photoUri, key).then((uri) => {
      if (current) setResult({ key, uri });
    });
    return () => {
      current = false;
    };
  }, [photoUri, key]);

  if (!photoUri || !key || !CatSticker) return null;
  if (result?.key === key) return result.uri;
  return made.has(key) ? made.get(key) : undefined;
}
