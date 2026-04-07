const React = require('react');
const {
  Badge,
  Box,
  Button,
  Code,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} = require('@chakra-ui/react');

function mergeSession(currentItems, nextSession) {
  if (!nextSession || !nextSession.id) {
    return currentItems;
  }

  const existingIndex = currentItems.findIndex(item => item.id === nextSession.id);
  if (existingIndex === -1) {
    return [nextSession, ...currentItems];
  }

  return currentItems.map(item => (item.id === nextSession.id ? nextSession : item));
}

function sortSessions(items) {
  return [...items].sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));
}

function buildBoundsFromRect(rect) {
  // BrowserView.setBounds expects device pixels; getBoundingClientRect returns CSS (logical) pixels.
  // Multiply by devicePixelRatio so the overlay aligns on HiDPI displays (e.g. 125% Windows scaling).
  const scale = (typeof window !== 'undefined' && window.devicePixelRatio > 0) ? window.devicePixelRatio : 1;
  return {
    x: Math.max(0, Math.round((rect.left || 0) * scale)),
    y: Math.max(0, Math.round((rect.top || 0) * scale)),
    width: Math.max(0, Math.round((rect.width || 0) * scale)),
    height: Math.max(0, Math.round((rect.height || 0) * scale)),
  };
}

function getBrowserApi() {
  if (typeof window === 'undefined' || !window.sentinel || !window.sentinel.browser) {
    return null;
  }

  return window.sentinel.browser;
}

function EmbeddedBrowserPanel() {
  const [sessions, setSessions] = React.useState([]);
  const [activeSessionId, setActiveSessionId] = React.useState('');
  const [address, setAddress] = React.useState('https://example.com');
  const [statusText, setStatusText] = React.useState('');
  const [errorText, setErrorText] = React.useState('');
  const [lastProxyPort, setLastProxyPort] = React.useState('unknown');
  const hostRef = React.useRef(null);

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const loadSessions = React.useCallback(async () => {
    const browser = getBrowserApi();
    if (!browser) {
      return;
    }

    const listed = await browser.listSessions();
    const items = Array.isArray(listed.items) ? listed.items : [];
    const sorted = sortSessions(items);
    setSessions(sorted);
    setActiveSessionId(currentId => {
      if (currentId && sorted.some(item => item.id === currentId)) {
        return currentId;
      }
      return sorted[0] ? sorted[0].id : '';
    });
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

  const syncActiveBounds = React.useCallback(async (sessionIdOverride) => {
    const browser = getBrowserApi();
    const targetSessionId = sessionIdOverride || activeSessionId;
    const element = hostRef.current;
    if (!browser || !targetSessionId || !element || typeof element.getBoundingClientRect !== 'function') {
      return;
    }

    const rect = element.getBoundingClientRect();
    const bounds = buildBoundsFromRect(rect);
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    await browser.setBounds({ sessionId: targetSessionId, bounds });
  }, [activeSessionId]);

  React.useEffect(() => {
    const browser = getBrowserApi();
    if (!browser) {
      return undefined;
    }

    const unsubscribers = [
      typeof browser.onState === 'function'
        ? browser.onState(payload => {
          const session = payload && payload.session ? payload.session : null;
          if (!session) {
            return;
          }

          setSessions(currentItems => {
            if (payload && payload.closed) {
              return currentItems.filter(item => item.id !== session.id);
            }
            return sortSessions(mergeSession(currentItems, session));
          });

          if (session.currentUrl) {
            setAddress(session.currentUrl);
          }

          if (payload && payload.proxy && payload.proxy.port) {
            setLastProxyPort(String(payload.proxy.port));
          }

          if (payload && payload.closed && activeSessionId === session.id) {
            setActiveSessionId('');
          }
        })
        : null,
      typeof browser.onNavigateStart === 'function'
        ? browser.onNavigateStart(payload => {
          if (payload && payload.url) {
            setAddress(payload.url);
          }
          setStatusText('Loading page in Chromium browser...');
          setErrorText('');
        })
        : null,
      typeof browser.onNavigateComplete === 'function'
        ? browser.onNavigateComplete(payload => {
          if (payload && payload.proxy && payload.proxy.port) {
            setLastProxyPort(String(payload.proxy.port));
          }
          setStatusText(`Chromium browser routed through proxy port ${payload && payload.proxy ? payload.proxy.port : 'unknown'}.`);
          setErrorText('');
        })
        : null,
      typeof browser.onNavigateError === 'function'
        ? browser.onNavigateError(payload => {
          setErrorText(payload && payload.error ? payload.error : 'Navigation failed.');
          setStatusText('');
        })
        : null,
      typeof browser.onTitleUpdated === 'function'
        ? browser.onTitleUpdated(payload => {
          if (payload && payload.title) {
            setStatusText(`Loaded: ${payload.title}`);
          }
        })
        : null,
    ].filter(Boolean);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [activeSessionId]);

  React.useEffect(() => {
    const browser = getBrowserApi();
    if (!browser || !activeSessionId) {
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        await browser.focusSession({ sessionId: activeSessionId });
        await browser.showView({ sessionId: activeSessionId });
        await syncActiveBounds(activeSessionId);
      } catch {
        if (!cancelled) {
          setErrorText('Unable to attach Chromium browser surface.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, syncActiveBounds]);

  React.useEffect(() => {
    const browser = getBrowserApi();
    if (!browser || !activeSessionId) {
      return undefined;
    }

    const handleResize = () => {
      syncActiveBounds(activeSessionId).catch(() => {
        // Ignore bounds sync failures triggered by resize events.
      });
    };

    let resizeObserver = null;
    if (typeof ResizeObserver === 'function' && hostRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(hostRef.current);
    }

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', handleResize);
    }

    handleResize();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [activeSessionId, syncActiveBounds]);

  React.useEffect(() => {
    const browser = getBrowserApi();
    return () => {
      if (browser && activeSessionId && typeof browser.hideView === 'function') {
        browser.hideView({ sessionId: activeSessionId }).catch(() => {
          // Ignore detach failures on panel unmount.
        });
      }
    };
  }, [activeSessionId]);

  async function createSession() {
    const browser = getBrowserApi();
    if (!browser) {
      return;
    }

    setErrorText('');
    setStatusText('');
    try {
      const created = await browser.createSession({});
      const session = created && created.session ? created.session : null;
      if (!session) {
        throw new Error('No session returned from browser service.');
      }

      setSessions(prev => sortSessions(mergeSession(prev, session)));
      setActiveSessionId(session.id);
      setAddress(session.currentUrl || address);
      setStatusText('Chromium browser session opened.');
    } catch (error) {
      setErrorText(error && error.message ? error.message : 'Unable to create browser session.');
    }
  }

  async function runNavigation(methodName, args = {}) {
    const browser = getBrowserApi();
    if (!browser || !activeSessionId || typeof browser[methodName] !== 'function') {
      return;
    }

    setErrorText('');
    setStatusText('');
    try {
      const response = await browser[methodName]({ sessionId: activeSessionId, ...args });
      const session = response && response.session ? response.session : null;
      if (session) {
        setSessions(prev => sortSessions(mergeSession(prev, session)));
        if (session.currentUrl) {
          setAddress(session.currentUrl);
        }
      }
      if (response && response.proxy && response.proxy.port) {
        setLastProxyPort(String(response.proxy.port));
      }
    } catch (error) {
      setErrorText(error && error.message ? error.message : 'Navigation failed.');
    }
  }

  async function navigate() {
    return runNavigation('navigate', { url: address });
  }

  async function closeActiveSession() {
    const browser = getBrowserApi();
    if (!browser || !activeSessionId || typeof browser.closeSession !== 'function') {
      return;
    }

    setErrorText('');
    setStatusText('');
    try {
      await browser.closeSession({ sessionId: activeSessionId });
      setSessions(prev => prev.filter(item => item.id !== activeSessionId));
      const remaining = sessions.filter(item => item.id !== activeSessionId);
      setActiveSessionId(remaining[0] ? remaining[0].id : '');
      setStatusText('Chromium browser session closed.');
    } catch (error) {
      setErrorText(error && error.message ? error.message : 'Unable to close browser session.');
    }
  }

  return (
    <Box p='4' borderWidth='1px' borderRadius='md' h='100%' minH='480px'>
      <VStack align='stretch' spacing={3}>
        <Flex justify='space-between' align='center' pb='3' borderBottomWidth='1px' borderColor='border.default'>
          <Text fontWeight='medium' fontSize='sm'>Embedded Browser</Text>
          <HStack gap='2'>
            <Button size='xs' variant='outline' onClick={createSession}>New Session</Button>
            <Button size='xs' variant='outline' onClick={loadSessions}>Refresh</Button>
          </HStack>
        </Flex>

        <HStack>
          <Button size='sm' onClick={createSession}>New Session</Button>
          <Button size='sm' variant='outline' onClick={loadSessions}>Refresh Sessions</Button>
          <Badge colorPalette='blue'>{sessions.length} sessions</Badge>
          <Badge colorPalette={activeSession && activeSession.loading ? 'orange' : 'green'}>
            {activeSession && activeSession.loading ? 'Loading' : 'Ready'}
          </Badge>
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
          <HStack wrap='wrap'>
            <Button size='sm' variant='outline' onClick={() => runNavigation('back')} disabled={!activeSession || !activeSession.canGoBack}>Back</Button>
            <Button size='sm' variant='outline' onClick={() => runNavigation('forward')} disabled={!activeSession || !activeSession.canGoForward}>Forward</Button>
            <Button size='sm' variant='outline' onClick={() => runNavigation('reload')} disabled={!activeSession}>Reload</Button>
            <Button size='sm' variant='outline' onClick={() => runNavigation('stop')} disabled={!activeSession || !activeSession.loading}>Stop</Button>
            <Input value={address} onChange={event => setAddress(event.target.value)} placeholder='https://target.example' />
            <Button size='sm' colorPalette='blue' onClick={navigate} disabled={!activeSessionId}>Go</Button>
            <Button size='sm' variant='outline' colorPalette='red' onClick={closeActiveSession} disabled={!activeSessionId}>Close</Button>
          </HStack>

          {activeSession ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={2} mt={2}>
              <Text fontSize='sm' color='fg.muted'>
                Active session: <Code>{activeSession.name}</Code> · URL <Code>{activeSession.currentUrl || 'pending'}</Code>
              </Text>
              <Text fontSize='sm' color='fg.muted'>
                Title <Code>{activeSession.title || 'untitled'}</Code> · Proxy <Code>{lastProxyPort}</Code>
              </Text>
              <Text fontSize='sm' color='fg.muted'>
                Status <Code>{activeSession.statusCode || 'pending'}</Code> · Type <Code>{activeSession.contentType || 'unknown'}</Code>
              </Text>
              <Text fontSize='sm' color='fg.muted'>
                Bounds <Code>{`${activeSession.bounds && activeSession.bounds.width ? activeSession.bounds.width : 0}x${activeSession.bounds && activeSession.bounds.height ? activeSession.bounds.height : 0}`}</Code> · Partition <Code>{activeSession.hostPartition || 'n/a'}</Code>
              </Text>
            </SimpleGrid>
          ) : null}
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={2} minH='340px'>
          <Text fontSize='sm' color='fg.muted' mb={2}>Chromium Surface</Text>
          <Box
            ref={hostRef}
            data-testid='embedded-browser-host'
            borderWidth='1px'
            borderRadius='md'
            overflow='hidden'
            h='320px'
            bg='bg.subtle'
            position='relative'
          >
            <Flex
              position='absolute'
              inset='0'
              align='center'
              justify='center'
              direction='column'
              gap='2'
              pointerEvents='none'
              color='fg.muted'
              textAlign='center'
              bg='linear-gradient(180deg, rgba(8, 17, 26, 0.16) 0%, rgba(8, 17, 26, 0.02) 100%)'
            >
              <Text fontWeight='semibold'>Chromium BrowserView Host</Text>
              <Text fontSize='sm' maxW='md'>
                The live browser surface is attached by Electron main process to this viewport region.
              </Text>
            </Flex>
          </Box>
        </Box>

        {statusText ? <Text color='green.300' fontSize='sm'>{statusText}</Text> : null}
        {errorText ? <Text color='red.300' fontSize='sm'>{errorText}</Text> : null}
      </VStack>
    </Box>
  );
}

module.exports = EmbeddedBrowserPanel;
