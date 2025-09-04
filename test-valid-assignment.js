// Test the fix with valid students
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testWithValidStudent() {
  console.log('🔧 Testing assignment fix with valid students...\n');
  
  try {
    // Clear all assignments first
    await db.delete(groupMixedAssignments).where(eq(groupMixedAssignments.schoolId, 8));
    console.log('✅ Cleared existing assignments\n');

    // Test with Student 15 (Secondary level) - assign to math group
    console.log('📝 Testing Student 15 (Secondary level):');
    const updatedGroup = await storage.updateGroupAssignments(
      27, // Math group for secondary
      [15], // Student 15 (sudent 3)
      1, // Teacher ID
      null, // No group data update
      8, // School ID
      1  // Admin ID
    );
    
    // Verify assignment was created
    const assignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Created ${assignments.length} assignments:`);
    assignments.forEach(a => {
      console.log(`   - Student ${a.studentId} → Group ${a.groupId}`);
    });

    // Test QR scanner lookup
    console.log('\n🔍 Testing QR scanner lookup:');
    const profile = await storage.getStudentCompleteProfile(15, 'student', 8);
    
    if (profile && profile.enrolledGroups?.length > 0) {
      console.log(`✅ SUCCESS: Student ${profile.name} has ${profile.enrolledGroups.length} enrolled group(s):`);
      profile.enrolledGroups.forEach(group => {
        console.log(`   - ${group.name} (${group.subjectName})`);
      });
    } else {
      console.log('❌ FAILED: No enrolled groups found');
    }

    // Test with another student - Student 14 (Middle level)
    console.log('\n📝 Testing Student 14 (Middle level):');
    await storage.updateGroupAssignments(
      28, // Arabic-Math group  
      [14], // Student 14 (student2)
      1, // Teacher ID
      null,
      8,
      1
    );

    const profile2 = await storage.getStudentCompleteProfile(14, 'student', 8);
    if (profile2 && profile2.enrolledGroups?.length > 0) {
      console.log(`✅ SUCCESS: Student ${profile2.name} has ${profile2.enrolledGroups.length} enrolled group(s):`);
      profile2.enrolledGroups.forEach(group => {
        console.log(`   - ${group.name} (${group.subjectName})`);
      });
    } else {
      console.log('❌ FAILED: No enrolled groups found');
    }

    // Final verification - check all assignments
    console.log('\n📊 Final assignment verification:');
    const finalAssignments = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.schoolId, 8));
    
    console.log(`Total assignments: ${finalAssignments.length}`);
    finalAssignments.forEach(a => {
      console.log(`   - Assignment ${a.id}: Student ${a.studentId} → Group ${a.groupId} (${a.studentType})`);
    });

    console.log('\n✅ Fix verification complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testWithValidStudent().catch(console.error);