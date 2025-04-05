import { jest } from '@jest/globals';
import { ImmediateMeterEventStrategy } from '../../src/stripe/immediate-meter-event-strategy';
import { InvalidInputError, StripeApiError } from '../../src/types/errors';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    billingPortal: {
      meterEvents: {
        create: jest.fn().mockImplementation((params: any, options: any) => {
          if (params.customer === 'cus_error') {
            throw new Error('Stripe API error');
          }
          return Promise.resolve({ id: 'meter_event_123' });
        })
      }
    }
  }));
});

describe('ImmediateMeterEventStrategy', () => {
  const mockConfig = {
    stripeApiKey: 'sk_test_mockkey',
    strategyType: 'immediate' as const,
    idempotencyKeyPrefix: 'test_prefix'
  };
  
  let strategy: ImmediateMeterEventStrategy;
  let stripeMock: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh instance of the mock
    stripeMock = require('stripe');
    strategy = new ImmediateMeterEventStrategy(mockConfig);
  });
  
  describe('constructor', () => {
    it('should initialize with the provided configuration', () => {
      expect(stripeMock).toHaveBeenCalledWith('sk_test_mockkey', {
        apiVersion: '2023-10-16'
      });
      
      expect((strategy as any).idempotencyKeyPrefix).toBe('test_prefix');
    });
    
    it('should use default idempotency key prefix if not provided', () => {
      const defaultStrategy = new ImmediateMeterEventStrategy({
        stripeApiKey: 'sk_test_mockkey',
        strategyType: 'immediate'
      });
      
      // The implementation generates a random ID, so just check it's a string
      expect(typeof (defaultStrategy as any).idempotencyKeyPrefix).toBe('string');
    });
    
    it('should throw an error if Stripe API key is not provided', () => {
      expect(() => new ImmediateMeterEventStrategy({
        stripeApiKey: '',
        strategyType: 'immediate'
      })).toThrow('Stripe API key is required');
    });
  });
  
  describe('recordUsage', () => {
    it('should throw an error if customer ID is not provided', async () => {
      await expect(strategy.recordUsage('', 1)).rejects.toThrow(
        new InvalidInputError('Customer ID is required')
      );
    });
    
    it('should throw an error if usage value is not positive', async () => {
      await expect(strategy.recordUsage('cus_123', 0)).rejects.toThrow(
        new InvalidInputError('Usage value must be greater than zero')
      );
      
      await expect(strategy.recordUsage('cus_123', -1)).rejects.toThrow(
        new InvalidInputError('Usage value must be greater than zero')
      );
    });
    
    it('should call Stripe API with the correct parameters', async () => {
      const createMeter = stripeMock.mock.results[0].value.billingPortal.meterEvents.create;
      
      await strategy.recordUsage('cus_123', 2, '/api/data');
      
      expect(createMeter).toHaveBeenCalled();
      
      const callArgs = createMeter.mock.calls[0][0];
      expect(callArgs.customer).toBe('cus_123');
      expect(callArgs.value).toBe(2);
      expect(callArgs.metadata.api_endpoint).toBe('/api/data');
    });
    
    it('should use default endpoint description if not provided', async () => {
      const createMeter = stripeMock.mock.results[0].value.billingPortal.meterEvents.create;
      
      await strategy.recordUsage('cus_123', 1);
      
      expect(createMeter).toHaveBeenCalled();
      
      const callArgs = createMeter.mock.calls[0][0];
      expect(callArgs.customer).toBe('cus_123');
      expect(callArgs.value).toBe(1);
      expect(callArgs.metadata.api_endpoint).toBe('not_specified');
    });
    
    it('should handle and enhance Stripe API errors', async () => {
      // Use toThrowError matcher with regex instead of exact message
      await expect(strategy.recordUsage('cus_error', 1)).rejects.toThrow(StripeApiError);
      
      // Check that the error message contains the expected text
      await expect(strategy.recordUsage('cus_error', 1)).rejects.toThrow(
        /Failed to record meter event for customer cus_error/
      );
    });
  });
});
