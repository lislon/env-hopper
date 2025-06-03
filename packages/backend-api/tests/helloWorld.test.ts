import { describe, it, expect } from 'vitest';
import { helloWorld } from '../src/index';

describe('helloWorld', () => {
  it('returns the correct greeting', () => {
    expect(helloWorld()).toBe('Hello, Env Hopper!');
  });
});
