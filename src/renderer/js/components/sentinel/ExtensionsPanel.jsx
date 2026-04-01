const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function ExtensionsPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Extensions</Heading>
      <Text color='fg.muted'>Extension lifecycle and permission management are planned here.</Text>
    </Box>
  );
}

module.exports = ExtensionsPanel;
