import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';

import { PRIVACY_URL } from '@/lib/api';

/** Bump the version to ask again if what is shared with the AI ever changes. */
const CONSENT_KEY = 'recipai.photo-consent.v1';

const TITLE = 'Tu foto se envía a Google Gemini';
const MESSAGE =
  'Para reconocer los ingredientes y escribir las recetas, RecipAI envía la foto, el tipo de cocina y tus notas ' +
  'a Gemini, la IA de Google. RecipAI no guarda tus fotos. Evita fotos con personas o datos personales.';

export function openPrivacyPolicy() {
  if (PRIVACY_URL) WebBrowser.openBrowserAsync(PRIVACY_URL);
}

/**
 * Apple asks apps to say clearly, and get permission, before personal data goes to a
 * third-party AI. The photo goes to Google Gemini, so ask once before the first upload.
 */
export async function ensurePhotoConsent(): Promise<boolean> {
  try {
    if ((await AsyncStorage.getItem(CONSENT_KEY)) === 'yes') return true;
  } catch {
    // Unreadable storage: just ask again.
  }

  const accepted = await askConsent();
  if (accepted) {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'yes');
    } catch {
      // Not saved: the notice shows again next time, which is harmless.
    }
  }
  return accepted;
}

function askConsent(): Promise<boolean> {
  // React Native's Alert does nothing on web, where only the dev preview runs.
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${TITLE}\n\n${MESSAGE}`));

  return new Promise((resolve) => {
    Alert.alert(
      TITLE,
      MESSAGE,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Ver privacidad',
          onPress: () => {
            openPrivacyPolicy();
            resolve(false);
          },
        },
        { text: 'Aceptar y enviar', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
