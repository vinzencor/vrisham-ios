import { where } from 'firebase/firestore';
import { queryDocuments } from './firestore';
import { Pincode } from './schema';

export interface PincodeValidationResult {
  isServiceable: boolean;
  deliveryCharge?: number;
  areaName?: string;
  branchCode?: string;
  branchName?: string;
  error?: string;
}

/**
 * Validate if a pincode is serviceable and get delivery charges
 */
export const validatePincode = async (pincode: string): Promise<PincodeValidationResult> => {
  try {
    console.log(`Validating pincode: ${pincode}`);
    
    // Query the Pincodes collection for the given pincode
    const pincodeData = await queryDocuments<Pincode>(
      'Pincodes',
      where('pincode', '==', pincode)
    );

    if (pincodeData.length === 0) {
      return {
        isServiceable: false,
        error: 'Sorry, we do not deliver to this pincode yet.'
      };
    }

    // Get the first matching pincode (should be unique)
    const pincodeInfo = pincodeData[0];

    return {
      isServiceable: true,
      deliveryCharge: pincodeInfo.deliveryCharge,
      areaName: pincodeInfo.areaName,
      branchCode: pincodeInfo.branchCode,
      branchName: pincodeInfo.branchName
    };

  } catch (error) {
    console.error('Error validating pincode:', error);
    return {
      isServiceable: false,
      error: 'Failed to validate pincode. Please try again.'
    };
  }
};

/**
 * Get delivery charge for a specific pincode
 */
export const getDeliveryCharge = async (pincode: string): Promise<number | null> => {
  try {
    const result = await validatePincode(pincode);
    return result.isServiceable ? result.deliveryCharge || 0 : null;
  } catch (error) {
    console.error('Error getting delivery charge:', error);
    return null;
  }
};

/**
 * Get all serviceable pincodes
 */
export const getAllServiceablePincodes = async (): Promise<Pincode[]> => {
  try {
    return await queryDocuments<Pincode>('Pincodes');
  } catch (error) {
    console.error('Error fetching serviceable pincodes:', error);
    return [];
  }
};
