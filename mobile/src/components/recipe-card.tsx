import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DIFFICULTY_LABEL, type Recipe } from '@/lib/types';

type RecipeCardProps = {
  recipe: Recipe;
  onPress: () => void;
};

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const theme = useTheme();
  const fromPhoto = recipe.ingredients.filter((ingredient) => ingredient.in_photo).length;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" themeColor="accent">
        {recipe.cuisine.toUpperCase()}
      </ThemedText>
      <ThemedText style={styles.title}>{recipe.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
        {recipe.summary}
      </ThemedText>
      <View style={styles.meta}>
        <ThemedText type="small">⏱ {recipe.minutes} min</ThemedText>
        <ThemedText type="small">📶 {DIFFICULTY_LABEL[recipe.difficulty]}</ThemedText>
        <ThemedText type="small">
          ✓ {fromPhoto} de tu foto
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three + 4,
    gap: Spacing.two,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.three,
    rowGap: Spacing.one,
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
  },
});
