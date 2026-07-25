import { useContext } from 'react';
import { MidnightContext, type MidnightContextValue } from './MidnightContext';

export function useMidnight(): MidnightContextValue {
  const ctx = useContext(MidnightContext);
  if (!ctx) throw new Error('useMidnight must be used inside <MidnightProvider>');
  return ctx;
}

export type { MidnightContextValue };
