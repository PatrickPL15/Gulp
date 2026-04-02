const React = require('react');
const {
	Badge,
	Box,
	Button,
	Code,
	Heading,
	HStack,
	Input,
	Text,
	Textarea,
	VStack,
} = require('@chakra-ui/react');

function ProxyPanel() {
	const [status, setStatus] = React.useState({ running: false, port: 8080, intercepting: true });
	const [queue, setQueue] = React.useState([]);
	const [selectedId, setSelectedId] = React.useState('');
	const [editPath, setEditPath] = React.useState('');
	const [editBody, setEditBody] = React.useState('');
	const [errorText, setErrorText] = React.useState('');

	const selected = queue.find(item => item.id === selectedId) || null;

	React.useEffect(() => {
		let cancelled = false;
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy) {
			return undefined;
		}

		async function bootstrap() {
			try {
				const currentStatus = await sentinel.proxy.status();
				if (!cancelled) {
					setStatus(currentStatus);
				}
			} catch {
				if (!cancelled) {
					setErrorText('Unable to load proxy status.');
				}
			}
		}

		bootstrap();

		const unsubscribe = sentinel.proxy.intercept.onRequest((request) => {
			if (cancelled || !request || !request.id) {
				return;
			}
			setQueue(prev => {
				if (prev.some(item => item.id === request.id)) {
					return prev;
				}
				return [request, ...prev];
			});
		});

		return () => {
			cancelled = true;
			if (typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}, []);

	React.useEffect(() => {
		if (!selected) {
			setEditPath('');
			setEditBody('');
			return;
		}

		setEditPath(selected.path || '/');
		setEditBody(selected.body || '');
	}, [selectedId]);

	async function startProxy() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy) {
			return;
		}
		setErrorText('');
		try {
			const running = await sentinel.proxy.start({ port: status.port || 8080 });
			setStatus(prev => ({ ...prev, running: true, port: running.port }));
		} catch {
			setErrorText('Unable to start proxy listener.');
		}
	}

	async function stopProxy() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy) {
			return;
		}
		setErrorText('');
		try {
			await sentinel.proxy.stop();
			setStatus(prev => ({ ...prev, running: false }));
		} catch {
			setErrorText('Unable to stop proxy listener.');
		}
	}

	async function toggleIntercept() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy) {
			return;
		}
		setErrorText('');
		try {
			const next = await sentinel.proxy.intercept.toggle({ enabled: !status.intercepting });
			setStatus(prev => ({ ...prev, intercepting: next.intercepting }));
		} catch {
			setErrorText('Unable to toggle intercept mode.');
		}
	}

	async function forwardSelected() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy || !selected) {
			return;
		}
		setErrorText('');
		try {
			await sentinel.proxy.intercept.forward({
				requestId: selected.id,
				editedRequest: {
					path: editPath,
					body: editBody,
				},
			});
			setQueue(prev => prev.filter(item => item.id !== selected.id));
			setSelectedId('');
		} catch {
			setErrorText('Unable to forward selected request.');
		}
	}

	async function dropSelected() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.proxy || !selected) {
			return;
		}
		setErrorText('');
		try {
			await sentinel.proxy.intercept.drop({ requestId: selected.id });
			setQueue(prev => prev.filter(item => item.id !== selected.id));
			setSelectedId('');
		} catch {
			setErrorText('Unable to drop selected request.');
		}
	}

	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<VStack align='stretch' spacing={3}>
				<Heading size='md'>Proxy</Heading>
				<HStack justify='space-between' wrap='wrap'>
					<HStack>
						<Badge colorPalette={status.running ? 'green' : 'orange'}>
							{status.running ? 'Running' : 'Stopped'}
						</Badge>
						<Badge colorPalette={status.intercepting ? 'purple' : 'blue'}>
							Intercept {status.intercepting ? 'On' : 'Off'}
						</Badge>
						<Text fontSize='sm'>Port <Code>{status.port}</Code></Text>
					</HStack>
					<HStack>
						<Button size='xs' variant='outline' onClick={status.running ? stopProxy : startProxy}>
							{status.running ? 'Stop' : 'Start'}
						</Button>
						<Button size='xs' variant='outline' onClick={toggleIntercept}>
							{status.intercepting ? 'Resume All' : 'Pause All'}
						</Button>
					</HStack>
				</HStack>

				<Text color='fg.muted' fontSize='sm'>
					Intercept queue depth: <Code>{queue.length}</Code>
				</Text>

				<Box borderWidth='1px' borderRadius='md' p={3}>
					<Text fontWeight='semibold' mb={2}>Queued Requests</Text>
					{queue.length === 0 ? (
						<Text color='fg.muted' fontSize='sm'>No paused requests.</Text>
					) : queue.map(item => (
						<Button
							key={item.id}
							size='xs'
							variant={selectedId === item.id ? 'solid' : 'ghost'}
							onClick={() => setSelectedId(item.id)}
							mr={2}
							mb={2}
						>
							{item.method} {item.host}{item.path}
						</Button>
					))}
				</Box>

				{selected ? (
					<Box borderWidth='1px' borderRadius='md' p={3}>
						<Text fontWeight='semibold' mb={2}>Edit Request Before Forward</Text>
						<Text fontSize='sm' mb={1}>Request ID: <Code>{selected.id}</Code></Text>
						<Input
							size='sm'
							value={editPath}
							onChange={event => setEditPath(event.target.value)}
							mb={2}
							placeholder='Path'
						/>
						<Textarea
							size='sm'
							value={editBody}
							onChange={event => setEditBody(event.target.value)}
							placeholder='Request body (optional)'
							rows={6}
						/>
						<HStack mt={3}>
							<Button size='sm' colorPalette='green' onClick={forwardSelected}>Forward</Button>
							<Button size='sm' colorPalette='red' variant='outline' onClick={dropSelected}>Drop</Button>
						</HStack>
					</Box>
				) : null}

				{errorText ? (
					<Text color='red.300' fontSize='sm'>{errorText}</Text>
				) : null}
			</VStack>
		</Box>
	);
}

module.exports = ProxyPanel;
