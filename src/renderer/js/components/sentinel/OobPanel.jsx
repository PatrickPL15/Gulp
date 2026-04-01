const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function OobPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>OOB</Heading>
      <Text color='fg.muted'>Out-of-band callback monitoring and correlation are planned here.</Text>
    </Box>
  );
}

module.exports = OobPanel;
