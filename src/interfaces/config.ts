/**
 * Common configuration properties for all metering strategies
 */
export interface BaseConfig {
  /**
   * Stripe API key used for authentication
   */
  stripeApiKey: string;
  
  /**
   * Optional API version to use with Stripe
   * @default '2023-10-16'
   */
  stripeApiVersion?: string;
}

/**
 * Configuration for immediate meter event strategy
 */
export interface ImmediateMeterEventConfig extends BaseConfig {
  /**
   * Type of strategy
   */
  strategyType: 'immediate';
  
  /**
   * Optional prefix for idempotency keys to prevent duplicate events
   * If not provided, a random prefix will be generated
   */
  idempotencyKeyPrefix?: string;
}

/**
 * Configuration for batched usage record strategy
 */
export interface BatchedUsageRecordConfig extends BaseConfig {
  /**
   * Type of strategy
   */
  strategyType: 'batched';
  
  /**
   * Interval in milliseconds for flushing batched records
   * @default 60000 (1 minute)
   */
  batchIntervalMs?: number;
  
  /**
   * Maximum size of batch before flushing
   * @default 100
   */
  maxBatchSize?: number;
  
  /**
   * Whether to flush pending records when dispose is called
   * @default true
   */
  flushOnDispose?: boolean;
}

/**
 * Union type for all metering strategy configurations
 */
export type MeteringConfig = ImmediateMeterEventConfig | BatchedUsageRecordConfig;
