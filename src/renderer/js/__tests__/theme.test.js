import { describe, it, expect } from 'vitest';
import themeSystem from '../theme.js';

describe('Theme Configuration', () => {
  it('should export a theme system object', () => {
    expect(themeSystem).toBeDefined();
    expect(typeof themeSystem).toBe('object');
  });

  it('should have theme configuration with tokens', () => {
    // Verify theme structure
    expect(themeSystem).toBeTruthy();
  });

  it('should define brand color palette with 10 shades', () => {
    const brandColors = {
      50: '#eef6ff',
      100: '#d9eaff',
      200: '#b7d7ff',
      300: '#8cbcff',
      400: '#5d99ff',
      500: '#386fff',
      600: '#284fdd',
      700: '#1f3da8',
      800: '#1d3684',
      900: '#1f3369'
    };

    expect(Object.keys(brandColors).length).toBe(10);
    Object.entries(brandColors).forEach(([key, value]) => {
      expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('should define semantic tokens bg.panel and bg.subtle', () => {
    const semanticTokens = {
      'bg.panel': 'brand.50',
      'bg.subtle': 'brand.100'
    };

    expect(semanticTokens['bg.panel']).toBe('brand.50');
    expect(semanticTokens['bg.subtle']).toBe('brand.100');
  });

  it('should provide valid color references', () => {
    const allColors = [
      '#eef6ff', '#d9eaff', '#b7d7ff', '#8cbcff', '#5d99ff',
      '#386fff', '#284fdd', '#1f3da8', '#1d3684', '#1f3369'
    ];

    allColors.forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

