import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { RecipeCard } from '@/components/recipe-card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ANY_CUISINE } from '@/lib/cuisines';
import { useRecipeSession } from '@/state/recipe-session';

export default function ResultsScreen() {
  const { photo, status, results, error, search } = useRecipeSession();

  if (!photo || status === 'idle') return <Redirect href="/" />;
  if (status === 'loading') return <Thinking photoUri={photo.uri} />;

  if (status === 'error' || !results) {
    return (
      <Message icon="😕" text={error ?? 'Algo ha fallado.'}>
        <Button label="Reintentar" onPress={search} />
        <Button label="Cambiar foto" variant="secondary" onPress={() => router.back()} />
      </Message>
    );
  }

  if (results.recipes.length === 0) {
    return (
      <Message icon="🔍" text={results.notice || 'No he encontrado ingredientes en la foto.'}>
        <Button label="Probar otra foto" onPress={() => router.back()} />
      </Message>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {results.detected_ingredients.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="smallBold">Lo que veo en tu foto</ThemedText>
          <View style={styles.chips}>
            {results.detected_ingredients.map((ingredient) => (
              <Chip key={ingredient} label={ingredient} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="smallBold">Te propongo</ThemedText>
        {results.recipes.map((recipe, index) => (
          <RecipeCard
            key={`${index}-${recipe.title}`}
            recipe={recipe}
            onPress={() => router.push({ pathname: '/recipe/[index]', params: { index: String(index) } })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const THINKING_LINES = [
  'Mirando qué hay en tu foto…',
  'Pensando recetas…',
  'Escribiendo los pasos…',
  'Casi listo…',
];

function Thinking({ photoUri }: { photoUri: string }) {
  const theme = useTheme();
  const { cuisine } = useRecipeSession();
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setLine((current) => Math.min(current + 1, THINKING_LINES.length - 1)), 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.centered}>
      <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
      <ActivityIndicator size="large" color={theme.accent} />
      <ThemedText style={styles.centerText}>{THINKING_LINES[line]}</ThemedText>
      {cuisine.id !== ANY_CUISINE.id && (
        <ThemedText type="small" themeColor="textSecondary">
          Cocina {cuisine.label.toLowerCase()} {cuisine.emoji}
        </ThemedText>
      )}
    </View>
  );
}

function Message({ icon, text, children }: { icon: string; text: string; children: ReactNode }) {
  return (
    <View style={styles.centered}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText style={styles.centerText}>{text}</ThemedText>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two + 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  thumbnail: {
    width: 160,
    height: 160,
    borderRadius: Radius.large,
  },
  centerText: {
    textAlign: 'center',
  },
  icon: {
    fontSize: 48,
    lineHeight: 58,
  },
  actions: {
    alignSelf: 'stretch',
    gap: Spacing.two + 4,
    marginTop: Spacing.two,
  },
});
