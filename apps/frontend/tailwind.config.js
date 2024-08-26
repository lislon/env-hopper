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
    extend: {},
  },
  plugins: [],
};
