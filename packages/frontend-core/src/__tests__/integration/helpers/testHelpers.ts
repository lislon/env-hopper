export interface Deferred {
  defer: <T>(value: T) => Promise<T>
  resolve: () => void
  reject: (error: Error) => void
}

export function createDeferred(): Deferred {
  let resolveInternal!: () => void
  let rejectInternal!: (error: Error) => void

  const promise = new Promise<void>((res, rej) => {
    resolveInternal = res
    rejectInternal = rej
  })

  return {
    defer: async <T>(value: T): Promise<T> => {
      await promise
      return value
    },
    resolve: resolveInternal,
    reject: rejectInternal,
  }
}
