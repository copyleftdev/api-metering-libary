/**
 * Basic usage example for the API Metering Library
 */
import { MeteringServiceFactory } from '../factories/metering-service-factory';

// Example function to demonstrate integration in an API handler
async function apiEndpointExample() {
  // Replace with your actual Stripe API key
  const stripeApiKey = 'sk_test_your_stripe_api_key';
  
  // Create a metering service with the immediate strategy
  const meteringService = MeteringServiceFactory.createService({
    stripeApiKey,
    strategyType: 'immediate',
    meterEventName: 'api_call'
  });
  
  // Customer ID from your application
  const customerId = 'cus_example123';
  
  try {
    // Record an API call with default usage (1)
    await meteringService.recordApiCall(customerId);
    console.log('Successfully recorded API usage for customer:', customerId);
    
    // Record an API call with custom usage and endpoint context
    await meteringService.recordApiCall(
      customerId, 
      5, // Record 5 units of usage
      '/api/data/query' // The endpoint being called
    );
    console.log('Successfully recorded 5 units of API usage for customer:', customerId);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to record API usage:', error);
    return { success: false, error };
  }
}

// Example function demonstrating a batched usage scenario
async function batchedUsageExample() {
  // Replace with your actual Stripe API key
  const stripeApiKey = 'sk_test_your_stripe_api_key';
  
  // Create a metering service with the batched strategy
  const meteringService = MeteringServiceFactory.createService({
    stripeApiKey,
    strategyType: 'batched',
    batchIntervalMs: 30000, // 30 seconds
    maxBatchSize: 50
  });
  
  // Record multiple API calls for different customers
  try {
    await meteringService.recordApiCall('cus_customer1');
    await meteringService.recordApiCall('cus_customer2', 3);
    await meteringService.recordApiCall('cus_customer1', 2, '/api/data/search');
    
    console.log('Successfully queued API usage for multiple customers');
    
    // When shutting down your application, dispose the service to ensure all pending usage is reported
    await meteringService.dispose();
    console.log('Successfully disposed metering service');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to record or flush API usage:', error);
    return { success: false, error };
  }
}

// These examples would be called from your actual application code
// apiEndpointExample();
// batchedUsageExample();

export { apiEndpointExample, batchedUsageExample };
