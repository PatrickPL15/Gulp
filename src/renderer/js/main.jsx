const React = require('react');
const { createRoot } = require('react-dom/client');
const { ChakraProvider, defaultSystem } = require('@chakra-ui/react');
const App = require('./components/App');
const themeSystem = require('./theme');

/*
TODO(Sentinel): Renderer root plan
- Add app-level router/workspace shell for Sentinel modules.
- Add global providers for project state, feature flags, and notifications.
- Add persisted layout/state restoration for multi-module workflow.
*/

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = createRoot(rootElement);
  const providerProps = {
    value: themeSystem || defaultSystem
  };

  root.render(
    React.createElement(
      ChakraProvider,
      providerProps,
      React.createElement(App)
    )
  );
}
