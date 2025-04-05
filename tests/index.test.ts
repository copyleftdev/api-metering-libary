import * as apiMetering from '../src/index';

describe('API Metering Library exports', () => {
  it('should export core service components', () => {
    expect(apiMetering.MeteringService).toBeDefined();
    expect(typeof apiMetering.MeteringService).toBe('function');
  });

  it('should export factory', () => {
    expect(apiMetering.MeteringServiceFactory).toBeDefined();
    expect(typeof apiMetering.MeteringServiceFactory).toBe('function');
    expect(apiMetering.MeteringServiceFactory.createService).toBeDefined();
  });

  it('should export strategy implementations', () => {
    expect(apiMetering.ImmediateMeterEventStrategy).toBeDefined();
    expect(apiMetering.BatchedUsageRecordStrategy).toBeDefined();
    expect(typeof apiMetering.ImmediateMeterEventStrategy).toBe('function');
    expect(typeof apiMetering.BatchedUsageRecordStrategy).toBe('function');
  });

  it('should export Stripe types and enums', () => {
    expect(apiMetering.StripeAggregationMethod).toBeDefined();
    expect(apiMetering.StripeUsageAction).toBeDefined();
    expect(apiMetering.StripeAggregationMethod.SUM).toBe('sum');
    expect(apiMetering.StripeUsageAction.INCREMENT).toBe('increment');
  });

  it('should export error types', () => {
    expect(apiMetering.MeteringError).toBeDefined();
    expect(apiMetering.ConfigurationError).toBeDefined();
    expect(apiMetering.StripeApiError).toBeDefined();
    expect(apiMetering.InvalidInputError).toBeDefined();
    expect(apiMetering.DependencyError).toBeDefined();
    expect(apiMetering.ConfigurationError.prototype instanceof apiMetering.MeteringError).toBe(true);
  });
});
