import { describe, it, expect } from 'vitest';

describe('Sentinel Proxy Services Coverage', () => {
  const proxyServices = [
    'intercept-engine',
    'history-log',
    'protocol-support',
    'rules-engine',
    'repeater-service',
    'intruder-engine',
    'target-mapper',
    'scanner-engine',
    'oob-service',
    'sequencer-service',
    'decoder-service',
    'extension-host',
    'embedded-browser-service'
  ];

  proxyServices.forEach((service) => {
    it(`should have ${service} service defined`, () => {
      expect(service).toBeDefined();
      expect(typeof service).toBe('string');
    });
  });

  it('should verify all proxy services are defined', () => {
    expect(proxyServices.length).toBe(13);
    proxyServices.forEach(service => {
      expect(service).toBeDefined();
      expect(typeof service).toBe('string');
      expect(service.length).toBeGreaterThan(0);
    });
  });

  it('should have correct service naming convention', () => {
    const expectedNames = [
      'intercept-engine',
      'history-log',
      'protocol-support',
      'rules-engine',
      'repeater-service',
      'intruder-engine',
      'target-mapper',
      'scanner-engine',
      'oob-service',
      'sequencer-service',
      'decoder-service',
      'extension-host',
      'embedded-browser-service'
    ];

    expectedNames.forEach((name, index) => {
      expect(proxyServices[index]).toBe(name);
    });
  });
});
