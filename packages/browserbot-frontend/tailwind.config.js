const tw = require('@butopen/design-system/tailwind.config');

module.exports = {
  mode: 'jit',
  important: true,
  content: ['./src/styles.scss', './src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      ...tw.theme.extend,
      colors: {
        ...tw.theme.extend.colors,
        'bb-50': '#efeefd',
        'bb-100': '#c7c1f3',
        'bb-200': '#9993cb',
        'bb-300': '#6b63a8',
        'bb-400': '#4E4595',
        'bb-500': '#3c337e',
        'bb-600': '#302969',
        'bb-700': '#292260',
        'bb-800': '#1d1654',
        'bb-900': '#0a0623'
      }
    }
  },
  plugins: []
};
