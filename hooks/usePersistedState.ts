'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

// Estado que sobrevive a sair da tela e voltar (guardado no localStorage).
// Começa com o valor inicial e só depois carrega o salvo, para não divergir do servidor.
export function usePersistedState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) setValue(JSON.parse(raw) as T);
      } catch {
        // Storage indisponível ou dado inválido: segue com o valor inicial.
      }
      setReady(true);
    });
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sem storage, o estado segue só em memória.
    }
  }, [key, value, ready]);

  return [value, setValue];
}
