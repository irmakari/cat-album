import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class CatStickerModule extends NativeModule<{}> {
  stickerAsync(source: string, key: string, size: number): Promise<string | null>;
  detectCatAsync(source: string): Promise<boolean | null>;
  remove(key: string): void;
}

// Missing on Android, the web and in Expo Go, where photos stay photos.
export default requireOptionalNativeModule<CatStickerModule>('CatSticker');
