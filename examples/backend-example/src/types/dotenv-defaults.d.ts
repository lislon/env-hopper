declare module 'dotenv-defaults' {
  interface ConfigOptions {
    encoding?: string
    path?: string
    defaults?: string
    silent?: boolean
  }

  interface DotenvDefaultsOutput {
    error?: Error
    parsed?: Record<string, string>
  }

  export function config(options?: ConfigOptions): DotenvDefaultsOutput
}
