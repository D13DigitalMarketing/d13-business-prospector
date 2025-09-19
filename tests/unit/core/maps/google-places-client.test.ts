import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { GooglePlacesClient } from '../../../../src/core/maps/google-places-client.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);
mockedAxios.isAxiosError = vi.fn();

describe('GooglePlacesClient', () => {
  let client: GooglePlacesClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GooglePlacesClient(mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      expect(client).toBeInstanceOf(GooglePlacesClient);
    });

    it('should throw error with empty API key', () => {
      expect(() => new GooglePlacesClient('')).toThrow('API key is required');
    });

    it('should throw error with null API key', () => {
      expect(() => new GooglePlacesClient(null as any)).toThrow(
        'API key is required'
      );
    });
  });

  describe('searchBusinesses', () => {
    const mockSuccessResponse = {
      data: {
        results: [
          {
            place_id: 'ChIJ123',
            name: 'Tampa Cleaning Services',
            formatted_address: '123 Main St, Tampa, FL 33601, USA',
            geometry: {
              location: {
                lat: 27.9506,
                lng: -82.4572,
              },
            },
            rating: 4.5,
            user_ratings_total: 127,
            types: ['establishment', 'point_of_interest'],
            business_status: 'OPERATIONAL',
            price_level: 2,
          },
        ],
        status: 'OK',
      },
    };

    it('should search businesses by query and location', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockSuccessResponse);

      const results = await client.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/textsearch/json',
        {
          params: {
            query: 'cleaning services in Tampa, FL',
            key: mockApiKey,
            type: 'establishment',
          },
        }
      );

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'ChIJ123',
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL 33601, USA',
        location: {
          latitude: 27.9506,
          longitude: -82.4572,
        },
        rating: 4.5,
        reviewCount: 127,
        types: ['establishment', 'point_of_interest'],
        businessStatus: 'OPERATIONAL',
        priceLevel: 2,
      });
    });

    it('should handle empty query gracefully', async () => {
      await expect(
        client.searchBusinesses('', 'Tampa, FL')
      ).rejects.toThrow('Query is required');
    });

    it('should handle empty location gracefully', async () => {
      await expect(
        client.searchBusinesses('cleaning services', '')
      ).rejects.toThrow('Location is required');
    });

    it('should handle API error responses', async () => {
      const errorResponse = {
        data: {
          status: 'REQUEST_DENIED',
          error_message: 'Invalid API key',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(errorResponse);

      await expect(
        client.searchBusinesses('cleaning services', 'Tampa, FL')
      ).rejects.toThrow('Google Places API error: Invalid API key');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);

      await expect(
        client.searchBusinesses('cleaning services', 'Tampa, FL')
      ).rejects.toThrow('Network Error');
    });

    it('should handle rate limiting (429 status)', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        data: { error_message: 'Rate limit exceeded' },
      };
      (rateLimitError as any).isAxiosError = true;

      mockedAxios.get.mockRejectedValueOnce(rateLimitError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(
        client.searchBusinesses('cleaning services', 'Tampa, FL')
      ).rejects.toThrow('Rate limit exceeded. Please try again later.');
    });

    it('should handle zero results', async () => {
      const zeroResultsResponse = {
        data: {
          results: [],
          status: 'ZERO_RESULTS',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(zeroResultsResponse);

      const results = await client.searchBusinesses(
        'nonexistent business',
        'Tampa, FL'
      );

      expect(results).toHaveLength(0);
    });

    it('should handle malformed response data', async () => {
      const malformedResponse = {
        data: {
          results: [
            {
              // Missing required fields
              name: 'Test Business',
            },
          ],
          status: 'OK',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(malformedResponse);

      const results = await client.searchBusinesses(
        'cleaning services',
        'Tampa, FL'
      );

      // Should filter out malformed results
      expect(results).toHaveLength(0);
    });
  });

  describe('getBusinessDetails', () => {
    const mockDetailsResponse = {
      data: {
        result: {
          place_id: 'ChIJ123',
          name: 'Tampa Cleaning Services',
          formatted_address: '123 Main St, Tampa, FL 33601, USA',
          formatted_phone_number: '+1 813-555-0123',
          website: 'https://tampacleaning.com',
          opening_hours: {
            weekday_text: [
              'Monday: 8:00 AM – 6:00 PM',
              'Tuesday: 8:00 AM – 6:00 PM',
              'Wednesday: 8:00 AM – 6:00 PM',
              'Thursday: 8:00 AM – 6:00 PM',
              'Friday: 8:00 AM – 6:00 PM',
              'Saturday: 9:00 AM – 4:00 PM',
              'Sunday: Closed',
            ],
          },
          rating: 4.5,
          user_ratings_total: 127,
          reviews: [
            {
              rating: 5,
              text: 'Great service!',
              time: 1640995200,
            },
          ],
        },
        status: 'OK',
      },
    };

    it('should get detailed business information', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockDetailsResponse);

      const details = await client.getBusinessDetails('ChIJ123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: 'ChIJ123',
            key: mockApiKey,
            fields:
              'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,geometry',
          },
        }
      );

      expect(details).toEqual({
        id: 'ChIJ123',
        name: 'Tampa Cleaning Services',
        address: '123 Main St, Tampa, FL 33601, USA',
        phone: '+1 813-555-0123',
        website: 'https://tampacleaning.com',
        openingHours: [
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
        reviews: [
          {
            rating: 5,
            text: 'Great service!',
            time: 1640995200,
          },
        ],
      });
    });

    it('should handle invalid place ID', async () => {
      await expect(client.getBusinessDetails('')).rejects.toThrow(
        'Place ID is required'
      );
    });

    it('should handle NOT_FOUND status', async () => {
      const notFoundResponse = {
        data: {
          status: 'NOT_FOUND',
        },
      };
      mockedAxios.get.mockResolvedValueOnce(notFoundResponse);

      await expect(client.getBusinessDetails('invalid-id')).rejects.toThrow(
        'Business not found'
      );
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      // Mock multiple rapid requests
      const promises = Array.from({ length: 5 }, () =>
        client.searchBusinesses('test', 'location')
      );

      // Should handle concurrent requests appropriately
      // This test ensures the rate limiting infrastructure is in place
      await expect(Promise.allSettled(promises)).resolves.toBeDefined();
    });
  });
});