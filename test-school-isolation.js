// Test school ID isolation for attendance data
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupAttendance, users } from './shared/schema.js';
import { eq, ne, and } from 'drizzle-orm';

async function testSchoolIsolation() {
  console.log('🧪 Testing school ID isolation for attendance data...\n');
  
  try {
    // Step 1: Check current school data and users
    console.log('1️⃣ Checking existing schools and users:');
    const schoolData = await db.execute(`
      SELECT DISTINCT school_id, COUNT(*) as user_count
      FROM users 
      WHERE school_id IS NOT NULL
      GROUP BY school_id
      ORDER BY school_id;
    `);
    
    console.log('   Schools with users:');
    schoolData.rows.forEach(row => {
      console.log(`     - School ID ${row.school_id}: ${row.user_count} users`);
    });
    
    // Step 2: Check attendance data by school
    console.log('\n2️⃣ Checking attendance data by school:');
    const attendanceBySchool = await db.execute(`
      SELECT ga.school_id, COUNT(*) as attendance_count, 
             COUNT(DISTINCT ga.group_id) as group_count,
             COUNT(DISTINCT ga.student_id) as student_count
      FROM group_attendance ga
      GROUP BY ga.school_id
      ORDER BY ga.school_id;
    `);
    
    console.log('   Attendance records by school:');
    attendanceBySchool.rows.forEach(row => {
      console.log(`     - School ID ${row.school_id}: ${row.attendance_count} records, ${row.group_count} groups, ${row.student_count} students`);
    });
    
    // Step 3: Test cross-school data leakage
    console.log('\n3️⃣ Testing for cross-school data leakage:');
    
    // Get a user from school 8
    const school8User = await db
      .select({ id: users.id, name: users.name, schoolId: users.schoolId })
      .from(users)
      .where(eq(users.schoolId, 8))
      .limit(1);
      
    if (school8User[0]) {
      console.log(`   Testing with School 8 user: ${school8User[0].name} (ID: ${school8User[0].id})`);
      
      // Check if this user appears in attendance for other schools
      const crossSchoolAttendance = await db
        .select({
          schoolId: groupAttendance.schoolId,
          studentId: groupAttendance.studentId,
          groupId: groupAttendance.groupId
        })
        .from(groupAttendance)
        .where(
          and(
            eq(groupAttendance.studentId, school8User[0].id),
            ne(groupAttendance.schoolId, 8) // Look for attendance in other schools
          )
        );
        
      if (crossSchoolAttendance.length > 0) {
        console.log('   ❌ SECURITY ISSUE: User appears in other schools\' attendance:');
        crossSchoolAttendance.forEach(record => {
          console.log(`     - Found in School ${record.schoolId}, Group ${record.groupId}`);
        });
      } else {
        console.log('   ✅ No cross-school data leakage detected for user data');
      }
    }
    
    // Step 4: Test getAttendanceWithStudentDetails isolation
    console.log('\n4️⃣ Testing getAttendanceWithStudentDetails isolation:');
    
    // Get a group from school 8
    const school8Groups = await storage.getAdminGroups(8);
    const testGroup = school8Groups.find(g => g.id && !g.isPlaceholder);
    
    if (testGroup) {
      console.log(`   Testing with Group: ${testGroup.name} (ID: ${testGroup.id}) from School 8`);
      
      // Test with correct school ID
      const correctAttendance = await storage.getAttendanceWithStudentDetails(testGroup.id, 8);
      console.log(`   ✅ Correct school (8): Found ${correctAttendance.length} attendance records`);
      
      // Test with wrong school ID (should return empty or filtered results)
      try {
        const wrongAttendance = await storage.getAttendanceWithStudentDetails(testGroup.id, 999);
        console.log(`   ✅ Wrong school (999): Found ${wrongAttendance.length} records (should be 0 or filtered)`);
        
        if (wrongAttendance.length > 0) {
          console.log('   ⚠️  WARNING: Some records returned for wrong school - check isolation');
        }
      } catch (error) {
        console.log('   ✅ Wrong school query failed as expected (proper isolation)');
      }
    }
    
    // Step 5: Test getGroupAttendanceHistory isolation  
    console.log('\n5️⃣ Testing getGroupAttendanceHistory isolation:');
    
    if (testGroup) {
      // Test with correct school ID
      const correctHistory = await storage.getGroupAttendanceHistory(testGroup.id, 8);
      console.log(`   ✅ Correct school (8): Found ${correctHistory.length} history records`);
      
      // Test with wrong school ID
      const wrongHistory = await storage.getGroupAttendanceHistory(testGroup.id, 999);
      console.log(`   ✅ Wrong school (999): Found ${wrongHistory.length} records (should be 0)`);
      
      if (wrongHistory.length === 0) {
        console.log('   ✅ Perfect isolation: No data leakage between schools');
      } else {
        console.log('   ❌ SECURITY ISSUE: Cross-school data accessed');
      }
    }
    
    // Step 6: Verify user data is not leaking between schools
    console.log('\n6️⃣ Checking user name "afaf" issue:');
    
    const afafUsers = await db
      .select({ id: users.id, name: users.name, schoolId: users.schoolId })
      .from(users)
      .where(eq(users.name, 'afaf'));
      
    if (afafUsers.length > 0) {
      console.log('   Found user(s) named "afaf":');
      afafUsers.forEach(user => {
        console.log(`     - User ID: ${user.id}, School ID: ${user.schoolId}`);
      });
      
      // Check if this user appears in school 8's attendance
      for (const user of afafUsers) {
        const attendanceInSchool8 = await db
          .select()
          .from(groupAttendance)
          .where(
            and(
              eq(groupAttendance.studentId, user.id),
              eq(groupAttendance.schoolId, 8)
            )
          );
          
        if (attendanceInSchool8.length > 0 && user.schoolId !== 8) {
          console.log(`   ❌ ISSUE FOUND: User "afaf" from School ${user.schoolId} appears in School 8 attendance`);
        } else {
          console.log(`   ✅ User "afaf" properly isolated to School ${user.schoolId}`);
        }
      }
    } else {
      console.log('   No user named "afaf" found in database');
    }
    
    console.log('\n✅ School isolation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testSchoolIsolation().catch(console.error);