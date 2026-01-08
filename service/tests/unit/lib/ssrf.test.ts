import { describe, it, expect } from 'vitest';
import { checkIp, ssrfFilter, getAxiosSsrfFilter } from '../../../src/lib/ssrf';

describe('checkIp', () => {
  describe('public IP addresses', () => {
    it('should allow valid public IPv4 addresses', () => {
      expect(checkIp('8.8.8.8')).toBe(true);
      expect(checkIp('1.1.1.1')).toBe(true);
      expect(checkIp('208.67.222.222')).toBe(true);
    });

    it('should allow valid public IPv6 addresses', () => {
      expect(checkIp('2001:4860:4860::8888')).toBe(true);
      expect(checkIp('2606:4700:4700::1111')).toBe(true);
    });
  });

  describe('private IP addresses', () => {
    it('should block private IPv4 addresses (10.x.x.x)', () => {
      expect(checkIp('10.0.0.1')).toBe(false);
      expect(checkIp('10.255.255.255')).toBe(false);
    });

    it('should block private IPv4 addresses (172.16-31.x.x)', () => {
      expect(checkIp('172.16.0.1')).toBe(false);
      expect(checkIp('172.31.255.255')).toBe(false);
    });

    it('should block private IPv4 addresses (192.168.x.x)', () => {
      expect(checkIp('192.168.1.1')).toBe(false);
      expect(checkIp('192.168.255.255')).toBe(false);
    });

    it('should block localhost IPv4', () => {
      expect(checkIp('127.0.0.1')).toBe(false);
      expect(checkIp('127.0.0.2')).toBe(false);
    });

    it('should block localhost IPv6', () => {
      expect(checkIp('::1')).toBe(false);
    });

    it('should block link-local IPv4 addresses', () => {
      expect(checkIp('169.254.1.1')).toBe(false);
    });

    it('should block link-local IPv6 addresses', () => {
      expect(checkIp('fe80::1')).toBe(false);
    });

    it('should block multicast addresses', () => {
      expect(checkIp('224.0.0.1')).toBe(false);
      expect(checkIp('ff02::1')).toBe(false);
    });

    it('should block broadcast address', () => {
      expect(checkIp('255.255.255.255')).toBe(false);
    });

    it('should block IPv6 unique local addresses', () => {
      expect(checkIp('fc00::1')).toBe(false);
      expect(checkIp('fd00::1')).toBe(false);
    });
  });

  describe('invalid IP addresses', () => {
    it('should handle invalid IP strings', () => {
      expect(checkIp('not-an-ip')).toBe(true);
      expect(checkIp('example.com')).toBe(true);
      expect(checkIp('300.300.300.300')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(checkIp('')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should block 0.0.0.0', () => {
      expect(checkIp('0.0.0.0')).toBe(false);
    });

    it('should block IPv6 unspecified address', () => {
      expect(checkIp('::')).toBe(false);
    });
  });
});

describe('ssrfFilter', () => {
  it('should create HTTP agent for HTTP URLs', () => {
    const url = new URL('http://example.com');
    const agent = ssrfFilter(url);

    expect(agent).toBeDefined();
    expect(typeof agent).toBe('object');
  });

  it('should create HTTPS agent for HTTPS URLs', () => {
    const url = new URL('https://example.com');
    const agent = ssrfFilter(url);

    expect(agent).toBeDefined();
    expect(typeof agent).toBe('object');
  });
});

describe('getAxiosSsrfFilter', () => {
  it('should return axios config with httpAgent and httpsAgent for HTTP URL', () => {
    const config = getAxiosSsrfFilter('http://example.com');

    expect(config).toHaveProperty('httpAgent');
    expect(config).toHaveProperty('httpsAgent');
    expect(config.httpAgent).toBeDefined();
    expect(config.httpsAgent).toBeDefined();
  });

  it('should return axios config with httpAgent and httpsAgent for HTTPS URL', () => {
    const config = getAxiosSsrfFilter('https://example.com');

    expect(config).toHaveProperty('httpAgent');
    expect(config).toHaveProperty('httpsAgent');
    expect(config.httpAgent).toBeDefined();
    expect(config.httpsAgent).toBeDefined();
  });
});
