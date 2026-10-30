/** Shapes shared with the backend (backend/app/schemas.py). */

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Ingredient = {
  name: string;
  quantity: string;
  /** True when the ingredient was seen in the photo. */
  in_photo: boolean;
};

export type Recipe = {
  title: string;
  cuisine: string;
  summary: string;
  minutes: number;
  difficulty: Difficulty;
  servings: number;
  ingredients: Ingredient[];
  steps: string[];
  tip: string;
};

export type RecipeResults = {
  detected_ingredients: string[];
  /** Non-empty when the photo had no usable food. */
  notice: string;
  recipes: Recipe[];
  model: string;
};

/** A photo already resized and compressed, ready to upload. */
export type PreparedPhoto = {
  uri: string;
  base64: string;
  width: number;
  height: number;
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};
