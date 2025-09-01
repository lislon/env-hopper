import React from 'react';
import cn from 'classnames';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../../../api/ApiQueryMagazine';
import { useMainAppFormContext } from '../../../context/MainFormContextProvider';
import {
  hasUnresolvedSubstitution,
  interpolateWidgetStr,
} from '../../../lib/utils';

export interface LinkTypeWidgetProps {
  className?: string;
  iconRaw?: string;
  title?: string;
  url: string;
}

function LinkTypeWidget({
  className,
  url,
  title,
  iconRaw,
}: LinkTypeWidgetProps) {
  return (
    <a className="link text-sm" href={url} target={'_blank'}>
      <div className={cn('flex items-center gap-2', className)}>
        {iconRaw && (
          <div
            className="w-4 h-4"
            dangerouslySetInnerHTML={{ __html: iconRaw }}
          />
        )}
        <div>{title}</div>
      </div>
    </a>
  );
}

export function UnstableCustomWidget() {
  const { env, app } = useMainAppFormContext();

  const { data: customization } = useSuspenseQuery(
    ApiQueryMagazine.getCustomization(),
  );

  return (
    <ul className={'flex flex-col gap-2 mt-4'}>
      {customization.appLinkTypes
        .map((linkType) => {
          const iconRaw = customization.icons?.find(
            (icon) => icon.iconId === linkType.iconId,
          )?.svg;
          const url = interpolateWidgetStr(linkType.urlDecoded, env, app);
          if (!url || hasUnresolvedSubstitution(url)) {
            return null;
          }

          return (
            <li key={linkType.typeId}>
              <LinkTypeWidget
                iconRaw={iconRaw}
                title={interpolateWidgetStr(linkType.title, env, app)}
                url={encodeURI(url)}
              />
            </li>
          );
        })
        .filter(Boolean)}
    </ul>
  );
}
