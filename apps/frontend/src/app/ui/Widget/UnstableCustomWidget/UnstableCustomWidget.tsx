import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../../../context/EhContext';
import { Link } from 'react-router-dom';
import { EhEnv } from '@env-hopper/types';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../../../api/ApiQueryMagazine';

export interface UnstableCustomWidgetProps {
  className?: string;
}

function replaceVars(str: string, env: EhEnv) {
  let replaced = str;
  for (const [key, value] of Object.entries(env?.meta)) {
    replaced = replaced.replace(`{{env.meta.${key}}}`, value);
  }
  replaced = replaced.replace('{{env.id}}', env.id);
  return replaced;
}

export function UnstableCustomWidget({ className }: UnstableCustomWidgetProps) {
  const { env } = useEhContext();

  const { data: customization } = useSuspenseQuery(
    ApiQueryMagazine.getCustomization(),
  );

  if (env?.meta && customization?.widgetTitle && customization?.widgetUrl) {
    const urlReplaced = replaceVars(customization?.widgetUrl, env);
    const titleReplaced = replaceVars(customization?.widgetTitle, env);

    if (!urlReplaced.includes('{{') && !titleReplaced.includes('{{')) {
      return (
        <Link className="link text-sm" to={urlReplaced} target={'_blank'}>
          <div className={cn('flex items-center gap-2', className)}>
            {customization?.widgetSvg && (
              <div className="w-4 h-4">
                <div
                  dangerouslySetInnerHTML={{ __html: customization?.widgetSvg }}
                />
              </div>
            )}
            <div>{titleReplaced}</div>
          </div>
        </Link>
      );
    }
  }
  return null;
}
