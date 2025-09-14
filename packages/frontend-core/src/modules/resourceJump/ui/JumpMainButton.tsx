import cn from 'classnames'
import { useResourceJumpContext } from '../ResourceJumpContext'
import { JumpALink } from './JumpALink'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import {
  formatJumpButtonTitle,
  isAutocompleteItem,
} from '~/plugins/builtin/pageUrl/pageUrlAutoCompletePlugin'

export const JUMP_MAIN_BTN_ID = 'jump-main-button'

export interface JumpMainButtonProps {
  className?: string
}

export function JumpMainButton({ className }: JumpMainButtonProps) {
  const { currentResourceJump, getJumpUrl } = useResourceJumpContext()

  const { currentEnv } = useEnvironmentContext()

  const url =
    currentResourceJump && currentEnv
      ? getJumpUrl(currentResourceJump.slug, currentEnv.slug)
      : undefined

  let buttonTitle = 'n/a'
  if (isAutocompleteItem(currentResourceJump)) {
    // If the current resource jump is an autocomplete item, format the button title
    buttonTitle = formatJumpButtonTitle(currentResourceJump)
  }

  // .btn:active:hover,
  //   .btn:active:focus {
  //   animation: button-pop 0s ease-out;
  //   transform: scale(var(--btn-focus-scale, 0.97));
  // }

  // @media (prefers-reduced-motion: no-preference) {

  //   .btn {
  //     animation: button-pop var(--animation-btn, 0.25s) ease-out;
  //   }
  // }

  return (
    <div className={cn('relative flex justify-center', className)}>
      {currentResourceJump !== undefined && url !== undefined ? (
        <JumpALink
          id={JUMP_MAIN_BTN_ID}
          testId={'jump-main-button'}
          ctx={{
            env: currentEnv,
          }}
          jumpResource={currentResourceJump}
          isMain={true}
          className={cn(
            'border border-secondary-foreground/50 primary text-center rounded-md px-8 py-4 h-auto shadow-xl group indicator relative hover:bg-base-content/10 hover:text-base-content w-full hover:bg-accent hover:text-accent-foreground ease-out  ',
            'active:hover:scale-(--btn-focus-scale) active:focus:scale-(--btn-focus-scale) motion-safe:duration-200',
          )}
        >
          <div className="absolute top-0 bottom-0 right-0 flex items-center text-xl text-hopper invisible lg:visible font-semibold select-none">
            <div
              className={cn(
                'mr-12 group-hover:motion-safe:-translate-x-0.5 group-hover:motion-safe:translate-y-0.5 group-hover:motion-safe:scale-y-90 group-hover:motion-safe:rotate-2 origin-bottom transition-transform motion-safe:duration-100',
              )}
            >
              JUMP
            </div>
          </div>
          <div
            className={'flex flex-col gap-6'}
            data-testid={'jump-main-button-text'}
          >
            <div>
              <code>{buttonTitle}</code>
            </div>
            <div>
              <code>{currentEnv?.slug}</code>
            </div>
            <div
              className={
                'group-hover:underline text-xs text-wrap font-semibold'
              }
            >
              {url}
            </div>
          </div>
        </JumpALink>
      ) : (
        <div className="border border-dashed border-black dark:border-white rounded flex justify-center p-4 flex-col cursor-not-allowed w-full">
          not ready
          {/* <MainJumpButtonNotReady isHovered={isHovered} /> */}
        </div>
      )}
    </div>
  )
}
