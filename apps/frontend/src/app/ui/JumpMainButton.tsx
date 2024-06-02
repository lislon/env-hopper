import { useEhContext } from '../context/EhContext';

import { getJumpUrl } from '../lib/utils';
import { JumpUrl } from './JumpUrl';


export function JumpMainButton() {
  const {
    app,
    env,
    substitution
  } = useEhContext();

  const url = getJumpUrl({ app, env, substitution });
  if (url !== undefined) {
    return <JumpUrl>
      <img
        src="/grasshopper-lsn.svg"
        // className="dark:invert"
        alt={'Grasshopper Logo'}
        width={100}
        height={24}
      />
    </JumpUrl>
  }
  return <div>No jump</div>
}
