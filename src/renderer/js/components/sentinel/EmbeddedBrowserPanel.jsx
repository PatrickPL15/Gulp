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
  VStack,
} = require('@chakra-ui/react');

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSafePreviewDoc(text) {
  const escaped = escapeHtml(text);
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8"/>',
    '<meta http-equiv="Content-Security-Policy" content="default-src \"none\"; img-src \"none\"; media-src \"none\"; font-src \"none\"; style-src \"none\"; script-src \"none\"; connect-src \"none\"; frame-src \"none\"; object-src \"none\"; base-uri \"none\"; form-action \"none\""/>',
    '<title>Sentinel Preview</title>',
    '</head>',
    '<body>',
    `<pre>${escaped}</pre>`,
    '</body>',
    '</html>',
  ].join('');
}

function EmbeddedBrowserPanel() {
  const [sessions, setSessions] = React.useState([]);
  const [activeSessionId, setActiveSessionId] = React.useState('');
  const [address, setAddress] = React.useState('https://example.com');
  const [statusText, setStatusText] = React.useState('');
  const [errorText, setErrorText] = React.useState('');
  const [previewDoc, setPreviewDoc] = React.useState(() => buildSafePreviewDoc('Preview not loaded yet.'));

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const loadSessions = React.useCallback(async () => {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.browser) {
      return;
    }

    const listed = await sentinel.browser.listSessions();
    const items = Array.isArray(listed.items) ? listed.items : [];
    setSessions(items);
    if (items.length > 0 && !activeSessionId) {
      setActiveSessionId(items[0].id);
    }
  }, [activeSessionId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadSessions();
      } catch {
        if (!cancelled) {
          setErrorText('Unable to load embedded browser sessions.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  async function createSession() {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.browser) {
      return;
    }

    setErrorText('');
    setStatusText('');
    try {
      const created = await sentinel.browser.createSession({});
      const session = created && created.session ? created.session : null;
      if (!session) {
        throw new Error('No session returned from browser service.');
      }

      setSessions(prev => [session, ...prev]);
      setActiveSessionId(session.id);
      setStatusText('Embedded browser session opened.');
    } catch {
      setErrorText('Unable to create browser session.');
    }
  }

  async function navigate() {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.browser || !activeSessionId) {
      return;
    }

    setErrorText('');
    setStatusText('');
    try {
      const response = await sentinel.browser.navigate({
        sessionId: activeSessionId,
        url: address,
      });

      const session = response && response.session ? response.session : null;
      const payload = response && response.response ? response.response : null;

      if (session) {
        setSessions(prev => prev.map(item => (item.id === session.id ? session : item)));
      }

      if (payload && payload.body) {
        setPreviewDoc(buildSafePreviewDoc(payload.body));
      } else {
        setPreviewDoc(buildSafePreviewDoc('Binary/empty response preview unavailable.'));
      }

      setStatusText(`Navigated via proxy port ${response && response.proxy ? response.proxy.port : 'unknown'}.`);
    } catch (error) {
      setErrorText(error && error.message ? error.message : 'Navigation failed.');
    }
  }

  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <VStack align='stretch' spacing={3}>
        <Heading size='md'>Embedded Browser</Heading>
        <Text color='fg.muted'>Create browser sessions and navigate URLs through the Sentinel proxy.</Text>

        <HStack>
          <Button size='sm' onClick={createSession}>New Session</Button>
          <Button size='sm' variant='outline' onClick={loadSessions}>Refresh Sessions</Button>
          <Badge colorPalette='blue'>{sessions.length} sessions</Badge>
        </HStack>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <Text fontWeight='semibold' mb={2}>Sessions</Text>
          {sessions.length === 0 ? (
            <Text fontSize='sm' color='fg.muted'>No browser sessions yet.</Text>
          ) : sessions.map(session => (
            <Button
              key={session.id}
              size='xs'
              variant={activeSessionId === session.id ? 'solid' : 'ghost'}
              onClick={() => setActiveSessionId(session.id)}
              mr={2}
              mb={2}
            >
              {session.name}
            </Button>
          ))}
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <Text fontWeight='semibold' mb={2}>Address Bar</Text>
          <HStack>
            <Input value={address} onChange={event => setAddress(event.target.value)} placeholder='https://target.example' />
            <Button size='sm' colorPalette='blue' onClick={navigate} disabled={!activeSessionId}>Go</Button>
          </HStack>

          {activeSession ? (
            <Text fontSize='sm' mt={2} color='fg.muted'>
              Active session: <Code>{activeSession.name}</Code> · Status <Code>{activeSession.statusCode || 'pending'}</Code> · Type <Code>{activeSession.contentType || 'unknown'}</Code>
            </Text>
          ) : null}
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={2} minH='320px'>
          <Text fontSize='sm' color='fg.muted' mb={2}>Embedded Preview</Text>
          <Box borderWidth='1px' borderRadius='md' overflow='hidden' h='300px' bg='bg.subtle'>
            <iframe
              title='embedded-browser-preview'
              srcDoc={previewDoc}
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
              sandbox=''
            />
          </Box>
        </Box>

        {statusText ? <Text color='green.300' fontSize='sm'>{statusText}</Text> : null}
        {errorText ? <Text color='red.300' fontSize='sm'>{errorText}</Text> : null}
      </VStack>
    </Box>
  );
}

module.exports = EmbeddedBrowserPanel;
