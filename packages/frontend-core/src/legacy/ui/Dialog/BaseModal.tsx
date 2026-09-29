import cn from 'classnames'
import { useEffect, useRef } from 'react'
import type { FC, ReactNode } from 'react'
import type { ModalController } from '../../hooks/useModal'

export interface BaseDialogProps extends ModalController {
  children?: ReactNode
  className?: string
}

/**
 * The previous UI's only dialog shell: a native `<dialog>` with the skin's
 * `modal` / `modal-box` classes and a backdrop that closes on click.
 *
 * INTENTIONAL DIFF: the original looked its own element up by a hardcoded
 * `id="my_modal_1"` and needed a `@ts-expect-error` to get past
 * `getElementById` returning `HTMLElement`. A ref types correctly, needs no
 * suppression, and retires the duplicate-id defect — a second dialog rendered
 * anywhere on the page used to steal the first one's open call.
 */
export const BaseModal: FC<BaseDialogProps> = ({
  setOpener,
  className,
  children,
}) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    setOpener(() => ref.current?.showModal())
  }, [setOpener])

  return (
    <dialog ref={ref} className="modal">
      <div className={cn('modal-box', className)}>{children}</div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}
