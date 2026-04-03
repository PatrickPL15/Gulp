const React = require('react');
const {
  Badge,
  Box,
  Button,
  Code,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} = require('@chakra-ui/react');

function flattenTree(nodes = [], depth = 0, rows = []) {
  for (const node of nodes) {
    rows.push({
      id: node.id,
      label: node.label,
      depth,
      inScope: Boolean(node.inScope),
      type: node.type,
    });
    if (Array.isArray(node.children) && node.children.length > 0) {
      flattenTree(node.children, depth + 1, rows);
    }
  }
  return rows;
}

function TargetMapPanel() {
  const [rules, setRules] = React.useState([]);
  const [sitemapRows, setSitemapRows] = React.useState([]);
  const [form, setForm] = React.useState({
    kind: 'include',
    host: '',
    path: '/',
    protocol: '',
    port: '',
    cidr: '',
    ip: '',
  });
  const [csvFormat, setCsvFormat] = React.useState('hackerone');
  const [statusText, setStatusText] = React.useState('');
  const [errorText, setErrorText] = React.useState('');

  const loadScope = React.useCallback(async () => {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.scope) {
      return;
    }
    const payload = await sentinel.scope.get();
    setRules(Array.isArray(payload.rules) ? payload.rules : []);
  }, []);

  const loadSitemap = React.useCallback(async () => {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.target) {
      return;
    }
    const payload = await sentinel.target.sitemap();
    const rows = flattenTree(Array.isArray(payload.tree) ? payload.tree : []);
    setSitemapRows(rows);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadScope(), loadSitemap()]);
      } catch {
        if (!cancelled) {
          setErrorText('Unable to load target map data.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadScope, loadSitemap]);

  async function saveRules(nextRules) {
    const sentinel = window.sentinel;
    if (!sentinel || !sentinel.scope) {
      return;
    }
    await sentinel.scope.set({ rules: nextRules });
    setRules(nextRules);
  }

  async function addRule() {
    setErrorText('');
    setStatusText('');
    try {
      if (!form.host && !form.cidr && !form.ip) {
        throw new Error('Host, CIDR, or IP is required.');
      }

      const nextRules = [...rules, {
        id: `scope-${Date.now()}`,
        kind: form.kind,
        host: form.host || null,
        path: form.path || '/',
        protocol: form.protocol || null,
        port: form.port ? Number(form.port) : null,
        cidr: form.cidr || null,
        ip: form.ip || null,
      }];

      await saveRules(nextRules);
      setForm({ kind: 'include', host: '', path: '/', protocol: '', port: '', cidr: '', ip: '' });
      setStatusText('Scope rule saved.');
      await loadSitemap();
    } catch (error) {
      setErrorText(error && error.message ? error.message : 'Unable to save scope rule.');
    }
  }

  async function removeRule(ruleId) {
    setErrorText('');
    setStatusText('');
    try {
      const nextRules = rules.filter(rule => rule.id !== ruleId);
      await saveRules(nextRules);
      setStatusText('Scope rule removed.');
      await loadSitemap();
    } catch {
      setErrorText('Unable to remove scope rule.');
    }
  }

  async function importBurp() {
    setErrorText('');
    setStatusText('');
    try {
      const sentinel = window.sentinel;
      if (!sentinel || !sentinel.scope) {
        return;
      }
      const result = await sentinel.scope.importBurp({});
      if (!result || result.ok === false) {
        setStatusText('Burp import cancelled.');
        return;
      }
      await loadScope();
      await loadSitemap();
      setStatusText(`Imported ${result.imported || 0} Burp scope entries.`);
    } catch {
      setErrorText('Unable to import Burp scope file.');
    }
  }

  async function importCsv() {
    setErrorText('');
    setStatusText('');
    try {
      const sentinel = window.sentinel;
      if (!sentinel || !sentinel.scope) {
        return;
      }
      const result = await sentinel.scope.importCsv({ format: csvFormat });
      if (!result || result.ok === false) {
        setStatusText('CSV import cancelled.');
        return;
      }
      await loadScope();
      await loadSitemap();
      setStatusText(`Imported ${result.imported || 0} CSV scope entries.`);
    } catch {
      setErrorText('Unable to import CSV scope file.');
    }
  }

  return (
    <Box p='4' borderWidth='1px' borderRadius='md'>
      <VStack align='stretch' spacing={3}>
        <Flex justify='space-between' align='center' pb='3' borderBottomWidth='1px' borderColor='border.default'>
          <Text fontWeight='medium' fontSize='sm'>Target Map</Text>
          <HStack gap='2'>
            <Button size='xs' variant='outline' onClick={loadScope}>Refresh Scope</Button>
          </HStack>
        </Flex>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <Text fontWeight='semibold' mb={2}>Add Scope Rule</Text>
          <VStack align='stretch' spacing={2}>
            <HStack>
              <Button
                size='sm'
                variant={form.kind === 'include' ? 'solid' : 'outline'}
                onClick={() => setForm(prev => ({ ...prev, kind: 'include' }))}
              >
                Include
              </Button>
              <Button
                size='sm'
                variant={form.kind === 'exclude' ? 'solid' : 'outline'}
                onClick={() => setForm(prev => ({ ...prev, kind: 'exclude' }))}
              >
                Exclude
              </Button>
              <Input placeholder='host (example.com)' value={form.host} onChange={event => setForm(prev => ({ ...prev, host: event.target.value }))} />
              <Input placeholder='path (/api)' value={form.path} onChange={event => setForm(prev => ({ ...prev, path: event.target.value }))} />
            </HStack>
            <HStack>
              <Input placeholder='protocol (http/https)' value={form.protocol} onChange={event => setForm(prev => ({ ...prev, protocol: event.target.value }))} />
              <Input placeholder='port (443)' value={form.port} onChange={event => setForm(prev => ({ ...prev, port: event.target.value }))} />
              <Input placeholder='cidr (10.0.0.0/24)' value={form.cidr} onChange={event => setForm(prev => ({ ...prev, cidr: event.target.value }))} />
              <Input placeholder='ip (192.168.1.15)' value={form.ip} onChange={event => setForm(prev => ({ ...prev, ip: event.target.value }))} />
              <Button size='sm' onClick={addRule}>Add</Button>
            </HStack>
          </VStack>
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <Text fontWeight='semibold' mb={2}>Import Scope Rules</Text>
          <VStack align='stretch' spacing={2}>
            <HStack>
              <Text fontSize='sm' color='fg.muted' flex='1'>Choose a Burp XML/JSON file in the system file picker.</Text>
              <Button size='sm' variant='outline' onClick={importBurp}>Import Burp</Button>
            </HStack>
            <HStack>
              <Text fontSize='sm' color='fg.muted' flex='1'>Choose a CSV file in the system file picker.</Text>
              <Button
                size='sm'
                variant={csvFormat === 'hackerone' ? 'solid' : 'outline'}
                onClick={() => setCsvFormat('hackerone')}
              >
                HackerOne
              </Button>
              <Button
                size='sm'
                variant={csvFormat === 'generic' ? 'solid' : 'outline'}
                onClick={() => setCsvFormat('generic')}
              >
                Generic
              </Button>
              <Button size='sm' variant='outline' onClick={importCsv}>Import CSV</Button>
            </HStack>
          </VStack>
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <HStack justify='space-between' mb={2}>
            <Text fontWeight='semibold'>Scope Rules</Text>
            <Code>{rules.length} rules</Code>
          </HStack>
          {rules.length === 0 ? (
            <Text fontSize='sm' color='fg.muted'>No scope rules configured.</Text>
          ) : rules.map(rule => (
            <HStack key={rule.id} justify='space-between' borderWidth='1px' borderRadius='md' p={2} mb={2}>
              <HStack>
                <Badge colorPalette={rule.kind === 'include' ? 'green' : 'red'}>{rule.kind}</Badge>
                <Text fontSize='sm'>
                  {rule.host || rule.ip || rule.cidr || 'unknown'}
                  {rule.path ? ` ${rule.path}` : ''}
                </Text>
              </HStack>
              <Button size='xs' variant='ghost' onClick={() => removeRule(rule.id)}>Remove</Button>
            </HStack>
          ))}
        </Box>

        <Box borderWidth='1px' borderRadius='md' p={3}>
          <HStack justify='space-between' mb={2}>
            <Text fontWeight='semibold'>Site Map</Text>
            <Button size='xs' variant='outline' onClick={loadSitemap}>Refresh</Button>
          </HStack>
          {sitemapRows.length === 0 ? (
            <Text fontSize='sm' color='fg.muted'>No observed traffic yet.</Text>
          ) : sitemapRows.map(row => (
            <HStack key={row.id} pl={`${row.depth * 16}px`} spacing={2}>
              <Badge colorPalette={row.inScope ? 'green' : 'orange'}>
                {row.inScope ? 'in-scope' : 'out-of-scope'}
              </Badge>
              <Text fontSize='sm'>{row.type === 'host' ? row.label : `/${row.label}`}</Text>
            </HStack>
          ))}
        </Box>

        {statusText ? <Text color='green.300' fontSize='sm'>{statusText}</Text> : null}
        {errorText ? <Text color='red.300' fontSize='sm'>{errorText}</Text> : null}
      </VStack>
    </Box>
  );
}

module.exports = TargetMapPanel;
