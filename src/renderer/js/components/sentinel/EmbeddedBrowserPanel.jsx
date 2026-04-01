const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function EmbeddedBrowserPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Embedded Browser</Heading>
      <Text color='fg.muted'>Proxy-bound browser controls and session indicators are planned here.</Text>
    </Box>
  );
}

module.exports = EmbeddedBrowserPanel;
