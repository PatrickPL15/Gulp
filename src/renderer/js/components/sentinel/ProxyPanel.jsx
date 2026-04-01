const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function ProxyPanel() {
	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<Heading size='md' mb={2}>Proxy</Heading>
			<Text color='fg.muted'>Interception controls and request/response workflow are planned here.</Text>
		</Box>
	);
}

module.exports = ProxyPanel;
