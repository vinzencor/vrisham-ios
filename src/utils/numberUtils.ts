/**
 * Utility functions for number formatting and precision handling
 * Fixes floating point precision issues in quantity and price calculations
 */

/**
 * Rounds a number to a specified number of decimal places
 * Fixes JavaScript floating point precision issues
 */
export const roundToDecimals = (num: number, decimals: number = 2): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Format quantity to avoid floating point precision issues
 * @param quantity - The quantity to format
 * @param maxDecimals - Maximum number of decimal places (default: 2)
 * @returns Formatted quantity as a number
 */
export const formatQuantity = (quantity: number, maxDecimals: number = 2): number => {
  return roundToDecimals(quantity, maxDecimals);
};

/**
 * Format quantity for display with proper decimal handling
 * @param quantity - The quantity to format
 * @param maxDecimals - Maximum number of decimal places (default: 2)
 * @returns Formatted quantity as a string
 */
export const formatQuantityDisplay = (quantity: number, maxDecimals: number = 2): string => {
  if (isNaN(quantity) || !isFinite(quantity)) return '0';

  const formatted = formatQuantity(quantity, maxDecimals);

  // Remove trailing zeros after decimal point
  if (formatted % 1 === 0) {
    return formatted.toString();
  }

  return formatted.toFixed(maxDecimals).replace(/\.?0+$/, '');
};

/**
 * Safely add quantities with proper precision handling
 * @param a - First quantity
 * @param b - Second quantity
 * @param maxDecimals - Maximum number of decimal places (default: 2)
 * @returns Sum with proper precision
 */
export const addQuantities = (a: number, b: number, maxDecimals: number = 2): number => {
  return roundToDecimals(a + b, maxDecimals);
};

/**
 * Safely subtract quantities with proper precision handling
 * @param a - First quantity
 * @param b - Second quantity
 * @param maxDecimals - Maximum number of decimal places (default: 2)
 * @returns Difference with proper precision
 */
export const subtractQuantities = (a: number, b: number, maxDecimals: number = 2): number => {
  return roundToDecimals(a - b, maxDecimals);
};

/**
 * Safely multiply numbers with proper decimal handling
 */
export const safeMultiply = (a: number, b: number, decimals: number = 2): number => {
  return roundToDecimals(a * b, decimals);
};

/**
 * Safely divide numbers with proper decimal handling
 */
export const safeDivide = (a: number, b: number, decimals: number = 2): number => {
  if (b === 0) return 0;
  return roundToDecimals(a / b, decimals);
};

/**
 * Format currency amount with proper decimal handling
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || !isFinite(amount)) return '₹0.00';

  const formatted = roundToDecimals(amount, 2);
  return `₹${formatted.toFixed(2)}`;
};

/**
 * Format price for display with currency symbol
 */
export const formatPrice = (price: number, currency: string = '₹'): string => {
  if (isNaN(price) || !isFinite(price)) return `${currency}0.00`;

  const formatted = roundToDecimals(price, 2);
  return `${currency}${formatted.toFixed(2)}`;
};

/**
 * Ensures a number is safe for calculations (not NaN or Infinity)
 */
export const ensureSafeNumber = (value: any, fallback: number = 0): number => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};
