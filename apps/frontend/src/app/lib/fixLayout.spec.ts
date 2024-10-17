import { expect } from 'vitest';
import { fixRuLayout, isRuLayout } from './fixLayout';

describe('ru -> en fix', () => {
  it('can detect ru layout', () => {
    expect(isRuLayout('йцукен')).toBe(true);
  });
  it('can fix ru layout', () => {
    expect(fixRuLayout('здуфыу ашч ьу')).toBe('please fix me');
  });
});
