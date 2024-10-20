import { useEhContext } from '../../context/EhContext';
import { getJumpUrlEvenNotComplete } from '../../lib/utils';
import { ComboBoxType } from '../../types';

export function MainJumpButtonNotReady() {
  const { app, env, substitution, substitutionType, setHighlightAutoComplete } =
    useEhContext();

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

  return (
    <div
      className="text-center p-5"
      data-testid={'jump-main-button-text'}
      onMouseEnter={() => setHighlightAutoComplete(notSelected)}
      onMouseLeave={() => setHighlightAutoComplete(undefined)}
    >
      {notSelected === 'environments' && 'Select an environment'}
      {notSelected === 'applications' && 'Select an application'}
      {notSelected === 'substitutions' && sub}
    </div>
  );
}
