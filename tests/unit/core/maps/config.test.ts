import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MapsConfigManager } from '../../../../src/core/maps/config.js';

describe('MapsConfigManager', () => {
  let originalEnv: typeof process.env;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
    // Reset singleton instance
    (MapsConfigManager as any).instance = undefined;
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MapsConfigManager.getInstance();
      const instance2 = MapsConfigManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('default configuration', () => {
    it('should load default configuration when no env vars are set', () => {
      // Clear relevant env vars
      delete process.env.GOOGLE_PLACES_API_KEY;
      delete process.env.USE_API_FIRST;
      delete process.env.SCRAPING_ENABLED;

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config).toEqual({
        googlePlacesApiKey: undefined,
        useApiFirst: true,
        scraping: {
          enabled: true,
          headless: true,
          timeout: 30000,
          maxRetries: 3,
          respectRobots: true,
          userAgent: expect.stringContaining('Mozilla'),
          viewport: { width: 1920, height: 1080 },
        },
        rateLimiting: {
          requestsPerSecond: 10,
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
        },
      });
    });
  });

  describe('environment variable parsing', () => {
    it('should parse boolean environment variables correctly', () => {
      process.env.USE_API_FIRST = 'false';
      process.env.SCRAPING_ENABLED = 'true';
      process.env.SCRAPING_HEADLESS = 'false';
      process.env.SCRAPING_RESPECT_ROBOTS = 'true';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.useApiFirst).toBe(false);
      expect(config.scraping.enabled).toBe(true);
      expect(config.scraping.headless).toBe(false);
      expect(config.scraping.respectRobots).toBe(true);
    });

    it('should parse integer environment variables correctly', () => {
      process.env.SCRAPING_TIMEOUT = '60000';
      process.env.SCRAPING_MAX_RETRIES = '5';
      process.env.RATE_LIMIT_REQUESTS_PER_SECOND = '5';
      process.env.RATE_LIMIT_MAX_RETRIES = '7';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.scraping.timeout).toBe(60000);
      expect(config.scraping.maxRetries).toBe(5);
      expect(config.rateLimiting.requestsPerSecond).toBe(5);
      expect(config.rateLimiting.maxRetries).toBe(7);
    });

    it('should parse float environment variables correctly', () => {
      process.env.RATE_LIMIT_BACKOFF_MULTIPLIER = '2.5';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.rateLimiting.backoffMultiplier).toBe(2.5);
    });

    it('should use defaults for invalid numeric values', () => {
      process.env.SCRAPING_TIMEOUT = 'invalid';
      process.env.RATE_LIMIT_BACKOFF_MULTIPLIER = 'not-a-number';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.scraping.timeout).toBe(30000); // default
      expect(config.rateLimiting.backoffMultiplier).toBe(2); // default
    });

    it('should parse string environment variables correctly', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
      process.env.SCRAPING_USER_AGENT = 'Custom User Agent';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.googlePlacesApiKey).toBe('test-api-key');
      expect(config.scraping.userAgent).toBe('Custom User Agent');
    });

    it('should parse viewport dimensions correctly', () => {
      process.env.SCRAPING_VIEWPORT_WIDTH = '1280';
      process.env.SCRAPING_VIEWPORT_HEIGHT = '720';

      const configManager = MapsConfigManager.getInstance();
      const config = configManager.getConfig();

      expect(config.scraping.viewport.width).toBe(1280);
      expect(config.scraping.viewport.height).toBe(720);
    });
  });

  describe('API key methods', () => {
    it('should return true when API key is present', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

      const configManager = MapsConfigManager.getInstance();

      expect(configManager.hasApiKey()).toBe(true);
    });

    it('should return false when API key is not present', () => {
      delete process.env.GOOGLE_PLACES_API_KEY;

      const configManager = MapsConfigManager.getInstance();

      expect(configManager.hasApiKey()).toBe(false);
    });

    it('should return API key when present', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

      const configManager = MapsConfigManager.getInstance();

      expect(configManager.getApiKey()).toBe('test-api-key');
    });

    it('should throw error when API key is not present', () => {
      delete process.env.GOOGLE_PLACES_API_KEY;

      const configManager = MapsConfigManager.getInstance();

      expect(() => configManager.getApiKey()).toThrow(
        'Google Places API key not found'
      );
    });
  });

  describe('config validation', () => {
    it('should validate correct configuration', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';

      const configManager = MapsConfigManager.getInstance();
      const validation = configManager.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate configuration with scraping enabled but no API key', () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      process.env.SCRAPING_ENABLED = 'true';

      const configManager = MapsConfigManager.getInstance();
      const validation = configManager.validateConfig();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should invalidate configuration with no API key and scraping disabled', () => {
      delete process.env.GOOGLE_PLACES_API_KEY;
      process.env.SCRAPING_ENABLED = 'false';

      const configManager = MapsConfigManager.getInstance();
      const validation = configManager.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Either Google Places API key or web scraping must be enabled'
      );
    });

    it('should invalidate configuration with invalid rate limiting values', () => {
      process.env.GOOGLE_PLACES_API_KEY = 'test-api-key';
      process.env.RATE_LIMIT_REQUESTS_PER_SECOND = '0';
      process.env.RATE_LIMIT_MAX_RETRIES = '-1';
      process.env.RATE_LIMIT_BASE_DELAY = '0';
      process.env.RATE_LIMIT_MAX_DELAY = '-100';
      process.env.RATE_LIMIT_BACKOFF_MULTIPLIER = '1';

      const configManager = MapsConfigManager.getInstance();
      const validation = configManager.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(
        'Rate limiting requests per second must be positive'
      );
      expect(validation.errors).toContain(
        'Rate limiting max retries must be non-negative'
      );
      expect(validation.errors).toContain(
        'Rate limiting base delay must be positive'
      );
      expect(validation.errors).toContain(
        'Rate limiting max delay must be positive'
      );
      expect(validation.errors).toContain(
        'Rate limiting backoff multiplier must be greater than 1'
      );
    });

    it('should invalidate configuration with invalid scraping values', () => {
      // Set invalid config through updateConfig instead of env vars
      process.env.SCRAPING_ENABLED = 'true';

      const configManager = MapsConfigManager.getInstance();

      // Update config with invalid values
      configManager.updateConfig({
        scraping: {
          enabled: true,
          timeout: 0,
          maxRetries: -1,
          userAgent: '',
          viewport: { width: 0, height: -100 },
          headless: true,
          respectRobots: true,
        },
      });

      const validation = configManager.validateConfig();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Scraping timeout must be positive');
      expect(validation.errors).toContain(
        'Scraping max retries must be non-negative'
      );
      expect(validation.errors).toContain('Scraping user agent is required');
      expect(validation.errors).toContain(
        'Scraping viewport dimensions must be positive'
      );
    });
  });

  describe('config updates', () => {
    it('should update configuration', () => {
      const configManager = MapsConfigManager.getInstance();
      const originalConfig = configManager.getConfig();

      configManager.updateConfig({
        useApiFirst: false,
        rateLimiting: {
          ...originalConfig.rateLimiting,
          requestsPerSecond: 5,
        },
      });

      const updatedConfig = configManager.getConfig();

      expect(updatedConfig.useApiFirst).toBe(false);
      expect(updatedConfig.rateLimiting.requestsPerSecond).toBe(5);
      // Other values should remain unchanged
      expect(updatedConfig.scraping.enabled).toBe(
        originalConfig.scraping.enabled
      );
    });

    it('should not modify original config when getting config', () => {
      const configManager = MapsConfigManager.getInstance();
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      config1.useApiFirst = false;

      expect(config2.useApiFirst).toBe(true); // Should not be affected
    });
  });
});
