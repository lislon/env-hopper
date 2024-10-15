import { useRouteError } from 'react-router-dom';
import { Layout } from '../Layout/Layout';

export function DefaultErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <Layout>
      <div className={'mt-8 text-center'} role="alert">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        {error instanceof Error && 'message' in error && (
          <pre className={'text-left mt-8 text-sm'}>
            {<i>{error.message}</i>}
          </pre>
        )}
      </div>
    </Layout>
  );
}
