import { useEhContext } from '../../context/EhContext';

import { getJumpUrl } from '../../lib/utils';
import { JumpALink } from './JumpALink';
import { AppWidgetsPanel } from '../Widget/AppWidgetsPanel';
import { MainJumpButtonNotReady } from './MainJumpButtonNotReady';

export const JUMP_MAIN_BTN_ID = 'jump-main-button';

export function JumpMainButton() {
  const { app, env, substitution } = useEhContext();

  const url = getJumpUrl({ app, env, substitution });
  if (url !== undefined) {
    return (
      <div className="relative flex justify-center">
        <JumpALink
          id={JUMP_MAIN_BTN_ID}
          testId={'jump-main-button'}
          app={app}
          env={env}
          substitution={substitution}
          isMain={true}
          className="btn btn-outline px-8 py-4 h-auto shadow-xl group indicator min-w-[800px] relative hover:bg-base-content/10 hover:text-base-content"
        >
          <div className="absolute top-0 bottom-0 right-0 flex items-center text-xl text-primary-content">
            <div
              className={
                'mr-12 group-hover:motion-safe:-translate-x-0.5 group-hover:motion-safe:translate-y-0.5  group-hover:motion-safe:scale-y-90 group-hover:motion-safe:rotate-2 origin-bottom transition-transform motion-safe:duration-100'
              }
            >
              JUMP
            </div>
          </div>
          <div
            className={'flex flex-col gap-6'}
            data-testid={'jump-main-button-text'}
          >
            <div>
              <code>{app?.title}</code>
            </div>
            <div>
              <code>{env?.id}</code>
            </div>
            <div className={'group-hover:underline text-xs'}>{url}</div>
          </div>
        </JumpALink>
        <AppWidgetsPanel />
      </div>
    );
  } else {
    return (
      <div>
        <div className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 flex-col cursor-not-allowed">
          <MainJumpButtonNotReady />
        </div>
      </div>
    );
  }
}
