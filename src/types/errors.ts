/**
 * Base error class for the API metering library.
 * Provides additional context for errors that occur within the library.
 */
export class MeteringError extends Error {
  /**
   * Creates a new MeteringError instance.
   * 
   * @param message - Error message
   * @param cause - The underlying cause of the error (optional)
   */
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'MeteringError';
    
    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when there's an issue with the configuration.
 */
export class ConfigurationError extends MeteringError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when there's an issue with the Stripe API.
 */
export class StripeApiError extends MeteringError {
  /**
   * The Stripe error code, if available.
   */
  public readonly stripeCode?: string;
  
  /**
   * The HTTP status code from the Stripe API response, if available.
   */
  public readonly statusCode?: number;

  constructor(
    message: string, 
    stripeError?: any, 
    cause?: Error
  ) {
    super(message, cause);
    this.name = 'StripeApiError';
    
    // Extract Stripe-specific error details if available
    if (stripeError) {
      this.stripeCode = stripeError.code;
      this.statusCode = stripeError.statusCode;
    }
  }
}

/**
 * Error thrown when an invalid input is provided.
 */
export class InvalidInputError extends MeteringError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'InvalidInputError';
  }
}

/**
 * Error thrown when a required dependency is missing.
 */
export class DependencyError extends MeteringError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'DependencyError';
  }
}
