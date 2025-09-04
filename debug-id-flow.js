// Debug the exact ID flow to see where user IDs are getting through
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function debugIdFlow() {
  console.log('🔍 Debugging ID flow to find where user IDs are leaking through...\n');
  
  try {
    // Step 1: Show current students and their IDs
    console.log('1️⃣ Current students in school 8:');
    const currentStudents = await db
      .select({
        studentId: students.id,
        userId: students.userId, 
        userName: users.name,
        studentName: students.name
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .where(eq(students.schoolId, 8));
    
    currentStudents.forEach(s => {
      console.log(`   Student ID: ${s.studentId}, User ID: ${s.userId}, Name: ${s.studentName || s.userName}`);
    });

    // Step 2: Test getAvailableStudentsByLevelAndSubject to see what IDs it returns
    console.log('\n2️⃣ Testing getAvailableStudentsByLevelAndSubject:');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject(
      'الثانوي', // Secondary
      1375, // Math subject  
      8 // School 8
    );
    
    console.log('Available students returned:');
    availableStudents.forEach(s => {
      console.log(`   ID: ${s.id}, UserID: ${s.userId || 'N/A'}, Name: ${s.name}, Type: ${s.type}`);
      console.log(`   🔍 Is s.id a student ID or user ID? Let's check...`);
      
      // Check if s.id matches any student.id
      const matchingStudent = currentStudents.find(cs => cs.studentId === s.id);
      if (matchingStudent) {
        console.log(`   ✅ s.id (${s.id}) matches student.id ${matchingStudent.studentId} ✅`);
      } else {
        console.log(`   ❌ s.id (${s.id}) does NOT match any student.id ❌`);
      }
      
      // Check if s.id matches any user.id  
      const matchingUser = currentStudents.find(cs => cs.userId === s.id);
      if (matchingUser) {
        console.log(`   ❌ s.id (${s.id}) matches user.id ${matchingUser.userId} - THIS IS THE PROBLEM! ❌`);
      } else {
        console.log(`   ✅ s.id (${s.id}) does NOT match any user.id ✅`);
      }
    });

    // Step 3: Clear assignments and test assignment creation
    console.log('\n3️⃣ Clearing assignments and testing assignment creation...');
    await db.delete(groupMixedAssignments).where(eq(groupMixedAssignments.schoolId, 8));
    
    if (availableStudents.length > 0) {
      const testStudent = availableStudents[0];
      console.log(`\n4️⃣ Creating assignment with student ID: ${testStudent.id}`);
      console.log(`   This ID should be a student.id (${currentStudents.find(s => s.studentId === testStudent.id)?.studentId || 'NOT FOUND'})`);
      console.log(`   NOT a user.id (${currentStudents.find(s => s.userId === testStudent.id)?.userId || 'NOT FOUND'})`);
      
      await storage.updateGroupAssignments(
        27, // Group 27
        [testStudent.id], // This should be student ID
        1,
        null,
        8,
        1
      );
      
      // Check what was actually saved
      const savedAssignments = await db
        .select()
        .from(groupMixedAssignments)
        .where(eq(groupMixedAssignments.schoolId, 8));
      
      console.log('\n5️⃣ What was actually saved:');
      savedAssignments.forEach(assignment => {
        console.log(`   Assignment ID: ${assignment.id}`);
        console.log(`   Saved student_id: ${assignment.studentId}`);
        
        // Check if the saved ID is a student ID or user ID
        const isStudentId = currentStudents.find(s => s.studentId === assignment.studentId);
        const isUserId = currentStudents.find(s => s.userId === assignment.studentId);
        
        if (isStudentId) {
          console.log(`   ✅ Saved as student.id (${assignment.studentId}) - CORRECT!`);
        } else if (isUserId) {
          console.log(`   ❌ Saved as user.id (${assignment.studentId}) - WRONG!`);
        } else {
          console.log(`   ❓ Saved as unknown ID (${assignment.studentId}) - INVALID!`);
        }
      });
    }

    console.log('\n✅ ID flow debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  process.exit(0);
}

debugIdFlow().catch(console.error);