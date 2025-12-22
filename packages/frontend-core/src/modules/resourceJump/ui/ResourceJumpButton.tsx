import type { EnvBaseInfo } from '@env-hopper/backend-core'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { ExternalLinkIcon } from 'lucide-react'
import { LinkExternal } from '~/components/ui/linkExternal'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import { JumpAnimatedLabel } from '~/modules/resourceJump/ui/JumpMainButton'
import { isFlagshipResource } from '~/modules/resourceJump/utils/helpers'

const linkVariants = cva('flex items-center group-hover:underline', {
  variants: {
    variant: {
      default: 'gap-2 text-lg',
      flagship: 'gap-2 text-3xl font-semibold',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const iconVariants = cva('', {
  variants: {
    variant: {
      default: 'h-3 w-3',
      flagship: 'h-6 w-6',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const subLinkVariant = cva('text-secondary-foreground/40 group-hover:underline', {
  variants: {
    variant: {
      default: '',
      flagship: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function ResourceJumpButton({
  resourceJump: resouceJump,
  env,
  variant,
  className,
  onClick,
}: {
  resourceJump: ResourceJumpUI
  env: EnvBaseInfo | undefined
  className?: string
  onClick?: () => void
} & VariantProps<typeof linkVariants>) {
  const { getJumpUrl } = useResourceJumpContext()

  return (
    <div className={className} onClick={onClick}>
      <div className="p-2 flex flex-col gap-2 hover:bg-accent/30 duration-100 rounded-lg group">
        <LinkExternal
          href={getJumpUrl(resouceJump.slug, env?.slug)}
          className="flex justify-between active:hover:scale-(--btn-focus-scale) active:focus:scale-(--btn-focus-scale) motion-safe:duration-200 ease-out transition-all gap-2"
        >
          <div className="flex flex-col">
            <div className={linkVariants({ variant })}>
              {isFlagshipResource(resouceJump)
                ? resouceJump.flagship.displayName
                : resouceJump.displayName}
              <ExternalLinkIcon className={iconVariants({ variant })} />
              {/* <JumpIcon resouceJump={resouceJump} /> */}

              {/* <LateResolvableParamInput resourceJump={resouceJump} /> */}
              {/* <ExternalLinkIcon className="w-4 stroke-secondary-foreground invisible group-hover:visible" /> */}
            </div>
            <div className={subLinkVariant({ variant })}>
              {getJumpUrl(resouceJump.slug, env?.slug)}
            </div>
          </div>
          <JumpAnimatedLabel className='invisible group-hover:visible text-lg py-3 px-5 hidden lg:flex' />
        </LinkExternal>
      </div>
    </div>
  )
}
