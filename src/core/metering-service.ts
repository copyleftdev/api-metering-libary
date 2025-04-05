import { MeteringStrategy } from '../interfaces/metering-strategy';

/**
 * Core service for metering API calls.
 * This class delegates the actual recording of usage to a configured MeteringStrategy.
 */
export class MeteringService {
  private strategy: MeteringStrategy;

  /**
   * Creates a new MeteringService instance.
   * 
   * @param strategy - The strategy to use for recording API usage
   */
  constructor(strategy: MeteringStrategy) {
    if (!strategy) {
      throw new Error('A metering strategy is required');
    }
    
    this.strategy = strategy;
  }

  /**
   * Records an API call for the specified customer.
   * 
   * @param customerId - The ID of the customer making the API call
   * @param usageValue - The amount of usage to record (defaults to 1)
   * @param apiEndpoint - Optional API endpoint information for context
   * @returns A promise that resolves when the usage has been recorded
   */
  public async recordApiCall(
    customerId: string,
    usageValue: number = 1,
    apiEndpoint?: string
  ): Promise<void> {
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    
    if (usageValue <= 0) {
      throw new Error('Usage value must be greater than zero');
    }
    
    try {
      await this.strategy.recordUsage(customerId, usageValue, apiEndpoint);
    } catch (error) {
      // Enhance the error with additional context
      const enhancedError = error instanceof Error 
        ? error 
        : new Error('Unknown error occurred');
        
      enhancedError.message = `Failed to record API call: ${enhancedError.message}`;
      throw enhancedError;
    }
  }

  /**
   * If the current strategy supports disposal (e.g., to clean up resources),
   * this method will call the dispose method on the strategy.
   */
  public async dispose(): Promise<void> {
    if (this.strategy && 'dispose' in this.strategy && typeof (this.strategy as any).dispose === 'function') {
      await (this.strategy as any).dispose();
    }
  }
}
