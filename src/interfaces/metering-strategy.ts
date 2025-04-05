/**
 * Interface for defining metering strategies used by the MeteringService.
 * Each strategy provides a different approach to reporting API usage to Stripe.
 */
export interface MeteringStrategy {
  /**
   * Records usage of an API call for a specific customer.
   * 
   * @param customerId - The identifier of the customer making the API call
   * @param usageValue - The amount of usage to record (e.g., 1 for a single call)
   * @param apiEndpoint - Optional endpoint information for context
   * @returns A promise that resolves when the usage has been recorded
   */
  recordUsage(
    customerId: string, 
    usageValue: number, 
    apiEndpoint?: string
  ): Promise<void>;
}
