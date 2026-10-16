import { ActionSheetIOS, Alert, Platform } from 'react-native';

import type { PhotoSource } from './pickPhoto';

// Asks where a photo should come from: the camera, for the cat in front of
// you, or the library. iOS asks in its own sheet, Android in a dialog.
export function askPhotoSource(onChoose: (source: PhotoSource) => void) {
  const take = 'Take Photo';
  const library = 'Choose from Library';
  const cancel = 'Cancel';

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions({ options: [take, library, cancel], cancelButtonIndex: 2 }, (index) => {
      if (index === 0) onChoose('camera');
      if (index === 1) onChoose('library');
    });
    return;
  }
  Alert.alert(
    'Add a cat',
    undefined,
    [
      { text: cancel, style: 'cancel' },
      { text: library, onPress: () => onChoose('library') },
      { text: take, onPress: () => onChoose('camera') },
    ],
    { cancelable: true },
  );
}
