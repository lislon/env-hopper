import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import { SmoothSwitcher } from '~/modules/resourceJump/ui/SmoothSwitcher'
import { useMostRelevantQuickFlaships } from '~/modules/resourceJump/utils/statistics/useMostRelevantQuickFlagships'

export interface AppSwitcherProps {
  className?: string
}

export function AppSwitcher({ className }: AppSwitcherProps) {
  const { setCurrentFlagship, currentFlagship } = useResourceJumpContext()


  const values = useMostRelevantQuickFlaships()

  return (
    <SmoothSwitcher
      values={values}
      selectedValueSlug={currentFlagship?.slug}
      onValueSelect={setCurrentFlagship}
      className={className}
    />
  )


}
