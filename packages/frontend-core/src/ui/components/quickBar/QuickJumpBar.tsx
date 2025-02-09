
interface QuickJumpBarProps {
  className?: string
}



export function QuickJumpBar(_: QuickJumpBarProps) {
  return null
  // const indexData = useBootstrapConfig()
  

  // const { setCurrentResourceJumpSlug } = useResourceJumpContext();
  // const { setCurrentEnv, currentEnv } = useEnvironmentContext();

  // // Get first 6 pages from real data
  // const getFirstSixPages = () => {
  //   const allPages = []
  //   for (const app of Object.values(indexData.apps)) {
  //     if (app.ui?.pages) {
  //         for (const page of app.ui?.pages) {
  //           allPages.push({ app, page })
  //           if (allPages.length >= 6) break
  //         }
  //         if (allPages.length >= 6) break
  //     }
  //     if (allPages.length >= 6) break
  //   }
  //   return allPages
  // }

  // const firstSixPages = getFirstSixPages()

  // // Get first 3-4 real environments from context data
  // const environments = Object.values(indexData.envs)
  //   .slice(0, 4)
  //   .map((env) => ({
  //     id: env.slug,
  //     label: env.displayName || env.slug,
  //     icon: getEnvironmentIcon(env.slug),
  //     color: getEnvironmentColor(env.slug),
  //   }))

  // const handleEnvironmentChange = (environment: string) => {
  //   setCurrentEnv(environment)
  // }

  // const handlePageSelect = (
  //   app: EhAppIndexed,
  //   page: { slug: string; title?: string; url: string },
  // ) => {
  //   setCurrentResourceJumpSlug(app.slug)
  //   // Could navigate to page here in the future
  //   console.log(`Navigate to ${app.slug}/${page.slug}`)
  // }

  // return (
  //   <div className={`flex mb-6 gap-3 ${className}`}>
  //     {/* Left Column - Simplified Environment Switcher */}
  //     <div className="flex flex-col gap-1">
  //       {environments.map((env) => {
  //         const Icon = env.icon
  //         const isActive = env.id === currentEnv?.slug

  //         return (
  //           <Button
  //             key={env.id}
  //             variant={'ghost'}
  //             onClick={() => handleEnvironmentChange(env.id)}
  //             className={`justify-start
  //               ${isActive ? 'bg-accent text-accent-foreground font-medium' : ''}
  //             `}
  //           >
  //             <Icon className={`w-4 h-4 ${env.color} flex-shrink-0`} />
  //             {env.label}
  //           </Button>
  //         )
  //       })}

  //       <div className="mt-2">
  //         <Button className="w-full">Environment...</Button>
  //       </div>
  //     </div>

  //     {/* Vertical Divider with padding */}
  //     <div>
  //       <Separator orientation="vertical" />
  //     </div>

  //     {/* Right Column - 2x3 Grid of Pages */}
  //     <div className="flex-1 p-4">
  //       <div className="grid grid-cols-2 gap-3">
  //         {firstSixPages.map(({ app, page}, index) => (
  //           <ActionCard
  //             key={`${app.slug}-${page.slug}-${index}`}
  //             app={app}
  //             actionName={getShortPageName(app, page)}
  //             onClick={() => handlePageSelect(app, page)}
  //           />
  //         ))}
  //       </div>
  //     </div>
  //   </div>
  // )
}
