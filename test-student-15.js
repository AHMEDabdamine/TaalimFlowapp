// Test script specifically for student 15 to debug the empty groups issue
import { db } from './server/db.js';
import { groupMixedAssignments, groups, students, users } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function testStudent15() {
  console.log('🔧 Testing student 15 specifically...\n');
  
  try {
    // Test 1: Check if student 15 exists in students table
    console.log('1️⃣ Checking if student 15 exists:');
    const student15Records = await db
      .select()
      .from(students)
      .where(eq(students.id, 15));
    
    console.log(`Found ${student15Records.length} student records for ID 15:`);
    if (student15Records.length > 0) {
      const student = student15Records[0];
      console.log(`   - Name: ${student.name}`);
      console.log(`   - School ID: ${student.schoolId}`);
      console.log(`   - Education Level: ${student.educationLevel}`);
      console.log(`   - User ID: ${student.userId}`);
      console.log(`   - Verified: ${student.verified}`);
    } else {
      console.log('❌ Student 15 does not exist in students table!');
      return;
    }

    const schoolId = student15Records[0].schoolId;

    // Test 2: Check assignments for student 15
    console.log('\n2️⃣ Checking assignments for student 15:');
    const assignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(
        and(
          eq(groupMixedAssignments.studentId, 15),
          eq(groupMixedAssignments.studentType, 'student'),
          eq(groupMixedAssignments.schoolId, schoolId)
        )
      );
    
    console.log(`Found ${assignments.length} assignments for student 15:`);
    assignments.forEach(assignment => {
      console.log(`   - Assignment ID ${assignment.id}: Group ${assignment.groupId}, assigned at ${assignment.assignedAt}`);
    });

    if (assignments.length === 0) {
      console.log('⚠️ Student 15 has NO group assignments - this explains empty groups!');
    }

    // Test 3: Check all assignments in the same school
    console.log(`\n3️⃣ All assignments in school ${schoolId}:`);
    const allSchoolAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, schoolId));
    
    console.log(`Found ${allSchoolAssignments.length} total assignments in school ${schoolId}:`);
    allSchoolAssignments.forEach(assignment => {
      console.log(`   - Student ${assignment.studentId} (${assignment.studentType}) → Group ${assignment.groupId}`);
    });

    // Test 4: Check if there are students with assignments in this school
    console.log('\n4️⃣ Students that DO have assignments:');
    const studentsWithAssignments = [...new Set(allSchoolAssignments.map(a => a.studentId))];
    console.log('Student IDs with assignments:', studentsWithAssignments);

    console.log('\n✅ Test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Student 15 exists: ${student15Records.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Student 15 has assignments: ${assignments.length > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Students with assignments in school: ${studentsWithAssignments.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testStudent15().catch(console.error);