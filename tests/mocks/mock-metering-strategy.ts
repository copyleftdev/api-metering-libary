import { MeteringStrategy } from '../../src/interfaces/metering-strategy';

/**
 * Mock implementation of the MeteringStrategy interface for testing
 */
export class MockMeteringStrategy implements MeteringStrategy {
  public recordedUsage: Array<{
    customerId: string;
    usageValue: number;
    apiEndpoint?: string;
  }> = [];
  
  public shouldThrow = false;
  public errorMessage = 'Mock strategy error';
  
  /**
   * Records usage by storing it in the recordedUsage array
   */
  public async recordUsage(
    customerId: string,
    usageValue: number,
    apiEndpoint?: string
  ): Promise<void> {
    if (this.shouldThrow) {
      throw new Error(this.errorMessage);
    }
    
    this.recordedUsage.push({
      customerId,
      usageValue,
      apiEndpoint
    });
  }
  
  /**
   * Mock implementation of dispose method for testing
   */
  public async dispose(): Promise<void> {
    if (this.shouldThrow) {
      throw new Error(this.errorMessage);
    }
  }
}
