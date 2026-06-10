export class AppleHealthService {
  // เปิดโหมดจำลองข้อมูล (Mock) ไว้เป็น true ก่อนระหว่างรอ Apple Dev Account
  private useMockData = true;

  /**
   * Request permissions to access Apple HealthKit data
   */
  async initHealthKit(): Promise<boolean> {
    console.log('Initializing Apple HealthKit...');
    
    if (this.useMockData) {
      console.log('✅ [MOCK] HealthKit Permission Granted');
      return true;
    }

    /* 
    // TODO: โค้ดของจริงที่จะใช้เมื่อมี Dev Account และติดตั้ง react-native-health แล้ว
    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [AppleHealthKit.Constants.Permissions.StepCount]
        },
      };
      AppleHealthKit.initHealthKit(permissions, (err) => {
        if (err) {
          console.error('Error initializing Healthkit: ', err);
          resolve(false);
        }
        resolve(true);
      });
    });
    */
    return true;
  }

  /**
   * Fetch step count data from Apple Health
   */
  async getSteps(startDate: Date, endDate: Date): Promise<number> {
    console.log(`Fetching steps from Apple Health between ${startDate.toISOString()} and ${endDate.toISOString()}...`);
    
    if (this.useMockData) {
      // คืนค่าข้อมูลก้าวเดินจำลอง เพื่อเอาไปทำ UI ต่อได้เลย
      const mockSteps = Math.floor(Math.random() * 5000) + 3000; // สุ่ม 3000 - 8000 ก้าว
      console.log(`🚶‍♂️ [MOCK] กลับค่าจำลอง: ${mockSteps} ก้าว`);
      return mockSteps;
    }

    /*
    // TODO: โค้ดของจริงสำหรับดึงข้อมูล
    return new Promise((resolve, reject) => {
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      AppleHealthKit.getDailyStepCountSamples(options, (err, results) => {
        if (err) {
          return reject(err);
        }
        // รวมจำนวนก้าวทั้งหมดที่ดึงมาได้
        const totalSteps = results.reduce((sum, item) => sum + item.value, 0);
        resolve(totalSteps);
      });
    });
    */
    return 0;
  }
}

export const appleHealthService = new AppleHealthService();
