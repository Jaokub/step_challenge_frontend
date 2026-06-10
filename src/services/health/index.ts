import { Platform } from 'react-native';
import { appleHealthService } from './ios/AppleHealthService';
import { googleHealthService } from './android/GoogleHealthService';

/**
 * Main Health Service facade that automatically routes 
 * function calls to the correct platform implementation.
 */
export const HealthService = {
  /**
   * Initialize and request health permissions for the current platform
   */
  init: async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      return appleHealthService.initHealthKit();
    } else if (Platform.OS === 'android') {
      return googleHealthService.initHealthConnect();
    }
    console.warn('HealthService: Unsupported platform');
    return false;
  },
  
  /**
   * Get step count for a specific date range
   */
  getSteps: async (startDate: Date, endDate: Date): Promise<number> => {
    if (Platform.OS === 'ios') {
      return appleHealthService.getSteps(startDate, endDate);
    } else if (Platform.OS === 'android') {
      return googleHealthService.getSteps(startDate, endDate);
    }
    console.warn('HealthService: Unsupported platform');
    return 0;
  }
};
