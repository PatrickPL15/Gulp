const React = require('react');
const { Box, Heading, Text, VStack } = require('@chakra-ui/react');

function DashboardShell() {
	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<VStack align='stretch' spacing={2}>
				<Heading size='md'>Dashboard</Heading>
				<Text color='fg.muted'>
					Overview of active project state, findings, and quick workflow actions.
				</Text>
			</VStack>
		</Box>
	);
}

module.exports = DashboardShell;
