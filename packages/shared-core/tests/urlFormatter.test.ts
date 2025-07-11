import { describe, expect, it } from 'vitest';
import { urlFormatter } from '~/index';

describe('urlFormatter', () => {

  it('generates the correct URL from nested templates', () => {
    const actual = urlFormatter(
      '<%= app.meta.ui.baseUrl + "/prod-lims/app/home" %>',
      {
        appMeta: {
          ui: {
            baseUrl: '<%= it.env.meta.isProduction ? "https://production.example.com" : "https://" + it.env.meta.subdomain + ".example.com:8250" %>'
          }
        },
        envMeta: {
          isProduction: false,
          subdomain: 'staging'
        }
      }
    );

    expect(actual).toStrictEqual("https://staging.example.com:8250/prod-lims/app/home");
  });

});
