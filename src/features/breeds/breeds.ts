// Every kind of cat the album has a slot for. Most cats met outside belong
// to no breed, so the coats seen on the street come first and are slots of
// their own; the breeds follow. Ids are stored with each cat and must never
// change; names and order can.
export type BreedGroup = 'street' | 'breed';

export type Breed = {
  id: string;
  name: string;
  group: BreedGroup;
  // A line to tell it apart in the picker.
  hint: string;
};

export const breeds: Breed[] = [
  { id: 'tabby', name: 'Tabby', group: 'street', hint: 'Striped or swirled grey-brown coat' },
  { id: 'ginger', name: 'Ginger', group: 'street', hint: 'Orange, often striped' },
  { id: 'tuxedo', name: 'Tuxedo', group: 'street', hint: 'Black with a white chest and paws' },
  { id: 'calico', name: 'Calico', group: 'street', hint: 'White with orange and black patches' },
  { id: 'tortoiseshell', name: 'Tortoiseshell', group: 'street', hint: 'Black and orange, mottled' },
  { id: 'black', name: 'Black', group: 'street', hint: 'Black all over' },
  { id: 'white', name: 'White', group: 'street', hint: 'White all over' },
  { id: 'grey', name: 'Grey', group: 'street', hint: 'Solid grey or blue-grey' },
  { id: 'cream', name: 'Cream', group: 'street', hint: 'Pale orange or cream' },
  { id: 'bicolor', name: 'Bicolor', group: 'street', hint: 'Any colour with large white patches' },

  { id: 'turkish-van', name: 'Turkish Van', group: 'breed', hint: 'White body, coloured head and tail' },
  { id: 'turkish-angora', name: 'Turkish Angora', group: 'breed', hint: 'Slender, silky, often white' },
  { id: 'british-shorthair', name: 'British Shorthair', group: 'breed', hint: 'Round face, plush blue-grey' },
  { id: 'scottish-fold', name: 'Scottish Fold', group: 'breed', hint: 'Ears folded forward' },
  { id: 'persian', name: 'Persian', group: 'breed', hint: 'Long coat, flat face' },
  { id: 'maine-coon', name: 'Maine Coon', group: 'breed', hint: 'Very large, tufted ears' },
  { id: 'siamese', name: 'Siamese', group: 'breed', hint: 'Pale body, dark points, blue eyes' },
  { id: 'ragdoll', name: 'Ragdoll', group: 'breed', hint: 'Large, pointed, blue eyes' },
  { id: 'bengal', name: 'Bengal', group: 'breed', hint: 'Leopard-like spots' },
  { id: 'sphynx', name: 'Sphynx', group: 'breed', hint: 'Hairless' },
  { id: 'russian-blue', name: 'Russian Blue', group: 'breed', hint: 'Silver-blue coat, green eyes' },
  { id: 'norwegian-forest', name: 'Norwegian Forest Cat', group: 'breed', hint: 'Thick coat, bushy tail' },
  { id: 'siberian', name: 'Siberian', group: 'breed', hint: 'Sturdy, triple coat' },
  { id: 'abyssinian', name: 'Abyssinian', group: 'breed', hint: 'Ticked, ruddy coat' },
  { id: 'birman', name: 'Birman', group: 'breed', hint: 'Pointed with white "gloves"' },
  { id: 'exotic-shorthair', name: 'Exotic Shorthair', group: 'breed', hint: 'Flat face, short plush coat' },
  { id: 'american-shorthair', name: 'American Shorthair', group: 'breed', hint: 'Sturdy, often silver tabby' },
  { id: 'devon-rex', name: 'Devon Rex', group: 'breed', hint: 'Big ears, wavy coat' },
  { id: 'cornish-rex', name: 'Cornish Rex', group: 'breed', hint: 'Slim, tight curly coat' },
  { id: 'burmese', name: 'Burmese', group: 'breed', hint: 'Glossy sable brown' },
  { id: 'oriental-shorthair', name: 'Oriental Shorthair', group: 'breed', hint: 'Slim, very large ears' },
  { id: 'himalayan', name: 'Himalayan', group: 'breed', hint: 'Persian with Siamese points' },
  { id: 'savannah', name: 'Savannah', group: 'breed', hint: 'Tall, spotted, serval-like' },
  { id: 'egyptian-mau', name: 'Egyptian Mau', group: 'breed', hint: 'Naturally spotted, green eyes' },
  { id: 'chartreux', name: 'Chartreux', group: 'breed', hint: 'Blue-grey, copper eyes' },
  { id: 'somali', name: 'Somali', group: 'breed', hint: 'Long-haired Abyssinian' },
  { id: 'tonkinese', name: 'Tonkinese', group: 'breed', hint: 'Soft points, aqua eyes' },
  { id: 'manx', name: 'Manx', group: 'breed', hint: 'No tail or a short stub' },
  { id: 'bombay', name: 'Bombay', group: 'breed', hint: 'Jet black, copper eyes' },
  { id: 'ragamuffin', name: 'RagaMuffin', group: 'breed', hint: 'Large, long-haired, gentle' },
];

const byId = new Map(breeds.map((breed) => [breed.id, breed]));

export function findBreed(id: string): Breed | undefined {
  return byId.get(id);
}

export const groupTitles: Record<BreedGroup, string> = {
  street: 'Street cats',
  breed: 'Breeds',
};
