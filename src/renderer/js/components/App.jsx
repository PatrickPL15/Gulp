const React = require('react');
const {
  Badge,
  Box,
  Button,
  Code,
  Container,
  Separator,
  Grid,
  HStack,
  Heading,
  Text,
  Wrap,
  VStack
} = require('@chakra-ui/react');
const DashboardShell = require('./sentinel/DashboardShell');
const ProxyPanel = require('./sentinel/ProxyPanel');
const HistoryPanel = require('./sentinel/HistoryPanel');
const RepeaterPanel = require('./sentinel/RepeaterPanel');
const IntruderPanel = require('./sentinel/IntruderPanel');
const TargetMapPanel = require('./sentinel/TargetMapPanel');
const ScannerPanel = require('./sentinel/ScannerPanel');
const DecoderPanel = require('./sentinel/DecoderPanel');
const ExtensionsPanel = require('./sentinel/ExtensionsPanel');

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
  Decoder: [
    { label: 'Encoding chain', key: 'encodingType' },
    { label: 'Chain steps', key: 'chainLength' }
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
  Decoder: { encodingType: 'URL', chainLength: 1 },
  Extensions: { loadedCount: 0, activeCount: 0 }
};

const modules = [
  'Dashboard',
  'Proxy',
  'History',
  'Repeater',
  'Intruder',
  'Target',
  'Scanner',
  'Decoder',
  'Extensions'
];

const moduleDescriptions = {
  Dashboard: 'Program overview, findings summary, and workflow shortcuts.',
  Proxy: 'Intercept, inspect, and forward HTTP/S traffic.',
  History: 'Search and filter previously captured traffic.',
  Repeater: 'Modify and replay requests for manual testing.',
  Intruder: 'Run payload attacks with baseline anomaly analysis.',
  Target: 'Manage scope and navigate discovered surface area.',
  Scanner: 'Run passive/active checks and review findings.',
  Decoder: 'Encode/decode payloads and inspect transformed values.',
  Extensions: 'Manage custom tools and extension-provided workflows.'
};

const modulePanels = {
  Dashboard: DashboardShell,
  Proxy: ProxyPanel,
  History: HistoryPanel,
  Repeater: RepeaterPanel,
  Intruder: IntruderPanel,
  Target: TargetMapPanel,
  Scanner: ScannerPanel,
  Decoder: DecoderPanel,
  Extensions: ExtensionsPanel
};

function App() {
  const [activeModule, setActiveModule] = React.useState('Dashboard');
  const [openPanes, setOpenPanes] = React.useState(['Dashboard', 'Proxy']);
  const [activePane, setActivePane] = React.useState('Dashboard');
  const [proxyRunning, setProxyRunning] = React.useState(true);
  const [panelStatus, setPanelStatus] = React.useState(defaultPanelStatus);

  const versions = (window.electronInfo && window.electronInfo.versions) || {};

  const addPane = (moduleName) => {
    setActiveModule(moduleName);
    setOpenPanes((prev) => {
      if (prev.includes(moduleName)) {
        return prev;
      }
      return [...prev, moduleName];
    });
    setActivePane(moduleName);
  };

  const closePane = (moduleName) => {
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
  };

  return (
    <Container maxW='7xl' py={{ base: 8, md: 10 }}>
      <VStack
        align='stretch'
        spacing={5}
        p={{ base: 5, md: 6 }}
        borderWidth='1px'
        borderRadius='xl'
        bg='bg.panel'
      >
        <HStack justify='space-between' align='flex-start' wrap='wrap' gap={3}>
          <VStack align='start' spacing={1}>
            <Heading size='lg'>Sentinel Workspace</Heading>
            <Text color='fg.muted'>
              Multi-module security workflow shell with shared status indicators.
            </Text>
          </VStack>
          <HStack gap={2} align='center'>
            <Badge colorPalette={proxyRunning ? 'green' : 'orange'}>
              Proxy: {proxyRunning ? 'Running' : 'Paused'}
            </Badge>
            <Badge colorPalette='blue'>Project: sentinel-dev</Badge>
            <Badge colorPalette='purple'>Scope: in-scope-only</Badge>
            <Button
              size='xs'
              variant='outline'
              onClick={() => setProxyRunning((prev) => !prev)}
            >
              {proxyRunning ? 'Pause Proxy' : 'Resume Proxy'}
            </Button>
          </HStack>
        </HStack>

        <Box
          p={3}
          borderWidth='1px'
          borderRadius='md'
          bg='bg.subtle'
        >
          <Wrap gap={3} fontSize='sm'>
            <Text>Node.js: <Code>{versions.node || 'unknown'}</Code></Text>
            <Text>Chromium: <Code>{versions.chrome || 'unknown'}</Code></Text>
            <Text>Electron: <Code>{versions.electron || 'unknown'}</Code></Text>
          </Wrap>
        </Box>

        <Separator />

        <VStack align='stretch' spacing={3}>
          <Text fontWeight='semibold'>Modules</Text>
          <Wrap gap={2}>
            {modules.map((moduleName) => (
              <Button
                key={moduleName}
                size='sm'
                variant={activeModule === moduleName ? 'solid' : 'outline'}
                onClick={() => addPane(moduleName)}
              >
                {moduleName}
              </Button>
            ))}
          </Wrap>
        </VStack>

        <VStack align='stretch' spacing={3}>
          <Text fontWeight='semibold'>Workspace Panes</Text>
          <Wrap gap={2}>
            {openPanes.map((pane) => (
              <HStack key={pane} gap={1}>
                <Button
                  size='sm'
                  variant={activePane === pane ? 'solid' : 'subtle'}
                  onClick={() => setActivePane(pane)}
                >
                  {pane}
                </Button>
                {openPanes.length > 1 ? (
                  <Button
                    size='xs'
                    variant='ghost'
                    aria-label={`Close ${pane} pane`}
                    onClick={() => closePane(pane)}
                  >
                    x
                  </Button>
                ) : null}
              </HStack>
            ))}
          </Wrap>
        </VStack>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4}>
          <VStack align='stretch' spacing={3}>
            <Heading size='md'>{activePane}</Heading>
            <Text color='fg.muted'>
              {moduleDescriptions[activePane] || 'Module panel is pending implementation.'}
            </Text>
            {React.createElement(modulePanels[activePane] || DashboardShell)}
          </VStack>

          <VStack align='stretch' spacing={3}>
            <Box p={4} borderWidth='1px' borderRadius='md'>
              <Text fontWeight='semibold' mb={2}>Active Context</Text>
              <Text fontSize='sm' mb={2}>Active pane: <Code>{activePane}</Code></Text>
              {(panelStatusFields[activePane] || []).map((field) => (
                <Text key={field.key} fontSize='sm'>
                  {field.label}:{' '}
                  <Code>{String((panelStatus[activePane] || {})[field.key] ?? '\u2014')}</Code>
                </Text>
              ))}
            </Box>
            <Box p={4} borderWidth='1px' borderRadius='md'>
              <Text fontWeight='semibold' mb={2}>Planned Integrations</Text>
              <Text fontSize='sm'>- Burp project configuration import</Text>
              <Text fontSize='sm'>- HackerOne CSV scope ingestion</Text>
              <Text fontSize='sm'>- Custom-script action automation</Text>
            </Box>
          </VStack>
        </Grid>
      </VStack>
    </Container>
  );
}

module.exports = App;
