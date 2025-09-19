import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExponentialBackoffRateLimiter } from '../../../../src/core/maps/rate-limiter.js';

describe('ExponentialBackoffRateLimiter', () => {
  let rateLimiter: ExponentialBackoffRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create with default configuration', () => {
      rateLimiter = new ExponentialBackoffRateLimiter();
      const status = rateLimiter.getQueueStatus();

      expect(status.requestsPerSecond).toBe(10);
      expect(status.queueLength).toBe(0);
      expect(status.processing).toBe(false);
    });

    it('should create with custom configuration', () => {
      rateLimiter = new ExponentialBackoffRateLimiter({
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

  describe('waitForNextRequest', () => {
    beforeEach(() => {
      rateLimiter = new ExponentialBackoffRateLimiter({ requestsPerSecond: 2 });
    });

    it('should process single request immediately', async () => {
      const promise = rateLimiter.waitForNextRequest();

      // Should resolve immediately for first request
      vi.advanceTimersByTime(0);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should rate limit multiple requests', async () => {
      const promises = [
        rateLimiter.waitForNextRequest(),
        rateLimiter.waitForNextRequest(),
        rateLimiter.waitForNextRequest(),
      ];

      // First request should resolve immediately
      vi.advanceTimersByTime(1);
      await expect(promises[0]).resolves.toBeUndefined();

      // Second request should wait for interval (500ms for 2 requests/second)
      vi.advanceTimersByTime(500);
      await expect(promises[1]).resolves.toBeUndefined();

      // Third request should wait another interval
      vi.advanceTimersByTime(500);
      await expect(promises[2]).resolves.toBeUndefined();
    });

    it('should handle concurrent requests in order', async () => {
      const results: number[] = [];
      const promises = Array.from({ length: 3 }, (_, i) =>
        rateLimiter.waitForNextRequest().then(() => results.push(i))
      );

      // Process all requests
      vi.advanceTimersByTime(2000);
      await Promise.all(promises);

      expect(results).toEqual([0, 1, 2]);
    });
  });

  describe('retryWithBackoff', () => {
    beforeEach(() => {
      rateLimiter = new ExponentialBackoffRateLimiter({
        maxRetries: 3,
        baseDelay: 1000,
        backoffMultiplier: 2,
      });
    });

    it('should succeed on first attempt', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');

      const result = await rateLimiter.retryWithBackoff(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors with exponential backoff', async () => {
      const mockOperation = vi
        .fn()
        .mockRejectedValueOnce({ response: { status: 429 } }) // Rate limit
        .mockRejectedValueOnce({ response: { status: 503 } }) // Service unavailable
        .mockResolvedValue('success');

      const promise = rateLimiter.retryWithBackoff(mockOperation);

      // First failure - wait base delay (1000ms)
      vi.advanceTimersByTime(1000);

      // Second failure - wait exponential backoff (2000ms)
      vi.advanceTimersByTime(2000);

      const result = await promise;

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const error = { response: { status: 429 } };
      const mockOperation = vi.fn().mockRejectedValue(error);

      const promise = rateLimiter.retryWithBackoff(mockOperation);

      // Advance through all retry delays
      vi.advanceTimersByTime(1000); // First retry
      vi.advanceTimersByTime(2000); // Second retry
      vi.advanceTimersByTime(4000); // Third retry

      await expect(promise).rejects.toEqual(error);
      expect(mockOperation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry non-retryable errors', async () => {
      const error = { response: { status: 400 } }; // Bad request - not retryable
      const mockOperation = vi.fn().mockRejectedValue(error);

      await expect(rateLimiter.retryWithBackoff(mockOperation)).rejects.toEqual(
        error
      );
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle different retryable error types', async () => {
      const retryableErrors = [
        { response: { status: 429 } }, // Rate limit
        { response: { status: 503 } }, // Service unavailable
        { response: { status: 504 } }, // Gateway timeout
        { code: 'ECONNRESET' }, // Network reset
        { code: 'ETIMEDOUT' }, // Timeout
        { message: 'timeout error' }, // Generic timeout
        { message: 'network error' }, // Network error
      ];

      for (const error of retryableErrors) {
        const mockOperation = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const promise = rateLimiter.retryWithBackoff(mockOperation);
        vi.advanceTimersByTime(1000);

        await expect(promise).resolves.toBe('success');
        expect(mockOperation).toHaveBeenCalledTimes(2);

        vi.clearAllMocks();
      }
    });

    it('should respect max delay limit', async () => {
      const rateLimiterWithMaxDelay = new ExponentialBackoffRateLimiter({
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 3000,
        backoffMultiplier: 2,
      });

      const mockOperation = vi.fn().mockRejectedValue({ response: { status: 429 } });

      const promise = rateLimiterWithMaxDelay.retryWithBackoff(mockOperation);

      // Delays should be: 1000, 2000, 3000 (capped), 3000 (capped), 3000 (capped)
      vi.advanceTimersByTime(1000); // First retry: 1000ms
      vi.advanceTimersByTime(2000); // Second retry: 2000ms
      vi.advanceTimersByTime(3000); // Third retry: 3000ms (capped)
      vi.advanceTimersByTime(3000); // Fourth retry: 3000ms (capped)
      vi.advanceTimersByTime(3000); // Fifth retry: 3000ms (capped)

      await expect(promise).rejects.toEqual({ response: { status: 429 } });
      expect(mockOperation).toHaveBeenCalledTimes(6); // Initial + 5 retries
    });
  });

  describe('getQueueStatus', () => {
    beforeEach(() => {
      rateLimiter = new ExponentialBackoffRateLimiter({ requestsPerSecond: 1 });
    });

    it('should return correct queue status', async () => {
      // Add requests to queue
      const promises = [
        rateLimiter.waitForNextRequest(),
        rateLimiter.waitForNextRequest(),
        rateLimiter.waitForNextRequest(),
      ];

      const initialStatus = rateLimiter.getQueueStatus();
      expect(initialStatus.queueLength).toBeGreaterThan(0);
      expect(initialStatus.processing).toBe(true);
      expect(initialStatus.requestsPerSecond).toBe(1);

      // Process all requests
      vi.advanceTimersByTime(3000);
      await Promise.all(promises);

      const finalStatus = rateLimiter.getQueueStatus();
      expect(finalStatus.queueLength).toBe(0);
      expect(finalStatus.processing).toBe(false);
    });
  });
});