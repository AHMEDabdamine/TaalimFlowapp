// Test script to verify the student assignment fix
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testAssignmentFix() {
  console.log('🔧 Testing the student assignment fix...\n');
  
  try {
    // Test 1: Check current assignments (before our fix)
    console.log('1️⃣ Current assignments in school 8:');
    const currentAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Found ${currentAssignments.length} current assignments:`);
    currentAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: Student ${assignment.studentId} → Group ${assignment.groupId}`);
    });

    // Test 2: Get available students to see the correct ID mapping
    console.log('\n2️⃣ Testing getAvailableStudentsByLevelAndSubject with fixed logic:');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(
      'الثانوي', // Secondary education
      1, // Math subject (assuming it exists)
      8  // School 8
    );
    
    console.log(`Found ${availableStudents.length} available students:`);
    availableStudents.forEach(student => {
      console.log(`   - ID: ${student.id}, UserID: ${student.userId || 'N/A'}, Name: ${student.name}, Type: ${student.type}`);
    });

    // Test 3: Clear existing assignments for a clean test
    console.log('\n3️⃣ Clearing existing assignments to test fresh assignment...');
    await db
      .delete(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    console.log('   ✅ Cleared existing assignments');

    // Test 4: Create new assignment using the fixed logic
    if (availableStudents.length > 0) {
      console.log('\n4️⃣ Creating new assignment with fixed logic:');
      const studentToAssign = availableStudents[0];
      const targetGroupId = 27; // Group 27 exists in school 8
      
      console.log(`   Assigning student ${studentToAssign.id} (${studentToAssign.name}) to group ${targetGroupId}`);
      
      const updatedGroup = await storage.updateGroupAssignments(
        targetGroupId,
        [studentToAssign.id], // This should now use student ID, not user ID
        1, // Teacher ID
        null, // No group data update
        8, // School ID
        1  // Admin ID
      );
      
      console.log('   ✅ Assignment created successfully');
    }

    // Test 5: Verify the assignment was created with correct student ID
    console.log('\n5️⃣ Verifying the new assignment:');
    const newAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Found ${newAssignments.length} new assignments:`);
    newAssignments.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: Student ${assignment.studentId} → Group ${assignment.groupId} (Type: ${assignment.studentType})`);
    });

    // Test 6: Test getStudentCompleteProfile to see if groups now display
    if (newAssignments.length > 0) {
      console.log('\n6️⃣ Testing getStudentCompleteProfile:');
      const testAssignment = newAssignments[0];
      
      const profile = await storage.getStudentCompleteProfile(
        testAssignment.studentId,
        testAssignment.studentType,
        8
      );
      
      if (profile) {
        console.log(`   Profile found for student ${testAssignment.studentId}:`);
        console.log(`   - Name: ${profile.name}`);
        console.log(`   - Enrolled groups: ${profile.enrolledGroups?.length || 0}`);
        if (profile.enrolledGroups?.length > 0) {
          profile.enrolledGroups.forEach(group => {
            console.log(`     * Group ${group.id}: ${group.name}`);
          });
          console.log('   ✅ FIX SUCCESSFUL - Groups are now displayed!');
        } else {
          console.log('   ❌ FIX FAILED - Still no groups displayed');
        }
      } else {
        console.log('   ❌ No profile found');
      }
    }

    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testAssignmentFix().catch(console.error);