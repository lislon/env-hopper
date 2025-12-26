import type { EnvBaseInfo } from '@env-hopper/backend-core'
import { Link } from '@tanstack/react-router'
import { counting } from 'radashi'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type {
    ResourceJumpHistoryItem,
    ResourceJumpUI,
} from '~/modules/resourceJump/types'
import { ResourceJumpButton } from '~/modules/resourceJump/ui/ResourceJumpButton'
import type { FlagshipResourceJumpUi } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'
import { Card, CardContent, CardHeader } from '~/ui/card'

export interface TopFlagship {
  flagship: FlagshipResourceJumpUi
  topResourceJumps: Array<ResourceJumpUI>
}

function getTopFlagships(
  history: Array<ResourceJumpHistoryItem>,
  flagshipJumpResources: Array<FlagshipResourceJumpUi>,
): Array<TopFlagship> {
  const maxTopFlagships = 3
  const maxResoucesPerFlagship = 3
  const byResorceSlug = Object.entries(
    counting(
      history.filter((h) => h.resourceSlug !== undefined),
      (h) => h.resourceSlug!,
    ),
  )

  const allResouceJumps = flagshipJumpResources.flatMap((f) => f.resourceJumps)

  const topFlagships: Array<TopFlagship> = []
  for (const [rSlug] of byResorceSlug) {
    const rj = allResouceJumps.find((r) => r.slug === rSlug)
    if (!rj) {
      continue
    }

    if (topFlagships.length < maxTopFlagships) {
      topFlagships.push({
        flagship: rj.flagship,
        topResourceJumps: [],
      })
    }

    const tf = topFlagships.find((f) => f.flagship.slug === rj.flagship.slug)
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
  return topFlagships
}

export interface FlagshipBlockProps {
  topFlagship: TopFlagship
}

function FlagshipBlock({
  topFlagship: { flagship, topResourceJumps },
}: FlagshipBlockProps) {
  const { currentEnv } = useEnvironmentContext()
  return (
    <Card>
      <CardHeader>
        <LinkToFlagship flagship={flagship} env={currentEnv}>
          {flagship.displayName}
        </LinkToFlagship>
      </CardHeader>
      <CardContent>
        {topResourceJumps.map((rj) => (
          <ResourceJumpButton
            key={rj.slug}
            resourceJump={rj}
            env={currentEnv}
          />
        ))}
      </CardContent>
    </Card>
    // <div className="flex flex-col gap-2">
    //   <div className="font-semibold">
    //     <LinkToFlagship flagship={flagship} env={currentEnv}>
    //       {flagship.displayName}
    //     </LinkToFlagship>
    //   </div>
    //   <div className="flex flex-col pl-4 border-l border-muted/50 gap-1">
    //     {topResourceJumps.map((rj) => (
    //       <ResourceJumpButton key={rj.slug} resourceJump={rj} env={currentEnv} />
    //     ))}
    //   </div>
    // </div>
  )
}

function LinkToFlagship({
  flagship,
  env,
  children,
}: {
  flagship: FlagshipResourceJumpUi
  env?: EnvBaseInfo
  children: React.ReactNode
}) {
  if (!env) {
    return (
      <Link to={'/app/$appSlug'} params={{ appSlug: flagship.slug }}>
        {children}
      </Link>
    )
  } else if (flagship.resourceJumps[0] !== undefined) {
    return (
      <Link
        to={'/env/$envSlug/app/$appSlug'}
        params={{ envSlug: env.slug, appSlug: flagship.resourceJumps[0].slug }}
      >
        {children}
      </Link>
    )
  } else {
    return <span>{children}</span>
  }
}

export function EnvPage() {
  const { history, flagshipJumpResources } = useResourceJumpContext()

  const topFlagships = getTopFlagships(history, flagshipJumpResources)
  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* <div className='text-xl text-eh-env-foreground font-semibold'>{currentEnv?.displayName}</div> */}
      <div className="grid grid-cols-1 gap-8">
        {topFlagships.map((tp) => {
          return <FlagshipBlock key={tp.flagship.slug} topFlagship={tp} />
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
