import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Spacing } from '@/constants/theme';
import { CUISINES, type Cuisine } from '@/lib/cuisines';

type CuisinePickerProps = {
  value: Cuisine;
  onChange: (cuisine: Cuisine) => void;
};

export function CuisinePicker({ value, onChange }: CuisinePickerProps) {
  return (
    <View style={styles.grid}>
      {CUISINES.map((cuisine) => (
        <Chip
          key={cuisine.id}
          label={`${cuisine.emoji} ${cuisine.label}`}
          selected={cuisine.id === value.id}
          onPress={() => onChange(cuisine)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
