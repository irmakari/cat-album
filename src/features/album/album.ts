import { breeds, type Breed } from '@/features/breeds/breeds';
import type { Cat } from '@/features/cats/types';

export type AlbumCard = {
  // 1-based, the order the album shows them in.
  number: number;
  breed: Breed;
  // The newest cat of this kind, whose sticker the slot shows, or null while
  // it is still to collect.
  latest: Cat | null;
  count: number;
};

// Worked out from the cats, newest first, so it is never out of step. Cats
// of a breed the app no longer lists have no slot.
export function buildAlbum(cats: Cat[]): AlbumCard[] {
  const byBreed = new Map<string, { latest: Cat; count: number }>();
  for (const cat of cats) {
    const seen = byBreed.get(cat.breed);
    if (seen) seen.count += 1;
    else byBreed.set(cat.breed, { latest: cat, count: 1 });
  }
  return breeds.map((breed, index) => {
    const seen = byBreed.get(breed.id);
    return { number: index + 1, breed, latest: seen?.latest ?? null, count: seen?.count ?? 0 };
  });
}

export function collectedCount(cards: AlbumCard[]) {
  return cards.filter((card) => card.latest).length;
}

// "#007"
export function slotNumber(number: number) {
  return `#${String(number).padStart(3, '0')}`;
}
