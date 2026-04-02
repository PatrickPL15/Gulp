const React = require('react');
const {
	Box,
	Button,
	Code,
	Heading,
	HStack,
	Input,
	Text,
	VStack,
} = require('@chakra-ui/react');

function HistoryPanel() {
	const [items, setItems] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [errorText, setErrorText] = React.useState('');
	const [noticeText, setNoticeText] = React.useState('');
	const [page, setPage] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(10);
	const [total, setTotal] = React.useState(0);
	const [filters, setFilters] = React.useState({
		host: '',
		path: '',
		method: '',
		statusCode: '',
	});
	const loadHistoryRef = React.useRef(null);

	const loadHistory = React.useCallback(async (nextPage = 0) => {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.history) {
			setLoading(false);
			return;
		}

		setErrorText('');
		setNoticeText('');
		setLoading(true);
		try {
			const statusCodeValue = String(filters.statusCode || '').trim();
			const parsedStatus = statusCodeValue ? Number(statusCodeValue) : null;
			const queryFilter = {
				host: filters.host || undefined,
				path: filters.path || undefined,
				method: filters.method ? String(filters.method).toUpperCase() : undefined,
				statusCode: Number.isFinite(parsedStatus) ? parsedStatus : undefined,
			};

			const result = await sentinel.history.query({
				page: nextPage,
				pageSize,
				filter: queryFilter,
			});

			setItems(Array.isArray(result.items) ? result.items : []);
			setTotal(Number(result.total) || 0);
			setPage(Number(result.page) || 0);
		} catch {
			setErrorText('Unable to load traffic history.');
		} finally {
			setLoading(false);
		}
	}, [filters, pageSize]);

	React.useEffect(() => {
		loadHistoryRef.current = loadHistory;
	}, [loadHistory]);

	React.useEffect(() => {
		let cancelled = false;
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.history) {
			setLoading(false);
			return undefined;
		}

		if (loadHistoryRef.current) {
			loadHistoryRef.current(0);
		}

		const unsubscribe = sentinel.history.onPush((item) => {
			if (cancelled || !item) {
				return;
			}
			if (loadHistoryRef.current) {
				loadHistoryRef.current(0);
			}
		});

		return () => {
			cancelled = true;
			if (typeof unsubscribe === 'function') {
				unsubscribe();
			}
		};
	}, []);

	async function clearHistory() {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.history) {
			return;
		}
		setErrorText('');
		setNoticeText('');
		try {
			await sentinel.history.clear();
			setItems([]);
			setTotal(0);
			setPage(0);
		} catch {
			setErrorText('Unable to clear history.');
		}
	}

	async function sendToRepeater(itemId) {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.history || !sentinel.repeater) {
			return;
		}

		setErrorText('');
		setNoticeText('');
		try {
			const item = await sentinel.history.get({ id: itemId });
			if (!item || !item.request) {
				throw new Error('Selected history item has no request payload.');
			}

			await sentinel.repeater.send({ request: item.request });
			setNoticeText('Sent to Repeater.');
		} catch {
			setErrorText('Unable to send item to Repeater.');
		}
	}

	async function sendToIntruder(itemId) {
		const sentinel = window.sentinel;
		if (!sentinel || !sentinel.history || !sentinel.intruder) {
			return;
		}

		setErrorText('');
		setNoticeText('');
		try {
			const item = await sentinel.history.get({ id: itemId });
			if (!item || !item.request) {
				throw new Error('Selected history item has no request payload.');
			}

			const configured = await sentinel.intruder.configure({
				config: {
					method: item.request.method,
					path: item.request.path,
					headers: item.request.headers,
					body: item.request.body,
					payloads: ['${injection}'],
				},
			});

			await sentinel.intruder.start({ configId: configured.configId });
			setNoticeText('Sent to Intruder.');
		} catch {
			setErrorText('Unable to send item to Intruder.');
		}
	}

	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	function onFilterChange(key, value) {
		setFilters(prev => ({ ...prev, [key]: value }));
	}

	return (
		<Box p={4} borderWidth='1px' borderRadius='md'>
			<VStack align='stretch' spacing={3}>
				<HStack justify='space-between'>
					<Heading size='md'>History</Heading>
					<HStack>
						<Button size='xs' variant='outline' onClick={() => loadHistory(page)}>Refresh</Button>
						<Button size='xs' variant='outline' colorPalette='red' onClick={clearHistory}>Clear</Button>
					</HStack>
				</HStack>

				<HStack wrap='wrap'>
					<Input
						size='xs'
						placeholder='Host'
						value={filters.host}
						onChange={event => onFilterChange('host', event.target.value)}
						maxW='180px'
					/>
					<Input
						size='xs'
						placeholder='Path prefix'
						value={filters.path}
						onChange={event => onFilterChange('path', event.target.value)}
						maxW='180px'
					/>
					<Input
						size='xs'
						placeholder='Method (GET)'
						value={filters.method}
						onChange={event => onFilterChange('method', event.target.value)}
						maxW='140px'
					/>
					<Input
						size='xs'
						type='number'
						placeholder='Status (200)'
						value={filters.statusCode}
						onChange={event => onFilterChange('statusCode', event.target.value)}
						maxW='140px'
					/>
					<Button size='xs' variant='outline' onClick={() => loadHistory(0)}>Apply</Button>
				</HStack>

				<Text fontSize='sm' color='fg.muted'>
					Page <Code>{page + 1}</Code> / <Code>{totalPages}</Code> · Showing <Code>{items.length}</Code> of <Code>{total}</Code>
				</Text>

				{loading ? (
					<Text fontSize='sm' color='fg.muted'>Loading history...</Text>
				) : null}

				{!loading && items.length === 0 ? (
					<Text fontSize='sm' color='fg.muted'>No traffic captured yet.</Text>
				) : null}

				{items.map(item => {
					const request = item.request || {};
					const response = item.response || {};
					const statusCode = response.statusCode || 'pending';
					return (
						<Box key={item.id} borderWidth='1px' borderRadius='md' p={2}>
							<Text fontSize='sm'>
								<Code>{request.method || 'GET'}</Code>{' '}
								{request.host || 'unknown-host'}{request.path || '/'}
							</Text>
							<Text fontSize='xs' color='fg.muted'>
								Status: <Code>{statusCode}</Code> · {new Date(item.timestamp).toLocaleTimeString()}
							</Text>
							<HStack mt={2}>
								<Button size='xs' variant='outline' onClick={() => sendToRepeater(item.id)}>To Repeater</Button>
								<Button size='xs' variant='outline' onClick={() => sendToIntruder(item.id)}>To Intruder</Button>
							</HStack>
						</Box>
					);
				})}

				<HStack justify='space-between'>
					<Button
						size='xs'
						variant='outline'
						onClick={() => loadHistory(Math.max(0, page - 1))}
						disabled={page <= 0}
					>
						Previous
					</Button>
					<Button
						size='xs'
						variant='outline'
						onClick={() => loadHistory(page + 1)}
						disabled={(page + 1) >= totalPages}
					>
						Next
					</Button>
				</HStack>

				{errorText ? <Text color='red.300' fontSize='sm'>{errorText}</Text> : null}
				{noticeText ? <Text color='green.300' fontSize='sm'>{noticeText}</Text> : null}
			</VStack>
		</Box>
	);
}

module.exports = HistoryPanel;
