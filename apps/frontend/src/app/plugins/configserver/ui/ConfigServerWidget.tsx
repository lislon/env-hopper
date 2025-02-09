import { ConfigServerPluginProps, ConfigServerWindow } from './ConfigServerMain';
import { useModal } from '../../../hooks/useModal';
import { BaseModal } from '../../../ui/Dialog/BaseModal';
import { Link } from '@tanstack/react-router';

export function ConfigServerWidget(props: ConfigServerPluginProps) {
  return <>
    <Link to={`/env/$envId/app/$appId/config`} params={{ envId: props.envId, appId: props.appId}}
          viewTransition
          className='btn btn-outline'
    >View App Config</Link>
  </>;
}
