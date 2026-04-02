const React = require('react');
const { Box, Code, Heading, Text, VStack } = require('@chakra-ui/react');

function DashboardShell() {
	const [guidance, setGuidance] = React.useState(null);

	React.useEffect(() => {
		let cancelled = false;

		async function loadGuidance() {
			const sentinel = window.sentinel;
			if (!sentinel || !sentinel.ca || typeof sentinel.ca.trustGuidance !== 'function') {
				return;
			}

			try {
				const payload = await sentinel.ca.trustGuidance();
				if (!cancelled && payload && payload.guidance) {
					setGuidance(payload.guidance);
				}
			} catch {
				// Guidance is optional in early boot and should not break dashboard render.
			}
		}

		loadGuidance();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<VStack align='stretch' spacing={2}>
				<Heading size='md'>Dashboard</Heading>
				<Text color='fg.muted'>
					Overview of active project state, findings, and quick workflow actions.
				</Text>
				{guidance ? (
					<Box mt={2} p={3} borderWidth='1px' borderRadius='md' bg='bg.subtle'>
						<Text fontWeight='semibold'>CA Trust Guidance</Text>
						<Text fontSize='sm' color='fg.muted'>{guidance.title}</Text>
						<Text fontSize='sm'>Certificate path: <Code>{guidance.certPathHint}</Code></Text>
						{guidance.steps.slice(0, 2).map((step, index) => (
							<Text key={`${index}-${step}`} fontSize='sm'>
								{index + 1}. {step}
							</Text>
						))}
					</Box>
				) : null}
			</VStack>
		</Box>
	);
}

module.exports = DashboardShell;
