export interface RateLimiterConfig {
  requestsPerSecond?: number;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export class ExponentialBackoffRateLimiter {
  private readonly requestsPerSecond: number;
  private readonly maxRetries: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly backoffMultiplier: number;
  private readonly requestQueue: Array<{
    resolve: () => void;
    timestamp: number;
  }> = [];
  private processing = false;

  constructor(config: RateLimiterConfig = {}) {
    this.requestsPerSecond = config.requestsPerSecond || 10;
    this.maxRetries = config.maxRetries || 3;
    this.baseDelay = config.baseDelay || 1000; // 1 second
    this.maxDelay = config.maxDelay || 30000; // 30 seconds
    this.backoffMultiplier = config.backoffMultiplier || 2;
  }

  async waitForNextRequest(): Promise<void> {
    return new Promise((resolve) => {
      this.requestQueue.push({
        resolve,
        timestamp: Date.now(),
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    this.processing = true;
    const interval = 1000 / this.requestsPerSecond;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        request.resolve();
        await this.delay(interval);
      }
    }

    this.processing = false;
  }

  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable (rate limit, network error, etc.)
      if (this.isRetryableError(error)) {
        const delay = Math.min(
          this.baseDelay * Math.pow(this.backoffMultiplier, retryCount),
          this.maxDelay
        );

        await this.delay(delay);
        return this.retryWithBackoff(operation, retryCount + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on rate limits, timeouts, and network errors
    if (error?.response?.status === 429) return true; // Rate limit
    if (error?.response?.status === 503) return true; // Service unavailable
    if (error?.response?.status === 504) return true; // Gateway timeout
    if (error?.code === 'ECONNRESET') return true; // Network reset
    if (error?.code === 'ETIMEDOUT') return true; // Timeout
    if (error?.message?.includes('timeout')) return true; // Generic timeout
    if (error?.message?.includes('network')) return true; // Network error

    return false;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get queue status for monitoring
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    requestsPerSecond: number;
  } {
    return {
      queueLength: this.requestQueue.length,
      processing: this.processing,
      requestsPerSecond: this.requestsPerSecond,
    };
  }
}