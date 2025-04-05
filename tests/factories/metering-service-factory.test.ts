import { MeteringServiceFactory } from '../../src/factories/metering-service-factory';
import { ImmediateMeterEventStrategy } from '../../src/stripe/immediate-meter-event-strategy';
import { BatchedUsageRecordStrategy } from '../../src/stripe/batched-usage-record-strategy';
import { MeteringService } from '../../src/core/metering-service';
import { ConfigurationError } from '../../src/types/errors';

// Mock the strategy classes to avoid actual Stripe API calls
jest.mock('../../src/stripe/immediate-meter-event-strategy');
jest.mock('../../src/stripe/batched-usage-record-strategy');

describe('MeteringServiceFactory', () => {
  const validImmediateConfig = {
    stripeApiKey: 'sk_test_123',
    strategyType: 'immediate' as const,
    idempotencyKeyPrefix: 'test_prefix'
  };

  const validBatchedConfig = {
    stripeApiKey: 'sk_test_123',
    strategyType: 'batched' as const,
    batchIntervalMs: 30000,
    maxBatchSize: 50
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createService', () => {
    it('should throw an error when config is not provided', () => {
      // @ts-ignore - testing invalid input
      expect(() => MeteringServiceFactory.createService(null)).toThrow(
        new ConfigurationError('Configuration is required')
      );
    });

    it('should throw an error when Stripe API key is missing', () => {
      expect(() => MeteringServiceFactory.createService({
        // @ts-ignore - testing invalid input
        strategyType: 'immediate',
        stripeApiKey: ''
      })).toThrow(
        new ConfigurationError('Stripe API key is required')
      );
    });

    it('should throw an error for unknown strategy type', () => {
      expect(() => MeteringServiceFactory.createService({
        // @ts-ignore - testing invalid input
        strategyType: 'invalid',
        stripeApiKey: 'sk_test_123'
      })).toThrow(
        new ConfigurationError('Unknown strategy type: invalid')
      );
    });

    it('should create service with immediate strategy when configured', () => {
      const service = MeteringServiceFactory.createService(validImmediateConfig);
      
      expect(service).toBeInstanceOf(MeteringService);
      expect(ImmediateMeterEventStrategy).toHaveBeenCalledWith(validImmediateConfig);
    });

    it('should create service with batched strategy when configured', () => {
      const service = MeteringServiceFactory.createService(validBatchedConfig);
      
      expect(service).toBeInstanceOf(MeteringService);
      expect(BatchedUsageRecordStrategy).toHaveBeenCalledWith(validBatchedConfig);
    });
  });

  describe('createImmediateStrategy', () => {
    it('should create an ImmediateMeterEventStrategy instance', () => {
      const strategy = MeteringServiceFactory['createImmediateStrategy'](validImmediateConfig);
      
      expect(strategy).toBeInstanceOf(ImmediateMeterEventStrategy);
    });
  });

  describe('createBatchedStrategy', () => {
    it('should create a BatchedUsageRecordStrategy instance', () => {
      const strategy = MeteringServiceFactory['createBatchedStrategy'](validBatchedConfig);
      
      expect(strategy).toBeInstanceOf(BatchedUsageRecordStrategy);
    });
  });
});
