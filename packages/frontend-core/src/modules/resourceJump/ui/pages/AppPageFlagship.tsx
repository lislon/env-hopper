import { alphabetical, group } from 'radashi'
import { useState } from 'react'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { LateResolvableParamsInput } from '~/modules/resourceJump/ui/LateResolvableTopParam'
import { ResourceJumpButton } from '~/modules/resourceJump/ui/ResourceJumpButton'
import {
  getFlashipResource,
  isFlagshipResource,
} from '~/modules/resourceJump/utils/helpers'
import { useMostRelevantLateParamSlug } from '~/modules/resourceJump/utils/statistics/useMostRelevantLateParamSlug'

export function AppPageFlagship() {
  const { currentResourceJump, currentFlagship } =
    useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()
  const mostRelevantSlug = useMostRelevantLateParamSlug()
  const { crossCuttingParams } = useCrossCuttingParamsContext()
  
  const [selected, setSelected] = useState('');

  const resourceJumpsList =
    currentFlagship?.resourceJumps.filter((rj) => !isFlagshipResource(rj)) || []
  const grouped = group(resourceJumpsList, (rj) => {
    if (
      mostRelevantSlug &&
      rj.lateResolvableParamSlugs?.filter((s) => s === mostRelevantSlug)
        .length &&
      crossCuttingParams[mostRelevantSlug]?.stringValue
    ) {
      return 'slug-match'
    } else {
      return 'regular'
    }
  })
  const slugMatch = alphabetical(
    grouped['slug-match'] || [],
    (p) => p.displayName,
  )
  const regular = alphabetical(grouped['regular'] || [], (p) => p.displayName)

  const onClickResourceJump = (slug: string) => {
    setSelected(slug);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-center justify-between">
        <div className="flex flex-col gap-1 items-start py-4 grow-1">
          <ResourceJumpButton
            variant="flagship"
            resourceJump={getFlashipResource(currentResourceJump!.flagship)}
            env={currentEnv}
            onClick={() => onClickResourceJump(getFlashipResource(currentResourceJump!.flagship).slug)}
          />
        </div>
        <div>
          <LateResolvableParamsInput
            label="Case Id"
            placeholder="Case"
            mostRelevantSlug={mostRelevantSlug}
          />
        </div>
      </div>
      {slugMatch.length > 0 && (
        <>
          <div>Context</div>
          <div className="flex flex-col gap-2 text-sm">
            {slugMatch.map((rj) => (
              <ResourceJumpButton
                resourceJump={rj}
                env={currentEnv}
                key={rj.slug}
                onClick={() => onClickResourceJump(rj.slug)}
                className={rj.slug === selected ? 'bg-accent/50 rounded-lg' : ''}
              />
            ))}
          </div>
        </>
      )}
      {regular.length > 0 && (
        <>
          <div>Regular</div>
          <div className="flex flex-col gap-2 text-sm">
            {regular.map((rj) => (
              <ResourceJumpButton
                resourceJump={rj}
                env={currentEnv}
                key={rj.slug}
                onClick={() => onClickResourceJump(rj.slug)}
                className={rj.slug === selected ? 'bg-accent/50 rounded-lg' : ''}

              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
