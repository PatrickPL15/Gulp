const React = require('react');
const { Box, Heading, Text } = require('@chakra-ui/react');

function HistoryPanel() {
	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<Heading size='md' mb={2}>History</Heading>
			<Text color='fg.muted'>Searchable traffic history and drill-down views are planned here.</Text>
		</Box>
	);
}

module.exports = HistoryPanel;
