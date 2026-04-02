import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Static imports so Vite's JSX transform is applied to all panel components
import DashboardShell from '../DashboardShell.jsx';
import ProxyPanel from '../ProxyPanel.jsx';
import HistoryPanel from '../HistoryPanel.jsx';
import RepeaterPanel from '../RepeaterPanel.jsx';
import IntruderPanel from '../IntruderPanel.jsx';
import ScannerPanel from '../ScannerPanel.jsx';
import DecoderPanel from '../DecoderPanel.jsx';
import OobPanel from '../OobPanel.jsx';
import SequencerPanel from '../SequencerPanel.jsx';
import TargetMapPanel from '../TargetMapPanel.jsx';
import ExtensionsPanel from '../ExtensionsPanel.jsx';
import EmbeddedBrowserPanel from '../EmbeddedBrowserPanel.jsx';

// Use CJS require so ChakraProvider shares the same module instance as the
// panel components (which also use CJS require). ESM/CJS module splitting
// otherwise creates two separate React Context objects.
const { ChakraProvider, defaultSystem } = require('@chakra-ui/react');

// Wrap renders with ChakraProvider so Chakra's context hooks resolve correctly.
function renderWithChakra(ui) {
  return render(React.createElement(ChakraProvider, { value: defaultSystem }, ui));
}

describe('Sentinel UI Panel Components', () => {
  describe('DashboardShell', () => {
    it('exports a function component', () => {
      expect(typeof DashboardShell).toBe('function');
    });

    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(DashboardShell))).not.toThrow();
    });

    it('displays Dashboard heading', () => {
      renderWithChakra(React.createElement(DashboardShell));
      expect(screen.getByText('Dashboard')).toBeTruthy();
    });
  });

  describe('ProxyPanel', () => {
    it('exports a function component', () => {
      expect(typeof ProxyPanel).toBe('function');
    });

    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(ProxyPanel))).not.toThrow();
    });

    it('displays Proxy heading', () => {
      renderWithChakra(React.createElement(ProxyPanel));
      expect(screen.getByText('Proxy')).toBeTruthy();
    });
  });

  describe('HistoryPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(HistoryPanel))).not.toThrow();
    });

    it('displays History heading', () => {
      renderWithChakra(React.createElement(HistoryPanel));
      expect(screen.getByText('History')).toBeTruthy();
    });
  });

  describe('RepeaterPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(RepeaterPanel))).not.toThrow();
    });

    it('displays Repeater heading', () => {
      renderWithChakra(React.createElement(RepeaterPanel));
      expect(screen.getByText('Repeater')).toBeTruthy();
    });
  });

  describe('IntruderPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(IntruderPanel))).not.toThrow();
    });

    it('displays Intruder heading', () => {
      renderWithChakra(React.createElement(IntruderPanel));
      expect(screen.getByText('Intruder')).toBeTruthy();
    });
  });

  describe('ScannerPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(ScannerPanel))).not.toThrow();
    });

    it('displays Scanner heading', () => {
      renderWithChakra(React.createElement(ScannerPanel));
      expect(screen.getByText('Scanner')).toBeTruthy();
    });
  });

  describe('DecoderPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(DecoderPanel))).not.toThrow();
    });

    it('displays Decoder heading', () => {
      renderWithChakra(React.createElement(DecoderPanel));
      expect(screen.getByText('Decoder')).toBeTruthy();
    });
  });

  describe('OobPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(OobPanel))).not.toThrow();
    });

    it('displays OOB heading', () => {
      renderWithChakra(React.createElement(OobPanel));
      expect(screen.getByText('OOB')).toBeTruthy();
    });
  });

  describe('SequencerPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(SequencerPanel))).not.toThrow();
    });

    it('displays Sequencer heading', () => {
      renderWithChakra(React.createElement(SequencerPanel));
      expect(screen.getByText('Sequencer')).toBeTruthy();
    });
  });

  describe('TargetMapPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(TargetMapPanel))).not.toThrow();
    });

    it('displays Target Map heading', () => {
      renderWithChakra(React.createElement(TargetMapPanel));
      expect(screen.getByText('Target Map')).toBeTruthy();
    });
  });

  describe('ExtensionsPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(ExtensionsPanel))).not.toThrow();
    });

    it('displays Extensions heading', () => {
      renderWithChakra(React.createElement(ExtensionsPanel));
      expect(screen.getByText('Extensions')).toBeTruthy();
    });
  });

  describe('EmbeddedBrowserPanel', () => {
    it('renders without throwing', () => {
      expect(() => renderWithChakra(React.createElement(EmbeddedBrowserPanel))).not.toThrow();
    });

    it('displays Embedded Browser heading', () => {
      renderWithChakra(React.createElement(EmbeddedBrowserPanel));
      expect(screen.getByText('Embedded Browser')).toBeTruthy();
    });
  });

  it('all 12 panel components are functions', () => {
    const panels = [
      DashboardShell, ProxyPanel, HistoryPanel, RepeaterPanel,
      IntruderPanel, TargetMapPanel, ScannerPanel, OobPanel,
      SequencerPanel, DecoderPanel, ExtensionsPanel, EmbeddedBrowserPanel,
    ];
    expect(panels.length).toBe(12);
    panels.forEach((Panel) => {
      expect(typeof Panel).toBe('function');
    });
  });
});
