const React = require('react');
const {
  Badge,
  Box,
  Button,
  Code,
  Flex,
  HStack,
  Heading,
  Input,
  Stack,
  Text,
  VStack
} = require('@chakra-ui/react');
const {
  FiHome,
  FiShield,
  FiClock,
  FiRepeat,
  FiCrosshair,
  FiMap,
  FiSearch,
  FiRadio,
  FiBarChart2,
  FiCode,
  FiMonitor,
  FiPackage,
  FiChevronsLeft,
  FiChevronsRight
} = require('react-icons/fi');
const DashboardShell = require('./sentinel/DashboardShell');
const ProxyPanel = require('./sentinel/ProxyPanel');
const HistoryPanel = require('./sentinel/HistoryPanel');
const RepeaterPanel = require('./sentinel/RepeaterPanel');
const IntruderPanel = require('./sentinel/IntruderPanel');
const TargetMapPanel = require('./sentinel/TargetMapPanel');
const ScannerPanel = require('./sentinel/ScannerPanel');
const OobPanel = require('./sentinel/OobPanel');
const SequencerPanel = require('./sentinel/SequencerPanel');
const DecoderPanel = require('./sentinel/DecoderPanel');
const EmbeddedBrowserPanel = require('./sentinel/EmbeddedBrowserPanel');
const ExtensionsPanel = require('./sentinel/ExtensionsPanel');
const { modules, moduleDescriptions } = require('./app-constants');

const panelStatusFields = {
  Dashboard: [
    { label: 'Open issues', key: 'openIssues' },
    { label: 'Critical findings', key: 'criticalFindings' },
    { label: 'Active sessions', key: 'activeSessions' }
  ],
  Proxy: [
    { label: 'Queue depth', key: 'queueCount' },
    { label: 'Intercept mode', key: 'interceptMode' },
    { label: 'Listener port', key: 'listenerPort' }
  ],
  History: [
    { label: 'Requests captured', key: 'requestCount' },
    { label: 'Visible (filtered)', key: 'filteredCount' },
    { label: 'Active filter', key: 'activeFilter' }
  ],
  Repeater: [
    { label: 'Saved requests', key: 'savedRequests' },
    { label: 'Last target', key: 'lastTarget' }
  ],
  Intruder: [
    { label: 'Attack positions', key: 'positions' },
    { label: 'Payload count', key: 'payloadCount' },
    { label: 'Attack status', key: 'attackStatus' }
  ],
  Target: [
    { label: 'Scope entries', key: 'scopeEntries' },
    { label: 'Discovered hosts', key: 'discoveredHosts' },
    { label: 'Scope mode', key: 'scopeMode' }
  ],
  Scanner: [
    { label: 'Findings', key: 'findings' },
    { label: 'Active scans', key: 'activeScans' },
    { label: 'Last scan target', key: 'lastScanTarget' }
  ],
  OOB: [
    { label: 'Payloads', key: 'payloads' },
    { label: 'Callbacks', key: 'callbacks' },
    { label: 'Last callback source', key: 'lastSource' }
  ],
  Sequencer: [
    { label: 'Samples', key: 'samples' },
    { label: 'Entropy score', key: 'entropy' },
    { label: 'Rating', key: 'rating' }
  ],
  Decoder: [
    { label: 'Encoding chain', key: 'encodingType' },
    { label: 'Chain steps', key: 'chainLength' }
  ],
  'Embedded Browser': [
    { label: 'Open sessions', key: 'openSessions' },
    { label: 'Last URL', key: 'lastUrl' },
    { label: 'Proxy route', key: 'proxyRoute' }
  ],
  Extensions: [
    { label: 'Loaded', key: 'loadedCount' },
    { label: 'Active', key: 'activeCount' }
  ]
};

const defaultPanelStatus = {
  Dashboard: { openIssues: 0, criticalFindings: 0, activeSessions: 0 },
  Proxy: { queueCount: 0, interceptMode: 'All requests', listenerPort: 8080 },
  History: { requestCount: 0, filteredCount: 0, activeFilter: 'None' },
  Repeater: { savedRequests: 0, lastTarget: '\u2014' },
  Intruder: { positions: 0, payloadCount: 0, attackStatus: 'Idle' },
  Target: { scopeEntries: 0, discoveredHosts: 0, scopeMode: 'in-scope-only' },
  Scanner: { findings: 0, activeScans: 0, lastScanTarget: '\u2014' },
  OOB: { payloads: 0, callbacks: 0, lastSource: '\u2014' },
  Sequencer: { samples: 0, entropy: '\u2014', rating: 'pending' },
  Decoder: { encodingType: 'URL', chainLength: 1 },
  'Embedded Browser': { openSessions: 0, lastUrl: '\u2014', proxyRoute: 'auto' },
  Extensions: { loadedCount: 0, activeCount: 0 }
};

const modulePanels = {
  Dashboard: DashboardShell,
  Proxy: ProxyPanel,
  History: HistoryPanel,
  Repeater: RepeaterPanel,
  Intruder: IntruderPanel,
  Target: TargetMapPanel,
  Scanner: ScannerPanel,
  OOB: OobPanel,
  Sequencer: SequencerPanel,
  Decoder: DecoderPanel,
  'Embedded Browser': EmbeddedBrowserPanel,
  Extensions: ExtensionsPanel
};

const moduleIcons = {
  Dashboard: FiHome,
  Proxy: FiShield,
  History: FiClock,
  Repeater: FiRepeat,
  Intruder: FiCrosshair,
  Target: FiMap,
  Scanner: FiSearch,
  OOB: FiRadio,
  Sequencer: FiBarChart2,
  Decoder: FiCode,
  'Embedded Browser': FiMonitor,
  Extensions: FiPackage
};

function formatMemoryUsageMb() {
  if (typeof performance !== 'undefined' && performance.memory && performance.memory.usedJSHeapSize) {
    return `${Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))} MB`;
  }
  if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
    return `~${navigator.deviceMemory} GB device`;
  }
  return 'n/a';
}

function App() {
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [openPanes, setOpenPanes] = React.useState(['Dashboard', 'Proxy']);
  const [activePane, setActivePane] = React.useState('Dashboard');
  const [proxyRunning, setProxyRunning] = React.useState(true);
  const [panelStatus, setPanelStatus] = React.useState(defaultPanelStatus);
  const [contextCollapsed, setContextCollapsed] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [commandQuery, setCommandQuery] = React.useState('');
  const [memoryUsage, setMemoryUsage] = React.useState(formatMemoryUsageMb());
  const contextToggleButtonRef = React.useRef(null);
  const contextRailContentRef = React.useRef(null);
  const quickActionButtonRefs = React.useRef([]);
  const contextRailScrollTopRef = React.useRef(0);
  const lastQuickActionIndexRef = React.useRef(-1);
  const previousContextCollapsedRef = React.useRef(false);

  const versions = (window.electronInfo && window.electronInfo.versions) || {};

  const addPane = React.useCallback((moduleName) => {
    setOpenPanes((prev) => {
      if (prev.includes(moduleName)) {
        return prev;
      }
      return [...prev, moduleName];
    });
    setActivePane(moduleName);
  }, []);

  const closePane = React.useCallback((moduleName) => {
    setOpenPanes((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      const next = prev.filter((pane) => pane !== moduleName);
      if (activePane === moduleName) {
        setActivePane(next[next.length - 1]);
      }
      return next;
    });
  }, [activePane]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    const handleNavigate = (event) => {
      const moduleName = event && event.detail ? event.detail.moduleName : '';
      if (moduleName && modules.includes(moduleName)) {
        addPane(moduleName);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('sentinel:navigate-module', handleNavigate);

    const timer = window.setInterval(() => {
      setMemoryUsage(formatMemoryUsageMb());
    }, 2000);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('sentinel:navigate-module', handleNavigate);
      window.clearInterval(timer);
    };
  }, [addPane]);

  const filteredCommands = modules.filter((moduleName) => {
    const query = String(commandQuery || '').trim().toLowerCase();
    if (!query) {
      return true;
    }
    return moduleName.toLowerCase().includes(query) || String(moduleDescriptions[moduleName] || '').toLowerCase().includes(query);
  });

  const contextQuickActions = React.useMemo(() => ([
    {
      id: 'open-command-palette',
      label: 'Open Command Palette',
      description: 'Search modules and commands instantly.',
      run: () => setCommandPaletteOpen(true)
    },
    {
      id: 'jump-proxy',
      label: 'Jump to Proxy',
      description: 'Review intercept queue and routing state.',
      run: () => addPane('Proxy')
    },
    {
      id: 'jump-history',
      label: 'Jump to History',
      description: 'Inspect captured traffic and replay handoff.',
      run: () => addPane('History')
    },
    {
      id: 'jump-scanner',
      label: 'Jump to Scanner',
      description: 'Review active scans and finding severity.',
      run: () => addPane('Scanner')
    },
    {
      id: 'toggle-engine',
      label: proxyRunning ? 'Pause Engine' : 'Resume Engine',
      description: 'Toggle proxy runtime without leaving the workspace.',
      run: () => setProxyRunning((prev) => !prev)
    }
  ]), [addPane, proxyRunning]);

  const focusQuickAction = React.useCallback((index) => {
    const total = contextQuickActions.length;
    if (!total) {
      return;
    }
    const wrapped = (index + total) % total;
    const target = quickActionButtonRefs.current[wrapped];
    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }, [contextQuickActions.length]);

  const handleQuickActionKeyDown = React.useCallback((event, index) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusQuickAction(index + 1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusQuickAction(index - 1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusQuickAction(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusQuickAction(contextQuickActions.length - 1);
    }
  }, [contextQuickActions.length, focusQuickAction]);

  React.useEffect(() => {
    const wasCollapsed = previousContextCollapsedRef.current;

    if (!wasCollapsed && contextCollapsed) {
      if (contextRailContentRef.current) {
        contextRailScrollTopRef.current = contextRailContentRef.current.scrollTop;
      }
      const activeElement = typeof document !== 'undefined' ? document.activeElement : null;
      if (
        activeElement &&
        contextRailContentRef.current &&
        contextRailContentRef.current.contains(activeElement) &&
        contextToggleButtonRef.current
      ) {
        contextToggleButtonRef.current.focus();
      }
    }

    if (wasCollapsed && !contextCollapsed) {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          if (contextRailContentRef.current) {
            contextRailContentRef.current.scrollTop = contextRailScrollTopRef.current;
          }
          const index = lastQuickActionIndexRef.current;
          if (index >= 0 && quickActionButtonRefs.current[index]) {
            quickActionButtonRefs.current[index].focus();
          }
        });
      }
    }

    previousContextCollapsedRef.current = contextCollapsed;
  }, [contextCollapsed]);

  const ActivePanel = modulePanels[activePane] || DashboardShell;

  return (
    <Flex h='100vh' overflow='hidden' bg='bg.canvas' color='fg.default' direction='row'>

      {/* Left Activity Bar */}
      <VStack
        w={sidebarExpanded ? '220px' : '60px'}
        minW={sidebarExpanded ? '220px' : '60px'}
        bg='bg.elevated'
        borderRightWidth='1px'
        borderColor='border.default'
        py='3'
        gap='1'
        align='stretch'
        overflowY='auto'
        overflowX='hidden'
        transition='width 0.2s ease, min-width 0.2s ease'
      >
        <Button
          size='sm'
          variant='ghost'
          mx={sidebarExpanded ? '2' : '0'}
          minW='0'
          h='40px'
          justifyContent={sidebarExpanded ? 'flex-start' : 'center'}
          onClick={() => setSidebarExpanded((prev) => !prev)}
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <HStack gap='2' w='100%' justify={sidebarExpanded ? 'flex-start' : 'center'}>
            {sidebarExpanded ? <FiChevronsLeft size={16} /> : <FiChevronsRight size={16} />}
            {sidebarExpanded ? <Text fontSize='sm'>Modules</Text> : null}
          </HStack>
        </Button>
        {modules.map((moduleName) => {
          const IconComp = moduleIcons[moduleName] || FiPackage;
          const isActive = activePane === moduleName;
          return (
            <Box key={moduleName} position='relative' mx={sidebarExpanded ? '2' : '0'}>
              <Button
                size='sm'
                variant={isActive ? 'solid' : 'ghost'}
                w={sidebarExpanded ? '100%' : '44px'}
                h='44px'
                px={sidebarExpanded ? '3' : '0'}
                minW='0'
                onClick={() => addPane(moduleName)}
                aria-label={moduleName}
                title={`${moduleName}: ${moduleDescriptions[moduleName] || ''}`}
                borderRadius='md'
                justifyContent={sidebarExpanded ? 'flex-start' : 'center'}
              >
                <HStack gap='2'>
                  <IconComp size={18} />
                  {sidebarExpanded ? <Text fontSize='sm'>{moduleName}</Text> : null}
                </HStack>
              </Button>
              {moduleName === 'Proxy' ? (
                <Box
                  position='absolute'
                  top='6px'
                  right={sidebarExpanded ? '8px' : '4px'}
                  w='7px'
                  h='7px'
                  borderRadius='full'
                  bg={proxyRunning ? 'green.400' : 'orange.400'}
                  pointerEvents='none'
                />
              ) : null}
            </Box>
          );
        })}
      </VStack>

      {/* Main content column */}
      <Flex flex='1' direction='column' overflow='hidden'>
        <Box borderBottomWidth='1px' borderColor='border.default' bg='bg.elevated'>
          <Flex px='4' py='3' justify='space-between' align='center' gap='4'>
            <Box>
              <Heading size='sm'>Sentinel Workspace</Heading>
              <Text fontSize='sm' color='fg.muted'>Workbench shell for concurrent security workflows.</Text>
            </Box>
            <HStack gap='3' wrap='wrap' justify='flex-end'>
              <Badge colorPalette={proxyRunning ? 'green' : 'orange'}>
                Proxy {proxyRunning ? 'running' : 'paused'}
              </Badge>
              <Text fontSize='xs' color='fg.muted'>Project <Code>sentinel-dev</Code></Text>
              <Text fontSize='xs' color='fg.muted'>Electron <Code>{versions.electron || 'unknown'}</Code></Text>
              <Button size='xs' variant='outline' onClick={() => setProxyRunning((prev) => !prev)}>
                {proxyRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button size='xs' variant='outline' onClick={() => setCommandPaletteOpen(true)} title='Command palette'>
                Ctrl+K
              </Button>
            </HStack>
          </Flex>
        </Box>

        <Flex flex='1' direction='column' overflow='hidden'>
          <Flex px='3' py='2' align='center' gap='2' borderBottomWidth='1px' borderColor='border.default' bg='bg.panel'>
            <HStack gap='2' flex='1' overflowX='auto'>
              {openPanes.map((pane) => (
                <HStack key={pane} gap='1' flex='0 0 auto'>
                  <Button
                    size='sm'
                    variant={activePane === pane ? 'solid' : 'outline'}
                    onClick={() => setActivePane(pane)}
                  >
                    {pane}
                  </Button>
                  {openPanes.length > 1 ? (
                    <Button size='xs' variant='ghost' aria-label={`Close ${pane} pane`} onClick={() => closePane(pane)}>
                      ×
                    </Button>
                  ) : null}
                </HStack>
              ))}
            </HStack>
            <Button ref={contextToggleButtonRef} size='xs' variant='outline' onClick={() => setContextCollapsed((prev) => !prev)}>
              {contextCollapsed ? 'Show Context' : 'Hide Context'}
            </Button>
          </Flex>

          <Flex flex='1' overflow='hidden' p='3' gap='3'>
            <Box flex='1' minW='0' h='100%' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.surface' overflow='hidden'>
              <ActivePanel />
            </Box>

            <Box
              w={contextCollapsed ? '0px' : '320px'}
              minW={contextCollapsed ? '0px' : '320px'}
              opacity={contextCollapsed ? 0 : 1}
              transform={contextCollapsed ? 'translateX(20px)' : 'translateX(0px)'}
              transition='width 0.22s ease, min-width 0.22s ease, opacity 0.22s ease, transform 0.22s ease'
              overflow='hidden'
              pointerEvents={contextCollapsed ? 'none' : 'auto'}
              aria-hidden={contextCollapsed}
            >
              <VStack ref={contextRailContentRef} w='320px' minW='320px' align='stretch' gap='3' overflowY='auto' overflowX='hidden' pr='1'>
                <Box p='4' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.panel'>
                  <Text fontWeight='semibold' mb='2'>Active Context</Text>
                  <Text fontSize='sm' mb='2'>Pane <Code>{activePane}</Code></Text>
                  {(panelStatusFields[activePane] || []).map((field) => (
                    <Text key={field.key} fontSize='sm' fontFamily='mono'>
                      {field.label}: <Code>{String((panelStatus[activePane] || {})[field.key] ?? '\u2014')}</Code>
                    </Text>
                  ))}
                </Box>
                <Box p='4' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.panel'>
                  <Text fontWeight='semibold' mb='2'>Quick Actions</Text>
                  <Stack gap='2'>
                    {contextQuickActions.map((action, index) => (
                      <Button
                        key={action.id}
                        ref={(node) => {
                          quickActionButtonRefs.current[index] = node;
                        }}
                        size='sm'
                        justifyContent='flex-start'
                        variant='ghost'
                        onClick={action.run}
                        onFocus={() => {
                          lastQuickActionIndexRef.current = index;
                        }}
                        onKeyDown={(event) => handleQuickActionKeyDown(event, index)}
                      >
                        <Box textAlign='left'>
                          <Text fontSize='sm'>{action.label}</Text>
                          <Text fontSize='xs' color='fg.muted'>{action.description}</Text>
                        </Box>
                      </Button>
                    ))}
                  </Stack>
                </Box>
              </VStack>
            </Box>
          </Flex>

          <Flex px='3' py='2' borderTopWidth='1px' borderColor='border.default' bg='bg.elevated' justify='space-between' align='center' fontSize='xs' fontFamily='mono'>
            <HStack gap='3'>
              <Text>Engine <Code>{proxyRunning ? 'running' : 'paused'}</Code></Text>
              <Text>Tabs <Code>{openPanes.length}</Code></Text>
              <Text>Scope <Code>in-scope-only</Code></Text>
            </HStack>
            <HStack gap='3'>
              <Text>Memory <Code>{memoryUsage}</Code></Text>
              <Text>Node <Code>{versions.node || 'unknown'}</Code></Text>
              <Text>Electron <Code>{versions.electron || 'unknown'}</Code></Text>
            </HStack>
          </Flex>
        </Flex>
      </Flex>

      {commandPaletteOpen ? (
        <Flex position='fixed' inset='0' bg='rgba(5, 10, 16, 0.65)' align='flex-start' justify='center' pt='16' zIndex='1000' role='presentation'>
          <Box
            w='560px'
            maxW='calc(100vw - 32px)'
            borderWidth='1px'
            borderColor='border.default'
            borderRadius='sm'
            bg='bg.panel'
            p='3'
            role='dialog'
            aria-modal='true'
            aria-label='Command palette'
          >
            <Input
              autoFocus
              placeholder='Jump to module...'
              aria-label='Search modules'
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              mb='3'
            />
            <Stack gap='2' maxH='320px' overflowY='auto'>
              {filteredCommands.map((moduleName) => (
                <Button
                  key={moduleName}
                  justifyContent='flex-start'
                  variant='ghost'
                  onClick={() => {
                    addPane(moduleName);
                    setCommandQuery('');
                    setCommandPaletteOpen(false);
                  }}
                >
                  <Box textAlign='left'>
                    <Text>{moduleName}</Text>
                    <Text fontSize='xs' color='fg.muted'>{moduleDescriptions[moduleName]}</Text>
                  </Box>
                </Button>
              ))}
              {filteredCommands.length === 0 ? (
                <Text fontSize='sm' color='fg.muted'>No modules matched your search.</Text>
              ) : null}
            </Stack>
          </Box>
        </Flex>
      ) : null}
    </Flex>
  );
}

module.exports = App;
