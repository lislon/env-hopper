import { useCallback, useMemo, useState } from 'react'

export type Opener = () => void

/**
 * What a modal hands back to whoever renders it, so a sibling button can open it.
 *
 * INTENTIONAL DIFF: the original also carried `isOpen` and `close`. Both were
 * dead — `isOpen` was `useState(false)` that nothing ever set true, and `close`
 * only flipped that same unread flag; the dialog opens and closes through the
 * native element (`showModal()`, and the backdrop's `<form method="dialog">`),
 * which keeps its own state. Keeping them would have meant two sources of truth
 * for "is it open", one of them permanently wrong.
 */
export interface ModalController {
  setOpener: (opener: Opener) => void
}

export type ModalReturn = [Opener, ModalController]

/**
 * The registration seam between a modal and the button that opens it.
 *
 * The dialog element lives inside the modal component, so the parent cannot call
 * `showModal()` itself. The modal registers its own opener here on mount and the
 * parent gets a stable function to call.
 */
export function useModal(): ModalReturn {
  const [opener, setOpener] = useState<Opener | undefined>(undefined)

  const open = useCallback(() => opener?.(), [opener])

  // `setOpener` must stay referentially stable: the modal registers from an
  // effect keyed on it, and a fresh identity each render would re-register
  // forever.
  const controller = useMemo<ModalController>(
    () => ({
      // The updater form, or React would call the opener instead of storing it.
      setOpener: (next: Opener) => setOpener(() => next),
    }),
    [],
  )

  return [open, controller]
}
