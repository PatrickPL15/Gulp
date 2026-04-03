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
  FiSettings,
  FiChevronsLeft,
  FiChevronsRight,
  FiChevronRight
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
const { getOverlayScrim } = require('./sentinel/theme-utils');
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

const lightThemeOptions = [
  {
    id: 'light-paper',
    label: 'Paper Grid',
    colors: {
      bgCanvas: '#f4f7fb',
      bgPanel: '#ffffff',
      bgSurface: '#edf2f8',
      bgSubtle: '#e4ebf4',
      bgElevated: '#e8eef6',
      fgDefault: '#16212e',
      fgMuted: '#33465c',
      borderDefault: '#91a5bb',
      borderSubtle: '#7f96ae'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 550,
      letterSpacing: '0.01em'
    }
  },
  {
    id: 'light-ivory',
    label: 'Ivory Ledger',
    colors: {
      bgCanvas: '#f8f5ee',
      bgPanel: '#fffdf7',
      bgSurface: '#f1ebdf',
      bgSubtle: '#e8dfcf',
      bgElevated: '#f4efe4',
      fgDefault: '#211a12',
      fgMuted: '#4a3d30',
      borderDefault: '#b49d82',
      borderSubtle: '#9f8568'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 560,
      letterSpacing: '0.008em'
    }
  },
  {
    id: 'light-cloud',
    label: 'Cloud Console',
    colors: {
      bgCanvas: '#f1f4f8',
      bgPanel: '#fdfefe',
      bgSurface: '#e8eef5',
      bgSubtle: '#dce5f0',
      bgElevated: '#e4ebf3',
      fgDefault: '#11263b',
      fgMuted: '#314d68',
      borderDefault: '#89a6c5',
      borderSubtle: '#7696b8'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 550,
      letterSpacing: '0.012em'
    }
  },
  {
    id: 'light-terminal',
    label: 'Terminal Daylight',
    colors: {
      bgCanvas: '#f6f8fa',
      bgPanel: '#ffffff',
      bgSurface: '#eef2f6',
      bgSubtle: '#e3e9f0',
      bgElevated: '#e8eef4',
      fgDefault: '#0f202f',
      fgMuted: '#30495f',
      borderDefault: '#8fa5bd',
      borderSubtle: '#7a92ac'
    },
    text: {
      fontFamily: "'IBM Plex Mono', 'Consolas', 'Courier New', monospace",
      fontWeight: 500,
      letterSpacing: '0.004em'
    }
  },
  {
    id: 'light-lab',
    label: 'Lab Neutral',
    colors: {
      bgCanvas: '#f3f3f3',
      bgPanel: '#fcfcfc',
      bgSurface: '#ebebeb',
      bgSubtle: '#dfdfdf',
      bgElevated: '#e6e6e6',
      fgDefault: '#1a1d22',
      fgMuted: '#3d4652',
      borderDefault: '#98a5b4',
      borderSubtle: '#8493a4'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 560,
      letterSpacing: '0.01em'
    }
  }
];

const darkThemeOptions = [
  {
    id: 'dark-steel',
    label: 'Steel Midnight',
    colors: {
      bgCanvas: '#0e141c',
      bgPanel: '#111821',
      bgSurface: '#1a2531',
      bgSubtle: '#202d3a',
      bgElevated: '#0b1118',
      fgDefault: '#edf2f7',
      fgMuted: '#d1dbe6',
      borderDefault: '#3a4f63',
      borderSubtle: '#4a627a'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 520,
      letterSpacing: '0.008em'
    }
  },
  {
    id: 'dark-carbon',
    label: 'Carbon Audit',
    colors: {
      bgCanvas: '#111114',
      bgPanel: '#18191d',
      bgSurface: '#1f2127',
      bgSubtle: '#272b32',
      bgElevated: '#141519',
      fgDefault: '#f4f6fb',
      fgMuted: '#d5dde8',
      borderDefault: '#4a5567',
      borderSubtle: '#5b687d'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 530,
      letterSpacing: '0.01em'
    }
  },
  {
    id: 'dark-ink',
    label: 'Ink Protocol',
    colors: {
      bgCanvas: '#0b1020',
      bgPanel: '#121a2f',
      bgSurface: '#1b2640',
      bgSubtle: '#253353',
      bgElevated: '#090e1a',
      fgDefault: '#ebf1ff',
      fgMuted: '#d0dcfa',
      borderDefault: '#46608f',
      borderSubtle: '#5774a6'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 520,
      letterSpacing: '0.012em'
    }
  },
  {
    id: 'dark-graphite',
    label: 'Graphite Ops',
    colors: {
      bgCanvas: '#13171f',
      bgPanel: '#1a2029',
      bgSurface: '#222b38',
      bgSubtle: '#2b3644',
      bgElevated: '#10141b',
      fgDefault: '#f1f5fd',
      fgMuted: '#d0dae8',
      borderDefault: '#4a5f77',
      borderSubtle: '#5a718c'
    },
    text: {
      fontFamily: "'IBM Plex Mono', 'Consolas', 'Courier New', monospace",
      fontWeight: 500,
      letterSpacing: '0.005em'
    }
  },
  {
    id: 'dark-emerald',
    label: 'Emerald Night',
    colors: {
      bgCanvas: '#0a1413',
      bgPanel: '#12201d',
      bgSurface: '#18302b',
      bgSubtle: '#1d3c35',
      bgElevated: '#09110f',
      fgDefault: '#e9fff8',
      fgMuted: '#c6efe3',
      borderDefault: '#3f7a6b',
      borderSubtle: '#4e8f7e'
    },
    text: {
      fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontWeight: 530,
      letterSpacing: '0.01em'
    }
  }
];

const allThemeOptions = [...lightThemeOptions, ...darkThemeOptions];
const themeOptionsById = allThemeOptions.reduce((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {});

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
  const [sidebarExpanded, setSidebarExpanded] = React.useState(true);
  const [openPanes, setOpenPanes] = React.useState(['Dashboard', 'Proxy']);
  const [activePane, setActivePane] = React.useState('Dashboard');
  const [proxyRunning, setProxyRunning] = React.useState(true);
  const [panelStatus, setPanelStatus] = React.useState(defaultPanelStatus);
  const [contextCollapsed, setContextCollapsed] = React.useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [settingsMenuOpen, setSettingsMenuOpen] = React.useState(false);
  const [preferencesMenuOpen, setPreferencesMenuOpen] = React.useState(false);
  const [commandQuery, setCommandQuery] = React.useState('');
  const [memoryUsage, setMemoryUsage] = React.useState(formatMemoryUsageMb());
  const [selectedThemeId, setSelectedThemeId] = React.useState('dark-steel');
  const contextToggleButtonRef = React.useRef(null);
  const contextRailContentRef = React.useRef(null);
  const quickActionButtonRefs = React.useRef([]);
  const settingsMenuRef = React.useRef(null);
  const settingsTriggerRef = React.useRef(null);
  const contextRailScrollTopRef = React.useRef(0);
  const lastQuickActionIndexRef = React.useRef(-1);
  const previousContextCollapsedRef = React.useRef(false);

  const versions = (window.electronInfo && window.electronInfo.versions) || {};
  const selectedTheme = themeOptionsById[selectedThemeId] || darkThemeOptions[0];

  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.documentElement) {
      return;
    }

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--sentinel-bg-canvas', selectedTheme.colors.bgCanvas);
    rootStyle.setProperty('--sentinel-bg-panel', selectedTheme.colors.bgPanel);
    rootStyle.setProperty('--sentinel-bg-surface', selectedTheme.colors.bgSurface);
    rootStyle.setProperty('--sentinel-bg-subtle', selectedTheme.colors.bgSubtle);
    rootStyle.setProperty('--sentinel-bg-elevated', selectedTheme.colors.bgElevated);
    rootStyle.setProperty('--sentinel-fg-default', selectedTheme.colors.fgDefault);
    rootStyle.setProperty('--sentinel-fg-muted', selectedTheme.colors.fgMuted);
    rootStyle.setProperty('--sentinel-border-default', selectedTheme.colors.borderDefault);
    rootStyle.setProperty('--sentinel-border-subtle', selectedTheme.colors.borderSubtle);
    document.documentElement.setAttribute('data-sentinel-theme-id', selectedThemeId);
  }, [selectedTheme, selectedThemeId]);

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

  React.useEffect(() => {
    if (!settingsMenuOpen) {
      setPreferencesMenuOpen(false);
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!settingsMenuRef.current) {
        return;
      }
      if (settingsMenuRef.current.contains(event.target)) {
        return;
      }
      if (settingsTriggerRef.current && settingsTriggerRef.current.contains(event.target)) {
        return;
      }
      setSettingsMenuOpen(false);
      setPreferencesMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSettingsMenuOpen(false);
        setPreferencesMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [settingsMenuOpen]);

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
    <Flex
      h='100vh'
      overflow='hidden'
      bg='bg.canvas'
      color='fg.default'
      direction='row'
      fontFamily={selectedTheme.text.fontFamily}
      fontWeight={selectedTheme.text.fontWeight}
      letterSpacing={selectedTheme.text.letterSpacing}
      style={{
        '--sentinel-bg-canvas': selectedTheme.colors.bgCanvas,
        '--sentinel-bg-panel': selectedTheme.colors.bgPanel,
        '--sentinel-bg-surface': selectedTheme.colors.bgSurface,
        '--sentinel-bg-subtle': selectedTheme.colors.bgSubtle,
        '--sentinel-bg-elevated': selectedTheme.colors.bgElevated,
        '--sentinel-fg-default': selectedTheme.colors.fgDefault,
        '--sentinel-fg-muted': selectedTheme.colors.fgMuted,
        '--sentinel-border-default': selectedTheme.colors.borderDefault,
        '--sentinel-border-subtle': selectedTheme.colors.borderSubtle
      }}
    >

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
          color='fg.default'
          _hover={{ bg: 'bg.subtle', color: 'fg.default' }}
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
                color={isActive ? 'white' : 'fg.default'}
                bg={isActive ? 'brand.600' : 'transparent'}
                _hover={{
                  bg: isActive ? 'brand.500' : 'bg.subtle',
                  color: isActive ? 'white' : 'fg.default'
                }}
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
              <Text fontSize='sm' color='fg.default'>Workbench shell for concurrent security workflows.</Text>
            </Box>
            <HStack gap='3' wrap='wrap' justify='flex-end'>
              <Badge colorPalette={proxyRunning ? 'green' : 'orange'}>
                Proxy {proxyRunning ? 'running' : 'paused'}
              </Badge>
              <Text fontSize='xs' color={selectedTheme.colors.fgDefault}>Theme <Code color={selectedTheme.colors.fgDefault} bg={selectedTheme.colors.bgSurface} borderWidth='1px' borderColor={selectedTheme.colors.borderDefault}>{selectedTheme.label}</Code></Text>
              <Text fontSize='xs' color={selectedTheme.colors.fgDefault}>Project <Code color={selectedTheme.colors.fgDefault} bg={selectedTheme.colors.bgSurface} borderWidth='1px' borderColor={selectedTheme.colors.borderDefault}>sentinel-dev</Code></Text>
              <Text fontSize='xs' color={selectedTheme.colors.fgDefault}>Electron <Code color={selectedTheme.colors.fgDefault} bg={selectedTheme.colors.bgSurface} borderWidth='1px' borderColor={selectedTheme.colors.borderDefault}>{versions.electron || 'unknown'}</Code></Text>
              <Box position='relative'>
                <Button
                  ref={settingsTriggerRef}
                  size='xs'
                  variant='outline'
                  color={selectedTheme.colors.fgDefault}
                  bg={selectedTheme.colors.bgPanel}
                  borderColor={selectedTheme.colors.borderDefault}
                  _hover={{
                    bg: selectedTheme.colors.bgSubtle,
                    color: selectedTheme.colors.fgDefault,
                    borderColor: selectedTheme.colors.borderSubtle
                  }}
                  onClick={() => setSettingsMenuOpen((prev) => !prev)}
                  title='Open settings menu'
                >
                  <HStack gap='1'>
                    <FiSettings size={14} />
                    <Text fontSize='xs'>Settings</Text>
                  </HStack>
                </Button>
                {settingsMenuOpen ? (
                  <Box
                    ref={settingsMenuRef}
                    position='absolute'
                    top='calc(100% + 8px)'
                    right='0'
                    minW='340px'
                    borderWidth='1px'
                    borderColor={selectedTheme.colors.borderDefault}
                    borderRadius='sm'
                    bg={selectedTheme.colors.bgPanel}
                    boxShadow='0 18px 34px rgba(0, 0, 0, 0.35)'
                    p='2'
                    zIndex='1200'
                  >
                    <Button
                      size='sm'
                      variant='ghost'
                      color={selectedTheme.colors.fgDefault}
                      _hover={{ bg: selectedTheme.colors.bgSubtle, color: selectedTheme.colors.fgDefault }}
                      justifyContent='space-between'
                      w='100%'
                      onClick={() => setPreferencesMenuOpen((prev) => !prev)}
                    >
                      <Text fontSize='sm'>Preferences</Text>
                      <FiChevronRight size={14} />
                    </Button>
                    {preferencesMenuOpen ? (
                      <Box mt='2' borderTopWidth='1px' borderColor={selectedTheme.colors.borderSubtle} pt='2'>
                        <Text px='2' pb='2' fontSize='xs' color={selectedTheme.colors.fgDefault} textTransform='uppercase' letterSpacing='wider'>
                          Theme Options
                        </Text>
                        <Stack gap='2'>
                          <Box>
                            <Text px='2' pb='1' fontSize='xs' color={selectedTheme.colors.fgDefault}>Dark Themes</Text>
                            <Stack gap='1'>
                              {darkThemeOptions.map((option) => (
                                <Button
                                  key={option.id}
                                  size='sm'
                                  variant={selectedThemeId === option.id ? 'solid' : 'ghost'}
                                  color={selectedThemeId === option.id ? 'white' : 'fg.default'}
                                  bg={selectedThemeId === option.id ? 'brand.600' : 'transparent'}
                                  _hover={{
                                    bg: selectedThemeId === option.id ? 'brand.500' : 'bg.subtle',
                                    color: selectedThemeId === option.id ? 'white' : 'fg.default'
                                  }}
                                  justifyContent='space-between'
                                  onClick={() => {
                                    setSelectedThemeId(option.id);
                                    setSettingsMenuOpen(false);
                                    setPreferencesMenuOpen(false);
                                  }}
                                >
                                  <Text fontSize='sm'>{option.label}</Text>
                                  <Code
                                    fontSize='xs'
                                    color={selectedThemeId === option.id ? 'white' : selectedTheme.colors.fgDefault}
                                    bg={selectedThemeId === option.id ? 'transparent' : selectedTheme.colors.bgSurface}
                                    borderWidth='1px'
                                    borderColor={selectedThemeId === option.id ? 'transparent' : selectedTheme.colors.borderDefault}
                                  >
                                    {option.id}
                                  </Code>
                                </Button>
                              ))}
                            </Stack>
                          </Box>
                          <Box>
                            <Text px='2' pb='1' fontSize='xs' color={selectedTheme.colors.fgDefault}>Light Themes</Text>
                            <Stack gap='1'>
                              {lightThemeOptions.map((option) => (
                                <Button
                                  key={option.id}
                                  size='sm'
                                  variant={selectedThemeId === option.id ? 'solid' : 'ghost'}
                                  color={selectedThemeId === option.id ? 'white' : 'fg.default'}
                                  bg={selectedThemeId === option.id ? 'brand.600' : 'transparent'}
                                  _hover={{
                                    bg: selectedThemeId === option.id ? 'brand.500' : 'bg.subtle',
                                    color: selectedThemeId === option.id ? 'white' : 'fg.default'
                                  }}
                                  justifyContent='space-between'
                                  onClick={() => {
                                    setSelectedThemeId(option.id);
                                    setSettingsMenuOpen(false);
                                    setPreferencesMenuOpen(false);
                                  }}
                                >
                                  <Text fontSize='sm'>{option.label}</Text>
                                  <Code
                                    fontSize='xs'
                                    color={selectedThemeId === option.id ? 'white' : selectedTheme.colors.fgDefault}
                                    bg={selectedThemeId === option.id ? 'transparent' : selectedTheme.colors.bgSurface}
                                    borderWidth='1px'
                                    borderColor={selectedThemeId === option.id ? 'transparent' : selectedTheme.colors.borderDefault}
                                  >
                                    {option.id}
                                  </Code>
                                </Button>
                              ))}
                            </Stack>
                          </Box>
                        </Stack>
                      </Box>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
              <Button
                size='xs'
                variant='outline'
                color={selectedTheme.colors.fgDefault}
                bg={selectedTheme.colors.bgPanel}
                borderColor={selectedTheme.colors.borderDefault}
                _hover={{
                  bg: selectedTheme.colors.bgSubtle,
                  color: selectedTheme.colors.fgDefault,
                  borderColor: selectedTheme.colors.borderSubtle
                }}
                onClick={() => setProxyRunning((prev) => !prev)}
              >
                {proxyRunning ? 'Pause' : 'Resume'}
              </Button>
              <Button
                size='xs'
                variant='outline'
                color={selectedTheme.colors.fgDefault}
                bg={selectedTheme.colors.bgPanel}
                borderColor={selectedTheme.colors.borderDefault}
                _hover={{
                  bg: selectedTheme.colors.bgSubtle,
                  color: selectedTheme.colors.fgDefault,
                  borderColor: selectedTheme.colors.borderSubtle
                }}
                onClick={() => setCommandPaletteOpen(true)}
                title='Command palette'
              >
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
            <Button
              ref={contextToggleButtonRef}
              size='xs'
              variant='outline'
              color={selectedTheme.colors.fgDefault}
              bg={selectedTheme.colors.bgPanel}
              borderColor={selectedTheme.colors.borderDefault}
              _hover={{
                bg: selectedTheme.colors.bgSubtle,
                color: selectedTheme.colors.fgDefault,
                borderColor: selectedTheme.colors.borderSubtle
              }}
              onClick={() => setContextCollapsed((prev) => !prev)}
            >
              {contextCollapsed ? 'Show Context' : 'Hide Context'}
            </Button>
          </Flex>

          <Flex flex='1' overflow='hidden' p='3' gap='3'>
            <Box flex='1' minW='0' h='100%' borderWidth='1px' borderColor='border.subtle' borderRadius='sm' bg='bg.surface' overflow='hidden'>
              <ActivePanel themeId={selectedThemeId} />
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
                <Box p='4' borderWidth='1px' borderColor={selectedTheme.colors.borderSubtle} borderRadius='sm' bg={selectedTheme.colors.bgPanel}>
                  <Text fontWeight='semibold' mb='2' color={selectedTheme.colors.fgDefault}>Active Context</Text>
                  <Text fontSize='sm' mb='2' color={selectedTheme.colors.fgDefault}>
                    Pane
                    {' '}
                    <Code color={selectedTheme.colors.fgDefault} bg={selectedTheme.colors.bgSurface} borderWidth='1px' borderColor={selectedTheme.colors.borderDefault}>{activePane}</Code>
                  </Text>
                  {(panelStatusFields[activePane] || []).map((field) => (
                    <Text key={field.key} fontSize='sm' fontFamily='mono' color={selectedTheme.colors.fgDefault}>
                      {field.label}:{' '}
                      <Code color={selectedTheme.colors.fgDefault} bg={selectedTheme.colors.bgSurface} borderWidth='1px' borderColor={selectedTheme.colors.borderDefault}>
                        {String((panelStatus[activePane] || {})[field.key] ?? '\u2014')}
                      </Code>
                    </Text>
                  ))}
                </Box>
                <Box p='4' borderWidth='1px' borderColor={selectedTheme.colors.borderSubtle} borderRadius='sm' bg={selectedTheme.colors.bgPanel}>
                  <Text fontWeight='semibold' mb='2' color={selectedTheme.colors.fgDefault}>Quick Actions</Text>
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
                        color={selectedTheme.colors.fgDefault}
                        borderWidth='1px'
                        borderColor={selectedTheme.colors.borderDefault}
                        bg={selectedTheme.colors.bgSurface}
                        _hover={{
                          bg: selectedTheme.colors.bgSubtle,
                          color: selectedTheme.colors.fgDefault,
                          borderColor: selectedTheme.colors.borderSubtle
                        }}
                        onClick={action.run}
                        onFocus={() => {
                          lastQuickActionIndexRef.current = index;
                        }}
                        onKeyDown={(event) => handleQuickActionKeyDown(event, index)}
                      >
                        <Box textAlign='left'>
                          <Text fontSize='sm' color={selectedTheme.colors.fgDefault}>{action.label}</Text>
                          <Text fontSize='xs' color={selectedTheme.colors.fgMuted}>{action.description}</Text>
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
        <Flex position='fixed' inset='0' bg={getOverlayScrim(selectedThemeId)} align='flex-start' justify='center' pt='16' zIndex='1000' role='presentation'>
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
