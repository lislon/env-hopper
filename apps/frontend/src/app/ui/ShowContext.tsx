'use client';
import React from 'react';
import { useEhContext } from '../context/EhContext';

export function ShowContext() {
  const { app, env, substitution, substitutionType, recentJumps } =
    useEhContext();
  return (
    <pre>
      {JSON.stringify(
        { app, env, substitution, substitutionType, recentJumps },
        undefined,
        2
      )}
    </pre>
  );
}
