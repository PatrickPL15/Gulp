const React = require('react');
const {
  Box,
  Code,
  Container,
  Heading,
  Text,
  VStack
} = require('@chakra-ui/react');

/*
TODO(Sentinel): App shell plan
- Replace welcome content with module-based navigation (Proxy, History, Repeater, Intruder, Target, Scanner, Decoder, Extensions).
- Add workspace tabs/panes for concurrent tool usage.
- Add global status indicators (proxy state, active project, scope).
*/

function App() {
  const versions = (window.electronInfo && window.electronInfo.versions) || {};

  return (
    <Container maxW='3xl' py={{ base: 10, md: 16 }}>
      <VStack
        align='stretch'
        spacing={6}
        p={{ base: 6, md: 8 }}
        borderWidth='1px'
        borderRadius='xl'
        bg='bg.panel'
      >
        <Heading size='lg'>Hello from React + Chakra UI</Heading>
        <Text color='fg.muted'>
          Renderer UI is now powered by Chakra components.
        </Text>
        <Box
          p={4}
          borderWidth='1px'
          borderRadius='md'
          bg='bg.subtle'
          fontSize='sm'
          lineHeight='1.8'
        >
          <Text>
            Node.js: <Code>{versions.node || 'unknown'}</Code>
          </Text>
          <Text>
            Chromium: <Code>{versions.chrome || 'unknown'}</Code>
          </Text>
          <Text>
            Electron: <Code>{versions.electron || 'unknown'}</Code>
          </Text>
        </Box>
      </VStack>
    </Container>
  );
}

module.exports = App;
