import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useAppsQuery } from '@/graphql-types';

const APPS_QUERY = gql`
  query Apps {
    apps {
      id
      name
      displayName
    }
  }
`;

export const Route = createFileRoute('/')({
  component: IndexRoute,
});
 
export function IndexRoute() {
  const { data, loading, error } = useAppsQuery({ fetchPolicy: 'cache-and-network' });
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Env Hopper Apps</h1>
      {loading && <div className="alert alert-info">Loading apps...</div>}
      {error && <div className="alert alert-error">Error loading apps</div>}
      {data && (
        <div className="grid gap-4">
          {data.apps.map((app: any) => (
            <div key={app.id} className="card bg-base-100 shadow-md p-4">
              <div className="font-bold text-lg">{app.displayName}</div>
              <div className="text-sm text-gray-500">{app.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 