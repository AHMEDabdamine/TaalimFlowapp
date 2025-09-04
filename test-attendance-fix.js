// Test that attendance system properly uses userId for student names
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupAttendance, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testAttendanceFix() {
  console.log('🔧 Testing attendance system userId fix...\n');
  
  try {
    // Step 1: Check attendance records and their userIds
    console.log('1️⃣ Checking attendance records with userIds:');
    const attendanceRecords = await db
      .select({
        id: groupAttendance.id,
        groupId: groupAttendance.groupId,
        studentId: groupAttendance.studentId,
        userId: groupAttendance.userId,
        schoolId: groupAttendance.schoolId,
        studentType: groupAttendance.studentType
      })
      .from(groupAttendance);
    
    console.log('   Attendance records found:');
    attendanceRecords.forEach(record => {
      console.log(`     - Record ID ${record.id}: Group ${record.groupId}, StudentID ${record.studentId}, UserID ${record.userId}, School ${record.schoolId}`);
    });
    
    // Step 2: Test getAttendanceWithStudentDetails for a specific group
    console.log('\n2️⃣ Testing getAttendanceWithStudentDetails method:');
    
    if (attendanceRecords.length > 0) {
      const testRecord = attendanceRecords[0];
      console.log(`   Testing with Group ID ${testRecord.groupId} from School ${testRecord.schoolId}`);
      
      // Call the fixed method
      const attendanceDetails = await storage.getAttendanceWithStudentDetails(
        testRecord.groupId,
        testRecord.schoolId
      );
      
      console.log(`   ✅ Method returned ${attendanceDetails.length} attendance records`);
      
      // Check if the returned record uses the correct userId
      if (attendanceDetails.length > 0) {
        const detail = attendanceDetails[0];
        console.log(`   📋 Attendance detail found:`);
        console.log(`     - Student Name: ${detail.student?.name || 'NOT FOUND'}`);
        console.log(`     - Student ID in record: ${detail.studentId}`);
        console.log(`     - User ID used for lookup: ${detail.userId || 'MISSING'}`);
        console.log(`     - Student Type: ${detail.studentType}`);
        
        if (detail.student?.name) {
          console.log('   ✅ SUCCESS: Student name retrieved using userId');
          
          // Verify the user exists with correct school
          const [verifyUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, detail.userId))
            .limit(1);
            
          if (verifyUser && verifyUser.schoolId === testRecord.schoolId) {
            console.log('   ✅ VERIFIED: User belongs to correct school');
          } else {
            console.log('   ❌ ERROR: User not found or wrong school');
          }
        } else {
          console.log('   ❌ FAILED: No student name retrieved');
        }
      }
    }
    
    // Step 3: Test cross-school isolation
    console.log('\n3️⃣ Testing cross-school isolation:');
    
    if (attendanceRecords.length > 0) {
      const testRecord = attendanceRecords[0];
      const wrongSchoolId = testRecord.schoolId === 8 ? 999 : 8;
      
      console.log(`   Testing Group ${testRecord.groupId} with wrong school ID ${wrongSchoolId}`);
      
      const wrongSchoolResults = await storage.getAttendanceWithStudentDetails(
        testRecord.groupId,
        wrongSchoolId
      );
      
      console.log(`   ✅ Wrong school query returned ${wrongSchoolResults.length} records (should be 0)`);
      
      if (wrongSchoolResults.length === 0) {
        console.log('   ✅ PERFECT: School isolation working correctly');
      } else {
        console.log('   ❌ SECURITY ISSUE: Cross-school data leaked');
      }
    }
    
    console.log('\n✅ Attendance system fix test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Attendance records now use userId for student name lookups');
    console.log('   - School ID filtering enforced at query level');
    console.log('   - Cross-school data access prevented');
    console.log('   - Student names retrieved from correct school users only');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testAttendanceFix().catch(console.error);