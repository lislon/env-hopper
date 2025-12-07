import type { EnvBaseInfo } from '@env-hopper/backend-core'
import { Link } from '@tanstack/react-router'
import { AppWindow, ExternalLinkIcon, GroupIcon, HomeIcon } from 'lucide-react'
import { counting, debounce } from 'radashi'
import { useMemo, useRef } from 'react'
import { Input } from '~/components/ui/input'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { CROSS_CUTTING_SINGLE_SLUG } from '~/modules/crossCuttingParams/types'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type {
  ResourceJumpHistoryItem,
  ResourceJumpUI,
} from '~/modules/resourceJump/types'
import type { FlagshipResourceJumpUi } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'

export interface TopFlagship {
  flagship: FlagshipResourceJumpUi
  topResourceJumps: Array<ResourceJumpUI>;
}

function getTopFlagships(history: Array<ResourceJumpHistoryItem>): Array<TopFlagship> {
  const maxTopFlagships = 3;
  const maxResoucesPerFlagship = 3;
  const { flagshipJumpResources } = useResourceJumpContext();
  const byResorceSlug = Object.entries(
    counting(history.filter(h => h.resourceSlug !== undefined), (h) => h.resourceSlug!!)
  )

  const allResouceJumps = flagshipJumpResources.flatMap(f => f.resourceJumps);

  const topFlagships: TopFlagship[] = []
  for (const [rSlug] of byResorceSlug) {
    const rj = allResouceJumps.find(r => r.slug === rSlug);
    if (!rj) {
      continue;
    }

    if (topFlagships.length < maxTopFlagships) {
      topFlagships.push({
        flagship: rj.flagship,
        topResourceJumps: [],
      })
    }

    const tf = topFlagships.find(f => f.flagship.slug === rj.flagship.slug)
    if (tf && tf.topResourceJumps.length < maxResoucesPerFlagship) {
      tf.topResourceJumps.push(rj)
    }
  }


  // const byFlagship = Object.entries(
  //   counting(history, (h) => h.flagmanSlug || ''),
  // )

  // const byFlagshipSorted = sort(byFlagship, (f) => f[1], true)
  // return byFlagshipSorted.slice(0, 3).map((f) => f[0]).map((f) => ({
  //   flagship: f
  // }))
  return topFlagships;
}

export interface JumpButtonProps {
  resourceJump: ResourceJumpUI
}

function JumpButton({ resourceJump }: JumpButtonProps) {
  const { currentEnv } = useEnvironmentContext()
  const { getJumpUrl } = useResourceJumpContext()

  if (!currentEnv) {
    return null
  }

  return (
    <a
      href={getJumpUrl(resourceJump.slug, currentEnv.slug)}
      className="px-4 py-2 rounded-md hover:bg-primary/80 transition"
    >
      <span>
        <GroupIcon className="inline w-4 h-4 mr-2 align-middle stroke-secondary-foreground/50" />
      </span>
      <span>
        {resourceJump.displayName}
      </span>
    </a>
  )
}

export interface FlagshipBlockProps {
  topFlagship: TopFlagship
}

function FlagshipBlock({ topFlagship: { flagship, topResourceJumps} }: FlagshipBlockProps) {
  const { currentEnv } = useEnvironmentContext()
  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold">
        <LinkToFlagship flagship={flagship} env={currentEnv}>
          {flagship.displayName}
        </LinkToFlagship>
      </div>
      <div className="flex flex-col pl-4 border-l border-muted/50 gap-1">
        {topResourceJumps.map((rj) => (
          <JumpButton key={rj.slug} resourceJump={rj} />
        ))}
      </div>
    </div>
  )
}

function LinkToFlagship({ flagship, env, children }: { flagship: FlagshipResourceJumpUi, env?: EnvBaseInfo, children: React.ReactNode }) {
  if (!env) {
    return <Link to={'/app/$appSlug'} params={{ appSlug: flagship.slug }}>{children}</Link>
  } else if (flagship.resourceJumps[0] !== undefined) {
    return <Link to={'/env/$envSlug/app/$appSlug'} params={{ envSlug: env.slug, appSlug: flagship.resourceJumps[0].slug }}>{children}</Link>
  } else {
    return <span>{children}</span>
  }
}


export function EnvPage() {
  const {
    history,
  } = useResourceJumpContext()
  const { currentEnv } = useEnvironmentContext()

  const topFlagships = getTopFlagships(history)
  return (
    <div className="flex flex-col gap-4 w-[600px]">
      <div className='text-xl text-eh-env-foreground font-semibold'>{currentEnv?.displayName}</div>
      <div className='grid grid-cols-2'>
        {topFlagships.map(tp => {
          return <FlagshipBlock key={tp.flagship.slug} topFlagship={tp} />;
        })}
      </div>
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
      {/* <div className="flex flex-col gap-2 text-sm">
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
      </div> */}
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
