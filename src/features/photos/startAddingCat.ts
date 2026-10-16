import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { askPhotoSource } from './askPhotoSource';
import { CameraDeniedError, pickPhoto } from './pickPhoto';

// Asks for a photo, then opens the page that turns it into a cat.
export function startAddingCat() {
  askPhotoSource(async (source) => {
    try {
      const photo = await pickPhoto(undefined, source);
      if (photo) router.push({ pathname: '/add', params: { photo } });
    } catch (error) {
      if (error instanceof CameraDeniedError) {
        Alert.alert('Camera access is off', 'Turn on camera access in Settings to photograph cats.', [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      Alert.alert('Could not open that photo', 'Please try another one.');
    }
  });
}
