import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useColors } from '@/theme';

import { photoUri } from './photos';
import { useSticker } from './sticker';

type Props = {
  // The photo to cut the cat out of, and the key its sticker is kept under.
  uri: string;
  stickerKey: string;
  size: number;
  // Shows the photo itself even where there is a sticker.
  photo?: boolean;
};

// A cat as the album shows it: its sticker, or its photo in a circle where
// no sticker can be made, so Android and older iPhones still get a collection.
export function CatArt({ uri, stickerKey, size, photo = false }: Props) {
  const theme = useColors();
  const sticker = useSticker(uri, stickerKey);

  // While the sticker is being cut, the photo stands in, faded, so there is
  // always a cat to look at.
  if (sticker === undefined) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri }}
          contentFit="cover"
          style={[
            styles.photo,
            styles.pending,
            { width: size, height: size, borderRadius: size / 2, borderColor: theme.surface },
          ]}
          accessibilityIgnoresInvertColors
        />
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator color={theme.text} />
        </View>
      </View>
    );
  }
  if (sticker && !photo) {
    return (
      <Image
        source={{ uri: sticker }}
        contentFit="contain"
        transition={200}
        style={{ width: size, height: size }}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      transition={200}
      style={[styles.photo, { width: size, height: size, borderRadius: size / 2, borderColor: theme.surface }]}
      accessibilityIgnoresInvertColors
    />
  );
}

// The same, for a cat already in the collection.
export function SavedCatArt({
  cat,
  size,
  photo,
}: {
  cat: { id: string; photo: string };
  size: number;
  photo?: boolean;
}) {
  return <CatArt uri={photoUri(cat.photo)} stickerKey={cat.id} size={size} photo={photo} />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    borderWidth: 2,
  },
  pending: {
    opacity: 0.45,
  },
});
