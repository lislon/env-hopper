import React, { ReactNode } from 'react';
import Playground from '~/ui/autocomplete/Playground';

export interface HomeProps {
  children?: ReactNode;
}

export function Home(props: HomeProps) {
  return (<>
    <Playground />
  </>);
}
