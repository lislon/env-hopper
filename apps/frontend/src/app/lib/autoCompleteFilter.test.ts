import { Item } from '../ui/EhAutoComplete';
import { makeAutoCompleteFilter } from './autoCompleteFilter';

describe('env search a bit fuzzy', () => {
  let db: Item[] = [];

  function toItem(title: string) {
    return { title, id: '', favorite: title.includes('favorite') };
  }

  function given(strings: string[]) {
    db = strings.map((title) => toItem(title));
  }

  function expectSearchResults(search: string, expected: string[]) {
    const actual = makeAutoCompleteFilter(db)(search, db).map(x => x.title);
    expect(actual).toEqual(expected);
  }

  it('case 1', () => {
    given(['env-a', 'env-b']);
    expectSearchResults('a', ['env-a']);
  });

  it('case 2', () => {
    given(['x abcdev', 'abc-dev']);
    expectSearchResults('abcdev', ['x abcdev']);
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
    expectSearchResults('env-xxx-3', ['env-xxx-3',
      'env-xxx-33',
      'env-xxxx-33']);
  });

  it('fuzzy will not match inverted', () => {
    given(['env-33']);
    expectSearchResults('33-env', []);
  });

  it('favorite should come first', () => {
    given(['o1', 'o2-favorite', 'o3-favorite', 'o4']);
    expectSearchResults('o', [
      'o2-favorite',
      'o3-favorite',
      'o1',
      'o4']);
  });

});
