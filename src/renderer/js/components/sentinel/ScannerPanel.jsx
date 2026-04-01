const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function ScannerPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Scanner</Heading>
      <Text color='fg.muted'>Passive and active scanning controls are planned here.</Text>
    </Box>
  );
}

module.exports = ScannerPanel;
