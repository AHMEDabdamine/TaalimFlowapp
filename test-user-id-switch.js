// Test switching attendance table to use user IDs instead of student IDs
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users, groupAttendance } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testUserIdSwitch() {
  console.log('🧪 Testing what happens if we switch to user IDs in attendance table...\n');
  
  try {
    // Step 1: Get current group assignments and see both student IDs and user IDs
    console.log('1️⃣ Current group assignments with ID mapping:');
    const assignments = await db
      .select({
        assignmentId: groupMixedAssignments.id,
        savedStudentId: groupMixedAssignments.studentId,
        actualStudentId: students.id,
        userId: students.userId,
        userName: users.name,
        studentName: students.name
      })
      .from(groupMixedAssignments)
      .leftJoin(students, eq(groupMixedAssignments.studentId, students.id))
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    assignments.forEach(a => {
      console.log(`   Assignment ${a.assignmentId}:`);
      console.log(`     - Saved student_id: ${a.savedStudentId}`);
      console.log(`     - Actual student.id: ${a.actualStudentId}`);
      console.log(`     - User ID: ${a.userId}`);
      console.log(`     - Name: ${a.studentName || a.userName}`);
      console.log('');
    });

    if (assignments.length === 0) {
      console.log('❌ No assignments found. Please create some assignments first.');
      return;
    }

    // Step 2: Simulate attendance record creation using current system (student IDs)
    console.log('2️⃣ Current system - attendance using student IDs:');
    const testAssignment = assignments[0];
    const testDate = new Date().toISOString().split('T')[0];
    
    // Clear any existing attendance for this test
    await db
      .delete(groupAttendance)
      .where(eq(groupAttendance.schoolId, 8));
    
    // Create attendance record using student ID (current system)
    const studentIdAttendance = await db
      .insert(groupAttendance)
      .values({
        schoolId: 8,
        groupId: 27,
        studentId: testAssignment.actualStudentId, // Using student ID
        studentType: 'student', // Required field
        attendanceDate: new Date(testDate),
        status: 'present',
        markedBy: 1
      })
      .returning();
    
    console.log(`   Created attendance record using student ID ${testAssignment.actualStudentId}`);
    
    // Step 3: Test what getGroupAttendanceHistory returns with student IDs
    console.log('3️⃣ Testing getGroupAttendanceHistory with student ID system:');
    const attendanceHistoryStudentId = await storage.getGroupAttendanceHistory(27, 8);
    console.log(`   Found ${attendanceHistoryStudentId.length} attendance records using student ID lookup`);
    
    attendanceHistoryStudentId.forEach(record => {
      console.log(`     - Student ID: ${record.studentId}, Name: ${record.studentName}, Status: ${record.status}`);
    });

    // Step 4: Now test what happens if we use user IDs instead
    console.log('\n4️⃣ Testing alternative - attendance using user IDs:');
    
    // Clear existing
    await db
      .delete(groupAttendance)
      .where(eq(groupAttendance.schoolId, 8));
    
    // Create attendance record using user ID instead
    const userIdAttendance = await db
      .insert(groupAttendance)
      .values({
        schoolId: 8,
        groupId: 27,
        studentId: testAssignment.userId, // Using user ID instead!
        studentType: 'student', // Required field
        attendanceDate: new Date(testDate),
        status: 'present', 
        markedBy: 1
      })
      .returning();
    
    console.log(`   Created attendance record using user ID ${testAssignment.userId} instead of student ID`);
    
    // Step 5: Test what getGroupAttendanceHistory returns with user IDs
    console.log('5️⃣ Testing getGroupAttendanceHistory with user ID system:');
    const attendanceHistoryUserId = await storage.getGroupAttendanceHistory(27, 8);
    console.log(`   Found ${attendanceHistoryUserId.length} attendance records using user ID lookup`);
    
    attendanceHistoryUserId.forEach(record => {
      console.log(`     - Student ID: ${record.studentId}, Name: ${record.studentName}, Status: ${record.status}`);
    });

    // Step 6: Compare what the frontend would see
    console.log('\n6️⃣ Frontend perspective comparison:');
    console.log('   Current system (student IDs):');
    console.log(`     - managementGroup.studentsAssigned has student.id = ${testAssignment.actualStudentId}`);
    console.log(`     - Attendance history returns records with studentId = ${testAssignment.actualStudentId}`);
    console.log(`     - Match found: ${attendanceHistoryStudentId.length > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n   Alternative system (user IDs):');
    console.log(`     - managementGroup.studentsAssigned would need user.id = ${testAssignment.userId}`);
    console.log(`     - Attendance history returns records with studentId = ${testAssignment.userId}`);
    console.log(`     - Match found: ${attendanceHistoryUserId.length > 0 ? 'YES' : 'NO'}`);

    // Step 7: Test what would happen if frontend used user IDs for attendance lookup
    console.log('\n7️⃣ Simulating frontend attendance lookup with user IDs:');
    
    // Create a mock student object like frontend would have if using user IDs
    const mockStudentWithUserId = {
      id: testAssignment.userId, // Frontend using user ID as student.id
      name: testAssignment.studentName
    };
    
    // Simulate frontend lookup - looking for attendance records
    const frontendAttendanceRecord = attendanceHistoryUserId.find(record => 
      record.studentId === mockStudentWithUserId.id
    );
    
    if (frontendAttendanceRecord) {
      console.log(`   ✅ Frontend would FIND attendance record for ${mockStudentWithUserId.name}`);
      console.log(`      Record: ${frontendAttendanceRecord.status} on ${frontendAttendanceRecord.attendanceDate}`);
    } else {
      console.log(`   ❌ Frontend would NOT FIND attendance record for ${mockStudentWithUserId.name}`);
    }

    console.log('\n✅ User ID switch test completed!');
    
    // Cleanup
    await db
      .delete(groupAttendance)
      .where(eq(groupAttendance.schoolId, 8));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testUserIdSwitch().catch(console.error);