import { catalogDbGlobalSetup } from '../../../packages/test-kit/src/catalog-db/index.ts'
import { shutdownTestServer } from '../src/catalog/fakeEntityProvider'

export default function setup({
  provide,
}: {
  provide: (key: string, value: unknown) => void
}) {
  catalogDbGlobalSetup({ provide })

  return async () => {
    await shutdownTestServer()
  }
}
