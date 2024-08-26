import { useRouteError } from 'react-router-dom';
import { Layout } from '../Layout';

export function DefaultErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <Layout>
      <div className={'mt-8 text-center'}>
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred.</p>
        <pre className={'text-left mt-8 text-sm'}>
          {<i>{JSON.stringify(error, null, 2)}</i>}
        </pre>
      </div>
    </Layout>
  );
}
