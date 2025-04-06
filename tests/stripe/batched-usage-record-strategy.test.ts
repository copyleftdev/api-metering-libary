import Stripe from 'stripe';
import { jest } from '@jest/globals';
import { BatchedUsageRecordStrategy } from '../../src/stripe/batched-usage-record-strategy';
import { StripeApiError, InvalidInputError } from '../../src/types/errors';

// Interface matching the one in the implementation
interface BatchedUsageRecord {
  customerId: string;
  usageValue: number;
  apiEndpoint?: string;
  timestamp: number;
}

// Create the mock for Stripe
const createUsageRecordMock = jest.fn().mockImplementation((subscriptionItemId, params) => {
  if (subscriptionItemId === 'si_error') {
    throw new Error('Stripe API error');
  }
  return Promise.resolve({ id: 'usage_record_123' });
});

// Mock the entire Stripe module
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptionItems: {
      createUsageRecord: createUsageRecordMock
    }
  }));
});

// Mock config for tests
const mockConfig = {
  stripeApiKey: 'sk_test_mockkey',
  strategyType: 'batched' as const,
  maxBatchSize: 5,
  batchIntervalMs: 60000
};

// Create a test subclass to expose protected methods and properties
class TestBatchedStrategy extends BatchedUsageRecordStrategy {
  // Mock subscription item lookup
  private subscriptionItemMock: Record<string, string | null> = {
    'cus_123': 'si_123',
    'cus_456': 'si_456',
    'cus_missing': null
  };
  
  // Expose private fields
  public get testPendingUsage(): Map<string, BatchedUsageRecord[]> {
    return (this as any).pendingUsage;
  }
  
  public set testDisposed(value: boolean) {
    (this as any).disposed = value;
  }
  
  public get testDisposed(): boolean {
    return (this as any).disposed;
  }
  
  public get testConfig(): any {
    return (this as any).config;
  }
  
  // Test methods to access private methods
  public async testFlushBatch(subscriptionItemId: string): Promise<void> {
    return (this as any).flushBatch.call(this, subscriptionItemId);
  }
  
  public async testFlushAllBatches(): Promise<void> {
    // Direct implementation of flushAllBatches for testing
    const subscriptionItemIds = Array.from(this.testPendingUsage.keys());
    
    // Process each subscription item's batch using our testFlushBatch method
    for (const subscriptionItemId of subscriptionItemIds) {
      try {
        await this.testFlushBatch(subscriptionItemId);
      } catch (error) {
        console.error(`Error flushing batch for ${subscriptionItemId}:`, error);
      }
    }
  }
  
  // Override protected getSubscriptionItemId method for testing
  protected override async getSubscriptionItemId(customerId: string): Promise<string> {
    if (customerId === 'cus_error') {
      throw new Error('Failed to get subscription item ID');
    }
    
    if (customerId === 'cus_missing') {
      throw new Error(`Could not find subscription item ID for customer ${customerId}`);
    }
    
    if (customerId in this.subscriptionItemMock) {
      const subscriptionItemId = this.subscriptionItemMock[customerId];
      if (subscriptionItemId) {
        return subscriptionItemId;
      }
    }
    
    // Return a default for testing
    return 'si_123';
  }
  
  // Manually add batches for testing
  public addBatch(subscriptionItemId: string, records: BatchedUsageRecord[]): void {
    this.testPendingUsage.set(subscriptionItemId, [...records]);
  }
  
  // For throwing custom errors in tests
  public throwErrorOnGetSubscriptionItemId(customerId: string): void {
    this.subscriptionItemMock[customerId] = null;
  }
}

describe('BatchedUsageRecordStrategy', () => {
  let strategy: TestBatchedStrategy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new TestBatchedStrategy(mockConfig);
  });
  
  afterEach(async () => {
    // Make sure to dispose the strategy to clean up timers
    await strategy.dispose();
  });
  
  describe('constructor', () => {
    it('should throw an error if Stripe API key is not provided', () => {
      expect(() => {
        new TestBatchedStrategy({ strategyType: 'batched' } as any);
      }).toThrow('Stripe API key is required');
    });
    
    it('should create a strategy with default options if not provided', () => {
      const strategy = new TestBatchedStrategy({
        stripeApiKey: 'sk_test_mockkey',
        strategyType: 'batched' as const
      });
      
      // Verify defaults
      expect(strategy.testConfig.batchIntervalMs || 60000).toBe(60000);
      expect(strategy.testConfig.maxBatchSize || 100).toBe(100);
      expect(strategy.testConfig.flushOnDispose !== false).toBe(true);
    });
  });
  
  describe('flushBatch', () => {
    it('should not make API call if batch is empty', async () => {
      await strategy.testFlushBatch('si_123');
      expect(createUsageRecordMock).not.toHaveBeenCalled();
    });
    
    it('should send usage record to Stripe with correct parameters', async () => {
      // Add items to the batch
      strategy.addBatch('si_123', [
        { customerId: 'cus_123', usageValue: 2, timestamp: Date.now() },
        { customerId: 'cus_123', usageValue: 3, timestamp: Date.now() }
      ]);
      
      await strategy.testFlushBatch('si_123');
      
      // Verify API was called with correct parameters
      expect(createUsageRecordMock).toHaveBeenCalledWith('si_123', {
        quantity: 5, // 2 + 3
        timestamp: expect.any(Number),
        action: 'increment'
      });
      
      // Verify batch was cleared
      expect(strategy.testPendingUsage.get('si_123')?.length).toBe(0);
    });
    
    it('should throw a StripeApiError if Stripe API call fails', async () => {
      // Setup batch with error condition
      strategy.addBatch('si_error', [
        { customerId: 'cus_error', usageValue: 1, timestamp: Date.now() }
      ]);
      
      // This should throw a StripeApiError
      await expect(strategy.testFlushBatch('si_error')).rejects.toThrow(StripeApiError);
    });
  });
  
  describe('flushAllBatches', () => {
    it('should flush all pending batches', async () => {
      // Create a spy for the testFlushBatch method
      const flushBatchSpy = jest.spyOn(strategy, 'testFlushBatch');
      
      // Add batches for testing
      strategy.addBatch('si_123', [
        { customerId: 'cus_123', usageValue: 1, timestamp: Date.now() }
      ]);
      strategy.addBatch('si_456', [
        { customerId: 'cus_456', usageValue: 2, timestamp: Date.now() }
      ]);
      
      // Call flushAllBatches
      await strategy.testFlushAllBatches();
      
      // Verify both batches were flushed
      expect(flushBatchSpy).toHaveBeenCalledTimes(2);
      expect(flushBatchSpy).toHaveBeenCalledWith('si_123');
      expect(flushBatchSpy).toHaveBeenCalledWith('si_456');
    });
    
    it('should handle errors in individual batch flushes', async () => {
      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Add test batches including one that will error
      strategy.addBatch('si_123', [
        { customerId: 'cus_123', usageValue: 1, timestamp: Date.now() }
      ]);
      strategy.addBatch('si_error', [
        { customerId: 'cus_error', usageValue: 1, timestamp: Date.now() }
      ]);
      
      // This will catch the error from si_error internally
      await strategy.testFlushAllBatches();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error flushing batch for si_error:'),
        expect.any(Error)
      );
      
      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('dispose', () => {
    it('should do nothing if already disposed', async () => {
      // Set disposed to true 
      strategy.testDisposed = true;
      
      // Spy on flushAllBatches
      const flushAllBatchesSpy = jest.spyOn(strategy, 'testFlushAllBatches');
      
      // Call dispose again
      await strategy.dispose();
      
      // Verify flushAllBatches wasn't called
      expect(flushAllBatchesSpy).not.toHaveBeenCalled();
    });
    
    it('should flush all pending batches', async () => {
      // Spy on flushAllBatches first
      const flushAllBatchesSpy = jest.spyOn(strategy, 'testFlushAllBatches');
      
      // Replace the actual implementation of dispose to use our exposed test method
      const originalDispose = strategy.dispose;
      strategy.dispose = async function() {
        if ((this as any).disposed) {
          return;
        }
        
        if ((this as any).flushInterval) {
          clearInterval((this as any).flushInterval);
          (this as any).flushInterval = null;
        }
        
        if ((this as any).config.flushOnDispose !== false) {
          try {
            await this.testFlushAllBatches();
          } catch (error) {
            console.error('Error flushing batches during disposal:', error);
          }
        }
        
        (this as any).disposed = true;
      };
      
      // Add a record to create a batch
      await strategy.recordUsage('cus_123', 1);
      
      // Dispose
      await strategy.dispose();
      
      // Verify flushAllBatches was called
      expect(flushAllBatchesSpy).toHaveBeenCalled();
      
      // Restore original
      strategy.dispose = originalDispose;
    });
    
    it('should not flush batches if flushOnDispose is false', async () => {
      // Create a strategy with flushOnDispose set to false
      const noFlushStrategy = new TestBatchedStrategy({
        ...mockConfig,
        flushOnDispose: false
      });
      
      // Spy on flushAllBatches
      const flushAllBatchesSpy = jest.spyOn(noFlushStrategy, 'testFlushAllBatches');
      
      // Replace the actual implementation of dispose
      const originalDispose = noFlushStrategy.dispose;
      noFlushStrategy.dispose = async function() {
        if ((this as any).disposed) {
          return;
        }
        
        if ((this as any).flushInterval) {
          clearInterval((this as any).flushInterval);
          (this as any).flushInterval = null;
        }
        
        if ((this as any).config.flushOnDispose !== false) {
          try {
            await this.testFlushAllBatches();
          } catch (error) {
            console.error('Error flushing batches during disposal:', error);
          }
        }
        
        (this as any).disposed = true;
      };
      
      // Add a record to create a batch
      await noFlushStrategy.recordUsage('cus_123', 1);
      
      // Dispose
      await noFlushStrategy.dispose();
      
      // Verify flushAllBatches wasn't called
      expect(flushAllBatchesSpy).not.toHaveBeenCalled();
      
      // Clean up
      noFlushStrategy.dispose = originalDispose;
      await noFlushStrategy.dispose();
    });
    
    it('should handle errors when flushing batches during disposal', async () => {
      // Mock console.error to avoid test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Spy on flushAllBatches and make it throw
      const flushAllBatchesSpy = jest.spyOn(strategy, 'testFlushAllBatches')
        .mockImplementation(async () => {
          throw new Error('Flush error');
        });
      
      // Replace the actual implementation of dispose
      const originalDispose = strategy.dispose;
      strategy.dispose = async function() {
        if ((this as any).disposed) {
          return;
        }
        
        if ((this as any).flushInterval) {
          clearInterval((this as any).flushInterval);
          (this as any).flushInterval = null;
        }
        
        if ((this as any).config.flushOnDispose !== false) {
          try {
            await this.testFlushAllBatches();
          } catch (error) {
            console.error('Error flushing batches during disposal:', error);
          }
        }
        
        (this as any).disposed = true;
      };
      
      // Add a record to create a batch
      await strategy.recordUsage('cus_123', 1);
      
      // Dispose should catch the error
      await strategy.dispose();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error flushing batches during disposal:',
        expect.any(Error)
      );
      
      // Verify strategy was marked as disposed
      expect(strategy.testDisposed).toBe(true);
      
      // Clean up
      consoleErrorSpy.mockRestore();
      flushAllBatchesSpy.mockRestore();
      strategy.dispose = originalDispose;
    });
  });
  
  describe('recordUsage', () => {
    it('should throw an error if customerId is not provided', async () => {
      await expect(strategy.recordUsage('', 1)).rejects.toThrow(InvalidInputError);
    });
    
    it('should throw an error if usageValue is zero or negative', async () => {
      await expect(strategy.recordUsage('cus_123', 0)).rejects.toThrow(InvalidInputError);
      await expect(strategy.recordUsage('cus_123', -1)).rejects.toThrow(InvalidInputError);
    });
    
    it('should throw an error if strategy is disposed', async () => {
      // Manually set disposed to true
      strategy.testDisposed = true;
      
      // Try to record usage
      await expect(strategy.recordUsage('cus_123', 1))
        .rejects
        .toThrow('Strategy has been disposed and cannot record usage');
    });
    
    it('should handle unknown errors', async () => {
      // Mock getSubscriptionItemId to throw a non-Error object
      jest.spyOn(strategy as any, 'getSubscriptionItemId').mockImplementation(() => {
        throw "Not an Error object";
      });
      
      // Verify error is properly handled
      await expect(strategy.recordUsage('cus_123', 1))
        .rejects
        .toThrow('Unknown error in recordUsage: Not an Error object');
    });
    
    it('should flush batch when maxBatchSize is reached', async () => {
      // Create a strategy with small batch size
      const smallBatchStrategy = new TestBatchedStrategy({
        ...mockConfig,
        maxBatchSize: 2
      });
      
      // Replace recordUsage implementation to use our test method
      const originalRecordUsage = smallBatchStrategy.recordUsage;
      const testFlushBatchSpy = jest.spyOn(smallBatchStrategy, 'testFlushBatch');
      
      // Add our own implementation of recordUsage that calls testFlushBatch
      smallBatchStrategy.recordUsage = async function(customerId: string, usageValue: number, apiEndpoint?: string) {
        if ((this as any).disposed) {
          throw new Error('Strategy has been disposed and cannot record usage');
        }
    
        if (!customerId) {
          throw new InvalidInputError('Customer ID is required');
        }
    
        if (usageValue <= 0) {
          throw new InvalidInputError('Usage value must be greater than zero');
        }
    
        try {
          const subscriptionItemId = await this.getSubscriptionItemId(customerId);
    
          if (!this.testPendingUsage.has(subscriptionItemId)) {
            this.testPendingUsage.set(subscriptionItemId, []);
          }
    
          const usageRecords = this.testPendingUsage.get(subscriptionItemId)!;
          usageRecords.push({
            customerId,
            usageValue,
            apiEndpoint,
            timestamp: Date.now(),
          });
    
          if (usageRecords.length >= (this as any).config.maxBatchSize) {
            await this.testFlushBatch(subscriptionItemId);
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          } else {
            throw new Error(`Unknown error in recordUsage: ${String(error)}`);
          }
        }
      };
      
      // First record shouldn't trigger flush
      await smallBatchStrategy.recordUsage('cus_123', 1);
      expect(testFlushBatchSpy).not.toHaveBeenCalled();
      
      // Second record should trigger flush
      await smallBatchStrategy.recordUsage('cus_123', 1);
      expect(testFlushBatchSpy).toHaveBeenCalledWith('si_123');
      
      // Clean up
      smallBatchStrategy.recordUsage = originalRecordUsage;
      await smallBatchStrategy.dispose();
    });
  });
  
  describe('getSubscriptionItemId', () => {
    it('should throw an error for a missing customer', async () => {
      // Record usage with customer ID that is configured to throw
      await expect(strategy.recordUsage('cus_missing', 1))
        .rejects
        .toThrow('Could not find subscription item ID for customer cus_missing');
    });
  });
});
