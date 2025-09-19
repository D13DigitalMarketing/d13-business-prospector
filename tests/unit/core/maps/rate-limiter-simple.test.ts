import { describe, it, expect } from 'vitest';
import { ExponentialBackoffRateLimiter } from '../../../../src/core/maps/rate-limiter.js';

describe('ExponentialBackoffRateLimiter - Simple Tests', () => {
  describe('constructor', () => {
    it('should create with default configuration', () => {
      const rateLimiter = new ExponentialBackoffRateLimiter();
      const status = rateLimiter.getQueueStatus();

      expect(status.requestsPerSecond).toBe(10);
      expect(status.queueLength).toBe(0);
      expect(status.processing).toBe(false);
    });

    it('should create with custom configuration', () => {
      const rateLimiter = new ExponentialBackoffRateLimiter({
        requestsPerSecond: 5,
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 3,
      });

      const status = rateLimiter.getQueueStatus();
      expect(status.requestsPerSecond).toBe(5);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const rateLimiter = new ExponentialBackoffRateLimiter();

      // Access private method for testing
      const isRetryable = (rateLimiter as any).isRetryableError;

      expect(isRetryable({ response: { status: 429 } })).toBe(true);
      expect(isRetryable({ response: { status: 503 } })).toBe(true);
      expect(isRetryable({ response: { status: 504 } })).toBe(true);
      expect(isRetryable({ code: 'ECONNRESET' })).toBe(true);
      expect(isRetryable({ code: 'ETIMEDOUT' })).toBe(true);
      expect(isRetryable({ message: 'timeout error' })).toBe(true);
      expect(isRetryable({ message: 'network error' })).toBe(true);

      // Non-retryable errors
      expect(isRetryable({ response: { status: 400 } })).toBe(false);
      expect(isRetryable({ response: { status: 401 } })).toBe(false);
      expect(isRetryable({ response: { status: 404 } })).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const rateLimiter = new ExponentialBackoffRateLimiter();
      const mockOperation = () => Promise.resolve('success');

      const result = await rateLimiter.retryWithBackoff(mockOperation);
      expect(result).toBe('success');
    });

    it('should not retry non-retryable errors', async () => {
      const rateLimiter = new ExponentialBackoffRateLimiter();
      const error = { response: { status: 400 } };
      const mockOperation = () => Promise.reject(error);

      await expect(rateLimiter.retryWithBackoff(mockOperation)).rejects.toEqual(
        error
      );
    });
  });

  describe('getQueueStatus', () => {
    it('should return correct queue status structure', () => {
      const rateLimiter = new ExponentialBackoffRateLimiter({
        requestsPerSecond: 5,
      });
      const status = rateLimiter.getQueueStatus();

      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('processing');
      expect(status).toHaveProperty('requestsPerSecond');
      expect(status.requestsPerSecond).toBe(5);
      expect(typeof status.queueLength).toBe('number');
      expect(typeof status.processing).toBe('boolean');
    });
  });
});
