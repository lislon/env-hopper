import { makeAutoCompleteFilter } from './autoCompleteFilter';
import { SourceItem } from '../../ui/AutoComplete/common';

const randomEnvironmentNames = [
  'uat-0916',
  'Prod-02a',
  'Pipeline-delta11',
  'BUILD-08',
  'Dev-107',
  'staging-envc',
  'Backup-gammae',
  'Infra-temporale',
  'STAGING-BETAB',
  'Backup-21',
  'Sig-betac',
  'Prod-production14',
  'Staging-deployb',
  'BACKUP-TEMPORAL',
  'acc-2198',
  'node-productiona',
  'shared-21',
  'Sig-deploy',
  'SIG-01',
  'uat-temporal',
];

describe('env search a bit fuzzy', () => {
  let db: SourceItem[] = [];

  function toItem(title: string): SourceItem {
    return {
      title,
      id: '',
      favorite: title.includes('favorite'),
      recent: title.includes('recent'),
    };
  }

  function given(strings: string[]) {
    db = strings.map((title) => toItem(title));
  }

  function expectSearchResults(search: string, expected: string[]) {
    const actual = makeAutoCompleteFilter(db)(search, db).map((x) => x.title);
    expect(actual).toEqual(expected);
  }

  it('case 1', () => {
    given(['env-a', 'env-b']);
    expectSearchResults('a', ['env-a']);
  });

  it('case 2', () => {
    given(['x abcdev', 'abc-dev']);
    expectSearchResults('abcdev', ['x abcdev', 'abc-dev']);
  });

  it('case 3', () => {
    given(['x abcdev', 'abcXXX-devXXX']);
    expectSearchResults('abc-dev', ['abcXXX-devXXX']);
  });

  it('case 4', () => {
    given(['env-xxx-1', 'env-xxx-3']);
    expectSearchResults('env1', ['env-xxx-1']);
  });

  it('case 5', () => {
    given(['env-xxxx-33', 'env-xxx-33', 'env-xxx-3']);
    expectSearchResults('env-xxx-3', [
      'env-xxx-3',
      'env-xxx-33',
      'env-xxxx-33',
    ]);
  });

  it('user can find split text without splitters', () => {
    given(['Abc-Rev']);
    expectSearchResults('Abcrev', ['Abc-Rev']);
  });

  it('case 6', () => {
    given(randomEnvironmentNames);
    expectSearchResults('pro14', ['Prod-production14']);
  });

  it('case 7', () => {
    given(randomEnvironmentNames);
    expectSearchResults('B', [
      'BUILD-08',
      'Backup-21',
      'Backup-gammae',
      'BACKUP-TEMPORAL',
      'Sig-betac',
      'STAGING-BETAB',
      'Staging-deployb',
    ]);
  });

  it('Case insensitive', () => {
    given(['Abc Review', 'AbcRev']);
    expectSearchResults('Rev', ['AbcRev', 'Abc Review']);
  });

  it('prefix is priority', () => {
    given(['EPIC-ENV-A64', 'A64-ENV-01']);
    expectSearchResults('a64', ['A64-ENV-01', 'EPIC-ENV-A64']);
  });

  // TODO: treat  numeric/letter boundaries with different priorities compared with separators like '-'
  it.skip('should respect delimiter', () => {
    given(['g32pe-01', 'g32-dev-01']);
    expectSearchResults('g32', ['g32-dev-01', 'g32pe-01']);
  });

  it('fuzzy will not match inverted', () => {
    given(['env-33']);
    expectSearchResults('33-env', []);
  });

  it('Upper case is a word separator', () => {
    given(['camelCase', 'PascalCase', 'case']);
    expectSearchResults('case', ['case', 'camelCase', 'PascalCase']);
  });

  it('Leading zeros can be omitted', () => {
    given(['env-001', 'env-1']);
    expectSearchResults('1', ['env-1', 'env-001']);
  });

  it('ru keyboard layout is working too', () => {
    given(['env-001']);
    expectSearchResults('утм', ['env-001']);
  });

  it('special symbols will be working if they are standalone', () => {
    given(['a order', 'b order #', 'c order']);
    expectSearchResults('order #', ['b order #']);
  });

  it('favorites, then recent, are priority - case sensitive', () => {
    given(['a order', 'a order - recent', 'a order - favorite']);
    expectSearchResults('a', [
      'a order - favorite',
      'a order - recent',
      'a order',
    ]);
  });

  it('favorites, then recent, are priority - case insensitive', () => {
    given(['A order', 'A order - recent', 'A order - favorite']);
    expectSearchResults('a', [
      'A order - favorite',
      'A order - recent',
      'A order',
    ]);
  });

  it('favorites, then recent, are priority - substring', () => {
    given(['A order', 'A order - recent', 'A order - favorite']);
    expectSearchResults('rd', [
      'A order - favorite',
      'A order - recent',
      'A order',
    ]);
  });
});
