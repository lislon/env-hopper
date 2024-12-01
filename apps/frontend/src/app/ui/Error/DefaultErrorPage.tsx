import { useQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../../api/ApiQueryMagazine';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useEffect, useState } from 'react';
import { useEhServerSync } from '../../context/EhServerSyncContext';
import { ErrorComponentProps } from '@tanstack/react-router/src/route';
import { LOCAL_STORAGE_KEY_VERSION } from '../../lib/local-storage-constants';

export function DefaultErrorPage({ error }: ErrorComponentProps) {
  const { data: config } = useQuery(ApiQueryMagazine.getConfig());
  const [localAppVersion] = useLocalStorage(
    LOCAL_STORAGE_KEY_VERSION,
    undefined,
  );
  const { isDegraded } = useEhServerSync();
  const configAppVersion = config?.appVersion;
  const [somethingIsWrong, setSomethingIsWrong] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setSomethingIsWrong(true);
    }, 25000);
    return () => {
      clearTimeout(t);
    };
  }, []);

  const isProbablyWillResolvedAfterUpdate =
    localAppVersion !== undefined &&
    configAppVersion !== undefined &&
    localAppVersion !== configAppVersion &&
    !somethingIsWrong &&
    !isDegraded;

  return (
    <>
      <div className={'mt-8 text-center prose !max-w-none'} role="alert">
        {isProbablyWillResolvedAfterUpdate && (
          <div>
            <h2>New version is loading....</h2>
            <div className="loading loading-dots loading-lg"></div>
            <p>
              Please wait, new version is loading{' '}
              <span className={'text-nowrap'}>
                {localAppVersion} -&gt; <strong>{configAppVersion}</strong>
              </span>
            </p>
            <p className="text-sm">
              While waiting, you can check what is changed:{' '}
              <a href={'https://github.com/lislon/env-hopper/releases/'}>
                https://github.com/lislon/env-hopper/releases/
              </a>
            </p>
          </div>
        )}
        {!isProbablyWillResolvedAfterUpdate && (
          <>
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred. :( </p>
            <pre className={'text-left mt-8 text-sm'}>
              {<i>{error.message}</i>}
            </pre>
            <pre className={'text-left mt-8 text-sm'}>
              {<i>{error.stack}</i>}
            </pre>
          </>
        )}
      </div>
    </>
  );
}
