import { createFileRoute } from '@tanstack/react-router';
import { ConfigServerWindow } from '../../../../../../../app/plugins/configserver/ui/ConfigServerMain';

export const Route = createFileRoute('/_layout/env/$envId/app/$appId/config/')({
  component: RouteComponent
})

function RouteComponent() {
  const urlParams = Route.useParams()

  return <ConfigServerWindow {...urlParams} />
}
