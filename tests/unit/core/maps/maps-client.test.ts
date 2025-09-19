import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MapsClient } from '../../../../src/core/maps/maps-client.js';
import { GooglePlacesClient } from '../../../../src/core/maps/google-places-client.js';
import { GoogleMapsScraper } from '../../../../src/core/maps/google-maps-scraper.js';

// Mock the dependencies
vi.mock('../../../../src/core/maps/google-places-client.js');
vi.mock('../../../../src/core/maps/google-maps-scraper.js');
vi.mock('../../../../src/core/maps/config.js', () => ({
  mapsConfig: {
    getConfig: () => ({
      googlePlacesApiKey: 'test-api-key',
      useApiFirst: true,
      scraping: {
        enabled: true,
        headless: true,
        timeout: 30000,
        maxRetries: 3,
        respectRobots: true,
        userAgent: 'Test User Agent',
        viewport: { width: 1920, height: 1080 },
      },
      rateLimiting: {
        requestsPerSecond: 10,
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
      },
    }),
    validateConfig: () => ({ isValid: true, errors: [] }),
  },
}));

describe('MapsClient', () => {
  let mapsClient: MapsClient;
  let mockPlacesClient: any;
  let mockScraper: any;

  beforeEach(() => {
    mockPlacesClient = {
      searchBusinesses: vi.fn(),
      getBusinessDetails: vi.fn(),
    };

    mockScraper = {
      searchBusinesses: vi.fn(),
      getBusinessDetails: vi.fn(),
      cleanup: vi.fn(),
    };

    (GooglePlacesClient as any).mockImplementation(() => mockPlacesClient);
    (GoogleMapsScraper as any).mockImplementation(() => mockScraper);

    mapsClient = new MapsClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create MapsClient with default configuration', () => {
      expect(mapsClient).toBeInstanceOf(MapsClient);
      expect(GooglePlacesClient).toHaveBeenCalledWith('test-api-key', expect.any(Object));
      expect(GoogleMapsScraper).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw error with invalid configuration', () => {
      const invalidConfig = {
        googlePlacesApiKey: undefined,
        scraping: { enabled: false },
      };

      // Mock validation to return invalid
      const mockConfig = vi.doMock('../../../../src/core/maps/config.js', () => ({
        mapsConfig: {
          getConfig: () => invalidConfig,
          validateConfig: () => ({
            isValid: false,
            errors: ['Either API key or scraping must be enabled'],
          }),
        },
      }));

      expect(() => new MapsClient(invalidConfig)).toThrow('Invalid configuration');
    });
  });

  describe('searchBusinesses', () => {
    const mockApiResults = [
      {
        id: 'place123',
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL',
        location: { latitude: 27.9506, longitude: -82.4572 },
        rating: 4.5,
        reviewCount: 127,
        types: ['establishment'],
        businessStatus: 'OPERATIONAL',
        priceLevel: 2,
      },
    ];

    const mockScraperResults = [
      {
        name: 'Clean Pro Tampa',
        address: '456 Oak Ave, Tampa, FL',
        rating: 4.2,
        reviewCount: 89,
        phone: '+1-813-555-0124',
        website: 'https://cleanpro.com',
        businessUrl: 'https://maps.google.com/place/456',
      },
    ];

    beforeEach(() => {
      mockPlacesClient.searchBusinesses.mockResolvedValue(mockApiResults);
      mockScraper.searchBusinesses.mockResolvedValue(mockScraperResults);
    });

    it('should search using API first when preferred', async () => {
      const results = await mapsClient.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      expect(mockPlacesClient.searchBusinesses).toHaveBeenCalledWith(
        'cleaning services',
        'Tampa, FL'
      );
      expect(mockScraper.searchBusinesses).not.toHaveBeenCalled();

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'place123',
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL',
        location: { latitude: 27.9506, longitude: -82.4572 },
        rating: 4.5,
        reviewCount: 127,
        types: ['establishment'],
        businessStatus: 'OPERATIONAL',
        priceLevel: 2,
        source: 'api',
      });
    });

    it('should fallback to scraper when API fails', async () => {
      mockPlacesClient.searchBusinesses.mockRejectedValue(new Error('API Error'));

      const results = await mapsClient.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      expect(mockPlacesClient.searchBusinesses).toHaveBeenCalled();
      expect(mockScraper.searchBusinesses).toHaveBeenCalledWith(
        'cleaning services',
        'Tampa, FL'
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        name: 'Clean Pro Tampa',
        address: '456 Oak Ave, Tampa, FL',
        rating: 4.2,
        reviewCount: 89,
        phone: '+1-813-555-0124',
        website: 'https://cleanpro.com',
        source: 'scraper',
      });
    });

    it('should use scraper first when preferApi is false', async () => {
      const results = await mapsClient.searchBusinesses(
        'cleaning services',
        'Tampa, FL',
        { preferApi: false }
      );

      expect(mockScraper.searchBusinesses).toHaveBeenCalledWith(
        'cleaning services',
        'Tampa, FL'
      );
      expect(mockPlacesClient.searchBusinesses).not.toHaveBeenCalled();

      expect(results[0].source).toBe('scraper');
    });

    it('should limit results based on maxResults option', async () => {
      const multipleResults = Array.from({ length: 10 }, (_, i) => ({
        ...mockApiResults[0],
        id: `place${i}`,
        name: `Business ${i}`,
      }));

      mockPlacesClient.searchBusinesses.mockResolvedValue(multipleResults);

      const results = await mapsClient.searchBusinesses(
        'cleaning services',
        'Tampa, FL',
        { maxResults: 5 }
      );

      expect(results).toHaveLength(5);
    });

    it('should handle empty query error', async () => {
      await expect(
        mapsClient.searchBusinesses('', 'Tampa, FL')
      ).rejects.toThrow('Query is required');
    });

    it('should handle empty location error', async () => {
      await expect(
        mapsClient.searchBusinesses('cleaning services', '')
      ).rejects.toThrow('Location is required');
    });

    it('should throw error when no search methods available', async () => {
      // Create client without API key or scraper
      const clientWithoutMethods = new MapsClient({
        googlePlacesApiKey: undefined,
        scraping: { enabled: false },
      });

      await expect(
        clientWithoutMethods.searchBusinesses('test', 'location')
      ).rejects.toThrow('No search methods available');
    });

    it('should fallback to API when scraper fails and preferApi is false', async () => {
      mockScraper.searchBusinesses.mockRejectedValue(new Error('Scraper Error'));

      const results = await mapsClient.searchBusinesses(
        'cleaning services',
        'Tampa, FL',
        { preferApi: false }
      );

      expect(mockScraper.searchBusinesses).toHaveBeenCalled();
      expect(mockPlacesClient.searchBusinesses).toHaveBeenCalled();
      expect(results[0].source).toBe('api');
    });
  });

  describe('getBusinessDetails', () => {
    const mockApiDetails = {
      id: 'place123',
      name: 'Tampa Cleaning Services',
      address: '123 Main St, Tampa, FL',
      phone: '+1-813-555-0123',
      website: 'https://tampacleaning.com',
      openingHours: ['Monday: 8:00 AM – 6:00 PM'],
      rating: 4.5,
      reviewCount: 127,
      reviews: [{ rating: 5, text: 'Great service!', time: 1640995200 }],
    };

    const mockScraperDetails = {
      name: 'Clean Pro Tampa',
      address: '456 Oak Ave, Tampa, FL',
      phone: '+1-813-555-0124',
      website: 'https://cleanpro.com',
      hours: ['Monday: 9:00 AM – 5:00 PM'],
      rating: 4.2,
      reviewCount: 89,
      priceLevel: '$$',
      photos: ['photo1.jpg'],
    };

    beforeEach(() => {
      mockPlacesClient.getBusinessDetails.mockResolvedValue(mockApiDetails);
      mockScraper.getBusinessDetails.mockResolvedValue(mockScraperDetails);
    });

    it('should get details using API with place ID', async () => {
      const details = await mapsClient.getBusinessDetails('place123');

      expect(mockPlacesClient.getBusinessDetails).toHaveBeenCalledWith('place123');
      expect(mockScraper.getBusinessDetails).not.toHaveBeenCalled();

      expect(details).toEqual({
        id: 'place123',
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL',
        phone: '+1-813-555-0123',
        website: 'https://tampacleaning.com',
        openingHours: ['Monday: 8:00 AM – 6:00 PM'],
        rating: 4.5,
        reviewCount: 127,
        reviews: [{ rating: 5, text: 'Great service!', time: 1640995200 }],
        source: 'api',
      });
    });

    it('should fallback to scraper when API fails', async () => {
      mockPlacesClient.getBusinessDetails.mockRejectedValue(new Error('API Error'));

      const details = await mapsClient.getBusinessDetails(
        'place123',
        'https://maps.google.com/place/123'
      );

      expect(mockPlacesClient.getBusinessDetails).toHaveBeenCalled();
      expect(mockScraper.getBusinessDetails).toHaveBeenCalledWith(
        'https://maps.google.com/place/123'
      );

      expect(details).toEqual({
        name: 'Clean Pro Tampa',
        address: '456 Oak Ave, Tampa, FL',
        phone: '+1-813-555-0124',
        website: 'https://cleanpro.com',
        openingHours: ['Monday: 9:00 AM – 5:00 PM'],
        rating: 4.2,
        reviewCount: 89,
        priceLevel: '$$',
        photos: ['photo1.jpg'],
        source: 'scraper',
      });
    });

    it('should use scraper when no place ID provided', async () => {
      const details = await mapsClient.getBusinessDetails(
        '',
        'https://maps.google.com/place/123'
      );

      expect(mockPlacesClient.getBusinessDetails).not.toHaveBeenCalled();
      expect(mockScraper.getBusinessDetails).toHaveBeenCalledWith(
        'https://maps.google.com/place/123'
      );

      expect(details.source).toBe('scraper');
    });

    it('should throw error when no valid business ID or URL provided', async () => {
      await expect(mapsClient.getBusinessDetails('', '')).rejects.toThrow(
        'Unable to fetch business details'
      );
    });
  });

  describe('cleanup', () => {
    it('should cleanup scraper resources', async () => {
      await mapsClient.cleanup();

      expect(mockScraper.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup when scraper is not available', async () => {
      const clientWithoutScraper = new MapsClient({
        scraping: { enabled: false },
      });

      await expect(clientWithoutScraper.cleanup()).resolves.toBeUndefined();
    });
  });

  describe('getQueueStatus', () => {
    it('should return rate limiter queue status', () => {
      const status = mapsClient.getQueueStatus();

      expect(status).toEqual({
        queueLength: expect.any(Number),
        processing: expect.any(Boolean),
        requestsPerSecond: expect.any(Number),
      });
    });
  });
});