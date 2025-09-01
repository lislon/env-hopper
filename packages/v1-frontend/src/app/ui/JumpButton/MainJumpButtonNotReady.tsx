import { getJumpUrlEvenNotComplete } from '../../lib/utils';
import { ComboBoxType } from '../../types';
import React, { useEffect, useMemo } from 'react';
import cn from 'classnames';
import { debounce } from 'lodash';
import { useMainAppFormContext } from '../../context/MainFormContextProvider';

function AttentionWord({
  word,
  highlightAutoComplete,
}: {
  word: string;
  highlightAutoComplete: ComboBoxType | undefined;
}) {
  return (
    <span
      className={cn('-m-2 p-2 border-4 rounded ', {
        ['border-accent motion-safe:animate-eh-pulse']:
          highlightAutoComplete !== undefined,
        ['border-transparent']: highlightAutoComplete === undefined,
      })}
    >
      {word}
    </span>
  );
}

export interface MainJumpButtonNotReadyProps {
  isHovered?: boolean;
}

export function MainJumpButtonNotReady({
  isHovered,
}: MainJumpButtonNotReadyProps) {
  const {
    app,
    env,
    substitution,
    substitutionType,
    setHighlightAutoComplete,
    highlightAutoComplete,
  } = useMainAppFormContext();

  let sub: React.ReactNode | null = null;

  if (env !== undefined && app !== undefined) {
    const url = getJumpUrlEvenNotComplete({ app, env, substitution });

    const start = url.indexOf('{{');
    const end = url.indexOf('}}');

    if (start !== -1 && end !== -1) {
      sub = (
        <pre>
          {url}
          {'\n'}
          {' '.repeat(start + 2)}
          {'^'.repeat(end - start - 2)}
          {' '.repeat(url.length - end)}
          {'\n'}
          {'\n'}Select {substitutionType?.title}
        </pre>
      );
    } else {
      sub = `Select ${substitutionType?.title}`;
    }
  }

  let notSelected: ComboBoxType;
  if (env === undefined) {
    notSelected = 'environments';
  } else if (app === undefined) {
    notSelected = 'applications';
  } else {
    notSelected = 'substitutions';
  }

  const setAttentionOnDebounced = useMemo<
    (b: ComboBoxType | undefined) => void
  >(
    () =>
      debounce<(b: ComboBoxType | undefined) => void>(
        (x) => setHighlightAutoComplete(x),
        300,
      ),
    [setHighlightAutoComplete],
  );

  useEffect(() => {
    if (isHovered) {
      setAttentionOnDebounced(notSelected);
    } else {
      setAttentionOnDebounced(undefined);
    }
  }, [isHovered, notSelected, setAttentionOnDebounced]);

  return (
    <div className="text-center p-5" data-testid={'jump-main-button-text'}>
      {notSelected === 'environments' && (
        <>
          Select{' '}
          <AttentionWord
            word={'environment'}
            highlightAutoComplete={highlightAutoComplete}
          />
        </>
      )}
      {notSelected === 'applications' && (
        <>
          Select{' '}
          <AttentionWord
            word={'application'}
            highlightAutoComplete={highlightAutoComplete}
          />
        </>
      )}
      {notSelected === 'substitutions' && sub}
    </div>
  );
}
