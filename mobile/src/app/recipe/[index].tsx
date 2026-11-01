import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DIFFICULTY_LABEL } from '@/lib/types';
import { useRecipeSession } from '@/state/recipe-session';

export default function RecipeScreen() {
  // The screen stays on while cooking.
  useKeepAwake();
  const theme = useTheme();
  const { index } = useLocalSearchParams<{ index: string }>();
  const { results } = useRecipeSession();
  const [doneSteps, setDoneSteps] = useState<ReadonlySet<number>>(new Set());

  const recipe = results?.recipes[Number(index)];
  if (!recipe) return <Redirect href="/" />;

  const toggleStep = (step: number) => {
    setDoneSteps((current) => {
      const next = new Set(current);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: recipe.title }} />

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="accent">
          {recipe.cuisine.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.title}>{recipe.title}</ThemedText>
        <ThemedText themeColor="textSecondary">{recipe.summary}</ThemedText>
        <View style={styles.meta}>
          <Pill text={`⏱ ${recipe.minutes} min`} />
          <Pill text={`👥 ${recipe.servings} ${recipe.servings === 1 ? 'ración' : 'raciones'}`} />
          <Pill text={`📶 ${DIFFICULTY_LABEL[recipe.difficulty]}`} />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.heading}>Ingredientes</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ✓ lo tienes en la foto · + básicos de despensa o para comprar
        </ThemedText>
        {recipe.ingredients.map((ingredient, position) => (
          <View key={`${position}-${ingredient.name}`} style={[styles.ingredient, { borderColor: theme.border }]}>
            <ThemedText style={[styles.mark, { color: ingredient.in_photo ? theme.success : theme.textSecondary }]}>
              {ingredient.in_photo ? '✓' : '+'}
            </ThemedText>
            <ThemedText style={styles.grow}>{ingredient.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {ingredient.quantity}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.heading}>Pasos</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Toca un paso para marcarlo como hecho.
        </ThemedText>
        {recipe.steps.map((step, position) => {
          const done = doneSteps.has(position);
          return (
            <Pressable
              key={position}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => toggleStep(position)}
              style={[styles.step, { backgroundColor: theme.backgroundElement }, done && styles.stepDone]}>
              <View style={[styles.stepNumber, { backgroundColor: done ? theme.success : theme.accent }]}>
                <ThemedText style={[styles.stepNumberText, { color: theme.onAccent }]}>
                  {done ? '✓' : position + 1}
                </ThemedText>
              </View>
              <ThemedText style={[styles.grow, done && styles.strike]}>{step}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {recipe.tip.trim() !== '' && (
        <View style={[styles.tip, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold">💡 Truco</ThemedText>
          <ThemedText>{recipe.tip}</ThemedText>
        </View>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Receta generada por IA: puede tener errores. Revisa ingredientes, alergias y que la carne, el pescado y los
        huevos queden bien cocinados.
      </ThemedText>
    </ScrollView>
  );
}

function Pill({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="small">{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two + 4,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: 800,
  },
  heading: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  pill: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.one + 2,
  },
  ingredient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mark: {
    width: 20,
    fontWeight: 700,
    textAlign: 'center',
  },
  grow: {
    flex: 1,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three - 4,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  stepDone: {
    opacity: 0.55,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 700,
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  tip: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
