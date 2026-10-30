/**
 * RecipAI colours for light and dark mode: warm kitchen tones with a tomato accent.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F1A17',
    background: '#FFF9F4',
    backgroundElement: '#F5ECE3',
    backgroundSelected: '#EADBCB',
    textSecondary: '#6F6259',
    border: '#E6D8CA',
    accent: '#D9481F',
    onAccent: '#FFFFFF',
    success: '#2E7D32',
  },
  dark: {
    text: '#F7F1EC',
    background: '#15110F',
    backgroundElement: '#241D19',
    backgroundSelected: '#3A2E25',
    textSecondary: '#B8ABA1',
    border: '#3A2F28',
    accent: '#FF7A50',
    onAccent: '#1A0F0A',
    success: '#7BC67E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
