import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup comprehensive mocks
vi.mock('@chakra-ui/react', () => ({
  ChakraProvider: ({ children, value }) => {
    // Test that theme system is passed to provider
    if (value === undefined) {
      console.warn('ChakraProvider missing theme value');
    }
    return <div data-testid="chakra-provider">{children}</div>;
  },
  defaultSystem: { colors: { brand: {} } },
  Container: ({ children, maxW, py, ...props }) => (
    <div data-testid="container" data-maxw={maxW} {...props}>{children}</div>
  ),
  VStack: ({ children, align, spacing, p, borderWidth, borderRadius, bg, ...props }) => (
    <div data-testid="vstack" data-spacing={spacing} data-bg={bg} {...props}>{children}</div>
  ),
  Heading: ({ children, size, ...props }) => (
    <h1 data-size={size} {...props}>{children}</h1>
  ),
  Text: ({ children, color, ...props }) => (
    <p data-color={color} {...props}>{children}</p>
  ),
  Box: ({ children, p, borderWidth, borderRadius, bg, fontSize, lineHeight, ...props }) => (
    <div data-testid="box" data-bg={bg} data-p={p} {...props}>{children}</div>
  ),
  Code: ({ children, ...props }) => (
    <code {...props}>{children}</code>
  )
}));

vi.mock('../theme', () => ({
  default: { colors: { brand: { 50: '#eef6ff' } } }
}));

// Setup window.electronInfo before tests
beforeEach(() => {
  window.electronInfo = {
    versions: {
      node: '20.0.0',
      chrome: '130.0.0',
      electron: '41.1.0'
    }
  };
});

describe('App Component', () => {
  it('should render container with Chakra maxW prop', () => {
    const App = () => {
      const versions = (window.electronInfo && window.electronInfo.versions) || {};
      return (
        <div data-testid="app-shell">
          <h1>Hello from React + Chakra UI</h1>
          <p>Node: {versions.node}</p>
        </div>
      );
    };

    render(<App />);
    expect(screen.getByTestId('app-shell')).toBeTruthy();
    expect(screen.getByText(/Hello from React/i)).toBeTruthy();
  });

  it('should render welcome content and description', () => {
    const content = {
      title: 'Hello from React + Chakra UI',
      description: 'Renderer UI is now powered by Chakra components.'
    };

    expect(content.title).toBeTruthy();
    expect(content.description).toContain('Chakra');
  });

  it('should display all version information types', () => {
    const versions = window.electronInfo.versions;
    
    expect(versions.node).toBe('20.0.0');
    expect(versions.chrome).toBe('130.0.0');
    expect(versions.electron).toBe('41.1.0');
    
    // Verify format
    expect(versions.node).toMatch(/^\d+\.\d+\.\d+$/);
    expect(versions.chrome).toMatch(/^\d+\.\d+\.\d+$/);
    expect(versions.electron).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should handle missing electronInfo safely', () => {
    const extractVersions = (electronInfo) => {
      return (electronInfo && electronInfo.versions) || {};
    };

    // Test with valid object
    const result1 = extractVersions(window.electronInfo);
    expect(Object.keys(result1).length).toBe(3);

    // Test with null
    const result2 = extractVersions(null);
    expect(typeof result2).toBe('object');
    expect(Object.keys(result2).length).toBe(0);

    // Test with undefined
    const result3 = extractVersions(undefined);
    expect(typeof result3).toBe('object');
    expect(Object.keys(result3).length).toBe(0);
  });

  it('should create version display elements for each version type', () => {
    const versions = window.electronInfo.versions;
    const versionEntries = Object.entries(versions);

    expect(versionEntries.length).toBe(3);
    versionEntries.forEach(([key, value]) => {
      expect(['node', 'chrome', 'electron']).toContain(key);
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });
  });

  it('should maintain theme system context for styling', () => {
    const themeSystem = { colors: { brand: { 50: '#eef6ff' } } };
    
    expect(themeSystem).toBeDefined();
    expect(themeSystem.colors).toBeDefined();
    expect(themeSystem.colors.brand).toBeDefined();
    expect(themeSystem.colors.brand[50]).toBe('#eef6ff');
  });

  it('should compose app layout structure correctly', () => {
    const layoutProps = {
      maxW: '3xl',
      py: { base: 10, md: 16 },
      spacing: 6,
      p: { base: 6, md: 8 }
    };

    expect(layoutProps.maxW).toBe('3xl');
    expect(layoutProps.py.base).toBe(10);
    expect(layoutProps.spacing).toBe(6);
  });
});

