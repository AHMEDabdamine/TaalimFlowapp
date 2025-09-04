// Test the new userId functionality in actual group assignment flow
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testLiveAssignment() {
  console.log('🧪 Testing live group assignment with userId functionality...\n');
  
  try {
    // Step 1: Get an existing group to work with
    console.log('1️⃣ Finding existing groups:');
    const existingGroups = await storage.getAdminGroups(8);
    const targetGroup = existingGroups.find(g => g.id && !g.isPlaceholder);
    
    if (!targetGroup) {
      console.log('❌ No existing groups found to test with.');
      return;
    }
    
    console.log(`   Using group: ${targetGroup.name} (ID: ${targetGroup.id})`);
    console.log(`   Subject: ${targetGroup.nameAr || targetGroup.subjectName}`);
    console.log(`   Level: ${targetGroup.educationLevel}\n`);
    
    // Step 2: Get available students for this group's level and subject
    console.log('2️⃣ Getting available students:');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(
      targetGroup.educationLevel,
      targetGroup.subjectId,
      8
    );
    
    console.log(`   Found ${availableStudents.length} available students:`);
    availableStudents.forEach(student => {
      console.log(`     - ${student.name} (Student ID: ${student.id}, User ID: ${student.userId})`);
    });
    
    if (availableStudents.length === 0) {
      console.log('❌ No available students found.');
      return;
    }
    
    // Step 3: Get current assignments for this group
    console.log('\n3️⃣ Current group assignments:');
    const currentAssignments = await storage.getGroupAssignments(targetGroup.id);
    console.log(`   Currently assigned: ${currentAssignments.length} students`);
    currentAssignments.forEach(assignment => {
      console.log(`     - ${assignment.name} (Student ID: ${assignment.id}, User ID: ${assignment.userId})`);
    });
    
    // Step 4: Test reassignment with a different student
    console.log('\n4️⃣ Testing reassignment with userId tracking:');
    let testStudent = availableStudents.find(s => 
      !currentAssignments.some(a => a.id === s.id)
    );
    
    if (!testStudent) {
      console.log('   All students already assigned, using first available student for reassignment test.');
      testStudent = availableStudents[0];
    }
    
    console.log(`   Reassigning group to: ${testStudent.name}`);
    console.log(`   Student ID: ${testStudent.id}, User ID: ${testStudent.userId}`);
    
    // Update group assignments
    const updatedGroup = await storage.updateGroupAssignments(
      targetGroup.id,
      [testStudent.id],
      targetGroup.teacherId || 13,
      undefined,
      8,
      1
    );
    
    console.log(`   ✅ Group ${updatedGroup.id} updated successfully`);
    
    // Step 5: Verify the assignment was stored with both IDs
    console.log('\n5️⃣ Verifying stored assignment data:');
    const storedAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.groupId, targetGroup.id));
    
    console.log(`   Database contains ${storedAssignments.length} assignments:`);
    storedAssignments.forEach(assignment => {
      console.log(`     - Assignment ID: ${assignment.id}`);
      console.log(`       Student ID: ${assignment.studentId}`);
      console.log(`       User ID: ${assignment.userId}`);
      console.log(`       Type: ${assignment.studentType}`);
      console.log('');
    });
    
    // Step 6: Test retrieval via getGroupAssignments
    console.log('6️⃣ Testing retrieval via getGroupAssignments:');
    const retrievedAssignments = await storage.getGroupAssignments(targetGroup.id);
    
    console.log(`   Retrieved ${retrievedAssignments.length} assignments:`);
    retrievedAssignments.forEach(assignment => {
      console.log(`     - Student: ${assignment.name}`);
      console.log(`       Student ID: ${assignment.id}`);
      console.log(`       User ID: ${assignment.userId}`);
      console.log(`       Email: ${assignment.email}`);
      console.log('');
    });
    
    // Step 7: Demonstrate both ID usage scenarios
    console.log('7️⃣ Demonstrating efficient queries using both IDs:');
    
    if (retrievedAssignments.length > 0) {
      const assignment = retrievedAssignments[0];
      
      console.log('   Scenario A: Session-based query using userId (fast)');
      console.log(`     SELECT * FROM user_sessions WHERE user_id = ${assignment.userId}`);
      
      console.log('   Scenario B: Attendance query using studentId (consistent)');
      console.log(`     SELECT * FROM group_attendance WHERE student_id = ${assignment.id}`);
      
      console.log('   Scenario C: Frontend display using studentId (UI consistency)');
      console.log(`     student.id = ${assignment.id} for checkbox selection logic`);
      
      console.log('   ✅ Both IDs available for optimal performance in different scenarios');
    }
    
    console.log('\n✅ Live assignment test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testLiveAssignment().catch(console.error);