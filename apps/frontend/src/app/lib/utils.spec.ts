import { expect } from 'vitest';
import { interpolateWidgetStr } from './utils';

describe('interpolateWidgetStr', () => {
  it('should replace simple placeholders from env and app', () => {
    const str =
      'Hello {{env.meta.name}}, your ID is {{env.id}} and link is {{app.meta.url}}.';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = { meta: { url: 'http://example.com' } };

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe(
      'Hello Alice, your ID is 123 and link is http://example.com.',
    );
  });

  it('should leave unresolved placeholders intact', () => {
    const str = 'Hello {{env.meta.name}}, welcome to {{app.meta.unknownKey}}!';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = { meta: { url: 'http://example.com' } };

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('Hello Alice, welcome to {{app.meta.unknownKey}}!');
  });

  it('should handle recursive placeholders', () => {
    const str = 'Hello {{env.meta.name}}, {{env.meta.greeting}}!';
    const env = {
      id: '123',
      meta: { name: 'Alice', greeting: '{{app.meta.greeting}}' },
    };
    const app = { meta: { greeting: 'Welcome to the app' } };

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('Hello Alice, Welcome to the app!');
  });

  it('should handle multiple occurrences of the same placeholder', () => {
    const str = '{{env.meta.name}} is logged in. Hello {{env.meta.name}}!';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = undefined;

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('Alice is logged in. Hello Alice!');
  });

  it('should work with no placeholders', () => {
    const str = 'No placeholders here.';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = { meta: { url: 'http://example.com' } };

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('No placeholders here.');
  });

  it('should handle empty string input', () => {
    const str = '';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = { meta: { url: 'http://example.com' } };

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('');
  });

  it('should handle missing env and app values gracefully', () => {
    const str =
      'Hello {{env.meta.name}}, your ID is {{env.id}} and link is {{app.meta.url}}.';
    const env = undefined;
    const app = undefined;

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe(
      'Hello {{env.meta.name}}, your ID is {{env.id}} and link is {{app.meta.url}}.',
    );
  });

  it('should handle nested recursion with partial placeholders resolved', () => {
    const str = 'Welcome {{env.meta.greeting}}, have a great day!';
    const env = { id: '123', meta: { greeting: 'Hello {{env.meta.name}}' } };
    const app = undefined;

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('Welcome Hello {{env.meta.name}}, have a great day!');
  });

  it('should handle inf nested recursio', () => {
    const str = 'Welcome {{env.meta.greeting}}, have a great day!';
    const env = {
      id: '123',
      meta: { greeting: '{{env.meta.name}}', name: '{{env.meta.greeting}}' },
    };
    const app = undefined;

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('Welcome {{env.meta.greeting}}, have a great day!');
  });

  it('default value', () => {
    const str = 'a={{env.meta.name ?? Kot}} b={{env.meta.name2 ?? Kot}}';
    const env = { id: '123', meta: { name: 'Alice' } };
    const app = undefined;

    const result = interpolateWidgetStr(str, env, app);

    expect(result).toBe('a=Alice b=Kot');
  });
});
