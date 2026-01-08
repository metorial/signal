import { describe, it, expect } from 'vitest';
import { generateSignature } from '../../../src/lib/signature';

describe('generateSignature', () => {
  it('should generate a valid signature for a string payload', async () => {
    const body = 'test payload';
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const signature = await generateSignature(body, secret, { timestamp });

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    expect(signature).toContain(`t=${timestamp}`);
  });

  it('should generate a valid signature for an object payload', async () => {
    const body = { test: 'data', nested: { value: 123 } };
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const signature = await generateSignature(body, secret, { timestamp });

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    expect(signature).toContain(`t=${timestamp}`);
  });

  it('should generate consistent signatures for the same input', async () => {
    const body = { event: 'test' };
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const sig1 = await generateSignature(body, secret, { timestamp });
    const sig2 = await generateSignature(body, secret, { timestamp });

    expect(sig1).toBe(sig2);
  });

  it('should generate different signatures for different secrets', async () => {
    const body = 'test payload';
    const timestamp = 1704067200;

    const sig1 = await generateSignature(body, 'secret1', { timestamp });
    const sig2 = await generateSignature(body, 'secret2', { timestamp });

    expect(sig1).not.toBe(sig2);
  });

  it('should generate different signatures for different timestamps', async () => {
    const body = 'test payload';
    const secret = 'test_secret';

    const sig1 = await generateSignature(body, secret, { timestamp: 1704067200 });
    const sig2 = await generateSignature(body, secret, { timestamp: 1704067201 });

    expect(sig1).not.toBe(sig2);
  });

  it('should generate different signatures for different payloads', async () => {
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const sig1 = await generateSignature('payload1', secret, { timestamp });
    const sig2 = await generateSignature('payload2', secret, { timestamp });

    expect(sig1).not.toBe(sig2);
  });

  it('should use current timestamp when not provided', async () => {
    const body = 'test payload';
    const secret = 'test_secret';

    const signature = await generateSignature(body, secret);
    const timestampMatch = signature.match(/^t=(\d+),/);

    expect(timestampMatch).toBeTruthy();
    if (!timestampMatch || !timestampMatch[1]) throw new Error('Invalid signature format');
    const timestamp = parseInt(timestampMatch[1]);
    const now = Math.floor(Date.now() / 1000);

    // Timestamp should be within 1 second of now
    expect(Math.abs(timestamp - now)).toBeLessThanOrEqual(1);
  });

  it('should handle empty payload', async () => {
    const body = '';
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const signature = await generateSignature(body, secret, { timestamp });

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });

  it('should handle special characters in payload', async () => {
    const body = 'test\n\t\r special"chars\'!@#$%^&*()';
    const secret = 'test_secret';
    const timestamp = 1704067200;

    const signature = await generateSignature(body, secret, { timestamp });

    expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
  });
});
