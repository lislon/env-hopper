import { useEhContext } from '../context/EhContext';

import { getJumpUrl } from '../lib/utils';
import { JumpUrl } from './JumpUrl';


export function JumpMainButton() {
  const {
    app,
    env,
    substitution,
    substitutionType,
  } = useEhContext();

  const url = getJumpUrl({ app, env, substitution });
  if (url !== undefined) {
    return <div>
      <JumpUrl app={app} env={env} substitution={substitution}>
        <div
          className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 hover:border-solid hover:bg-gray-100 dark:hover:bg-gray-700 flex-col">
          <div className="text-center p-5">JUMP</div>
          <div className="text-center underline">{url}</div>
        </div>
      </JumpUrl>
    </div>;
  } else {
    return <div>
      <div
        className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 flex-col cursor-not-allowed">
        <div className="text-center p-5">
          {env === undefined ? 'Select an environment' : (app === undefined ? 'Select an app' : `Enter ${substitutionType?.title}`)}
        </div>
      </div>
    </div>;

  }
}
