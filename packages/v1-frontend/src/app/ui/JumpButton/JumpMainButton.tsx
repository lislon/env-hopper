import { formatAppTitle, getJumpUrl } from '../../lib/utils';
import { JumpALink } from './JumpALink';
import { MainJumpButtonNotReady } from './MainJumpButtonNotReady';
import cn from 'classnames';
import { useState } from 'react';
import { useMainAppFormContext } from '../../context/MainFormContextProvider';

export const JUMP_MAIN_BTN_ID = 'jump-main-button';

export interface JumpMainButtonProps {
  className?: string;
}

export function JumpMainButton({ className }: JumpMainButtonProps) {
  const { app, env, substitution } = useMainAppFormContext();

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const url = getJumpUrl({ app, env, substitution });
  return (
    <div className={cn('relative flex justify-center', className)}>
      {url !== undefined ? (
        <JumpALink
          id={JUMP_MAIN_BTN_ID}
          testId={'jump-main-button'}
          app={app}
          env={env}
          substitution={substitution}
          isMain={true}
          className="btn btn-outline px-8 py-4 h-auto shadow-xl group indicator relative hover:bg-base-content/10 hover:text-base-content w-full"
        >
          <div className="absolute top-0 bottom-0 right-0 flex items-center text-xl text-eh-green invisible lg:visible">
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
              <code>{formatAppTitle(app)}</code>
            </div>
            <div>
              <code>{env?.id}</code>
            </div>
            <div className={'group-hover:underline text-xs text-wrap'}>
              {url}
            </div>
          </div>
        </JumpALink>
      ) : (
        <div
          className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 flex-col cursor-not-allowed w-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <MainJumpButtonNotReady isHovered={isHovered} />
        </div>
      )}
    </div>
  );
}
