import { Link } from '@tanstack/react-router'
import { MainLayout } from '~/ui/layout/MainLayout'

export function NotFoundError() {
  return (
    <MainLayout>
      <main className={'mt-8 text-center'}>
        <h1>404 Not Found</h1>
        <p>Sorry, I don't recognize this URL. Probably this was old link?</p>
        <p>
          Navigate to <Link to={'/'}>Home page</Link>
        </p>
      </main>
    </MainLayout>
  )
}
