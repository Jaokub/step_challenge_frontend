import {
  initialize,
  requestPermission,
  readRecords
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

export class GoogleHealthService {

  //initialize health connect and request permission
  public initHealthConnect = async (): Promise<boolean> => {
    try {
      const isInitialized = await initialize();
      if (!isInitialized) {
        console.error('Failed to initialize Health Connect');
        return false;
      }

      const granted = await requestPermission([
        { accessType: "read", recordType: "Steps" },
        { accessType: "read", recordType: "Distance" },
        { accessType: "read", recordType: "TotalCaloriesBurned" },
      ]);
      console.log("Permissions status updated:", granted);
      if (granted.length == 3) console.log("Permissions granted");
      else console.log("Permissions not granted");
      return true;
    } catch (error) {
        console.error('Error initializing Health Connect:', error);
      }
      return false;
    };

  //fetch the data from health connect
  public getSteps = async (startTime: string, endTime: string): Promise<number> => {
    try {
      console.log(`Fetching steps from Google Health Connect between ${startTime} and ${endTime}...`);
      const timeRangeFilter: TimeRangeFilter = {
        operator: "between",
        startTime: startTime,
        endTime: endTime
      }
      console.log("timeRangeFilter: ",timeRangeFilter);
      const stepRecords = await readRecords("Steps", { timeRangeFilter });
      console.log("Steps: ", stepRecords);
      return stepRecords.records.reduce((sum, r) => sum + (r.count || 0), 0);
    } catch (error) {
      console.error('Error fetching Health Connect Data:', error);
    }
    return 0;
  };

  public getDistance = async (startTime: string, endTime: string): Promise<number> => {
    try {
      console.log(`Fetching distance from Google Health Connect between ${startTime} and ${endTime}...`);
      const timeRangeFilter: TimeRangeFilter = {
        operator: "between",
        startTime: startTime,
        endTime: endTime
      }
      console.log("timeRangeFilter: ",timeRangeFilter);
      const distanceRecords = await readRecords("Distance", { timeRangeFilter });
      console.log("Distance: ", distanceRecords);
      return +distanceRecords.records.reduce((sum, r) => sum + (r.distance.inKilometers || 0), 0).toFixed(2);
    } catch (error) {
      console.error('Error fetching Health Connect Data:', error);
    }
    return 0;
  };

  public getCalories = async (startTime: string, endTime: string): Promise<number> => {
    try {
      console.log(`Fetching calories from Google Health Connect between ${startTime} and ${endTime}...`);
      const timeRangeFilter: TimeRangeFilter = {
        operator: "between",
        startTime: startTime,
        endTime: endTime
      }
      console.log("timeRangeFilter: ",timeRangeFilter);
      const caloriesRecords = await readRecords("TotalCaloriesBurned", { timeRangeFilter });
      console.log("Calories: ", caloriesRecords);
      return +caloriesRecords.records.reduce((sum, r) => sum + (r.energy.inKilocalories || 0), 0).toFixed(2);
    } catch (error) {
      console.error('Error fetching Health Connect Data:', error);
    }
    return 0;
  }
}

export const googleHealthService = new GoogleHealthService();
