import { Pressable, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

/** A rounded label; selectable when it gets an onPress. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected } : undefined}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, { color: selected ? theme.onAccent : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
  },
  label: {
    fontSize: 15,
    fontWeight: 500,
  },
  pressed: {
    opacity: 0.75,
  },
});
