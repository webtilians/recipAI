import type { PreparedPhoto, RecipeResults } from '@/lib/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
const APP_TOKEN = process.env.EXPO_PUBLIC_RECIPAI_TOKEN;
/** A little longer than the server's own Gemini timeout. */
const TIMEOUT_MS = 100_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly cancelled = false,
  ) {
    super(message);
  }
}

export type RecipeQuery = {
  photo: PreparedPhoto;
  /** Cuisine label, or null to let the AI choose. */
  cuisine: string | null;
  notes: string;
};

export async function fetchRecipes(query: RecipeQuery, signal?: AbortSignal): Promise<RecipeResults> {
  if (!API_URL) {
    throw new ApiError('Falta la dirección del servidor: define EXPO_PUBLIC_API_URL en mobile/.env.');
  }

  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(APP_TOKEN ? { 'X-RecipAI-Token': APP_TOKEN } : {}),
      },
      body: JSON.stringify({
        image_base64: query.photo.base64,
        mime_type: 'image/jpeg',
        cuisine: query.cuisine,
        notes: query.notes.trim() || null,
        language: 'es',
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(messageForStatus(response.status));
    }
    return (await response.json()) as RecipeResults;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError('La IA está tardando demasiado. Vuelve a intentarlo.');
    if (signal?.aborted) throw new ApiError('Cancelado', true);
    throw new ApiError('No se pudo conectar con el servidor. Comprueba tu conexión.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return 'No se pudo leer la foto. Prueba con otra.';
    case 401:
      return 'La app no tiene permiso para usar el servidor (token incorrecto).';
    case 413:
      return 'La foto es demasiado grande.';
    case 429:
      return 'Has pedido muchas recetas seguidas. Espera un rato y vuelve a probar.';
    case 502:
      return 'La IA no ha podido preparar recetas ahora mismo. Vuelve a intentarlo.';
    case 503:
      return 'El servidor todavía no tiene configurada la IA.';
    default:
      return `Error del servidor (${status}).`;
  }
}
