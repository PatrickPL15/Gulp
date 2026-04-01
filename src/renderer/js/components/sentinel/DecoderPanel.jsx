const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function DecoderPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Decoder</Heading>
      <Text color='fg.muted'>Transformation and nested encoding utilities are planned here.</Text>
    </Box>
  );
}

module.exports = DecoderPanel;
