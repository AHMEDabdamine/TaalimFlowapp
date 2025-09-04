// Script to assign student 15 to a group for testing
import { db } from './server/db.js';
import { groupMixedAssignments, groups } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function assignStudent15() {
  console.log('🔧 Assigning student 15 to a group for testing...\n');
  
  try {
    // Find an available group in school 8
    console.log('1️⃣ Finding available groups in school 8:');
    const availableGroups = await db
      .select()
      .from(groups)
      .where(eq(groups.schoolId, 8));
    
    console.log(`Found ${availableGroups.length} groups in school 8:`);
    availableGroups.forEach(group => {
      console.log(`   - Group ${group.id}: ${group.name} (${group.educationLevel})`);
    });

    if (availableGroups.length === 0) {
      console.log('❌ No groups found in school 8!');
      return;
    }

    // Use the first available group (Group 27)
    const targetGroup = availableGroups.find(g => g.id === 27) || availableGroups[0];
    console.log(`\n2️⃣ Assigning student 15 to group ${targetGroup.id} (${targetGroup.name})`);

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.studentId, 15));
    
    if (existingAssignment.length > 0) {
      console.log('⚠️ Student 15 already has an assignment, updating...');
      // For simplicity, we'll create a new assignment rather than update
    }

    // Create the assignment
    const [newAssignment] = await db
      .insert(groupMixedAssignments)
      .values({
        schoolId: 8,
        groupId: targetGroup.id,
        studentId: 15,
        studentType: 'student',
        assignedBy: 1, // Super admin
      })
      .returning();

    console.log('✅ Assignment created successfully:');
    console.log(`   - Assignment ID: ${newAssignment.id}`);
    console.log(`   - Student 15 → Group ${newAssignment.groupId}`);
    console.log(`   - Assigned at: ${newAssignment.assignedAt}`);

    // Verify the assignment
    console.log('\n3️⃣ Verifying assignment:');
    const verification = await db
      .select()
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.studentId, 15));
    
    console.log(`Student 15 now has ${verification.length} assignment(s):`);
    verification.forEach(assignment => {
      console.log(`   - Assignment ${assignment.id}: Group ${assignment.groupId}`);
    });

    console.log('\n✅ Student 15 assignment completed!');
    console.log('🔬 Now test the QR scanner with student:15:8:verified');
    console.log('   or manually search for student 15 in the student list');
    
  } catch (error) {
    console.error('❌ Assignment failed:', error);
  }
  
  process.exit(0);
}

assignStudent15().catch(console.error);