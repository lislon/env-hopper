import type React from 'react'
import cn from 'classnames'

export type K8SClientStyle = 'k9s' | 'kubectl'

export interface SettingsModalProps {
  ref?: React.Ref<HTMLDialogElement>
  className?: string
  k8sStyle: K8SClientStyle
  onChangeK8sStyle: (style: K8SClientStyle) => void
  preview: string
}

const OPTIONS: Array<K8SClientStyle> = ['kubectl', 'k9s']

/**
 * Which kubernetes client the copyable command should be written for.
 *
 * INTENTIONAL DIFF in the plumbing only — the contents are as they were. The
 * original opened itself through a `useModal` hook that stored a `showModal`
 * callback in state and a shared `BaseModal` that looked the element up by the
 * hardcoded id `my_modal_1` — an id the FAQ dialog also used, so two of them on
 * one page opened the same element. A `<dialog>` is addressed by ref here
 * instead: no id, no duplicate, no callback in state, and both files it needed
 * are left for the wave that owns the FAQ dialog.
 */
export function SettingsModal({
  ref,
  className,
  preview,
  k8sStyle,
  onChangeK8sStyle,
}: SettingsModalProps) {
  return (
    <dialog ref={ref} className="modal">
      <div className={cn('modal-box prose', className)}>
        <h3>Change kubernetes client style</h3>

        {OPTIONS.map((option) => (
          <div className="form-control w-32" key={option}>
            <label className="label cursor-pointer">
              <span className="label-text">{option}</span>
              <input
                type="radio"
                name="k8s-client-style"
                className="radio"
                checked={k8sStyle === option}
                onChange={() => onChangeK8sStyle(option)}
              />
            </label>
          </div>
        ))}
        {preview && (
          <div>
            Preview
            <pre>
              <code className={'text-xs'}>{preview}</code>
            </pre>
          </div>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
