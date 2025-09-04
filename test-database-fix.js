// Simple test script to verify database fix for school 8 assignments
const { db } = require('./server/db.js');
const { groupMixedAssignments, groups, students, users, teachingModules } = require('./shared/schema.js');
const { eq, and, inArray } = require('drizzle-orm');

async function testDatabaseFix() {
  console.log('🔧 Testing database fix for school 8 student assignments...\n');
  
  try {
    // Test 1: Check if assignments exist for school 8
    console.log('1️⃣ Testing assignments for school 8:');
    const school8Assignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`   Found ${school8Assignments.length} assignments in school 8:`);
    school8Assignments.forEach(assignment => {
      console.log(`   - Student ${assignment.studentId} (${assignment.studentType}) → Group ${assignment.groupId}`);
    });

    if (school8Assignments.length === 0) {
      console.log('❌ NO ASSIGNMENTS FOUND - This explains the empty groups issue!');
      return;
    }

    // Test 2: Specific test for student 26 (should be in group 27)
    console.log('\n2️⃣ Testing student 26 assignments:');
    const student26Assignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(
        and(
          eq(groupMixedAssignments.studentId, 26),
          eq(groupMixedAssignments.studentType, 'student'),
          eq(groupMixedAssignments.schoolId, 8)
        )
      );
    
    console.log(`   Found ${student26Assignments.length} assignments for student 26:`);
    student26Assignments.forEach(assignment => {
      console.log(`   - Group ${assignment.groupId}, assigned at ${assignment.assignedAt}`);
    });

    if (student26Assignments.length > 0) {
      // Test 3: Fetch group details
      console.log('\n3️⃣ Testing group details for student 26:');
      const groupIds = student26Assignments.map(a => a.groupId);
      
      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
          educationLevel: groups.educationLevel,
          subjectId: groups.subjectId,
          teacherId: groups.teacherId,
          schoolId: groups.schoolId
        })
        .from(groups)
        .where(
          and(
            inArray(groups.id, groupIds),
            eq(groups.schoolId, 8)
          )
        );
      
      console.log(`   Found ${groupsData.length} group details:`);
      groupsData.forEach(group => {
        console.log(`   - Group ${group.id}: ${group.name} (Level: ${group.educationLevel})`);
      });
    }

    // Test 4: Check if student 26 exists in students table
    console.log('\n4️⃣ Testing if student 26 exists in students table:');
    const student26 = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, 26),
          eq(students.schoolId, 8)
        )
      );
    
    console.log(`   Found ${student26.length} student record(s):`);
    if (student26.length > 0) {
      console.log(`   - Student 26: ${student26[0].name}, Education Level: ${student26[0].educationLevel}`);
      console.log(`   - User ID: ${student26[0].userId}, Verified: ${student26[0].verified}`);
    }

    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
  
  process.exit(0);
}

testDatabaseFix().catch(console.error);