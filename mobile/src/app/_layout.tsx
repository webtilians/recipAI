import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { RecipeSessionProvider } from '@/state/recipe-session';

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RecipeSessionProvider>
        <Stack
          screenOptions={{
            headerTintColor: colors.accent,
            headerTitleStyle: { color: colors.text },
            headerBackTitle: 'Atrás',
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ title: 'Recetas' }} />
          <Stack.Screen name="recipe/[index]" options={{ title: 'Receta' }} />
        </Stack>
      </RecipeSessionProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
