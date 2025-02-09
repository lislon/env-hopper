import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultErrorComponent({ error }: ErrorComponentProps) {
  //   const { data: config } = useQuery(ApiQueryMagazine.getConfig());
  //   const [localAppVersion] = useLocalStorage(
  //     LOCAL_STORAGE_KEY_VERSION,
  //     undefined,
  //   );
  //   const { isDegraded } = useEhServerSync();
  //   const configAppVersion = config?.appVersion;
  //   const [somethingIsWrong, setSomethingIsWrong] = useState(false);
  //   useEffect(() => {
  //     const t = setTimeout(() => {
  //       setSomethingIsWrong(true);
  //     }, 25000);
  //     return () => {
  //       clearTimeout(t);
  //     };
  //   }, []);

  //   const isProbablyWillResolvedAfterUpdate =
  //     localAppVersion !== undefined &&
  //     configAppVersion !== undefined &&
  //     localAppVersion !== configAppVersion &&
  //     !somethingIsWrong &&
  //     !isDegraded;

  return (
    <>
      <div className={'mt-8 text-center !max-w-none'} role="alert">
        <h1>Oops!</h1>
        <p>Sorry, an unexpected error has occurred. :( </p>
        <pre className={'text-left mt-8 text-sm'}>{<i>{error.message}</i>}</pre>
        <pre className={'text-left mt-8 text-sm'}>{<i>{error.stack}</i>}</pre>
      </div>
    </>
  )
}
