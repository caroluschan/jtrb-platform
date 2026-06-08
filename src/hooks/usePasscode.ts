import { useState, useCallback } from 'preact/hooks';

const CORRECT_PIN = '9499';
const AUTH_KEY = 'jvc-auth';

export function usePasscode(): {
  isAuthenticated: boolean;
  authenticate: (pin: string) => boolean;
} {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(AUTH_KEY) === '1';
    } catch {
      return false;
    }
  });

  const authenticate = useCallback((pin: string): boolean => {
    if (pin === CORRECT_PIN) {
      try {
        localStorage.setItem(AUTH_KEY, '1');
      } catch {
        // localStorage unavailable
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  return { isAuthenticated, authenticate };
}
