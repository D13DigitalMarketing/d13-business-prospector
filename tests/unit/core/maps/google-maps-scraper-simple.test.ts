import { describe, it, expect } from 'vitest';
import { GoogleMapsScraper } from '../../../../src/core/maps/google-maps-scraper.js';

describe('GoogleMapsScraper - Simple Tests', () => {
  describe('constructor', () => {
    it('should create scraper instance with default config', () => {
      const scraper = new GoogleMapsScraper();
      expect(scraper).toBeInstanceOf(GoogleMapsScraper);
    });

    it('should create scraper instance with custom config', () => {
      const scraper = new GoogleMapsScraper({
        headless: false,
        timeout: 60000,
        maxRetries: 5,
        respectRobots: false,
      });
      expect(scraper).toBeInstanceOf(GoogleMapsScraper);
    });
  });

  describe('input validation', () => {
    it('should reject empty query in searchBusinesses', async () => {
      const scraper = new GoogleMapsScraper({ respectRobots: false });

      await expect(
        scraper.searchBusinesses('', 'Tampa, FL')
      ).rejects.toThrow('Query is required');
    });

    it('should reject empty location in searchBusinesses', async () => {
      const scraper = new GoogleMapsScraper({ respectRobots: false });

      await expect(
        scraper.searchBusinesses('cleaning services', '')
      ).rejects.toThrow('Location is required');
    });

    it('should reject empty business URL in getBusinessDetails', async () => {
      const scraper = new GoogleMapsScraper({ respectRobots: false });

      await expect(
        scraper.getBusinessDetails('')
      ).rejects.toThrow('Business URL is required');
    });
  });

  describe('cleanup', () => {
    it('should handle cleanup when no browser is active', async () => {
      const scraper = new GoogleMapsScraper();

      // Should not throw
      await expect(scraper.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('data validation', () => {
    it('should have validation method available', () => {
      const scraper = new GoogleMapsScraper();

      // Just verify the method exists - actual validation is tested through integration
      expect(typeof (scraper as any).isValidScrapedResult).toBe('function');
    });
  });

  describe('URL building', () => {
    it('should have URL building method available', () => {
      const scraper = new GoogleMapsScraper();

      // Just verify the method exists - actual URL building is tested through integration
      expect(typeof (scraper as any).buildSearchUrl).toBe('function');
    });
  });
});