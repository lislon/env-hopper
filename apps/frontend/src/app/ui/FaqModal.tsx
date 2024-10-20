import { BaseDialogProps, BaseModal } from './Dialog/BaseModal';
import { useEhContext } from '../context/EhContext';
import { first } from 'lodash';
import {
  formatAppTitle,
  getEhUrl,
  getJumpUrlEvenNotComplete,
} from '../lib/utils';
import { Await, Link, useRouteLoaderData } from 'react-router-dom';
import { EhMainLoaderData } from '../types';
import React from 'react';
import { EhApp, EhCustomization, EhEnv } from '@env-hopper/types';
import { ReadonlyCopyField } from './ReadonlyCopyField';
import { ErrorBoundary } from 'react-error-boundary';

export interface SlideShared {
  sampleEnv: EhEnv | undefined;
  sampleApp: EhApp | undefined;
  url: string | undefined;
  sharableUrl: string | undefined;
  appWithFeatures: EhApp | undefined;
}

function Slide1() {
  return (
    <>
      <h3>What is for?</h3>
      <article>
        <p>
          This is browser bookmark tool for test/staging environments. It allows
          to quickly find an URL for a specific application on a specific
          environment.
        </p>
        <p>
          This saves time, because you don't need to typing and remembering long
          URLs
        </p>
        <p className="text-end">
          Press{' '}
          <a href={hrefToSlide(2)} className="btn btn-circle btn-xs">
            ❯
          </a>{' '}
          to learn how to use it
        </p>
      </article>
    </>
  );
}

function Slide2(props: SlideShared) {
  if (!props.sampleEnv || !props.sampleApp || !props.url) {
    return null;
  }
  return (
    <>
      <h3>How to Use?</h3>
      <article>
        <ol>
          <li>
            Choose <strong>Environment</strong> in autocomplete box, i.e.{' '}
            <code>{props.sampleEnv.id}</code>
          </li>
          <li>
            Choose <strong>Application</strong>, i.e.{' '}
            <code>{formatAppTitle(props.sampleApp)}</code>
          </li>
          <li>
            The link will be generated to {formatAppTitle(props.sampleApp)} on{' '}
            {props.sampleEnv.id} environment:{' '}
            <Link
              to={props.url}
              className={'text-xs tooltip'}
              data-tip={
                'Note: Example link can be not functional if this app is not exists on given env'
              }
            >
              {props.url}
            </Link>
          </li>
          <li>
            Hit{' '}
            <strong
              className={
                'bg-primary text-primary-content rounded-xl p-1 tooltip tooltip-right'
              }
              data-tip="This is not real jump button, but just an example of how it looks like in real app ;)"
            >
              Jump
            </strong>{' '}
            to follow generated URL
          </li>
        </ol>
        <p className="text-end">
          Press{' '}
          <a href={hrefToSlide(3)} className="btn btn-circle btn-xs">
            ❯
          </a>{' '}
          to see features
        </p>
      </article>
    </>
  );
}

function Slide3({
  appWithFeatures,
  sampleApp,
  sampleEnv,
  sharableUrl,
}: SlideShared) {
  return (
    <>
      <h3>What else can it do?</h3>
      <article>
        <ul>
          <li>
            <span role={'img'} aria-hidden>
              🔍
            </span>{' '}
            The autocomplete is fuzzy: to find <code>my-environment-01</code>,
            you can just type <code>my1</code>.
          </li>
          <li>
            <span role={'img'} aria-hidden>
              ⭐
            </span>{' '}
            You can favorite environment or application by pressing the star
            icon in the selection dialog.
          </li>
          {appWithFeatures && (
            <li>
              <span role={'img'} aria-hidden>
                🔐
              </span>{' '}
              Some apps, like{' '}
              <Link to={getEhUrl(sampleEnv?.id, appWithFeatures.id, undefined)}>
                {formatAppTitle(appWithFeatures)}
              </Link>
              , also show user/password for UI well as for service database.
            </li>
          )}
          {sharableUrl && (
            <li>
              <span role={'img'} aria-hidden>
                🔗
              </span>{' '}
              Env-hopper URLs are sharable. Pre-select an app, leave the
              environment empty, copy the URL from the browser. Example for{' '}
              <code>{formatAppTitle(sampleApp)}</code>:
              <ReadonlyCopyField value={sharableUrl} />
              and paste it in documentation / manuals / chats. Once user clicks
              on it, he can select the environment and proceed to given app.
            </li>
          )}
        </ul>
      </article>
    </>
  );
}

function SlideRawHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function SlideSimpleText({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h3>{title}</h3>
      <p>{text}</p>
    </>
  );
}

function hrefToSlide(slideIndex: number) {
  return (
    window.location.pathname + window.location.search + `#about-${slideIndex}`
  );
}

export function FaqModal(props: BaseDialogProps) {
  const { listEnvs, listApps } = useEhContext();
  const loaderData = useRouteLoaderData('root') as EhMainLoaderData;

  const sampleEnv = first(listEnvs);
  const sampleApp = first(listApps);

  const url =
    sampleEnv &&
    sampleApp &&
    getJumpUrlEvenNotComplete({ app: sampleApp, env: sampleEnv });
  const sharableUrl =
    sampleApp && getEhUrl(sampleApp?.id, undefined, undefined);
  const sharableUrlNormalized =
    sharableUrl && new URL(sharableUrl, document.baseURI).href;

  const appWithFeatures = listApps.find((app) => app.meta?.ui && app.meta?.db);
  const slideProps: SlideShared = {
    sampleEnv,
    sampleApp,
    url,
    sharableUrl: sharableUrlNormalized,
    appWithFeatures,
  };

  return (
    <BaseModal {...props} className={'prose max-w-[800px]'}>
      <div className="carousel w-full transition">
        <ErrorBoundary
          fallback={
            <SlideSimpleText
              title={'Error'}
              text={'Sorry! Something is wrong'}
            />
          }
        >
          <Await resolve={loaderData.customization}>
            {(customization) => {
              const customizationTyped =
                customization as unknown as EhCustomization;
              const slides = [
                <Slide1 />,
                <Slide2 {...slideProps} />,
                <Slide3 {...slideProps} />,
                ...(customizationTyped?.slidesHtml?.map((html) => (
                  <SlideRawHtml html={html} />
                )) || []),
              ].filter(Boolean);

              return (
                <>
                  {' '}
                  {slides.map((childrenSlide, slideIndex) => {
                    slideIndex++;
                    return (
                      <div
                        key={slideIndex}
                        id={`about-${slideIndex}`}
                        className="carousel-item relative w-full"
                      >
                        <div className="mx-32">{childrenSlide}</div>
                        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
                          {slideIndex - 1 > 0 ? (
                            <a
                              href={hrefToSlide(slideIndex - 1)}
                              className="btn btn-circle"
                            >
                              ❮
                            </a>
                          ) : (
                            <div />
                          )}
                          {slideIndex < slides.length ? (
                            <a
                              href={hrefToSlide(slideIndex + 1)}
                              className="btn btn-circle"
                            >
                              ❯
                            </a>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              );
            }}
          </Await>
        </ErrorBoundary>
      </div>
    </BaseModal>
  );
}
