import { MeteringService } from '../core/metering-service';
import { MeteringStrategy } from '../interfaces/metering-strategy';
import { 
  MeteringConfig,
  ImmediateMeterEventConfig, 
  BatchedUsageRecordConfig 
} from '../interfaces/config';
import { ConfigurationError } from '../types/errors';
import { ImmediateMeterEventStrategy } from '../stripe/immediate-meter-event-strategy';
import { BatchedUsageRecordStrategy } from '../stripe/batched-usage-record-strategy';

/**
 * Factory class for creating MeteringService instances with appropriate strategies
 * based on the provided configuration.
 */
export class MeteringServiceFactory {
  /**
   * Creates a MeteringService with a strategy based on the provided configuration
   * @param config Configuration object for the metering service
   * @returns A configured MeteringService instance
   */
  public static createService(config: MeteringConfig): MeteringService {
    if (!config) {
      throw new ConfigurationError('Configuration is required');
    }

    if (!config.stripeApiKey) {
      throw new ConfigurationError('Stripe API key is required');
    }

    let strategy: MeteringStrategy;

    // Create the appropriate strategy based on the strategy type
    if (config.strategyType === 'immediate') {
      strategy = this.createImmediateStrategy(config);
    } else if (config.strategyType === 'batched') {
      strategy = this.createBatchedStrategy(config);
    } else {
      throw new ConfigurationError(`Unknown strategy type: ${(config as any).strategyType}`);
    }

    // Create and return the MeteringService with the selected strategy
    return new MeteringService(strategy);
  }

  /**
   * Creates an immediate meter event strategy
   * @param config Configuration for immediate meter event strategy
   * @returns Configured ImmediateMeterEventStrategy
   */
  private static createImmediateStrategy(config: ImmediateMeterEventConfig): ImmediateMeterEventStrategy {
    return new ImmediateMeterEventStrategy(config);
  }

  /**
   * Creates a batched usage record strategy
   * @param config Configuration for batched usage record strategy
   * @returns Configured BatchedUsageRecordStrategy
   */
  private static createBatchedStrategy(config: BatchedUsageRecordConfig): BatchedUsageRecordStrategy {
    return new BatchedUsageRecordStrategy(config);
  }
}
