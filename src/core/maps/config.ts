import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface MapsConfig {
  googlePlacesApiKey?: string | undefined;
  useApiFirst: boolean;
  scraping: {
    enabled: boolean;
    headless: boolean;
    timeout: number;
    maxRetries: number;
    respectRobots: boolean;
    userAgent: string;
    viewport: { width: number; height: number };
  };
  rateLimiting: {
    requestsPerSecond: number;
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

export class MapsConfigManager {
  private static instance: MapsConfigManager;
  private config: MapsConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): MapsConfigManager {
    if (!MapsConfigManager.instance) {
      MapsConfigManager.instance = new MapsConfigManager();
    }
    return MapsConfigManager.instance;
  }

  public getConfig(): MapsConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<MapsConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public hasApiKey(): boolean {
    return !!this.config.googlePlacesApiKey;
  }

  public getApiKey(): string {
    if (!this.config.googlePlacesApiKey) {
      throw new Error(
        'Google Places API key not found. Please set GOOGLE_PLACES_API_KEY environment variable.'
      );
    }
    return this.config.googlePlacesApiKey;
  }

  public validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if we have either API key or scraping enabled
    if (!this.config.googlePlacesApiKey && !this.config.scraping.enabled) {
      errors.push(
        'Either Google Places API key or web scraping must be enabled'
      );
    }

    // Validate rate limiting config
    if (this.config.rateLimiting.requestsPerSecond <= 0) {
      errors.push('Rate limiting requests per second must be positive');
    }

    if (this.config.rateLimiting.maxRetries < 0) {
      errors.push('Rate limiting max retries must be non-negative');
    }

    if (this.config.rateLimiting.baseDelay <= 0) {
      errors.push('Rate limiting base delay must be positive');
    }

    if (this.config.rateLimiting.maxDelay <= 0) {
      errors.push('Rate limiting max delay must be positive');
    }

    if (this.config.rateLimiting.backoffMultiplier <= 1) {
      errors.push('Rate limiting backoff multiplier must be greater than 1');
    }

    // Validate scraping config
    if (this.config.scraping.enabled) {
      if (this.config.scraping.timeout <= 0) {
        errors.push('Scraping timeout must be positive');
      }

      if (this.config.scraping.maxRetries < 0) {
        errors.push('Scraping max retries must be non-negative');
      }

      if (
        !this.config.scraping.userAgent ||
        this.config.scraping.userAgent.trim() === ''
      ) {
        errors.push('Scraping user agent is required');
      }

      if (
        this.config.scraping.viewport.width <= 0 ||
        this.config.scraping.viewport.height <= 0
      ) {
        errors.push('Scraping viewport dimensions must be positive');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private loadConfig(): MapsConfig {
    return {
      googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
      useApiFirst: this.parseBoolean(process.env.USE_API_FIRST, true),
      scraping: {
        enabled: this.parseBoolean(process.env.SCRAPING_ENABLED, true),
        headless: this.parseBoolean(process.env.SCRAPING_HEADLESS, true),
        timeout: this.parseInt(process.env.SCRAPING_TIMEOUT, 30000),
        maxRetries: this.parseInt(process.env.SCRAPING_MAX_RETRIES, 3),
        respectRobots: this.parseBoolean(
          process.env.SCRAPING_RESPECT_ROBOTS,
          true
        ),
        userAgent:
          process.env.SCRAPING_USER_AGENT ||
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: {
          width: this.parseInt(process.env.SCRAPING_VIEWPORT_WIDTH, 1920),
          height: this.parseInt(process.env.SCRAPING_VIEWPORT_HEIGHT, 1080),
        },
      },
      rateLimiting: {
        requestsPerSecond: this.parseInt(
          process.env.RATE_LIMIT_REQUESTS_PER_SECOND,
          10
        ),
        maxRetries: this.parseInt(process.env.RATE_LIMIT_MAX_RETRIES, 3),
        baseDelay: this.parseInt(process.env.RATE_LIMIT_BASE_DELAY, 1000),
        maxDelay: this.parseInt(process.env.RATE_LIMIT_MAX_DELAY, 30000),
        backoffMultiplier: this.parseFloat(
          process.env.RATE_LIMIT_BACKOFF_MULTIPLIER,
          2
        ),
      },
    };
  }

  private parseBoolean(
    value: string | undefined,
    defaultValue: boolean
  ): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private parseInt(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private parseFloat(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

// Export singleton instance
export const mapsConfig = MapsConfigManager.getInstance();
