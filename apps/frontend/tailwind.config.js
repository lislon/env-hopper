const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.test).{ts,tsx,html}',
    ),
  ],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        'eh-green': 'oklch(74.88% 0.149 130.38)',
      },
      gridTemplateAreas: {
        'layout-md': [
          '   .    e-input   ui-widget',
          '   .    e-bar     ui-widget',
          '   .    a-input   ui-widget',
          '   .    a-bar     ui-widget',
          '   .    s-input   ui-widget',
          '   .    jump      ui-widget',
          'history history   history',
        ],
        'layout-sm': [
          'e-input',
          'e-bar  ',
          'a-input',
          'a-bar  ',
          's-input',
          '  jump ',
          'ui-widget',
          'history',
        ],
      },
      gridTemplateColumns: {
        'layout-2xl':
          'minmax(250px, 1fr) minmax(auto, 800px) minmax(250px, 1fr)',
        'layout-md': '1fr minmax(auto, 800px) 1fr',
        'layout-sm': '1fr',
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
        },
      },
    ],
  },
  plugins: [
    require('@savvywombat/tailwindcss-grid-areas'),
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
};
