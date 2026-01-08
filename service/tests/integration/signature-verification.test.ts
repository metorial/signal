import { describe, it, expect } from 'vitest';
import { generateSignature } from '../../src/lib/signature';

describe('Integration: Signature Verification', () => {
  describe('End-to-End Signature Flow', () => {
    it('should generate and verify signature for webhook delivery', async () => {
      const payload = {
        eventType: 'user.created',
        data: {
          userId: '12345',
          email: 'test@example.com',
          timestamp: '2024-01-01T00:00:00Z'
        }
      };

      const signingSecret = 'whsec_test1234567890';
      const timestamp = 1704067200;

      const signature = await generateSignature(payload, signingSecret, { timestamp });

      // Extract components
      const parts = signature.split(',');
      expect(parts).toHaveLength(2);

      const [timestampPart, signaturePart] = parts;
      expect(timestampPart).toBe(`t=${timestamp}`);
      expect(signaturePart).toMatch(/^v1=[a-f0-9]{64}$/);

      // Verify signature is deterministic
      const signature2 = await generateSignature(payload, signingSecret, { timestamp });
      expect(signature).toBe(signature2);
    });

    it('should detect tampering when payload is modified', async () => {
      const originalPayload = { userId: '123', action: 'create' };
      const tamperedPayload = { userId: '123', action: 'delete' };
      const secret = 'secret';
      const timestamp = 1704067200;

      const originalSig = await generateSignature(originalPayload, secret, { timestamp });
      const tamperedSig = await generateSignature(tamperedPayload, secret, { timestamp });

      expect(originalSig).not.toBe(tamperedSig);
    });

    it('should create different signatures for different secrets', async () => {
      const payload = { data: 'test' };
      const timestamp = 1704067200;

      const sig1 = await generateSignature(payload, 'secret1', { timestamp });
      const sig2 = await generateSignature(payload, 'secret2', { timestamp });

      expect(sig1).not.toBe(sig2);
    });

    it('should handle various payload types correctly', async () => {
      const secret = 'secret';
      const timestamp = 1704067200;

      const testCases = [
        { name: 'simple object', payload: { test: 'data' } },
        { name: 'nested object', payload: { user: { id: 1, profile: { name: 'Test' } } } },
        { name: 'with array', payload: { items: [1, 2, 3] } },
        { name: 'with null', payload: { value: null } },
        { name: 'with boolean', payload: { active: true, deleted: false } },
        { name: 'with number', payload: { count: 42, price: 99.99 } },
        { name: 'empty object', payload: {} }
      ];

      for (const testCase of testCases) {
        const sig = await generateSignature(testCase.payload, secret, { timestamp });
        expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
      }
    });

    it('should handle special characters in payload', async () => {
      const payload = {
        message: 'Hello\nWorld\t!',
        symbols: '!@#$%^&*()',
        quotes: 'He said "Hello"',
        unicode: '你好 🌍'
      };

      const secret = 'secret';
      const timestamp = 1704067200;

      const sig1 = await generateSignature(payload, secret, { timestamp });
      const sig2 = await generateSignature(payload, secret, { timestamp });

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
  });

  describe('Timestamp-based Replay Protection', () => {
    it('should produce different signatures for different timestamps', async () => {
      const payload = { data: 'test' };
      const secret = 'secret';

      const timestamps = [1704067200, 1704067201, 1704067202];
      const signatures = await Promise.all(
        timestamps.map(t => generateSignature(payload, secret, { timestamp: t }))
      );

      // All signatures should be different
      expect(signatures[0]).not.toBe(signatures[1]);
      expect(signatures[1]).not.toBe(signatures[2]);
      expect(signatures[0]).not.toBe(signatures[2]);

      // Each should contain its respective timestamp
      expect(signatures[0]).toContain('t=1704067200');
      expect(signatures[1]).toContain('t=1704067201');
      expect(signatures[2]).toContain('t=1704067202');
    });

    it('should use current timestamp when not provided', async () => {
      const payload = { data: 'test' };
      const secret = 'secret';

      const beforeTime = Math.floor(Date.now() / 1000);
      const signature = await generateSignature(payload, secret);
      const afterTime = Math.floor(Date.now() / 1000);

      const timestampMatch = signature.match(/^t=(\d+),/);
      expect(timestampMatch).toBeTruthy();
      if (!timestampMatch || !timestampMatch[1]) throw new Error('Invalid signature format');

      const sigTimestamp = parseInt(timestampMatch[1]);
      expect(sigTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(sigTimestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Real-world Webhook Scenarios', () => {
    it('should sign a typical user creation webhook', async () => {
      const webhook = {
        id: 'evt_1234567890',
        type: 'user.created',
        created: 1704067200,
        data: {
          object: {
            id: 'user_abc123',
            email: 'user@example.com',
            name: 'John Doe',
            created_at: '2024-01-01T00:00:00Z',
            metadata: {
              source: 'api',
              ip_address: '192.0.2.1'
            }
          }
        }
      };

      const signature = await generateSignature(webhook, 'whsec_prod_secret', {
        timestamp: 1704067200
      });

      expect(signature).toMatch(/^t=1704067200,v1=[a-f0-9]{64}$/);
    });

    it('should sign a webhook with large payload', async () => {
      const largePayload = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item_${i}`,
          name: `Item ${i}`,
          description: `This is a detailed description for item ${i}`.repeat(10),
          properties: {
            color: 'blue',
            size: 'large',
            weight: Math.random() * 100,
            tags: ['tag1', 'tag2', 'tag3']
          }
        }))
      };

      const secret = 'secret';
      const timestamp = 1704067200;

      const sig1 = await generateSignature(largePayload, secret, { timestamp });
      const sig2 = await generateSignature(largePayload, secret, { timestamp });

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });

    it('should handle multiple rapid signature generations', async () => {
      const payload = { test: 'concurrent' };
      const secret = 'secret';
      const timestamp = 1704067200;

      // Generate 10 signatures concurrently
      const promises = Array.from({ length: 10 }, () =>
        generateSignature(payload, secret, { timestamp })
      );

      const signatures = await Promise.all(promises);

      // All should be identical
      const first = signatures[0];
      signatures.forEach(sig => {
        expect(sig).toBe(first);
      });
    });

    it('should match expected format for webhook headers', async () => {
      const payload = { eventType: 'test.event', data: { id: '123' } };
      const signature = await generateSignature(payload, 'secret', { timestamp: 1704067200 });

      // Should be parseable by webhook receiver
      const [timestampPart, ...signatureParts] = signature.split(',');
      const signaturePart = signatureParts.join(',');

      expect(timestampPart).toBeDefined();
      expect(signaturePart).toBeDefined();
      expect(timestampPart!.startsWith('t=')).toBe(true);
      expect(signaturePart.startsWith('v1=')).toBe(true);

      const timestamp = parseInt(timestampPart!.substring(2));
      expect(timestamp).toBe(1704067200);

      const sig = signaturePart.substring(3);
      expect(sig.length).toBe(64); // SHA-256 hex = 64 chars
      expect(/^[a-f0-9]+$/.test(sig)).toBe(true);
    });
  });

  describe('Security Properties', () => {
    it('should produce cryptographically strong signatures', async () => {
      const payload = { test: 'security' };
      const secret = 'secret';
      const timestamp = 1704067200;

      const signature = await generateSignature(payload, secret, { timestamp });
      const parts = signature.split(',');
      const sigPart = parts[1]?.split('=')[1];

      expect(sigPart).toBeDefined();
      // SHA-256 produces 256 bits = 32 bytes = 64 hex chars
      expect(sigPart!.length).toBe(64);

      // Should have good entropy (not all same character)
      const uniqueChars = new Set(sigPart!.split(''));
      expect(uniqueChars.size).toBeGreaterThan(10);
    });

    it('should be sensitive to even small payload changes', async () => {
      const secret = 'secret';
      const timestamp = 1704067200;

      const sig1 = await generateSignature({ value: 'test' }, secret, { timestamp });
      const sig2 = await generateSignature({ value: 'Test' }, secret, { timestamp }); // Capital T

      expect(sig1).not.toBe(sig2);

      // Extract just the signature part (not timestamp)
      const sig1Part = sig1.split(',')[1];
      const sig2Part = sig2.split(',')[1];

      // Signatures should be completely different (avalanche effect)
      expect(sig1Part).not.toBe(sig2Part);
    });

    it('should handle very short secrets', async () => {
      const payload = { test: 'data' };
      const timestamp = 1704067200;

      const sig = await generateSignature(payload, 'a', { timestamp });
      expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });

    it('should handle very long secrets', async () => {
      const payload = { test: 'data' };
      const longSecret = 'a'.repeat(1000);
      const timestamp = 1704067200;

      const sig = await generateSignature(payload, longSecret, { timestamp });
      expect(sig).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
    });
  });
});
