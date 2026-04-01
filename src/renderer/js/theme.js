const { createSystem, defaultConfig, defineConfig } = require('@chakra-ui/react');

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eef6ff' },
          100: { value: '#d9eaff' },
          200: { value: '#b7d7ff' },
          300: { value: '#8cbcff' },
          400: { value: '#5d99ff' },
          500: { value: '#386fff' },
          600: { value: '#284fdd' },
          700: { value: '#1f3da8' },
          800: { value: '#1d3684' },
          900: { value: '#1f3369' }
        }
      }
    },
    semanticTokens: {
      colors: {
        'bg.panel': { value: '{colors.brand.50}' },
        'bg.subtle': { value: '{colors.brand.100}' }
      }
    }
  }
});

const system = createSystem(defaultConfig, config);

module.exports = system;
