const { createSystem, defaultConfig, defineConfig } = require('@chakra-ui/react');

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: { value: "'IBM Plex Sans', 'Segoe UI', sans-serif" },
        heading: { value: "'IBM Plex Sans', 'Segoe UI', sans-serif" },
        mono: { value: "'IBM Plex Mono', 'Consolas', 'Courier New', monospace" }
      },
      radii: {
        sm: { value: '4px' },
        md: { value: '6px' },
        lg: { value: '8px' }
      },
      colors: {
        brand: {
          50: { value: '#edf6ff' },
          100: { value: '#cfe3ff' },
          200: { value: '#9fc6ff' },
          300: { value: '#6ca7ff' },
          400: { value: '#3f89ff' },
          500: { value: '#216de6' },
          600: { value: '#1854b3' },
          700: { value: '#143f84' },
          800: { value: '#122f61' },
          900: { value: '#101f40' }
        },
        workbench: {
          50: { value: '#f3f6f8' },
          100: { value: '#d8e0e6' },
          200: { value: '#afbdc8' },
          300: { value: '#8699aa' },
          400: { value: '#5f7589' },
          500: { value: '#495d70' },
          600: { value: '#334252' },
          700: { value: '#242f3c' },
          800: { value: '#171f29' },
          900: { value: '#0e141c' }
        }
      }
    },
    semanticTokens: {
      colors: {
        'bg.canvas': { value: '{colors.workbench.900}' },
        'bg.panel': { value: '#111821' },
        'bg.surface': { value: '#1a2531' },
        'bg.subtle': { value: '#202d3a' },
        'bg.elevated': { value: '#0b1118' },
        'fg.default': { value: '#edf2f7' },
        'fg.muted': { value: '#b4c2cf' },
        'border.default': { value: '#2a3948' },
        'border.subtle': { value: '#34485b' },
        'severity.critical': { value: '#e53e3e' },
        'severity.high': { value: '#ed8936' },
        'severity.medium': { value: '#ecc94b' },
        'severity.low': { value: '#63b3ed' },
        'severity.info': { value: '#a0aec0' }
      }
    },
    recipes: {
      button: {
        base: {
          borderRadius: 'sm'
        }
      }
    }
  }
});

const system = createSystem(defaultConfig, config);
system.rawConfig = config;

module.exports = system;
