import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { CatsProvider } from '@/features/cats/CatsProvider';
import { DATABASE_NAME, migrate } from '@/features/cats/db';
import { FriendsProvider } from '@/features/friends/FriendsProvider';
import { fontAssets, fonts, useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = useColors();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Held behind the splash screen, so no text ever shows in the wrong font.
  if (!ready) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      primary: colors.accent,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <AuthProvider>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
          <CatsProvider>
            <FriendsProvider>
              <Stack
                screenOptions={{
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: 'minimal',
                  headerTintColor: colors.text,
                  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
                  contentStyle: { backgroundColor: colors.background },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="add" options={{ title: 'New Cat', presentation: 'modal' }} />
                <Stack.Screen name="account" options={{ title: 'Create Account', presentation: 'modal' }} />
                <Stack.Screen name="breed/[id]" options={{ title: '' }} />
                <Stack.Screen name="cat/[id]" options={{ title: '' }} />
                <Stack.Screen name="friend/[id]" options={{ title: '' }} />
                <Stack.Screen name="u/[username]" options={{ title: '', presentation: 'modal' }} />
              </Stack>
            </FriendsProvider>
          </CatsProvider>
        </SQLiteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
