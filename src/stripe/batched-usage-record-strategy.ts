import Stripe from 'stripe';
import { MeteringStrategy } from '../interfaces/metering-strategy';
import { BatchedUsageRecordConfig } from '../interfaces/config';
import { InvalidInputError, StripeApiError } from '../types/errors';
import { StripeUsageAction } from './types';

/**
 * BatchedUsageRecord represents a usage record that has been batched but not yet sent to Stripe
 */
interface BatchedUsageRecord {
  customerId: string;
  usageValue: number;
  apiEndpoint?: string;
  timestamp: number;
}

/**
 * Implementation of MeteringStrategy that batches API usage records to be sent to Stripe
 * at regular intervals or when the batch size reaches a configured maximum.
 * 
 * This strategy is suitable for high-volume API metering where sending each call
 * individually would create too many API requests to Stripe.
 */
export class BatchedUsageRecordStrategy implements MeteringStrategy {
  private readonly stripe: Stripe;
  private readonly batchIntervalMs: number;
  private readonly maxBatchSize: number;
  private readonly flushOnDispose: boolean;
  private readonly pendingUsage: Map<string, BatchedUsageRecord[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private disposed = false;

  /**
   * Creates a new instance of BatchedUsageRecordStrategy
   * @param config Configuration for the strategy
   */
  constructor(private readonly config: BatchedUsageRecordConfig) {
    if (!config.stripeApiKey) {
      throw new Error('Stripe API key is required');
    }

    // Initialize Stripe client
    this.stripe = new Stripe(config.stripeApiKey, {
      apiVersion: '2023-10-16', // Using a fixed API version for stability
    });

    // Set configuration values or use defaults
    this.batchIntervalMs = config.batchIntervalMs || 60000; // Default 1 minute
    this.maxBatchSize = config.maxBatchSize || 100; // Default 100 records
    this.flushOnDispose = config.flushOnDispose !== false; // Default true

    // Set up the interval for regularly flushing the batched usage
    this.flushInterval = setInterval(() => {
      this.flushAllBatches().catch(error => {
        console.error('Error flushing batched usage:', error);
      });
    }, this.batchIntervalMs);
    
    // Unref the timer to prevent it from keeping the process alive
    if (this.flushInterval.unref) {
      this.flushInterval.unref();
    }
  }

  /**
   * Records API usage for a customer by adding it to the batch
   * @param customerId The Stripe customer ID
   * @param usageValue The value to record (usually 1 for a single API call)
   * @param apiEndpoint Optional API endpoint information for better tracking
   * @returns Promise that resolves when the usage is added to the batch or the batch is flushed
   */
  async recordUsage(customerId: string, usageValue: number, apiEndpoint?: string): Promise<void> {
    if (this.disposed) {
      throw new Error('Strategy has been disposed and cannot record usage');
    }

    if (!customerId) {
      throw new InvalidInputError('Customer ID is required');
    }

    if (usageValue <= 0) {
      throw new InvalidInputError('Usage value must be greater than zero');
    }

    try {
      // Get the subscription item ID for this customer
      // In a real implementation, you would have a way to retrieve or store this mapping
      const subscriptionItemId = await this.getSubscriptionItemId(customerId);

      // Add the usage record to the batch
      if (!this.pendingUsage.has(subscriptionItemId)) {
        this.pendingUsage.set(subscriptionItemId, []);
      }

      const usageRecords = this.pendingUsage.get(subscriptionItemId)!;
      usageRecords.push({
        customerId,
        usageValue,
        apiEndpoint,
        timestamp: Date.now(),
      });

      // If the batch size has reached the maximum, flush it
      if (usageRecords.length >= this.maxBatchSize) {
        await this.flushBatch(subscriptionItemId);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error in recordUsage: ${String(error)}`);
      }
    }
  }

  /**
   * Disposes of resources used by this strategy
   * If flushOnDispose is true, it will attempt to flush all batched usage before disposing
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    // Clear the interval to prevent more flushes
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Flush all batched usage if configured to do so
    if (this.flushOnDispose) {
      try {
        await this.flushAllBatches();
      } catch (error) {
        console.error('Error flushing batches during disposal:', error);
      }
    }

    this.disposed = true;
  }

  /**
   * This method must be implemented to resolve a customer ID to a subscription item ID.
   * In a real implementation, this would likely query the Stripe API to find the
   * appropriate subscription item for the customer.
   * 
   * @param customerId The customer ID to resolve
   * @returns Promise resolving to the subscription item ID
   */
  protected async getSubscriptionItemId(customerId: string): Promise<string> {
    throw new Error('Subscription item ID resolution is not implemented in this example');
  }

  /**
   * Flushes all batched usage records for all subscription items
   */
  private async flushAllBatches(): Promise<void> {
    const subscriptionItemIds = Array.from(this.pendingUsage.keys());
    
    // Process each subscription item's batch
    for (const subscriptionItemId of subscriptionItemIds) {
      try {
        await this.flushBatch(subscriptionItemId);
      } catch (error) {
        console.error(`Error flushing batch for ${subscriptionItemId}:`, error);
      }
    }
  }

  /**
   * Flushes batched usage records for a specific subscription item
   * @param subscriptionItemId The Stripe subscription item ID
   */
  private async flushBatch(subscriptionItemId: string): Promise<void> {
    const usageRecords = this.pendingUsage.get(subscriptionItemId);
    
    // If there are no records, nothing to do
    if (!usageRecords || usageRecords.length === 0) {
      return;
    }

    try {
      // Calculate the total usage value for this batch
      const totalUsage = usageRecords.reduce((sum, record) => sum + record.usageValue, 0);
      
      // Send the aggregated usage record to Stripe
      await this.stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity: totalUsage,
          timestamp: Math.floor(Date.now() / 1000), // Current time in seconds
          action: StripeUsageAction.INCREMENT,
        }
      );

      // Clear the batch after successful submission
      usageRecords.length = 0;
    } catch (error: unknown) {
      // Enhance error with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stripeError = error as { code?: string; statusCode?: number };
      const errorDetails = stripeError.code && stripeError.statusCode 
        ? { code: stripeError.code, statusCode: stripeError.statusCode } 
        : null;
      
      throw new StripeApiError(
        `Failed to flush usage records for subscription item ${subscriptionItemId}: ${errorMessage}`,
        errorDetails,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
