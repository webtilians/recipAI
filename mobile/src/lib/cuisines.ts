export type Cuisine = {
  id: string;
  label: string;
  emoji: string;
};

/** "Surprise me": no cuisine is sent and the AI varies them. */
export const ANY_CUISINE: Cuisine = { id: 'any', label: 'Sorpréndeme', emoji: '✨' };

export const CUISINES: Cuisine[] = [
  ANY_CUISINE,
  { id: 'mediterranea', label: 'Mediterránea', emoji: '🫒' },
  { id: 'espanola', label: 'Española', emoji: '🥘' },
  { id: 'italiana', label: 'Italiana', emoji: '🍝' },
  { id: 'japonesa', label: 'Japonesa', emoji: '🍣' },
  { id: 'vietnamita', label: 'Vietnamita', emoji: '🍜' },
  { id: 'india', label: 'India', emoji: '🍛' },
  { id: 'mexicana', label: 'Mexicana', emoji: '🌮' },
  { id: 'china', label: 'China', emoji: '🥟' },
  { id: 'tailandesa', label: 'Tailandesa', emoji: '🌶️' },
  { id: 'coreana', label: 'Coreana', emoji: '🥢' },
  { id: 'francesa', label: 'Francesa', emoji: '🥐' },
  { id: 'griega', label: 'Griega', emoji: '🥙' },
  { id: 'peruana', label: 'Peruana', emoji: '🐟' },
  { id: 'libanesa', label: 'Libanesa', emoji: '🧆' },
];
