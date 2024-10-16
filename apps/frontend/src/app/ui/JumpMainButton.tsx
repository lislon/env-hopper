import { useEhContext } from '../context/EhContext';

import { getJumpUrl } from '../lib/utils';
import { JumpUrl } from './JumpUrl';
import { AppWidgetsPanel } from './Widget/AppWidgetsPanel';

export function JumpMainButton() {
  const { app, env, substitution, substitutionType } = useEhContext();

  const url = getJumpUrl({ app, env, substitution });
  if (url !== undefined) {
    return (
      <div className="relative flex justify-center">
        <JumpUrl
          app={app}
          env={env}
          substitution={substitution}
          isMain={true}
          className="btn btn-outline px-8 py-4 h-auto shadow-xl group indicator min-w-[800px]"
        >
          <span className="indicator-item badge badge-primary">Jump</span>
          <div className={'flex flex-col gap-6'}>
            <div>
              <code>{app?.title}</code>
            </div>
            <div>
              <code>{env?.id}</code>
            </div>
            <div className={'group-hover:underline text-xs'}>{url}</div>
          </div>
          {/*<div className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 hover:border-solid hover:bg-gray-100 dark:hover:bg-gray-700 flex-col">*/}
          {/*  <div className="text-center p-5">JUMP</div>*/}
          {/*  <div className="text-center underline">{url}</div>*/}
          {/*  <NewWindowIcon*/}
          {/*    className={'w-4 h-4 absolute top-2 right-2 opacity-50'}*/}
          {/*  />*/}
          {/*</div>*/}
        </JumpUrl>
        <AppWidgetsPanel />
      </div>
    );
  } else {
    return (
      <div>
        <div className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 flex-col cursor-not-allowed">
          <div className="text-center p-5">
            {env === undefined
              ? 'Select an environment'
              : app === undefined
                ? 'Select an app'
                : `Enter ${substitutionType?.title}`}
          </div>
        </div>
      </div>
    );
  }
}
