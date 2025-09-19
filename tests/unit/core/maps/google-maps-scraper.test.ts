import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Browser, Page } from 'playwright';
import { GoogleMapsScraper } from '../../../../src/core/maps/google-maps-scraper.js';

// Mock Playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

describe('GoogleMapsScraper', () => {
  let scraper: GoogleMapsScraper;
  let mockBrowser: Browser;
  let mockPage: Page;

  beforeEach(() => {
    mockPage = {
      goto: vi.fn(),
      waitForSelector: vi.fn(),
      locator: vi.fn(),
      evaluate: vi.fn(),
      close: vi.fn(),
      setUserAgent: vi.fn(),
      setViewportSize: vi.fn(),
    } as any;

    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn(),
    } as any;

    scraper = new GoogleMapsScraper();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create scraper instance', () => {
      expect(scraper).toBeInstanceOf(GoogleMapsScraper);
    });

    it('should accept custom configuration', () => {
      const customScraper = new GoogleMapsScraper({
        headless: false,
        timeout: 60000,
        maxRetries: 5,
      });

      expect(customScraper).toBeInstanceOf(GoogleMapsScraper);
    });
  });

  describe('searchBusinesses', () => {
    const mockBusinessResults = [
      {
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL 33601',
        rating: '4.5',
        reviewCount: '127',
        phone: '+1 813-555-0123',
        website: 'https://tampacleaning.com',
        businessUrl: 'https://maps.google.com/place/123',
      },
      {
        name: 'Clean Pro Tampa',
        address: '456 Oak Ave, Tampa, FL 33602',
        rating: '4.2',
        reviewCount: '89',
        phone: '+1 813-555-0124',
        website: null,
        businessUrl: 'https://maps.google.com/place/456',
      },
    ];

    beforeEach(() => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue(mockBusinessResults);
    });

    it('should search businesses by query and location', async () => {
      const results = await scraper.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/cleaning+services+Tampa,+FL',
        { waitUntil: 'networkidle' }
      );

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL 33601',
        rating: 4.5,
        reviewCount: 127,
        phone: '+1 813-555-0123',
        website: 'https://tampacleaning.com',
        businessUrl: 'https://maps.google.com/place/123',
      });
    });

    it('should handle empty query', async () => {
      await expect(
        scraper.searchBusinesses('', 'Tampa, FL')
      ).rejects.toThrow('Query is required');
    });

    it('should handle empty location', async () => {
      await expect(
        scraper.searchBusinesses('cleaning services', '')
      ).rejects.toThrow('Location is required');
    });

    it('should handle page navigation errors', async () => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(
        scraper.searchBusinesses('cleaning services', 'Tampa, FL')
      ).rejects.toThrow('Navigation failed');
    });

    it('should handle scraping timeout', async () => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(
        scraper.searchBusinesses('cleaning services', 'Tampa, FL')
      ).rejects.toThrow('Timeout');
    });

    it('should handle no results found', async () => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue([]);

      const results = await scraper.searchBusinesses(
        'nonexistent business',
        'Tampa, FL'
      );

      expect(results).toHaveLength(0);
    });

    it('should filter out invalid results', async () => {
      const invalidResults = [
        {
          name: 'Tampa Cleaning Services',
          address: '123 Main St, Tampa, FL 33601',
          rating: '4.5',
          reviewCount: '127',
        },
        {
          // Missing required name field
          address: '456 Oak Ave, Tampa, FL 33602',
          rating: '4.2',
        },
        {
          name: 'Another Business',
          // Missing address
          rating: '4.0',
        },
      ];

      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue(invalidResults);

      const results = await scraper.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      expect(results).toHaveLength(1); // Only first result is valid
    });
  });

  describe('getBusinessDetails', () => {
    const mockBusinessDetails = {
      name: 'Tampa Cleaning Services',
      address: '123 Main St, Tampa, FL 33601, USA',
      phone: '+1 813-555-0123',
      website: 'https://tampacleaning.com',
      hours: [
        'Monday: 8:00 AM – 6:00 PM',
        'Tuesday: 8:00 AM – 6:00 PM',
        'Wednesday: 8:00 AM – 6:00 PM',
        'Thursday: 8:00 AM – 6:00 PM',
        'Friday: 8:00 AM – 6:00 PM',
        'Saturday: 9:00 AM – 4:00 PM',
        'Sunday: Closed',
      ],
      rating: '4.5',
      reviewCount: '127',
      priceLevel: '$$',
      photos: ['photo1.jpg', 'photo2.jpg'],
    };

    beforeEach(() => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue(mockBusinessDetails);
    });

    it('should get detailed business information', async () => {
      const details = await scraper.getBusinessDetails(
        'https://maps.google.com/place/123'
      );

      expect(mockPage.goto).toHaveBeenCalledWith(
        'https://maps.google.com/place/123',
        { waitUntil: 'networkidle' }
      );

      expect(details).toEqual({
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL 33601, USA',
        phone: '+1 813-555-0123',
        website: 'https://tampacleaning.com',
        hours: [
          'Monday: 8:00 AM – 6:00 PM',
          'Tuesday: 8:00 AM – 6:00 PM',
          'Wednesday: 8:00 AM – 6:00 PM',
          'Thursday: 8:00 AM – 6:00 PM',
          'Friday: 8:00 AM – 6:00 PM',
          'Saturday: 9:00 AM – 4:00 PM',
          'Sunday: Closed',
        ],
        rating: 4.5,
        reviewCount: 127,
        priceLevel: '$$',
        photos: ['photo1.jpg', 'photo2.jpg'],
      });
    });

    it('should handle invalid business URL', async () => {
      await expect(scraper.getBusinessDetails('')).rejects.toThrow(
        'Business URL is required'
      );
    });

    it('should handle business not found', async () => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue(null);

      await expect(
        scraper.getBusinessDetails('https://maps.google.com/place/invalid')
      ).rejects.toThrow('Business details not found');
    });
  });

  describe('respectRobotsTxt', () => {
    it('should check robots.txt before scraping', async () => {
      const respectRobotsSpy = vi.spyOn(scraper as any, 'respectRobotsTxt');
      respectRobotsSpy.mockResolvedValue(true);

      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue([]);

      await scraper.searchBusinesses('test', 'location');

      expect(respectRobotsSpy).toHaveBeenCalled();
    });

    it('should reject scraping if robots.txt disallows', async () => {
      const respectRobotsSpy = vi.spyOn(scraper as any, 'respectRobotsTxt');
      respectRobotsSpy.mockResolvedValue(false);

      await expect(
        scraper.searchBusinesses('test', 'location')
      ).rejects.toThrow('Scraping not allowed by robots.txt');
    });
  });

  describe('cleanup', () => {
    it('should close browser resources', async () => {
      vi.spyOn(scraper as any, 'launchBrowser').mockResolvedValue(mockBrowser);
      mockPage.evaluate.mockResolvedValue([]);

      await scraper.searchBusinesses('test', 'location');
      await scraper.cleanup();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle cleanup when browser is null', async () => {
      await expect(scraper.cleanup()).resolves.toBeUndefined();
    });
  });
});