import { GooglePlacesClient, BusinessSearchResult, BusinessDetails } from './google-places-client.js';
import { GoogleMapsScraper, ScrapedBusinessResult, ScrapedBusinessDetails } from './google-maps-scraper.js';
import { ExponentialBackoffRateLimiter } from './rate-limiter.js';
import { mapsConfig, MapsConfig } from './config.js';

export interface UnifiedBusinessResult {
  id?: string;
  name: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  types?: string[];
  businessStatus?: string;
  priceLevel?: number | string;
  source: 'api' | 'scraper';
}

export interface UnifiedBusinessDetails extends UnifiedBusinessResult {
  openingHours?: string[];
  reviews?: Array<{
    rating: number;
    text: string;
    time: number;
  }>;
  photos?: string[];
}

export class MapsClient {
  private readonly config: MapsConfig;
  private readonly rateLimiter: ExponentialBackoffRateLimiter;
  private placesClient?: GooglePlacesClient;
  private scraper?: GoogleMapsScraper;

  constructor(config?: Partial<MapsConfig>) {
    this.config = config ? { ...mapsConfig.getConfig(), ...config } : mapsConfig.getConfig();

    // Validate configuration
    const validation = mapsConfig.validateConfig();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.rateLimiter = new ExponentialBackoffRateLimiter(this.config.rateLimiting);

    // Initialize clients based on configuration
    if (this.config.googlePlacesApiKey) {
      this.placesClient = new GooglePlacesClient(
        this.config.googlePlacesApiKey,
        this.rateLimiter
      );
    }

    if (this.config.scraping.enabled) {
      this.scraper = new GoogleMapsScraper({
        headless: this.config.scraping.headless,
        timeout: this.config.scraping.timeout,
        maxRetries: this.config.scraping.maxRetries,
        respectRobots: this.config.scraping.respectRobots,
        userAgent: this.config.scraping.userAgent,
        viewport: this.config.scraping.viewport,
      });
    }
  }

  async searchBusinesses(
    query: string,
    location: string,
    options: { maxResults?: number; preferApi?: boolean } = {}
  ): Promise<UnifiedBusinessResult[]> {
    const { maxResults = 20, preferApi = this.config.useApiFirst } = options;

    // Validate inputs
    if (!query || query.trim() === '') {
      throw new Error('Query is required');
    }

    if (!location || location.trim() === '') {
      throw new Error('Location is required');
    }

    // Try API first if preferred and available
    if (preferApi && this.placesClient) {
      try {
        const apiResults = await this.searchWithApi(query, location);
        const unifiedResults = this.mapApiResults(apiResults);

        if (unifiedResults.length > 0) {
          return unifiedResults.slice(0, maxResults);
        }
      } catch (error) {
        console.warn('API search failed, falling back to scraper:', error);
      }
    }

    // Try scraper as fallback or primary method
    if (this.scraper) {
      try {
        const scraperResults = await this.searchWithScraper(query, location);
        const unifiedResults = this.mapScraperResults(scraperResults);
        return unifiedResults.slice(0, maxResults);
      } catch (error) {
        // If API wasn't tried and scraper fails, try API as fallback
        if (!preferApi && this.placesClient) {
          console.warn('Scraper search failed, falling back to API:', error);
          const apiResults = await this.searchWithApi(query, location);
          const unifiedResults = this.mapApiResults(apiResults);
          return unifiedResults.slice(0, maxResults);
        }
        throw error;
      }
    }

    throw new Error('No search methods available. Please configure API key or enable scraping.');
  }

  async getBusinessDetails(
    businessId: string,
    businessUrl?: string
  ): Promise<UnifiedBusinessDetails> {
    // Try API first if we have a place ID and API client
    if (businessId && this.placesClient) {
      try {
        const apiDetails = await this.placesClient.getBusinessDetails(businessId);
        return this.mapApiDetails(apiDetails);
      } catch (error) {
        console.warn('API details fetch failed, trying scraper:', error);
      }
    }

    // Try scraper if we have a business URL
    if (businessUrl && this.scraper) {
      try {
        const scraperDetails = await this.scraper.getBusinessDetails(businessUrl);
        return this.mapScraperDetails(scraperDetails);
      } catch (error) {
        console.warn('Scraper details fetch failed:', error);
        throw error;
      }
    }

    throw new Error('Unable to fetch business details. No valid business ID or URL provided.');
  }

  async cleanup(): Promise<void> {
    if (this.scraper) {
      await this.scraper.cleanup();
    }
  }

  getQueueStatus() {
    return this.rateLimiter.getQueueStatus();
  }

  private async searchWithApi(query: string, location: string): Promise<BusinessSearchResult[]> {
    if (!this.placesClient) {
      throw new Error('Places API client not available');
    }

    return this.rateLimiter.retryWithBackoff(() =>
      this.placesClient!.searchBusinesses(query, location)
    );
  }

  private async searchWithScraper(
    query: string,
    location: string
  ): Promise<ScrapedBusinessResult[]> {
    if (!this.scraper) {
      throw new Error('Scraper not available');
    }

    return this.rateLimiter.retryWithBackoff(() =>
      this.scraper!.searchBusinesses(query, location)
    );
  }

  private mapApiResults(results: BusinessSearchResult[]): UnifiedBusinessResult[] {
    return results.map((result) => ({
      id: result.id,
      name: result.name,
      address: result.address,
      location: result.location,
      rating: result.rating,
      reviewCount: result.reviewCount,
      types: result.types,
      businessStatus: result.businessStatus,
      priceLevel: result.priceLevel,
      source: 'api' as const,
    }));
  }

  private mapScraperResults(results: ScrapedBusinessResult[]): UnifiedBusinessResult[] {
    return results.map((result) => ({
      name: result.name,
      address: result.address,
      rating: result.rating,
      reviewCount: result.reviewCount,
      phone: result.phone,
      website: result.website,
      source: 'scraper' as const,
    }));
  }

  private mapApiDetails(details: BusinessDetails): UnifiedBusinessDetails {
    return {
      id: details.id,
      name: details.name,
      address: details.address,
      phone: details.phone,
      website: details.website,
      openingHours: details.openingHours,
      rating: details.rating,
      reviewCount: details.reviewCount,
      reviews: details.reviews,
      source: 'api' as const,
    };
  }

  private mapScraperDetails(details: ScrapedBusinessDetails): UnifiedBusinessDetails {
    return {
      name: details.name,
      address: details.address,
      phone: details.phone,
      website: details.website,
      openingHours: details.hours,
      rating: details.rating,
      reviewCount: details.reviewCount,
      priceLevel: details.priceLevel,
      photos: details.photos,
      source: 'scraper' as const,
    };
  }
}