// Test the complete frontend-backend flow to confirm our fix
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testCompleteFrontendBackendFlow() {
  console.log('🧪 Testing complete frontend-backend flow...\n');
  
  try {
    // STEP 1: Simulate the frontend API call to get available students
    console.log('1️⃣ Simulating API call: GET /api/admin/groups/students/الثانوي/1375');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(
      'الثانوي', // Secondary education
      1375, // Math subject ID
      8  // School 8
    );
    
    console.log(`Frontend receives ${availableStudents.length} students:`);
    availableStudents.forEach(student => {
      console.log(`   - Student ID: ${student.id}, User ID: ${student.userId || 'N/A'}, Name: ${student.name}`);
    });

    if (availableStudents.length === 0) {
      console.log('❌ No students available for testing. Exiting...');
      return;
    }

    // STEP 2: Simulate the frontend sending assignment request
    const studentToAssign = availableStudents[0];
    const groupId = 27; // Math group
    const teacherId = 1;
    const adminId = 1;
    
    console.log(`\n2️⃣ Simulating API call: PUT /api/admin/groups/${groupId}/assignments`);
    console.log(`Frontend sends: { studentIds: [${studentToAssign.id}], teacherId: ${teacherId} }`);
    
    // This simulates exactly what the frontend mutation does
    const updatedGroup = await storage.updateGroupAssignments(
      groupId,
      [studentToAssign.id], // Frontend sends the student.id from available students
      teacherId,
      null,
      8, // School ID
      adminId
    );
    
    console.log('✅ Assignment request processed successfully');

    // STEP 3: Verify what was actually saved in the database
    console.log('\n3️⃣ Verifying database records:');
    const savedAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Found ${savedAssignments.length} assignments in database:`);
    savedAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: student_id=${assignment.studentId}, group_id=${assignment.groupId}`);
    });

    // STEP 4: Check if saved student_id is actually a student ID or user ID
    console.log('\n4️⃣ Verifying ID types:');
    
    // Get all students in school 8 to compare IDs
    const allStudents = await db
      .select({
        studentId: students.id,
        userId: students.userId,
        name: students.name
      })
      .from(students)
      .where(eq(students.schoolId, 8));
    
    console.log('Students in school 8:');
    allStudents.forEach(student => {
      console.log(`   - Student ID: ${student.studentId}, User ID: ${student.userId}, Name: ${student.name}`);
    });

    // Check each assignment
    savedAssignments.forEach(assignment => {
      const matchingStudent = allStudents.find(s => s.studentId === assignment.studentId);
      const matchingUser = allStudents.find(s => s.userId === assignment.studentId);
      
      if (matchingStudent) {
        console.log(`✅ Assignment ${assignment.id} uses STUDENT ID ${assignment.studentId} (${matchingStudent.name}) - CORRECT!`);
      } else if (matchingUser) {
        console.log(`❌ Assignment ${assignment.id} uses USER ID ${assignment.studentId} (${matchingUser.name}) - WRONG!`);
      } else {
        console.log(`❓ Assignment ${assignment.id} uses UNKNOWN ID ${assignment.studentId} - INVALID!`);
      }
    });

    // STEP 5: Test QR scanner lookup with the saved assignment
    if (savedAssignments.length > 0) {
      console.log('\n5️⃣ Testing QR scanner lookup:');
      const testAssignment = savedAssignments[0];
      
      const profile = await storage.getStudentCompleteProfile(
        testAssignment.studentId,
        testAssignment.studentType,
        8
      );
      
      if (profile && profile.enrolledGroups?.length > 0) {
        console.log(`✅ QR Scanner SUCCESS: Found ${profile.enrolledGroups.length} enrolled group(s) for student ${profile.name}`);
        profile.enrolledGroups.forEach(group => {
          console.log(`   - ${group.name} (${group.subjectName})`);
        });
      } else {
        console.log(`❌ QR Scanner FAILED: No enrolled groups found for student ID ${testAssignment.studentId}`);
      }
    }

    console.log('\n✅ Complete frontend-backend flow test finished!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testCompleteFrontendBackendFlow().catch(console.error);