import React from 'react';
import cn from 'classnames';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ApiQueryMagazine } from '../../../api/ApiQueryMagazine';
import { useMainAppFormContext } from '../../../context/MainFormContextProvider';
import {
  hasAppSpecificParams,
  hasEnvSpecificParams,
  hasUnresolvedSubstitution,
  interpolateWidgetStr
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
                          iconRaw
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

interface LinkToRender {
  widget: React.ReactNode;
  isAppSpecific?: boolean;
  isEnvSpecific?: boolean;
}

interface SectionProps {
  links: LinkToRender[];
  title: string;
}

export function Section({ links, title }: SectionProps) {
  if (links.length === 0) {
    return null;
  }
  return <section>
    <h3 className={'prose'}>{title}</h3>
    <ul className={'flex flex-col gap-2 pl-2 mt-2 ml-2'}>
      {links.map(({ widget }, index) => (
        <li key={index}>{widget}</li>
      ))}
    </ul>
  </section>;

}

export function UnstableCustomWidget() {
  const { env, app } = useMainAppFormContext();

  const { data: customization } = useSuspenseQuery(
    ApiQueryMagazine.getCustomization()
  );

  const links: LinkToRender[] = customization.appLinkTypes
    .map((linkType) => {
      const iconRaw = customization.icons?.find(
        (icon) => icon.iconId === linkType.iconId
      )?.svg;
      const url = interpolateWidgetStr(linkType.urlDecoded, env, app);
      if (!url || hasUnresolvedSubstitution(url)) {
        return {
          widget: null
        };
      }

      const isAppSpecific = hasAppSpecificParams(linkType.urlDecoded);
      const isEnvSpecific = hasEnvSpecificParams(linkType.urlDecoded);

      return {
        widget: <LinkTypeWidget
          iconRaw={iconRaw}
          title={interpolateWidgetStr(linkType.title, env, app)}
          url={encodeURI(url)}
        />,
        isAppSpecific, isEnvSpecific
      } satisfies LinkToRender;
    }).filter(({ widget }) => widget !== null);

  const envLinks = links.filter(({ isEnvSpecific, isAppSpecific }) => isEnvSpecific && !isAppSpecific);
  const appLinks = links.filter(({ isEnvSpecific, isAppSpecific }) => isAppSpecific && !isEnvSpecific);
  const envAppLinks = links.filter(({ isEnvSpecific, isAppSpecific }) => isAppSpecific && isEnvSpecific);
  const misc = links.filter(({ isEnvSpecific, isAppSpecific }) => !isAppSpecific && !isEnvSpecific);

  return (
    <div className={"ml-4 gap-4 flex flex-col"}>
      <Section links={envLinks} title={'Env Profile'} />
      <Section links={appLinks} title={'App Profile'} />
      <Section links={envAppLinks} title={'App x Env'} />
      <Section links={misc} title={'Misc'} />
    </div>
  );
}
