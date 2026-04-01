const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function SequencerPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Sequencer</Heading>
      <Text color='fg.muted'>Entropy and token predictability analysis are planned here.</Text>
    </Box>
  );
}

module.exports = SequencerPanel;
