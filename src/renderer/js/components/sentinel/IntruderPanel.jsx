const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function IntruderPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Intruder</Heading>
      <Text color='fg.muted'>Payload attack profiles and result analysis are planned here.</Text>
    </Box>
  );
}

module.exports = IntruderPanel;
