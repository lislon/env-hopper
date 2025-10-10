import type { ResourceJumpsData } from '@env-hopper/backend-core';
import type { ResourceJumpUI } from '~/modules/resourceJump/types';
import type { FlagshipResourceJumpUi } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps';


export function mapToResouceJumpUis(resourceJumpsData: ResourceJumpsData, flagshipJumpResources: FlagshipResourceJumpUi[]): ResourceJumpUI[] {
  return resourceJumpsData.resourceJumps.map(rj => {
    const flagship = flagshipJumpResources.find(fr => fr.resourceJumps.some(r => r.slug === rj.slug));
    if (flagship === undefined) {
      throw new Error(`Could not find flagship for resource jump with slug ${rj.slug}`);
    }
    return {...rj, flagship}
  })
}
