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
      gridTemplateAreas: {
        'layout-md': [
          '   .    e-input   widgets',
          '   .    e-bar     widgets',
          '   .    a-input   widgets',
          '   .    a-bar      a-bar ',
          '   .    s-input      .   ',
          '  jump   jump       jump  ',
          'history history   history ',
        ],
        'layout-sm': [
          'e-input',
          'e-bar  ',
          'a-input',
          'a-bar  ',
          's-input',
          '  jump ',
          'widgets',
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
          'primary-content': 'oklch(74.88% 0.149 130.38)',
        },
      },
      {
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'primary-content': 'oklch(74.88% 0.149 130.38)',
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
