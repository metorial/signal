import { describe, it, expect } from 'vitest';
import { clamp } from '../../src/lib/clamp';

describe('Integration: Retry Delay Calculation', () => {
  describe('Exponential Backoff', () => {
    it('should calculate exponential delays correctly', () => {
      const baseDelay = 10;
      const attempts = [1, 2, 3, 4, 5];

      const delays = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      expect(delays[0]).toBe(10);   // 10 * 2^0 = 10
      expect(delays[1]).toBe(20);   // 10 * 2^1 = 20
      expect(delays[2]).toBe(40);   // 10 * 2^2 = 40
      expect(delays[3]).toBe(80);   // 10 * 2^3 = 80
      expect(delays[4]).toBe(160);  // 10 * 2^4 = 160
    });

    it('should clamp exponential delays to maximum', () => {
      const baseDelay = 1000;
      const attempts = [1, 2, 3, 4, 5, 10, 15];
      const maxDelay = 60 * 60 * 3; // 3 hours

      const delays = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: maxDelay });
      });

      // Later attempts should all be clamped to max
      expect(delays[5]).toBe(maxDelay); // 1000 * 2^9 = 512000 > max
      expect(delays[6]).toBe(maxDelay); // 1000 * 2^14 = huge > max
    });

    it('should enforce minimum delay even for very small base delays', () => {
      const baseDelay = 1; // Very small base
      const attempt = 1;
      const minDelay = 10;

      let delay = baseDelay * Math.pow(2, attempt - 1);
      delay = clamp(delay, { min: minDelay, max: 60 * 60 * 3 });

      expect(delay).toBe(minDelay);
    });
  });

  describe('Linear Backoff', () => {
    it('should calculate linear delays correctly', () => {
      const baseDelay = 10;
      const attempts = [1, 2, 3, 4, 5];

      const delays = attempts.map(attempt => {
        let delay = baseDelay * attempt;
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      expect(delays[0]).toBe(10);  // 10 * 1 = 10
      expect(delays[1]).toBe(20);  // 10 * 2 = 20
      expect(delays[2]).toBe(30);  // 10 * 3 = 30
      expect(delays[3]).toBe(40);  // 10 * 4 = 40
      expect(delays[4]).toBe(50);  // 10 * 5 = 50
    });

    it('should clamp linear delays to maximum', () => {
      const baseDelay = 1000;
      const attempts = [1, 5, 10, 20];
      const maxDelay = 60 * 60 * 3;

      const delays = attempts.map(attempt => {
        let delay = baseDelay * attempt;
        return clamp(delay, { min: 10, max: maxDelay });
      });

      expect(delays[0]).toBe(1000);    // 1000 * 1 = 1000
      expect(delays[1]).toBe(5000);    // 1000 * 5 = 5000
      expect(delays[2]).toBe(10000);   // 1000 * 10 = 10000
      expect(delays[3]).toBe(maxDelay); // 1000 * 20 = 20000 > max
    });
  });

  describe('Comparison: Exponential vs Linear', () => {
    it('exponential should grow faster than linear', () => {
      const baseDelay = 10;
      const attempts = [1, 2, 3, 4, 5, 6, 7, 8];

      const exponential = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      const linear = attempts.map(attempt => {
        let delay = baseDelay * attempt;
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      // After first attempt, exponential should grow faster
      for (let i = 2; i < attempts.length; i++) {
        const expVal = exponential[i];
        const linVal = linear[i];
        if (expVal !== undefined && linVal !== undefined) {
          expect(expVal).toBeGreaterThan(linVal);
        }
      }

      // Specific examples
      expect(exponential[4]).toBe(160);  // 2^4 * 10
      expect(linear[4]).toBe(50);        // 5 * 10
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical webhook retry scenario', () => {
      // Typical: 30 second base, 3 retries, exponential
      const baseDelay = 30;
      const maxAttempts = 3;
      const attempts = Array.from({ length: maxAttempts }, (_, i) => i + 1);

      const delays = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      expect(delays[0]).toBe(30);   // 30 seconds
      expect(delays[1]).toBe(60);   // 1 minute
      expect(delays[2]).toBe(120);  // 2 minutes

      // Total time before giving up
      const totalWaitTime = delays.reduce((sum, delay) => sum + delay, 0);
      expect(totalWaitTime).toBe(210); // 3.5 minutes total
    });

    it('should handle aggressive retry scenario', () => {
      // Aggressive: 5 second base, 5 retries, linear
      const baseDelay = 5;
      const maxAttempts = 5;
      const attempts = Array.from({ length: maxAttempts }, (_, i) => i + 1);

      const delays = attempts.map(attempt => {
        let delay = baseDelay * attempt;
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      // First attempt uses minimum
      expect(delays[0]).toBe(10);  // Clamped to min
      expect(delays[1]).toBe(10);  // 5 * 2 = 10
      expect(delays[2]).toBe(15);  // 5 * 3 = 15
      expect(delays[3]).toBe(20);  // 5 * 4 = 20
      expect(delays[4]).toBe(25);  // 5 * 5 = 25

      const totalWaitTime = delays.reduce((sum, delay) => sum + delay, 0);
      expect(totalWaitTime).toBe(80); // 80 seconds total
    });

    it('should handle patient retry scenario', () => {
      // Patient: 300 second (5 min) base, 3 retries, exponential
      const baseDelay = 300;
      const maxAttempts = 3;
      const attempts = Array.from({ length: maxAttempts }, (_, i) => i + 1);

      const delays = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: 60 * 60 * 3 });
      });

      expect(delays[0]).toBe(300);   // 5 minutes
      expect(delays[1]).toBe(600);   // 10 minutes
      expect(delays[2]).toBe(1200);  // 20 minutes

      const totalWaitTime = delays.reduce((sum, delay) => sum + delay, 0);
      expect(totalWaitTime).toBe(2100); // 35 minutes total
    });

    it('should cap at 3 hours maximum', () => {
      // Very long delay that should be capped
      const baseDelay = 3600; // 1 hour
      const attempts = [1, 2, 3, 4];
      const maxDelay = 60 * 60 * 3; // 3 hours

      const delays = attempts.map(attempt => {
        let delay = baseDelay * Math.pow(2, attempt - 1);
        return clamp(delay, { min: 10, max: maxDelay });
      });

      expect(delays[0]).toBe(3600);   // 1 hour
      expect(delays[1]).toBe(7200);   // 2 hours
      expect(delays[2]).toBe(maxDelay); // Capped at 3 hours (was 4 hours)
      expect(delays[3]).toBe(maxDelay); // Capped at 3 hours (was 8 hours)
    });
  });
});
