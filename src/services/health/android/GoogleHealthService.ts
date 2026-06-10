/*
import {
  initialize,
  requestPermission,
  readRecords,
  Permission
} from 'react-native-health-connect';
*/

export class GoogleHealthService {
  // เปิดโหมดจำลองข้อมูล (Mock) ไว้เป็น true ก่อน
  private useMockData = true;

  /**
   * Request permissions to access Google Health Connect data
   */
  async initHealthConnect(): Promise<boolean> {
    console.log('Initializing Google Health Connect...');
    
    if (this.useMockData) {
      console.log('✅ [MOCK] Google Health Connect Permission Granted');
      return true;
    }

    /*
    try {
      const isInitialized = await initialize();
      if (!isInitialized) {
        console.error('Failed to initialize Health Connect');
        return false;
      }

      const permissions: Permission[] = [
        { accessType: 'read', recordType: 'Steps' }
      ];

      const granted = await requestPermission(permissions);
      return granted.length > 0;
    } catch (error) {
      console.error('Error initializing Health Connect:', error);
      return false;
    }
    */
    return false;
  }

  /**
   * Fetch step count data from Google Health Connect
   */
  async getSteps(startDate: Date, endDate: Date): Promise<number> {
    console.log(`Fetching steps from Google Health Connect between ${startDate.toISOString()} and ${endDate.toISOString()}...`);
    
    if (this.useMockData) {
      const mockSteps = Math.floor(Math.random() * 5000) + 3000;
      console.log(`🚶‍♂️ [MOCK] กลับค่าจำลอง: ${mockSteps} ก้าว`);
      return mockSteps;
    }

    /*
    try {
      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const totalSteps = result.records.reduce((sum, record) => sum + record.count, 0);
      return totalSteps;
    } catch (error) {
      console.error('Error fetching steps from Health Connect:', error);
      return 0;
    }
    */
    return 0;
  }
}

export const googleHealthService = new GoogleHealthService();
