import { Link } from '@tanstack/react-router'

export function NotFoundError() {
  return (
    <main className={'mt-8 text-center'}>
      <h1>404 Not Found</h1>
      <p>Sorry, I don't recognize this URL. Probably this was old link?</p>
      <p>
        Navigate to <Link to={'/'}>Home page</Link>
      </p>
    </main>)
}
