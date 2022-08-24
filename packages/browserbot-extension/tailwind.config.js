const tw = require('@butopen/design-system/tailwind.config');

module.exports = {
  mode: 'jit',
  prefix: '',
  content: ['./src/**/*.{html,ts,scss,js,md}'],
  theme: {
    extend: {
      ...tw.theme.extend,
      colors: {
        ...tw.theme.extend.colors,
        bbp: 'var(--bb-primary-color)',
        bbs: 'var(--bb-secondary-color)'
      },
      scale: {
        200: '2',
        300: '3'
      }
    }
  },
  variants: {
    extend: {}
  }
};
