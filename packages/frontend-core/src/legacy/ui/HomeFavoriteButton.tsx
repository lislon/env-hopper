export interface HomeFavoriteButtonProps {
  isFavorite: boolean
  onClick: () => void
  title: string
  testId?: string
}

/**
 * STUB — the memory wave owns this.
 *
 * The real button is a star that fills when the current selection is a
 * favourite. Favourites themselves already work: `EhContext` stores them and the
 * quick bars read them, so only this one affordance for toggling from inside the
 * field is missing. Rendering nothing keeps the field's reserved space, which is
 * why the input still carries `pr-10` when a button is passed.
 */
export function HomeFavoriteButton(_props: HomeFavoriteButtonProps) {
  return null
}
