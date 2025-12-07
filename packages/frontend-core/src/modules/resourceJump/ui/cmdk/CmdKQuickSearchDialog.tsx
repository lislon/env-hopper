import { Description, DialogTitle } from '@radix-ui/react-dialog'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Command } from 'cmdk'
import {
  BedIcon,
  GlobeIcon,
  HomeIcon,
  SearchIcon,
  SquareArrowOutUpRightIcon
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { cn } from '~/lib/utils'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { useCmdkDriver } from '~/modules/resourceJump/ui/cmdk/useCmdkDriver'
import './CmdKQuickSearchDialog.scss'

export interface CmdKQuickSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CmdKQuickSearchDialog({
  open,
  onOpenChange,
}: CmdKQuickSearchDialogProps) {
  const { flagshipJumpResources } = useResourceJumpContext()

  const { environments } = useEnvironmentContext();

  const { envsForApps, onResourceJumpSelected, onEnvironmentSelected } = useCmdkDriver({
    onOpenChange,
  })

  const [flagship, setFlagship] = useState('')

  const selectedFlagShipObj = useMemo(() => {
    return flagshipJumpResources.find((r) => r.slug === flagship)
  }, [flagship, flagshipJumpResources])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogTitle>Find environment or application</DialogTitle>
      </VisuallyHidden>
      <DialogContent>
        <VisuallyHidden>
          <Description>
            Type any part of envirinment or app name to select it
          </Description>
        </VisuallyHidden>
        <div className="framer">
          <Command value={flagship} onValueChange={(v) => setFlagship(v)}>
            <div cmdk-framer-header="">
              <SearchIcon />
              <Command.Input
                autoFocus
                placeholder="Find applications, environments..."
              />
            </div>
            <Command.List>
              <div cmdk-framer-items="">
                <div cmdk-framer-left="">
                  <Command.Group heading="Applications">
                    {flagshipJumpResources
                      .slice(0, 5)
                      .map(({ slug, displayName }) => (
                        <Item
                          value={displayName}
                          subtitle="Retrieve user input"
                          slug={slug}
                          key={slug}
                          type='application'
                        >
                          <BedIcon />
                        </Item>
                      ))}
                  </Command.Group>
                  <Command.Group heading="Environments">
                    {environments
                      .slice(0, 50)
                      .map(({ slug, displayName }) => (
                        <Item
                          value={displayName}
                          subtitle="Retrieve user input"
                          slug={slug}
                          key={slug}
                          type='environment'
                          onSelect={() => onEnvironmentSelected(slug)}
                        >
                          <GlobeIcon />
                        </Item>
                      ))}
                  </Command.Group>


                </div>
                <hr cmdk-framer-separator="" />
                <div cmdk-framer-right="" className="flex flex-col">
                  <RadioGroup
                    defaultValue={envsForApps[0]?.slug}
                    className="flex p-1 text-xs"
                  >
                    {envsForApps.map((env) => (
                      <label
                        key={env.slug}
                        className="border-input has-data-[state=checked]:border-primary/80 has-data-[state=checked]:bg-accent has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex flex-col items-center gap-3 rounded-md border px-2 py-3 text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:opacity-50 hover:bg-accent hover:text-accent-foreground hover:cursor-pointer duration-100"
                      >
                        <RadioGroupItem
                          id={`cmdk-env-${env.slug}`}
                          value={env.slug}
                          className="sr-only after:absolute after:inset-0 "
                          aria-label={env.displayName}
                        />
                        <p className="text-foreground leading-none font-medium">
                          {env.displayName}
                        </p>
                      </label>
                    ))}
                  </RadioGroup>
                  <div className="flex flex-col mt-6 w-full">
                    {selectedFlagShipObj?.resourceJumps.map((r) => (
                      <div
                        key={r.slug}
                        className="flex gap-4 hover:bg-sidebar-accent p-2 rounded-lg h-16 cursor-pointer items-center"
                        onClick={() => onResourceJumpSelected(r.slug)}
                      >
                        <div>
                          {r.displayName === 'Home' ? (
                            <HomeIcon />
                          ) : (
                            <BedIcon />
                          )}
                        </div>
                        <div
                          className={cn('flex-1', {
                            'font-bold': r.displayName === 'Home',
                          })}
                        >
                          {r.displayName === 'Home'
                            ? selectedFlagShipObj.displayName
                            : r.displayName}
                        </div>
                        <div className="p-4 hover:bg-red-200 rounded-2xl">
                          <SquareArrowOutUpRightIcon className="w-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Command.List>
          </Command>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Main search view
  // return (
  //   <Dialog open={open} onOpenChange={onOpenChange}>
  //     <DialogContent hasCloseButton={false}>
  //       <div className="flex flex-col">
  //         <div className="flex flex-row gap-2 items-center">
  //           <div className="flex-1">
  //             <Input
  //               placeholder="Search apps or environments..."
  //               variant={'ghost'}
  //               sizeX={'lg'}
  //             />
  //           </div>
  //           <div className="div">
  //             <Button variant={'ghost'} onClick={() => onOpenChange?.(false)}>
  //               Close
  //             </Button>
  //           </div>
  //         </div>
  //         <div className="flex">
  //           <ul className="flex flex-col">
  //             {flagshipJumpResources.map(({ slug, displayName }) => {
  //               return (
  //                 <li
  //                   className="group m-3 fadeIn inactive hover:bg-accent rounded-lg"
  //                   key={slug}
  //                 >
  //                   <a
  //                     href="/mime"
  //                     className="flex justify-between items-center rounded-lg py-1 px-4 transition-colors duration-100 ease-in-out overflow-hidden"
  //                   >
  //                     <div className="flex items-start">
  //                       <div className="flex justify-center items-center w-5 mr-5 mt-2 flex-none">
  //                         <i className="icon text-2xl">
  //                           <svg
  //                             viewBox="0 0 1024 1024"
  //                             xmlns="http://www.w3.org/2000/svg"
  //                             fill="currentColor"
  //                             height="1em"
  //                             width="1em"
  //                           >
  //                             <path d="M886.25058594 98.67324219L137.8385 98.67324219c-39.31382813 0-71.47256836 29.21941406-71.47256836 68.59713867l0 687.8025c0 39.37675781 32.15786133 71.60036133 71.47256836 71.60036133l754.3764 0c39.31382813 0 68.51162109-32.22360352 68.51162109-71.60036133L960.72652109 167.2703C960.72558594 127.89256836 925.56529297 98.67324219 886.25058594 98.67324219zM354.49103516 200.47132812c60.54662109 0 109.63617188 49.04727539 109.63617187 109.5516211 0 60.50425781-49.08867187 109.55162109-109.63617187 109.55162109s-109.63617188-49.04727539-109.63617188-109.55162109C244.85477539 249.51772461 293.94353516 200.47132812 354.49103516 200.47132812zM167.03632813 839.84574219c-8.22058594 0-16.50506836-2.83227539-23.23441407-8.62646485-14.99308594-12.86279297-16.73912109-35.45727539-3.87632812-50.47286132l164.34720703-247.7241211c12.20396484-14.26860352 33.32970703-16.65448242 48.42896484-5.47286133l145.00977539 107.69668946 259.82191407-295.15227539c12.30925781-15.44036133 77.58448242-88.16853516 115.79036132-5.68529297 0.04227539-0.12779297 0.08551758 109.06110352 0.12779297 220.54948242 0.04227539 116.28272461 0.06389648 284.78162109 0.06389649 284.78162109C872.72808594 839.54603516 167.37646484 839.84574219 167.03632813 839.84574219z"></path>
  //                           </svg>
  //                         </i>
  //                       </div>
  //                       <div className="flex flex-col truncate">
  //                         <span className="font-semibold dark:text-slate-300 dark:group-hover:text-white">
  //                           {displayName}
  //                         </span>
  //                         <div className="sub-intro flex items-center text-sm leading-tight mt-4 xl:mt-2 mb-2">
  //                           <span className="mr-2">Other</span>
  //                           <div className="w-px h-3 bg-slate-300 mr-2"></div>
  //                           <span className="mr-2">media type</span>
  //                         </div>
  //                       </div>
  //                     </div>
  //                     <i className="w-6 ml-8 p-2 icon icon-enter"></i>
  //                   </a>
  //                 </li>
  //               )
  //               // return (
  //               //   <li key={slug} className="h-12">
  //               //     <Package className="mr-2 h-4 w-4" />
  //               //     <span>{displayName}</span>
  //               //   </li>
  //               // )
  //             })}
  //           </ul>
  //           <div>{JSON.stringify({ selectedFlagship })}</div>
  //         </div>
  //       </div>
  //       {flagshipJumpResources.length === 0 && <div>No results found.</div>}
  //     </DialogContent>
  //   </Dialog>
  // )
}

function Item({
  children,
  slug,
  value,
  subtitle,
  type,
  onSelect,
}: {
  children: React.ReactNode
  slug: string
  value: string
  subtitle: string
  type: 'application' | 'environment',
  onSelect?: (value: string) => void;
}) {
  return (
    <Command.Item value={slug} onSelect={onSelect}>
      <div cmdk-framer-icon-wrapper="" cmdk-framer-icon-wrapper-type={type}>{children}</div>
      <div cmdk-framer-item-meta="">
        {value}
        <span cmdk-framer-item-subtitle="">{subtitle}</span>
      </div>
    </Command.Item>
  )
}

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        {/* <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" /> */}
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
