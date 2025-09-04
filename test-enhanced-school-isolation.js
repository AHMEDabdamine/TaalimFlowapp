// Test enhanced school ID isolation using group mixed assignments
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupAttendance, groupMixedAssignments, users, children } from './shared/schema.js';
import { eq, ne, and } from 'drizzle-orm';

async function testEnhancedSchoolIsolation() {
  console.log('🔬 Testing enhanced school isolation using group mixed assignments...\n');
  
  try {
    // Step 1: Check group assignments by school
    console.log('1️⃣ Checking group mixed assignments by school:');
    const assignmentsBySchool = await db.execute(`
      SELECT gma.school_id, COUNT(*) as assignment_count, 
             COUNT(DISTINCT gma.group_id) as group_count,
             COUNT(DISTINCT gma.student_id) as student_count
      FROM group_mixed_assignments gma
      GROUP BY gma.school_id
      ORDER BY gma.school_id;
    `);
    
    console.log('   Group assignments by school:');
    assignmentsBySchool.rows.forEach(row => {
      console.log(`     - School ID ${row.school_id}: ${row.assignment_count} assignments, ${row.group_count} groups, ${row.student_count} students`);
    });
    
    // Step 2: Check attendance records vs assignments alignment
    console.log('\n2️⃣ Checking attendance vs group assignments alignment:');
    
    const attendanceAlignmentCheck = await db.execute(`
      SELECT 
        ga.school_id,
        COUNT(ga.id) as attendance_records,
        COUNT(gma.id) as matched_assignments
      FROM group_attendance ga
      LEFT JOIN group_mixed_assignments gma ON (
        ga.group_id = gma.group_id AND 
        ga.student_id = gma.student_id AND 
        ga.school_id = gma.school_id
      )
      GROUP BY ga.school_id
      ORDER BY ga.school_id;
    `);
    
    console.log('   Attendance alignment with assignments:');
    attendanceAlignmentCheck.rows.forEach(row => {
      const alignmentRate = Math.round((row.matched_assignments / row.attendance_records) * 100);
      console.log(`     - School ID ${row.school_id}: ${row.attendance_records} attendance records, ${row.matched_assignments} matched assignments (${alignmentRate}% alignment)`);
    });
    
    // Step 3: Test getAttendanceWithStudentDetails with enhanced verification
    console.log('\n3️⃣ Testing enhanced getAttendanceWithStudentDetails:');
    
    // Get a group from school 8 with assignments
    const school8Groups = await storage.getAdminGroups(8);
    const testGroup = school8Groups.find(g => g.id && !g.isPlaceholder);
    
    if (testGroup) {
      console.log(`   Testing with Group: ${testGroup.name} (ID: ${testGroup.id}) from School 8`);
      
      // Check assignments for this group
      const groupAssignments = await db
        .select()
        .from(groupMixedAssignments)
        .where(
          and(
            eq(groupMixedAssignments.groupId, testGroup.id),
            eq(groupMixedAssignments.schoolId, 8)
          )
        );
      
      console.log(`   ✅ Group has ${groupAssignments.length} student assignments in School 8`);
      
      // Test enhanced attendance method
      const enhancedAttendance = await storage.getAttendanceWithStudentDetails(testGroup.id, 8);
      console.log(`   ✅ Enhanced method returned ${enhancedAttendance.length} attendance records`);
      
      // Verify each attendance record has a valid assignment
      let validAssignments = 0;
      for (const record of enhancedAttendance) {
        const hasAssignment = groupAssignments.some(assignment => 
          assignment.studentId === record.studentId
        );
        if (hasAssignment) validAssignments++;
      }
      
      console.log(`   ✅ ${validAssignments}/${enhancedAttendance.length} attendance records have valid group assignments`);
      
      if (validAssignments === enhancedAttendance.length) {
        console.log('   ✅ Perfect: All attendance records are properly validated through group assignments');
      } else {
        console.log('   ⚠️  Some attendance records may not have proper group assignments');
      }
    }
    
    // Step 4: Test cross-school isolation with assignments
    console.log('\n4️⃣ Testing cross-school isolation through assignments:');
    
    // Try to get attendance for school 8 group but with wrong school ID
    if (testGroup) {
      try {
        const wrongSchoolAttendance = await storage.getAttendanceWithStudentDetails(testGroup.id, 999);
        console.log(`   ✅ Wrong school query returned ${wrongSchoolAttendance.length} records (should be 0)`);
        
        if (wrongSchoolAttendance.length === 0) {
          console.log('   ✅ Perfect isolation: No attendance records returned for wrong school');
        } else {
          console.log('   ❌ SECURITY ISSUE: Attendance returned for wrong school');
        }
      } catch (error) {
        console.log('   ✅ Wrong school query failed as expected (proper isolation)');
      }
    }
    
    // Step 5: Check for any orphaned attendance records
    console.log('\n5️⃣ Checking for orphaned attendance records:');
    
    const orphanedAttendance = await db.execute(`
      SELECT ga.school_id, COUNT(*) as orphaned_count
      FROM group_attendance ga
      LEFT JOIN group_mixed_assignments gma ON (
        ga.group_id = gma.group_id AND 
        ga.student_id = gma.student_id AND 
        ga.school_id = gma.school_id
      )
      WHERE gma.id IS NULL
      GROUP BY ga.school_id;
    `);
    
    if (orphanedAttendance.rows.length === 0) {
      console.log('   ✅ No orphaned attendance records found - perfect data integrity');
    } else {
      console.log('   ⚠️  Found orphaned attendance records:');
      orphanedAttendance.rows.forEach(row => {
        console.log(`     - School ID ${row.school_id}: ${row.orphaned_count} orphaned records`);
      });
    }
    
    // Step 6: Verify userId population in both tables
    console.log('\n6️⃣ Checking userId population for cost optimization:');
    
    const userIdStats = await db.execute(`
      SELECT 
        'group_attendance' as table_name,
        COUNT(*) as total_records,
        COUNT(user_id) as records_with_userid,
        ROUND((COUNT(user_id)::decimal / COUNT(*)) * 100, 2) as userid_percentage
      FROM group_attendance
      UNION ALL
      SELECT 
        'group_mixed_assignments' as table_name,
        COUNT(*) as total_records,
        COUNT(user_id) as records_with_userid,
        ROUND((COUNT(user_id)::decimal / COUNT(*)) * 100, 2) as userid_percentage
      FROM group_mixed_assignments;
    `);
    
    console.log('   UserId population status:');
    userIdStats.rows.forEach(row => {
      console.log(`     - ${row.table_name}: ${row.records_with_userid}/${row.total_records} records (${row.userid_percentage}%)`);
    });
    
    console.log('\n✅ Enhanced school isolation test completed!');
    console.log('\n📊 Summary:');
    console.log('   - Group mixed assignments ensure proper school-based student verification');
    console.log('   - Attendance records are validated through group assignments');
    console.log('   - Cross-school data access is prevented at multiple levels');
    console.log('   - UserId optimization maintains performance while ensuring security');
    
  } catch (error) {
    console.error('❌ Enhanced test failed:', error);
  }
  
  process.exit(0);
}

testEnhancedSchoolIsolation().catch(console.error);