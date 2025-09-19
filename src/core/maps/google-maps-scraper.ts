import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';

export interface ScraperConfig {
  headless?: boolean;
  timeout?: number;
  maxRetries?: number;
  respectRobots?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
}

export interface ScrapedBusinessResult {
  name: string;
  address: string;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  website?: string;
  businessUrl?: string;
}

export interface ScrapedBusinessDetails {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  hours?: string[];
  rating?: number;
  reviewCount?: number;
  priceLevel?: string;
  photos?: string[];
}

export class GoogleMapsScraper {
  private readonly config: Required<ScraperConfig>;
  private browser: Browser | null = null;

  constructor(config: ScraperConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      respectRobots: config.respectRobots ?? true,
      userAgent:
        config.userAgent ??
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: config.viewport ?? { width: 1920, height: 1080 },
    };
  }

  async searchBusinesses(
    query: string,
    location: string
  ): Promise<ScrapedBusinessResult[]> {
    if (!query || query.trim() === '') {
      throw new Error('Query is required');
    }

    if (!location || location.trim() === '') {
      throw new Error('Location is required');
    }

    if (this.config.respectRobots) {
      const allowed = await this.respectRobotsTxt();
      if (!allowed) {
        throw new Error('Scraping not allowed by robots.txt');
      }
    }

    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    try {
      await this.setupPage(page);

      const searchUrl = this.buildSearchUrl(query, location);
      await page.goto(searchUrl, { waitUntil: 'networkidle' });

      // Wait for search results to load
      await page.waitForSelector('[data-value="Search results"]', {
        timeout: this.config.timeout,
      });

      // Extract business data
      const businesses = await page.evaluate(() => {
        const results: any[] = [];
        const businessElements = document.querySelectorAll('[data-result-index]');

        businessElements.forEach((element) => {
          try {
            const nameElement = element.querySelector('[data-value="Business name"]');
            const addressElement = element.querySelector('[data-value="Address"]');
            const ratingElement = element.querySelector('[data-value="Rating"]');
            const reviewsElement = element.querySelector('[data-value="Reviews"]');
            const phoneElement = element.querySelector('[data-value="Phone"]');
            const websiteElement = element.querySelector('[data-value="Website"]');
            const linkElement = element.querySelector('a[href*="/place/"]');

            const name = nameElement?.textContent?.trim();
            const address = addressElement?.textContent?.trim();

            if (name && address) {
              results.push({
                name,
                address,
                rating: ratingElement?.textContent?.trim(),
                reviewCount: reviewsElement?.textContent?.trim()?.replace(/[^\d]/g, ''),
                phone: phoneElement?.textContent?.trim(),
                website: websiteElement?.getAttribute('href'),
                businessUrl: linkElement?.getAttribute('href'),
              });
            }
          } catch (error) {
            console.warn('Error extracting business data:', error);
          }
        });

        return results;
      });

      return this.mapScrapedResults(businesses);
    } finally {
      await page.close();
    }
  }

  async getBusinessDetails(businessUrl: string): Promise<ScrapedBusinessDetails> {
    if (!businessUrl || businessUrl.trim() === '') {
      throw new Error('Business URL is required');
    }

    const browser = await this.launchBrowser();
    const page = await browser.newPage();

    try {
      await this.setupPage(page);
      await page.goto(businessUrl, { waitUntil: 'networkidle' });

      // Wait for business details to load
      await page.waitForSelector('[data-value="Business name"]', {
        timeout: this.config.timeout,
      });

      const details = await page.evaluate(() => {
        try {
          const nameElement = document.querySelector('[data-value="Business name"]');
          const addressElement = document.querySelector('[data-value="Address"]');
          const phoneElement = document.querySelector('[data-value="Phone"]');
          const websiteElement = document.querySelector('[data-value="Website"]');
          const ratingElement = document.querySelector('[data-value="Rating"]');
          const reviewsElement = document.querySelector('[data-value="Reviews"]');
          const hoursElements = document.querySelectorAll('[data-value*="hours"]');
          const priceLevelElement = document.querySelector('[data-value="Price level"]');
          const photoElements = document.querySelectorAll('[data-value="Photo"] img');

          return {
            name: nameElement?.textContent?.trim(),
            address: addressElement?.textContent?.trim(),
            phone: phoneElement?.textContent?.trim(),
            website: websiteElement?.getAttribute('href'),
            rating: ratingElement?.textContent?.trim(),
            reviewCount: reviewsElement?.textContent?.trim()?.replace(/[^\d]/g, ''),
            hours: Array.from(hoursElements).map((el) => el.textContent?.trim()).filter(Boolean),
            priceLevel: priceLevelElement?.textContent?.trim(),
            photos: Array.from(photoElements).map((img: any) => img.src).filter(Boolean),
          };
        } catch (error) {
          console.warn('Error extracting business details:', error);
          return null;
        }
      });

      if (!details) {
        throw new Error('Business details not found');
      }

      return this.mapScrapedDetails(details);
    } finally {
      await page.close();
    }
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async launchBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  private async setupPage(page: Page): Promise<void> {
    await page.setUserAgent(this.config.userAgent);
    await page.setViewportSize(this.config.viewport);

    // Set reasonable timeouts
    page.setDefaultTimeout(this.config.timeout);
    page.setDefaultNavigationTimeout(this.config.timeout);

    // Block unnecessary resources to speed up scraping
    await page.route('**/*', (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  private buildSearchUrl(query: string, location: string): string {
    const searchQuery = encodeURIComponent(`${query} ${location}`);
    return `https://www.google.com/maps/search/${searchQuery.replace(/%20/g, '+')}`;
  }

  private mapScrapedResults(results: any[]): ScrapedBusinessResult[] {
    return results
      .filter((result) => this.isValidScrapedResult(result))
      .map((result) => ({
        name: result.name,
        address: result.address,
        rating: result.rating ? parseFloat(result.rating) : undefined,
        reviewCount: result.reviewCount ? parseInt(result.reviewCount) : undefined,
        phone: result.phone || undefined,
        website: result.website || undefined,
        businessUrl: result.businessUrl || undefined,
      }));
  }

  private mapScrapedDetails(details: any): ScrapedBusinessDetails {
    return {
      name: details.name,
      address: details.address,
      phone: details.phone || undefined,
      website: details.website || undefined,
      hours: details.hours || undefined,
      rating: details.rating ? parseFloat(details.rating) : undefined,
      reviewCount: details.reviewCount ? parseInt(details.reviewCount) : undefined,
      priceLevel: details.priceLevel || undefined,
      photos: details.photos || undefined,
    };
  }

  private isValidScrapedResult(result: any): boolean {
    return result && result.name && result.address;
  }

  private async respectRobotsTxt(): Promise<boolean> {
    try {
      const response = await axios.get('https://www.google.com/robots.txt', {
        timeout: 5000,
      });

      const robotsTxt = response.data;

      // Check if our user agent is disallowed from /maps
      if (robotsTxt.includes('Disallow: /maps')) {
        return false;
      }

      // Check for general disallow rules that might affect us
      const lines = robotsTxt.split('\n');
      let isOurSection = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('User-agent:')) {
          const userAgent = trimmedLine.split(':')[1]?.trim();
          isOurSection = userAgent === '*' || userAgent === 'GoogleBot';
        }

        if (isOurSection && trimmedLine.startsWith('Disallow:')) {
          const disallowedPath = trimmedLine.split(':')[1]?.trim();
          if (disallowedPath === '/maps' || disallowedPath === '/') {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      // If we can't fetch robots.txt, assume it's safe to proceed
      console.warn('Could not fetch robots.txt:', error);
      return true;
    }
  }
}