import cn from 'classnames'
import EyeOpenIcon from '../assets/eye.svg?react'
import EyeCloseIcon from '../assets/eye-closed.svg?react'
import { useMainAppFormContext } from '../context/MainFormContextProvider'

export interface HideSensitiveDataToggleProps {
  className?: string
}

/**
 * Show or hide the password fields in the credential widgets.
 *
 * The state is one boolean in localStorage (`hideSensitiveInfo`), so the toggle
 * is complete as ported. It is unrelated to `env.envType`, which gates a
 * different thing — whether a recorded jump's parameter value is stored masked
 * — and which the current payload does not carry.
 *
 * INTENTIONAL DIFF: a `<button>` with `aria-pressed`, where the original had a
 * `<div onClick>`. Same classes, same look; it is now reachable by keyboard and
 * announces which state it is in.
 */
export function HideSensitiveDataToggle({
  className,
}: HideSensitiveDataToggleProps) {
  const { isHideSensitiveInfo, setHideSensitiveInfo } = useMainAppFormContext()

  return (
    <button
      type="button"
      aria-pressed={isHideSensitiveInfo}
      aria-label={
        isHideSensitiveInfo ? 'Show sensitive values' : 'Hide sensitive values'
      }
      className={cn(
        'hover:bg-base-content hover:bg-opacity-10 p-1 rounded-md cursor-pointer',
        className,
      )}
      onClick={() => setHideSensitiveInfo(!isHideSensitiveInfo)}
    >
      {isHideSensitiveInfo ? (
        <EyeCloseIcon className={'w-4 h-4 '} />
      ) : (
        <EyeOpenIcon className={'w-4 h-4 '} />
      )}
    </button>
  )
}
