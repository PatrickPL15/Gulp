const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function RepeaterPanel() {
  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <Heading size='md' mb='2'>Repeater</Heading>
      <Text color='fg.muted'>Manual replay and response inspection workflows are planned here.</Text>
    </Box>
  );
}

module.exports = RepeaterPanel;
