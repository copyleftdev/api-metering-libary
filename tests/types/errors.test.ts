import {
  MeteringError,
  ConfigurationError,
  StripeApiError,
  InvalidInputError,
  DependencyError
} from '../../src/types/errors';

describe('Error Types', () => {
  describe('MeteringError', () => {
    it('should create a basic error with correct properties', () => {
      const error = new MeteringError('Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('MeteringError');
      expect(error.message).toBe('Test error message');
      expect(error.cause).toBeUndefined();
    });

    it('should store the cause of the error', () => {
      const cause = new Error('Cause error');
      const error = new MeteringError('Test error message', cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('ConfigurationError', () => {
    it('should create a configuration error with correct properties', () => {
      const error = new ConfigurationError('Invalid configuration');
      
      expect(error).toBeInstanceOf(MeteringError);
      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Invalid configuration');
    });

    it('should store the cause of the error', () => {
      const cause = new Error('Cause error');
      const error = new ConfigurationError('Invalid configuration', cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('StripeApiError', () => {
    it('should create a Stripe API error with correct properties', () => {
      const error = new StripeApiError('Stripe API failed');
      
      expect(error).toBeInstanceOf(MeteringError);
      expect(error.name).toBe('StripeApiError');
      expect(error.message).toBe('Stripe API failed');
      expect(error.stripeCode).toBeUndefined();
      expect(error.statusCode).toBeUndefined();
    });

    it('should store Stripe error details', () => {
      const stripeError = {
        code: 'resource_missing',
        statusCode: 404
      };
      
      const error = new StripeApiError('Stripe API failed', stripeError);
      
      expect(error.stripeCode).toBe('resource_missing');
      expect(error.statusCode).toBe(404);
    });

    it('should store the cause of the error', () => {
      const cause = new Error('Cause error');
      const error = new StripeApiError('Stripe API failed', null, cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('InvalidInputError', () => {
    it('should create an invalid input error with correct properties', () => {
      const error = new InvalidInputError('Invalid input value');
      
      expect(error).toBeInstanceOf(MeteringError);
      expect(error.name).toBe('InvalidInputError');
      expect(error.message).toBe('Invalid input value');
    });

    it('should store the cause of the error', () => {
      const cause = new Error('Cause error');
      const error = new InvalidInputError('Invalid input value', cause);
      
      expect(error.cause).toBe(cause);
    });
  });

  describe('DependencyError', () => {
    it('should create a dependency error with correct properties', () => {
      const error = new DependencyError('Missing dependency');
      
      expect(error).toBeInstanceOf(MeteringError);
      expect(error.name).toBe('DependencyError');
      expect(error.message).toBe('Missing dependency');
    });

    it('should store the cause of the error', () => {
      const cause = new Error('Cause error');
      const error = new DependencyError('Missing dependency', cause);
      
      expect(error.cause).toBe(cause);
    });
  });
});
