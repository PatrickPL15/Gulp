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
	const refreshTimerRef = React.useRef(null);
	const refreshPendingRef = React.useRef(false);
	const activeFilterRef = React.useRef({});
	const pageRef = React.useRef(0);
	const pageSizeRef = React.useRef(10);

	function buildQueryFilter(rawFilters) {
		const hostValue = String(rawFilters.host || '').trim();
		const pathValue = String(rawFilters.path || '').trim();
		const methodValue = String(rawFilters.method || '').trim().toUpperCase();
		const statusCodeValue = String(rawFilters.statusCode || '').trim();
		const parsedStatus = statusCodeValue ? Number(statusCodeValue) : null;

		return {
			host: hostValue || undefined,
			path: pathValue || undefined,
			method: methodValue || undefined,
			statusCode: Number.isFinite(parsedStatus) ? parsedStatus : undefined,
		};
	}

	function matchesActiveFilters(item, filter) {
		const request = item && item.request ? item.request : {};
		const response = item && item.response ? item.response : {};

		if (filter.method && String(request.method || '').toUpperCase() !== String(filter.method).toUpperCase()) {
			return false;
		}

		if (filter.host && !String(request.host || '').toLowerCase().includes(String(filter.host).toLowerCase())) {
			return false;
		}

		if (filter.path && !String(request.path || '').startsWith(String(filter.path))) {
			return false;
		}

		if (typeof filter.statusCode === 'number' && response.statusCode !== filter.statusCode) {
			return false;
		}

		return true;
	}

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
			const queryFilter = buildQueryFilter(filters);

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
		activeFilterRef.current = buildQueryFilter(filters);
		pageRef.current = page;
		pageSizeRef.current = pageSize;
	}, [filters, page, pageSize]);

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

		const scheduleRefresh = () => {
			refreshPendingRef.current = true;
			if (refreshTimerRef.current) {
				return;
			}

			refreshTimerRef.current = setTimeout(() => {
				refreshTimerRef.current = null;
				if (cancelled || !refreshPendingRef.current) {
					return;
				}

				refreshPendingRef.current = false;
				if (loadHistoryRef.current) {
					loadHistoryRef.current(0);
				}
			}, 150);
		};

		const unsubscribe = sentinel.history.onPush((item) => {
			if (cancelled || !item) {
				return;
			}

			if (pageRef.current === 0 && matchesActiveFilters(item, activeFilterRef.current)) {
				setItems(prev => {
					const exists = prev.some(existing => existing && existing.id === item.id);
					const nextItems = [item, ...prev.filter(existing => existing && existing.id !== item.id)]
						.slice(0, pageSizeRef.current);
					if (!exists) {
						setTotal(prevTotal => prevTotal + 1);
					}
					return nextItems;
				});
			}

			scheduleRefresh();
		});

		return () => {
			cancelled = true;
			refreshPendingRef.current = false;
			if (refreshTimerRef.current) {
				clearTimeout(refreshTimerRef.current);
				refreshTimerRef.current = null;
			}
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

			const request = item.request;
			const scheme = request.tls ? 'https' : 'http';
			const authority = request.host || (request.headers && request.headers.host) || 'localhost';
			const originalUrl = request.url || `${scheme}://${authority}${request.path || '/'}`;
			const separator = originalUrl.includes('?') ? '&' : '?';
			const templateUrl = `${originalUrl}${separator}attack=§injection§`;

			const configured = await sentinel.intruder.configure({
				config: {
					requestTemplate: {
						method: request.method,
						url: templateUrl,
						headers: request.headers,
						body: request.body,
					},
					attackType: 'sniper',
					positions: [
						{
							source: {
								type: 'dictionary',
								items: ['test', 'admin', "' or 1=1 --"],
							},
						},
					],
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
