import { Eta } from 'eta';
import { EhBackendGenericMetaInput } from '@env-hopper/backend-core';

export interface UrlFormatterContext {
  appMeta?: EhBackendGenericMetaInput;
  envMeta?: Record<string, unknown>;
}

/**
 * Recursively renders template until all `${...}` expressions are resolved or max depth reached.
 */
export function urlFormatter(input: string, ctx: UrlFormatterContext): string {
  const MAX_PASSES = 5;
  let current = input;
  let previous = '';

  // Disable auto-escaping to prevent HTML escaping of template content
  const eta = new Eta({ autoEscape: false });

  const safeCtx = {
    app: { meta: ctx.appMeta ?? {} },
    env: { meta: ctx.envMeta ?? {} }
  };


  // Safe wrapper: missing props won't throw
  const safeTemplate = (etaTemplate: string) => {
    try {
      const result = eta.renderString(etaTemplate, safeCtx);
      console.log('Eta result:', result);
      return result;
    } catch (error) {
      console.log('Error during template processing:', error);
      return etaTemplate; // fallback for missing deep keys or syntax error
    }
  };

  for (let i = 0; i < MAX_PASSES; i++) {
    console.log(`\nPass ${i + 1}: "${current}"`);
    previous = current;
    current = safeTemplate(current);
    console.log(`After pass ${i + 1}: "${current}"`);

    // Check if we still have ${...} patterns that need processing
    if (!/\$\{.*?}/.test(current)) {
      console.log('No more ${...} patterns found, breaking');
      break;
    }
    // Also break if no changes were made to prevent infinite loops
    if (current === previous) {
      console.log('No changes made, breaking to prevent infinite loop');
      break;
    }
  }

  console.log('Final result:', current);
  return current;
}
