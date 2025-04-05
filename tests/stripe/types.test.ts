import {
  StripeAggregationMethod,
  StripeUsageAction
} from '../../src/stripe/types';

describe('Stripe Types', () => {
  describe('StripeAggregationMethod', () => {
    it('should have the correct values', () => {
      expect(StripeAggregationMethod.SUM).toBe('sum');
      expect(StripeAggregationMethod.LAST_DURING_PERIOD).toBe('last_during_period');
      expect(StripeAggregationMethod.MAX).toBe('max');
      expect(StripeAggregationMethod.LAST_EVER).toBe('last_ever');
    });
  });

  describe('StripeUsageAction', () => {
    it('should have the correct values', () => {
      expect(StripeUsageAction.INCREMENT).toBe('increment');
      expect(StripeUsageAction.SET).toBe('set');
    });
  });
});
