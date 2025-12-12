import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { AppPageFlagship } from '~/modules/resourceJump/ui/pages/AppPageFlagship'
import { AppPageRegular } from '~/modules/resourceJump/ui/pages/AppPageRegular'
import { isFlagshipResource } from '~/modules/resourceJump/utils/helpers'


export function AppPage() {
  const { currentResourceJump} = useResourceJumpContext()

  console.log('App Page', currentResourceJump?.slug, isFlagshipResource(currentResourceJump));
  

  if (isFlagshipResource(currentResourceJump)) {
    return <AppPageFlagship />
  } else {
    return <AppPageRegular />
  }
}