import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundError() {
  return (
    <main className={'mt-8 text-center'}>
      <h1>404 Not Found</h1>
      <p>Sorry, I don't recognize this URL. Probably this was old link?</p>
      <p>
        Navigate to <Link to={'/'}>Home page</Link>
      </p>
    </main>
  );
}
