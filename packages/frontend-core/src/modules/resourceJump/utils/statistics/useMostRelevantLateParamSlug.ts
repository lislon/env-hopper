import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext';

export function useMostRelevantLateParamSlug(): string | undefined {
  const { currentFlagship } = useResourceJumpContext();
  // const { history  } = useResourceJumpContext()
  const anyLateResolvableSlug = currentFlagship?.resourceJumps.flatMap(rj => rj.lateResolvableParamSlugs || [])[0];
  return anyLateResolvableSlug;
}
