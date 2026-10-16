import { Directory, File, Paths } from 'expo-file-system';

// Photos live in the app's documents, which the system never clears: they
// are the collection. Stickers are made from them and can always be made again.
function folder() {
  const directory = new Directory(Paths.document, 'cat-photos');
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

export function photoUri(photo: string): string {
  return new File(folder(), photo).uri;
}

// Moves a freshly picked photo into the collection. Resolves to the file name
// that is saved on the cat.
export async function keepPhoto(pickedUri: string, id: string): Promise<string> {
  const name = `${id}.jpg`;
  await new File(pickedUri).move(new File(folder(), name));
  return name;
}

// Best effort: a photo left behind only takes some space.
export function removePhoto(photo: string) {
  try {
    const file = new File(folder(), photo);
    if (file.exists) file.delete();
  } catch {
    // Nothing to do.
  }
}
