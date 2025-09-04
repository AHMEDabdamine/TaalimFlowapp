// Direct test of group assignment query for school 8
import { db } from './server/db.js';
import { groupMixedAssignments, groups } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function testGroupAssignments() {
  console.log('🔧 Testing group assignments query for school 8...\n');
  
  try {
    // Test 1: Check all assignments in school 8
    console.log('1️⃣ All assignments in school 8:');
    const allAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Found ${allAssignments.length} assignments:`);
    allAssignments.forEach(assignment => {
      console.log(`   - ID ${assignment.id}: Student ${assignment.studentId} (${assignment.studentType}) → Group ${assignment.groupId}`);
    });

    if (allAssignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND IN SCHOOL 8!');
      return;
    }

    // Test 2: Exact query from getStudentCompleteProfile for student 26
    console.log('\n2️⃣ Testing exact query for student 26:');
    const student26Query = await db
      .select({
        groupId: groupMixedAssignments.groupId,
        studentId: groupMixedAssignments.studentId,
        studentType: groupMixedAssignments.studentType,
        schoolId: groupMixedAssignments.schoolId,
        assignedAt: groupMixedAssignments.assignedAt,
      })
      .from(groupMixedAssignments)
      .where(
        and(
          eq(groupMixedAssignments.studentId, 26),
          eq(groupMixedAssignments.studentType, 'student'),
          eq(groupMixedAssignments.schoolId, 8),
        ),
      );
    
    console.log(`Query result for student 26:`, student26Query);
    console.log(`Number of assignments found: ${student26Query.length}`);

    if (student26Query.length > 0) {
      // Test 3: Fetch group details for found assignments
      console.log('\n3️⃣ Fetching group details:');
      const groupIds = student26Query.map(a => a.groupId);
      console.log('Group IDs to fetch:', groupIds);
      
      const groupDetails = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          schoolId: groups.schoolId
        })
        .from(groups)
        .where(eq(groups.schoolId, 8));
      
      console.log('All groups in school 8:', groupDetails);
    }

    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testGroupAssignments().catch(console.error);