import { createContext, use, useRef, useState, type ReactNode } from 'react';

import { ApiError, fetchRecipes } from '@/lib/api';
import { ANY_CUISINE, type Cuisine } from '@/lib/cuisines';
import type { PreparedPhoto, RecipeResults } from '@/lib/types';

export type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

type RecipeSession = {
  photo: PreparedPhoto | null;
  cuisine: Cuisine;
  notes: string;
  status: SearchStatus;
  results: RecipeResults | null;
  error: string | null;
  setPhoto: (photo: PreparedPhoto | null) => void;
  setCuisine: (cuisine: Cuisine) => void;
  setNotes: (notes: string) => void;
  /** Sends the photo and wishes to the backend; the results screen shows progress. */
  search: () => void;
};

const RecipeSessionContext = createContext<RecipeSession | null>(null);

/** Holds the current photo, the user's wishes and the last answer, shared by every screen. */
export function RecipeSessionProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [cuisine, setCuisine] = useState<Cuisine>(ANY_CUISINE);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<RecipeResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const search = () => {
    if (!photo) return;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setStatus('loading');
    setResults(null);
    setError(null);
    fetchRecipes({ photo, cuisine: cuisine.id === ANY_CUISINE.id ? null : cuisine.label, notes }, controller.signal)
      .then((answer) => {
        if (controller.signal.aborted) return;
        setResults(answer);
        setStatus('done');
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof ApiError ? reason.message : 'Algo ha fallado. Vuelve a intentarlo.');
        setStatus('error');
      });
  };

  const changePhoto = (next: PreparedPhoto | null) => {
    inFlight.current?.abort();
    setPhoto(next);
    setStatus('idle');
    setResults(null);
    setError(null);
  };

  return (
    <RecipeSessionContext
      value={{
        photo,
        cuisine,
        notes,
        status,
        results,
        error,
        setPhoto: changePhoto,
        setCuisine,
        setNotes,
        search,
      }}>
      {children}
    </RecipeSessionContext>
  );
}

export function useRecipeSession(): RecipeSession {
  const session = use(RecipeSessionContext);
  if (!session) throw new Error('useRecipeSession must be used inside RecipeSessionProvider');
  return session;
}
