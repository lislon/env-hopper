import type { EnvBaseInfo } from '@env-hopper/backend-core'
import { AppWindow, ExternalLinkIcon, HomeIcon } from 'lucide-react'
import { alphabetical, debounce } from 'radashi'
import { useMemo, useRef } from 'react'
import { Input } from '~/components/ui/input'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { CROSS_CUTTING_SINGLE_SLUG } from '~/modules/crossCuttingParams/types'
import { useEnvironmentContext } from '~/modules/environment/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/ResourceJumpContext'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'

export function PageJump() {
  const { currentResourceJump, currentFlagship } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()
  return (
    <div className="flex flex-col gap-4 w-[600px]">
      {/* <div>
        Related to Case ID - <strong>12q33244</strong>
      </div> */}
      {/* <Card>
        <CardContent>
          <div className="flex gap-2 justify-center">
            <div>
              <InputGroup>
                <InputGroupInput placeholder="Case Id, Clinic Id, ..." />
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div>
              <Button variant="secondary">Go</Button>
            </div>
          </div>

        </CardContent>
      </Card> */}
      {/* 
      <div className="flex flex-col gap-2">
        <div className="round-lg p-2 rounded-lg hover:bg-secondary/50">
          Slisptream
        </div>
        <div className="round-lg p-2 rounded-lg hover:bg-secondary/50">
          <div className="flex items-center justify-between ">
            <div className="grow">Support Review #</div>
            <InputGroup className="max-w-64 h-">
              <InputGroupInput placeholder="Type case id to search ..." />
            </InputGroup>
          </div>
        </div>
      </div> */}

      <div className="flex flex-col gap-2 text-sm">
        {currentFlagship &&
          alphabetical(currentFlagship.resourceJumps, (p) => p.displayName).map(
            (rj) => (
              <ResouceJumpRow
                resourceJump={rj}
                env={currentEnv}
                key={rj.slug}
              />
            ),
          )}
      </div>
    </div>
  )
}

export function LateResolvableParamInput({
  resourceJump,
}: {
  resourceJump: ResourceJumpUI
}) {
  const { getParamDefBySlug, crossCuttingParams, setCrossCuttingParams } =
    useCrossCuttingParamsContext()

  const paramSlug = resourceJump.lateResolvableParamSlugs?.[0] || ''

  const paramDef = getParamDefBySlug(paramSlug)

  const paramsObj = crossCuttingParams[paramSlug] || {
    stringValue: '',
    slug: CROSS_CUTTING_SINGLE_SLUG,
  }

  const paramsRef = useRef(crossCuttingParams)
  paramsRef.current = crossCuttingParams

  const debouncedUpdate = useMemo(
    () =>
      debounce({ delay: 100 }, (value: string) => {
        setCrossCuttingParams({
          ...paramsRef.current,
          [paramSlug]: { slug: paramSlug, stringValue: value },
        })
      }),
    [paramSlug, setCrossCuttingParams],
  )

  if (!paramSlug) {
    return null
  }

  return (
    <Input
      placeholder={paramDef?.displayName || 'undef ' + paramDef}
      className="w-fit"
      defaultValue={paramsObj.stringValue || ''}
      key={paramSlug}
      onChange={(v) => {
        debouncedUpdate(v.target.value)
      }}
    />
  )
}

export function ResouceJumpRow({
  resourceJump: resouceJump,
  env,
}: {
  resourceJump: ResourceJumpUI
  env: EnvBaseInfo | undefined
}) {
  const { getJumpUrl } = useResourceJumpContext()

  return (
    <div className="p-4 flex flex-col gap-2 hover:bg-accent duration-100 rounded-lg group">
      <div className="flex justify-end gap-4 items-center">
        <div className="inline-flex gap-2 mr-auto">
          {resouceJump.displayName === 'Home' ? (
            <HomeIcon className="stroke-hopper inline" />
          ) : (
            <AppWindow className="inline stroke-secondary-foreground/50" />
          )}
          {resouceJump.displayName}
        </div>
        <LateResolvableParamInput resourceJump={resouceJump} />
        <ExternalLinkIcon className="w-4 stroke-secondary-foreground invisible group-hover:visible" />
      </div>
      <div className="text-muted-foreground/50 text-xs hover:visible">
        {env ? (
          <a href={getJumpUrl(resouceJump.slug, env.slug)}>
            {getJumpUrl(resouceJump.slug, env.slug)}
          </a>
        ) : (
          'pick env'
        )}
      </div>
    </div>
  )
}
