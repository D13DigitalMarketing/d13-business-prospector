import axios, { AxiosError, AxiosResponse } from 'axios';

export interface BusinessSearchResult {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  reviewCount?: number;
  types?: string[];
  businessStatus?: string;
  priceLevel?: number;
}

export interface BusinessDetails {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  rating?: number;
  reviewCount?: number;
  reviews?: Array<{
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface RateLimiter {
  waitForNextRequest(): Promise<void>;
}

export class GooglePlacesClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string, rateLimiter?: RateLimiter) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter || new DefaultRateLimiter();
  }

  async searchBusinesses(
    query: string,
    location: string
  ): Promise<BusinessSearchResult[]> {
    if (!query || query.trim() === '') {
      throw new Error('Query is required');
    }

    if (!location || location.trim() === '') {
      throw new Error('Location is required');
    }

    await this.rateLimiter.waitForNextRequest();

    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/textsearch/json`,
        {
          params: {
            query: `${query} in ${location}`,
            key: this.apiKey,
            type: 'establishment',
          },
        }
      );

      if (response.data.status === 'REQUEST_DENIED') {
        throw new Error(
          `Google Places API error: ${response.data.error_message}`
        );
      }

      if (response.data.status === 'ZERO_RESULTS') {
        return [];
      }

      if (response.data.status !== 'OK') {
        throw new Error(
          `Google Places API error: ${
            response.data.error_message || response.data.status
          }`
        );
      }

      return this.mapSearchResults(response.data.results || []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    }
  }

  async getBusinessDetails(placeId: string): Promise<BusinessDetails> {
    if (!placeId || placeId.trim() === '') {
      throw new Error('Place ID is required');
    }

    await this.rateLimiter.waitForNextRequest();

    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/details/json`,
        {
          params: {
            place_id: placeId,
            key: this.apiKey,
            fields:
              'place_id,name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,geometry',
          },
        }
      );

      if (response.data.status === 'NOT_FOUND') {
        throw new Error('Business not found');
      }

      if (response.data.status === 'REQUEST_DENIED') {
        throw new Error(
          `Google Places API error: ${response.data.error_message}`
        );
      }

      if (response.data.status !== 'OK') {
        throw new Error(
          `Google Places API error: ${
            response.data.error_message || response.data.status
          }`
        );
      }

      return this.mapBusinessDetails(response.data.result);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    }
  }

  private mapSearchResults(results: any[]): BusinessSearchResult[] {
    return results
      .filter((result) => this.isValidSearchResult(result))
      .map((result) => ({
        id: result.place_id,
        name: result.name,
        address: result.formatted_address,
        location: {
          latitude: result.geometry?.location?.lat,
          longitude: result.geometry?.location?.lng,
        },
        rating: result.rating,
        reviewCount: result.user_ratings_total,
        types: result.types,
        businessStatus: result.business_status,
        priceLevel: result.price_level,
      }));
  }

  private mapBusinessDetails(result: any): BusinessDetails {
    return {
      id: result.place_id,
      name: result.name,
      address: result.formatted_address,
      phone: result.formatted_phone_number,
      website: result.website,
      openingHours: result.opening_hours?.weekday_text,
      rating: result.rating,
      reviewCount: result.user_ratings_total,
      reviews: result.reviews?.map((review: any) => ({
        rating: review.rating,
        text: review.text,
        time: review.time,
      })),
    };
  }

  private isValidSearchResult(result: any): boolean {
    return (
      result &&
      result.place_id &&
      result.name &&
      result.formatted_address &&
      result.geometry?.location?.lat !== undefined &&
      result.geometry?.location?.lng !== undefined
    );
  }
}

export class DefaultRateLimiter implements RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval = 100; // 100ms between requests (10 requests per second)

  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}