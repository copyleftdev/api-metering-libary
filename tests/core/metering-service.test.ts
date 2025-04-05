import { MeteringService } from '../../src/core/metering-service';
import { MockMeteringStrategy } from '../mocks/mock-metering-strategy';

describe('MeteringService', () => {
  let mockStrategy: MockMeteringStrategy;
  let meteringService: MeteringService;

  beforeEach(() => {
    mockStrategy = new MockMeteringStrategy();
    meteringService = new MeteringService(mockStrategy);
  });

  it('should create a MeteringService instance', () => {
    expect(meteringService).toBeInstanceOf(MeteringService);
  });

  it('should throw an error if initialized without a strategy', () => {
    expect(() => new MeteringService(null as any)).toThrow('A metering strategy is required');
  });

  describe('recordApiCall', () => {
    it('should record API call with default usage value', async () => {
      await meteringService.recordApiCall('customer123');
      
      expect(mockStrategy.recordedUsage).toHaveLength(1);
      expect(mockStrategy.recordedUsage[0]).toEqual({
        customerId: 'customer123',
        usageValue: 1,
        apiEndpoint: undefined
      });
    });

    it('should record API call with custom usage value', async () => {
      await meteringService.recordApiCall('customer123', 5);
      
      expect(mockStrategy.recordedUsage).toHaveLength(1);
      expect(mockStrategy.recordedUsage[0]).toEqual({
        customerId: 'customer123',
        usageValue: 5,
        apiEndpoint: undefined
      });
    });

    it('should record API call with custom usage value and API endpoint', async () => {
      await meteringService.recordApiCall('customer123', 3, '/api/data');
      
      expect(mockStrategy.recordedUsage).toHaveLength(1);
      expect(mockStrategy.recordedUsage[0]).toEqual({
        customerId: 'customer123',
        usageValue: 3,
        apiEndpoint: '/api/data'
      });
    });

    it('should throw an error if customerId is not provided', async () => {
      await expect(meteringService.recordApiCall('')).rejects.toThrow('Customer ID is required');
      await expect(meteringService.recordApiCall(null as any)).rejects.toThrow('Customer ID is required');
      await expect(meteringService.recordApiCall(undefined as any)).rejects.toThrow('Customer ID is required');
    });

    it('should throw an error if usageValue is not positive', async () => {
      await expect(meteringService.recordApiCall('customer123', 0)).rejects.toThrow('Usage value must be greater than zero');
      await expect(meteringService.recordApiCall('customer123', -1)).rejects.toThrow('Usage value must be greater than zero');
    });

    it('should propagate errors from the strategy with enhanced context', async () => {
      mockStrategy.shouldThrow = true;
      mockStrategy.errorMessage = 'Strategy failed';
      
      await expect(meteringService.recordApiCall('customer123')).rejects.toThrow('Failed to record API call: Strategy failed');
    });

    it('should handle non-Error objects thrown by the strategy', async () => {
      mockStrategy.recordUsage = jest.fn().mockImplementation(() => {
        throw 'String error'; // Non-Error object
      });
      
      await expect(meteringService.recordApiCall('customer123')).rejects.toThrow('Failed to record API call: Unknown error occurred');
    });
  });

  describe('dispose', () => {
    it('should call dispose on the strategy if available', async () => {
      const disposeSpy = jest.spyOn(mockStrategy, 'dispose');
      
      await meteringService.dispose();
      
      expect(disposeSpy).toHaveBeenCalledTimes(1);
    });

    it('should not throw an error if strategy does not have dispose method', async () => {
      const strategyWithoutDispose = {
        recordUsage: async () => {}
      };
      
      const service = new MeteringService(strategyWithoutDispose as any);
      
      await expect(service.dispose()).resolves.not.toThrow();
    });

    it('should not throw if dispose is not a function', async () => {
      const strategyWithNonFunctionDispose = {
        recordUsage: async () => {},
        dispose: 'not a function'
      };
      
      const service = new MeteringService(strategyWithNonFunctionDispose as any);
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
