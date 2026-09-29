import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * Ported from the previous UI unchanged except for the tolerant read below.
 *
 * INTENTIONAL DIFF: the original did a bare `JSON.parse(storedValue)`. The
 * previous UI owned localStorage alone; here `next-themes` writes the same
 * `theme` key as a RAW string (`dark`), and `JSON.parse('dark')` throws — which
 * took out the whole provider tree on mount. Falling back to the raw string
 * keeps both writers readable.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key)
    if (storedValue) {
      try {
        return JSON.parse(storedValue) as T
      } catch {
        return storedValue as T
      }
    }
    return typeof defaultValue === 'function'
      ? (defaultValue as () => T)()
      : defaultValue
  })

  useEffect(() => {
    if (value === undefined) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, [value, key])

  return [value, setValue]
}
