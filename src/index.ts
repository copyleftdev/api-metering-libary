/**
 * API Metering Library for Stripe
 * A TypeScript library for tracking and metering API calls using Stripe's billing APIs
 */

// Export main components
import { MeteringService } from './core/metering-service';
import { MeteringServiceFactory } from './factories/metering-service-factory';
import { ImmediateMeterEventStrategy } from './stripe/immediate-meter-event-strategy';
import { BatchedUsageRecordStrategy } from './stripe/batched-usage-record-strategy';

// Export interfaces
import { MeteringStrategy } from './interfaces/metering-strategy';
import { 
  BaseConfig,
  ImmediateMeterEventConfig, 
  BatchedUsageRecordConfig,
  MeteringConfig
} from './interfaces/config';

// Export types
import { 
  StripeAggregationMethod, 
  StripeUsageAction
} from './stripe/types';

// Export errors
import {
  MeteringError,
  ConfigurationError,
  StripeApiError,
  InvalidInputError,
  DependencyError
} from './types/errors';

// Re-export all components
export {
  // Core
  MeteringService,
  MeteringServiceFactory,
  
  // Strategies
  MeteringStrategy,
  ImmediateMeterEventStrategy,
  BatchedUsageRecordStrategy,
  
  // Configuration
  BaseConfig,
  ImmediateMeterEventConfig,
  BatchedUsageRecordConfig,
  MeteringConfig,
  
  // Types
  StripeAggregationMethod,
  StripeUsageAction,
  
  // Errors
  MeteringError,
  ConfigurationError,
  StripeApiError,
  InvalidInputError,
  DependencyError
};
