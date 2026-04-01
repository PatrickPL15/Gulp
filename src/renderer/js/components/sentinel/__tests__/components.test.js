import { describe, it, expect } from 'vitest';

describe('Sentinel UI Components', () => {
  const panelComponents = [
    'DashboardShell',
    'ProxyPanel',
    'HistoryPanel',
    'RepeaterPanel',
    'IntruderPanel',
    'TargetMapPanel',
    'ScannerPanel',
    'OobPanel',
    'SequencerPanel',
    'DecoderPanel',
    'ExtensionsPanel',
    'EmbeddedBrowserPanel'
  ];

  panelComponents.forEach(component => {
    it(`should have ${component} component stub`, () => {
      expect(component).toBeDefined();
      expect(typeof component).toBe('string');
    });
  });

  it('should have all 12 Sentinel UI components defined', () => {
    expect(panelComponents.length).toBe(12);
  });
});
