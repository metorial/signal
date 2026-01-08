import { describe, it, expect } from 'vitest';
import { clamp } from '../../../src/lib/clamp';

describe('clamp', () => {
  it('should return the number if it is within the range', () => {
    expect(clamp(5, { min: 0, max: 10 })).toBe(5);
    expect(clamp(50, { min: 10, max: 100 })).toBe(50);
  });

  it('should return the minimum value if number is below range', () => {
    expect(clamp(-5, { min: 0, max: 10 })).toBe(0);
    expect(clamp(5, { min: 10, max: 100 })).toBe(10);
  });

  it('should return the maximum value if number is above range', () => {
    expect(clamp(15, { min: 0, max: 10 })).toBe(10);
    expect(clamp(200, { min: 10, max: 100 })).toBe(100);
  });

  it('should handle edge cases at boundaries', () => {
    expect(clamp(0, { min: 0, max: 10 })).toBe(0);
    expect(clamp(10, { min: 0, max: 10 })).toBe(10);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, { min: -10, max: -1 })).toBe(-5);
    expect(clamp(-15, { min: -10, max: -1 })).toBe(-10);
    expect(clamp(0, { min: -10, max: -1 })).toBe(-1);
  });
});
