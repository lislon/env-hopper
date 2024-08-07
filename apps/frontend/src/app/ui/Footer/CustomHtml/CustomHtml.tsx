import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '../../../api';

export function CustomHtml() {
  const { data } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  });

  if (data?.customFooterHtml) {
    return <div>${data.customFooterHtml}</div>;
  }
  return null;
}
