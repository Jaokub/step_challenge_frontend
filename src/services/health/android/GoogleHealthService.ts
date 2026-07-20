import {
  initialize,
  requestPermission,
  readRecords
} from 'react-native-health-connect';
import { TimeRangeFilter } from 'react-native-health-connect/lib/typescript/types/base.types';

/**
 * Permissions this app asks Health Connect for.
 *
 * `Steps` is REQUIRED — `HealthRecord.steps` is the ranking source of truth
 * for every leaderboard in the product. `Distance` and `TotalCaloriesBurned`
 * are display-only extras.
 *
 * Declared as one list so the grant check below can be derived from it.
 * The previous code hard-coded `granted.length == 4` while requesting only
 * three permissions — see initHealthConnect.
 */
const REQUIRED_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
] as const;

const OPTIONAL_PERMISSIONS = [
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
] as const;

const ALL_PERMISSIONS = [...REQUIRED_PERMISSIONS, ...OPTIONAL_PERMISSIONS];

type PermissionLike = { accessType?: string; recordType?: string };

const isGranted = (
  granted: PermissionLike[],
  want: { accessType: string; recordType: string }
) => granted.some((g) => g.recordType === want.recordType && g.accessType === want.accessType);

export class GoogleHealthService {
  private permissionGranted = false;

  //initialize health connect and request permission
  public initHealthConnect = async (): Promise<boolean> => {
    try {
      if(this.permissionGranted) return true;

      const isInitialized = await initialize();
      if (!isInitialized) {
        console.error('Failed to initialize Health Connect');
        return false;
      }

      const granted = (await requestPermission([...ALL_PERMISSIONS])) as PermissionLike[];

      // ⚠️ This check used to read `if (granted.length == 4)` while only
      // THREE permissions were requested — so it could never be true.
      // `requestPermission` resolves with the subset of the requested
      // permissions the user actually granted, so its length is capped at 3.
      // The result: initHealthConnect always returned false, syncTodayHealthData
      // bailed at its first step every single time, and NOTHING was ever
      // uploaded on Android. Fixed 2026-07-19.
      //
      // The check is now derived from the permission lists themselves, so
      // adding or removing a permission can't desync it again.
      const missingRequired = REQUIRED_PERMISSIONS.filter((p) => !isGranted(granted, p));
      if (missingRequired.length > 0) {
        console.warn(
          '[HealthConnect] Missing required permission(s):',
          missingRequired.map((p) => p.recordType).join(', ')
        );
        return false;
      }

      // Distance/calories are cosmetic. Failing the whole sync because the
      // user declined one of them would take the step leaderboard down with
      // it, so degrade instead: the getters already resolve to 0 on error.
      const missingOptional = OPTIONAL_PERMISSIONS.filter((p) => !isGranted(granted, p));
      if (missingOptional.length > 0) {
        console.warn(
          '[HealthConnect] Optional permission(s) not granted, those metrics will read 0:',
          missingOptional.map((p) => p.recordType).join(', ')
        );
      }

      this.permissionGranted = true;
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
      //console.log("Steps: ", stepRecords);
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
      //console.log("Distance: ", distanceRecords);
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
      //console.log("Calories: ", caloriesRecords);
      return +caloriesRecords.records.reduce((sum, r) => sum + (r.energy.inKilocalories || 0), 0).toFixed(2);
    } catch (error) {
      console.error('Error fetching Health Connect Data:', error);
    }
    return 0;
  }
}

export const googleHealthService = new GoogleHealthService();
