const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function TargetMapPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Target Map</Heading>
      <Text color='fg.muted'>Scope management and site map navigation are planned here.</Text>
    </Box>
  );
}

module.exports = TargetMapPanel;
