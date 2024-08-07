import { Dispatch, SetStateAction, useReducer, useState } from 'react';

export const localStorageMock = {} as Record<string, unknown>;

export function useLocalStorageMock<T>(
  key: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [, dispatch] = useReducer((n) => n + 1, 0);

  localStorageMock[key] = localStorageMock[key] || defaultValue;
  return [
    localStorageMock[key] as T,
    (value: unknown) => {
      if (localStorageMock[key] !== value) {
        dispatch();
      }
      localStorageMock[key] = value;
    },
  ];
}
