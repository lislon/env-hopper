import React, { useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../api/ApiQueryMagazine';

function InsertJs({ js }: { js: string }) {
  useEffect(() => {
    if (document.getElementById('analytics-script') === null) {
      const script = document.createElement('script');
      script.id = 'analytics-script';
      script.async = true;
      script.innerHTML = js;
      document.body.appendChild(script);
    }
  }, [js]);
  return null;
}

export function Analytics() {
  const { data: customization } = useSuspenseQuery(
    ApiQueryMagazine.getCustomization(),
  );

  return (
    <InsertJs
      js={customization.analyticsScript.replace(
        '{{APP_VERSION}}',
        import.meta.env.VITE_APP_VERSION,
      )}
    />
  );
}
