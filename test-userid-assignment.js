// Test the new userId assignment functionality
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testUserIdAssignment() {
  console.log('🧪 Testing new userId assignment functionality...\n');
  
  try {
    // Step 1: Check current database schema
    console.log('1️⃣ Checking current schema:');
    const schemaCheck = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'group_mixed_assignments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('   Current group_mixed_assignments columns:');
    schemaCheck.rows.forEach(row => {
      console.log(`     - ${row.column_name}: ${row.data_type}`);
    });
    
    const hasUserId = schemaCheck.rows.some(row => row.column_name === 'user_id');
    console.log(`   ✅ user_id column exists: ${hasUserId}\n`);
    
    if (!hasUserId) {
      console.log('❌ user_id column missing. Schema update needed.');
      return;
    }

    // Step 2: Find a valid subject ID first
    console.log('2️⃣ Finding valid subject for testing:');
    const validSubjects = await db.execute(`
      SELECT id, name_ar, education_level 
      FROM teaching_modules 
      WHERE education_level = 'الابتدائي' 
      LIMIT 1;
    `);
    
    if (validSubjects.rows.length === 0) {
      console.log('❌ No valid subjects found for primary level.');
      return;
    }
    
    const validSubject = validSubjects.rows[0];
    console.log(`   Using valid subject: ${validSubject.name_ar} (ID: ${validSubject.id})\n`);
    
    // Step 3: Check available students and their user IDs
    console.log('3️⃣ Getting available students with user IDs:');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(
      'الابتدائي',
      validSubject.id, // Use valid subject ID
      8   // School ID
    );
    
    console.log(`   Found ${availableStudents.length} available students:`);
    availableStudents.forEach(student => {
      console.log(`     - Student ID: ${student.id}, User ID: ${student.userId}, Name: ${student.name}, Type: ${student.type}`);
    });

    if (availableStudents.length === 0) {
      console.log('❌ No available students found. Cannot test assignment.');
      return;
    }

    // Step 4: Test creating a group assignment with both studentId and userId
    console.log('\n4️⃣ Testing updateGroupAssignments with both IDs:');
    
    // Get first available student for testing
    const testStudent = availableStudents[0];
    console.log(`   Testing with student: ${testStudent.name} (studentId: ${testStudent.id}, userId: ${testStudent.userId})`);
    
    // Create a group assignment with matching education level and subject
    try {
      const updatedGroup = await storage.updateGroupAssignments(
        null, // Create new group
        [testStudent.id], // Student IDs array
        13, // Teacher ID
        {
          name: 'Test Group for User ID',
          description: 'Testing userId assignment functionality',
          category: 'دراسية',
          educationLevel: 'الابتدائي', // Match student's level
          subjectId: validSubject.id // Use valid subject ID
        },
        8, // School ID
        1  // Admin ID
      );
      
      console.log(`   ✅ Group assignment created/updated for group ${updatedGroup.id}`);
      
      // Step 5: Check what was stored in the database
      console.log('\n5️⃣ Checking stored assignment data:');
      const storedAssignments = await db
        .select()
        .from(groupMixedAssignments)
        .where(eq(groupMixedAssignments.groupId, updatedGroup.id));
      
      console.log(`   Found ${storedAssignments.length} stored assignments:`);
      storedAssignments.forEach(assignment => {
        console.log(`     - Assignment ID: ${assignment.id}`);
        console.log(`       Student ID: ${assignment.studentId}`);
        console.log(`       User ID: ${assignment.userId}`);
        console.log(`       Student Type: ${assignment.studentType}`);
        console.log(`       School ID: ${assignment.schoolId}`);
        console.log('');
      });
      
      // Step 6: Test getGroupAssignments with the new userId field
      console.log('6️⃣ Testing getGroupAssignments with userId retrieval:');
      const retrievedAssignments = await storage.getGroupAssignments(updatedGroup.id);
      
      console.log(`   Retrieved ${retrievedAssignments.length} assignments via storage method:`);
      retrievedAssignments.forEach(assignment => {
        console.log(`     - Student: ${assignment.name}`);
        console.log(`       Student ID: ${assignment.id}`);
        console.log(`       User ID: ${assignment.userId}`);
        console.log(`       Type: ${assignment.type}`);
        console.log('');
      });
      
      // Step 7: Verify both IDs are consistent
      console.log('7️⃣ Verifying ID consistency:');
      const firstAssignment = retrievedAssignments[0];
      if (firstAssignment) {
        console.log(`   Student ID from assignment: ${firstAssignment.id}`);
        console.log(`   User ID from assignment: ${firstAssignment.userId}`);
        
        // Cross-check with students table
        const studentRecord = await db
          .select({ studentId: students.id, userId: students.userId })
          .from(students)
          .where(eq(students.id, firstAssignment.id))
          .limit(1);
          
        if (studentRecord[0]) {
          console.log(`   Student ID from students table: ${studentRecord[0].studentId}`);
          console.log(`   User ID from students table: ${studentRecord[0].userId}`);
          
          const idsMatch = (
            firstAssignment.id === studentRecord[0].studentId &&
            firstAssignment.userId === studentRecord[0].userId
          );
          
          console.log(`   ✅ IDs are consistent: ${idsMatch}`);
        } else {
          console.log('   ❌ Could not find student record for verification');
        }
      }
      
      console.log('\n✅ User ID assignment test completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during group assignment:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testUserIdAssignment().catch(console.error);