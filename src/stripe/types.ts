/**
 * Types related to Stripe API interactions
 */

/**
 * The supported aggregation methods for Stripe meters
 */
export enum StripeAggregationMethod {
  SUM = 'sum',
  LAST_DURING_PERIOD = 'last_during_period',
  MAX = 'max',
  LAST_EVER = 'last_ever'
}

/**
 * The supported actions for usage records
 */
export enum StripeUsageAction {
  INCREMENT = 'increment',
  SET = 'set'
}

/**
 * Parameters for creating a Stripe meter event
 */
export interface StripeMeterEventParams {
  /**
   * Name of the event
   */
  event_name: string;
  
  /**
   * The ID of the customer this usage belongs to
   */
  customer: string;
  
  /**
   * The value of the usage
   */
  value: number;
  
  /**
   * Optional timestamp for the meter event
   */
  created?: number;
}

/**
 * Parameters for creating a usage record
 */
export interface StripeUsageRecordParams {
  /**
   * The ID of the subscription item this usage belongs to
   */
  subscription_item: string;
  
  /**
   * The quantity of usage
   */
  quantity: number;
  
  /**
   * The action to take for this usage record
   */
  action?: StripeUsageAction;
  
  /**
   * Optional timestamp for the usage record
   */
  timestamp?: number;
}
