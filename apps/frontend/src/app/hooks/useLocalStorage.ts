import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export function localStorageGet<T>(key: string, defaultValue: T) {
  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    try {
      return JSON.parse(storedValue) as T;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    return localStorageGet(key, defaultValue);
  });

  useEffect(() => {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
}
