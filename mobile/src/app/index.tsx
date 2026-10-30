import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CuisinePicker } from '@/components/cuisine-picker';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickPhoto, type PhotoSource } from '@/lib/photo';
import { useRecipeSession } from '@/state/recipe-session';

export default function CaptureScreen() {
  const theme = useTheme();
  const { photo, setPhoto, cuisine, setCuisine, notes, setNotes, search } = useRecipeSession();
  const [preparing, setPreparing] = useState<PhotoSource | null>(null);

  const takePhoto = async (source: PhotoSource) => {
    setPreparing(source);
    try {
      const result = await pickPhoto(source);
      if (result.status === 'ok') setPhoto(result.photo);
      if (result.status === 'denied') {
        Alert.alert('Sin acceso a la cámara', 'Activa el permiso de cámara en Ajustes para hacer la foto.', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => Linking.openSettings() },
        ]);
      }
    } catch {
      Alert.alert('No se pudo usar la foto', 'Vuelve a intentarlo con otra foto.');
    } finally {
      setPreparing(null);
    }
  };

  const findRecipes = () => {
    search();
    router.push('/results');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText style={styles.brand}>
            Recip<ThemedText style={[styles.brand, { color: theme.accent }]}>AI</ThemedText>
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Haz una foto a tu nevera, tu despensa o la mesa y te propongo recetas con lo que tienes.
          </ThemedText>
        </View>

        {photo ? (
          <View style={styles.section}>
            <Image
              source={{ uri: photo.uri }}
              style={[styles.photo, { aspectRatio: photo.width / photo.height || 4 / 3 }]}
              contentFit="cover"
              accessibilityLabel="Tu foto"
            />
            <View style={styles.row}>
              <Button
                label="Repetir foto"
                variant="secondary"
                style={styles.grow}
                busy={preparing === 'camera'}
                disabled={preparing !== null}
                onPress={() => takePhoto('camera')}
              />
              <Button
                label="Galería"
                variant="secondary"
                style={styles.grow}
                busy={preparing === 'library'}
                disabled={preparing !== null}
                onPress={() => takePhoto('library')}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.placeholder, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.placeholderIcon}>📸</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Que se vean bien los ingredientes: abre la nevera, aparta lo que tape y busca buena luz.
            </ThemedText>
            <Button
              label="Hacer foto"
              style={styles.stretch}
              busy={preparing === 'camera'}
              disabled={preparing !== null}
              onPress={() => takePhoto('camera')}
            />
            <Button
              label="Elegir de la galería"
              variant="secondary"
              style={styles.stretch}
              busy={preparing === 'library'}
              disabled={preparing !== null}
              onPress={() => takePhoto('library')}
            />
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="smallBold">¿Qué tipo de cocina te apetece?</ThemedText>
          <CuisinePicker value={cuisine} onChange={setCuisine} />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">¿Algo más? (opcional)</ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej.: vegetariana, sin gluten, en menos de 20 minutos…"
            placeholderTextColor={theme.textSecondary}
            maxLength={200}
            multiline
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          />
        </View>

        <Button label="Buscar recetas" disabled={!photo || preparing !== null} onPress={findRecipes} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
  },
  brand: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: 800,
  },
  section: {
    gap: Spacing.two + 4,
  },
  photo: {
    width: '100%',
    maxHeight: 420,
    borderRadius: Radius.large,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  grow: {
    flex: 1,
  },
  placeholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  placeholderIcon: {
    fontSize: 48,
    lineHeight: 58,
  },
  center: {
    textAlign: 'center',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three - 4,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
