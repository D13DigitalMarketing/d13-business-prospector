import { describe, it, expect } from 'vitest';
import { MapsClient } from '../../../../src/core/maps/maps-client.js';

describe('MapsClient - Simple Tests', () => {
  describe('constructor', () => {
    it('should create MapsClient with valid configuration', () => {
      const config = {
        googlePlacesApiKey: 'test-key',
        useApiFirst: true,
        scraping: {
          enabled: true,
          headless: true,
          timeout: 30000,
          maxRetries: 3,
          respectRobots: true,
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080 },
        },
        rateLimiting: {
          requestsPerSecond: 10,
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      };

      expect(() => new MapsClient(config)).not.toThrow();
    });
  });

  describe('input validation', () => {
    it('should validate search inputs', async () => {
      const config = {
        googlePlacesApiKey: 'test-key',
        useApiFirst: true,
        scraping: {
          enabled: false,
          headless: true,
          timeout: 30000,
          maxRetries: 3,
          respectRobots: true,
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080 },
        },
        rateLimiting: {
          requestsPerSecond: 10,
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      };

      const client = new MapsClient(config);

      await expect(
        client.searchBusinesses('', 'Tampa, FL')
      ).rejects.toThrow('Query is required');

      await expect(
        client.searchBusinesses('cleaning services', '')
      ).rejects.toThrow('Location is required');
    });
  });

  describe('configuration', () => {
    it('should get queue status', () => {
      const config = {
        googlePlacesApiKey: 'test-key',
        useApiFirst: true,
        scraping: {
          enabled: true,
          headless: true,
          timeout: 30000,
          maxRetries: 3,
          respectRobots: true,
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080 },
        },
        rateLimiting: {
          requestsPerSecond: 5,
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      };

      const client = new MapsClient(config);
      const status = client.getQueueStatus();

      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('processing');
      expect(status).toHaveProperty('requestsPerSecond');
      expect(status.requestsPerSecond).toBe(5);
    });
  });

  describe('cleanup', () => {
    it('should handle cleanup', async () => {
      const config = {
        googlePlacesApiKey: 'test-key',
        useApiFirst: true,
        scraping: {
          enabled: true,
          headless: true,
          timeout: 30000,
          maxRetries: 3,
          respectRobots: true,
          userAgent: 'Test Agent',
          viewport: { width: 1920, height: 1080 },
        },
        rateLimiting: {
          requestsPerSecond: 10,
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      };

      const client = new MapsClient(config);

      // Should not throw
      await expect(client.cleanup()).resolves.toBeUndefined();
    });
  });
});