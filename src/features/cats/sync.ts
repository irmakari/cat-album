import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { SQLiteDatabase } from 'expo-sqlite';

import { supabase } from '@/lib/supabase';

import { listUnsynced, markCatSynced, removeCatRow } from './db';
import { photoUri } from './photos';
import { stickerFor } from './sticker';
import type { Cat } from './types';

const BUCKET = 'cat-images';

// The long edge of the small photo friends see where there is no sticker.
const THUMB_SIZE = 480;

// The image friends see: the sticker, with nothing of the place around the
// cat, or else a small photo. Re-encoding it leaves its location behind.
async function imageToUpload(cat: Cat): Promise<{ uri: string; kind: 'sticker' | 'photo' }> {
  const source = photoUri(cat.photo);
  const sticker = await stickerFor(source, cat.id);
  if (sticker) return { uri: sticker, kind: 'sticker' };

  const context = ImageManipulator.manipulate(source).resize({
    width: THUMB_SIZE,
  });
  const rendered = await context.renderAsync();
  try {
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.7,
    });
    return { uri: saved.uri, kind: 'photo' };
  } finally {
    rendered.release();
    context.release();
  }
}

function imagePath(userId: string, cat: Pick<Cat, 'id'>, kind: 'sticker' | 'photo') {
  return `${userId}/${cat.id}.${kind === 'sticker' ? 'png' : 'jpg'}`;
}

async function upload(userId: string, cat: Cat) {
  const image = await imageToUpload(cat);
  const path = imagePath(userId, cat, image.kind);
  const body = await (await fetch(image.uri)).arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: image.kind === 'sticker' ? 'image/png' : 'image/jpeg',
    upsert: true,
  });
  if (uploadError) throw uploadError;

  // A cat already on the server is left as it is, so one whose upload was
  // cut short is simply sent again. Ignoring duplicates also keeps this an
  // insert, which needs no right to change has_cat or seen_at afterwards.
  const { error } = await supabase.from('cats').upsert(
    {
      id: cat.id,
      breed: cat.breed,
      name: cat.name,
      image_path: path,
      image_kind: image.kind,
      has_cat: cat.hasCat === true,
      seen_at: cat.seenAt,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

async function remove(userId: string, cat: Cat) {
  // Either image may be there; removing one that is not is harmless.
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([imagePath(userId, cat, 'sticker'), imagePath(userId, cat, 'photo')]);
  if (storageError) throw storageError;
  const { error } = await supabase.from('cats').delete().eq('id', cat.id);
  if (error) throw error;
}

let running: Promise<void> | null = null;
let again = false;

// Sends the server whatever changed on the phone. Safe to call often: one
// pass runs at a time, and a call during a pass runs one more after it. A
// cat that fails stays unsynced and is tried on the next pass.
export function syncCats(db: SQLiteDatabase, userId: string): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    do {
      again = false;
      const { added, deleted } = await listUnsynced(db);
      for (const cat of deleted) {
        try {
          await remove(userId, cat);
          await removeCatRow(db, cat.id);
        } catch {
          // Next pass.
        }
      }
      for (const cat of added) {
        try {
          await upload(userId, cat);
          await markCatSynced(db, cat.id);
        } catch {
          // Next pass.
        }
      }
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}
