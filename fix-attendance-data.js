import { db } from './dist/server/db.js';
import { eq, and, sql } from 'drizzle-orm';

async function fixAttendanceData() {
  try {
    console.log('=== ATTENDANCE DATA FIX ===');
    
    // First, let's check the current state
    console.log('\n1. Checking current attendance records...');
    const currentRecords = await db.execute(sql`
      SELECT 
        ga.id,
        ga.studentId,
        ga.userId,
        ga.studentType,
        ga.groupId,
        ga.schoolId,
        u.name as userName
      FROM group_attendance ga
      LEFT JOIN users u ON ga.userId = u.id
      WHERE ga.schoolId = 8
      ORDER BY ga.id DESC
      LIMIT 10
    `);
    
    console.log('Current attendance records:');
    currentRecords.forEach(record => {
      console.log(`  Record ${record.id}: studentId=${record.studentid}, userId=${record.userid}, user=${record.username}`);
    });
    
    // Check group assignments to find correct studentId for each userId
    console.log('\n2. Checking group assignments for correct mapping...');
    const assignments = await db.execute(sql`
      SELECT 
        studentId,
        userId,
        studentType,
        groupId
      FROM group_mixed_assignments
      WHERE userId = 34 OR studentId = 34 OR studentId = 18
      ORDER BY groupId
    `);
    
    console.log('Group assignments:');
    assignments.forEach(assignment => {
      console.log(`  Assignment: studentId=${assignment.studentid}, userId=${assignment.userid}, type=${assignment.studenttype}, group=${assignment.groupid}`);
    });
    
    // Check if there are records where studentId equals userId (indicating incorrect data)
    console.log('\n3. Finding records with incorrect studentId...');
    const incorrectRecords = await db.execute(sql`
      SELECT 
        ga.id,
        ga.studentId,
        ga.userId,
        gma.studentId as correctStudentId
      FROM group_attendance ga
      LEFT JOIN group_mixed_assignments gma 
        ON ga.groupId = gma.groupId 
        AND ga.userId = gma.userId
        AND ga.studentType = gma.studentType
      WHERE ga.schoolId = 8
        AND ga.studentId = ga.userId
        AND gma.studentId IS NOT NULL
    `);
    
    console.log(`Found ${incorrectRecords.length} records with incorrect studentId:`);
    incorrectRecords.forEach(record => {
      console.log(`  Record ${record.id}: current studentId=${record.studentid}, should be=${record.correctstudentid}`);
    });
    
    // Fix the incorrect records
    if (incorrectRecords.length > 0) {
      console.log('\n4. Fixing incorrect attendance records...');
      
      for (const record of incorrectRecords) {
        await db.execute(sql`
          UPDATE group_attendance 
          SET studentId = ${record.correctstudentid}
          WHERE id = ${record.id}
        `);
        console.log(`  Fixed record ${record.id}: studentId changed from ${record.studentid} to ${record.correctstudentid}`);
      }
      
      console.log('\n5. Verification - checking fixed records...');
      const verificationRecords = await db.execute(sql`
        SELECT 
          ga.id,
          ga.studentId,
          ga.userId,
          u.name as userName,
          s.name as studentName
        FROM group_attendance ga
        LEFT JOIN users u ON ga.userId = u.id
        LEFT JOIN students s ON ga.studentId = s.id
        WHERE ga.schoolId = 8
        ORDER BY ga.id DESC
        LIMIT 5
      `);
      
      console.log('Fixed attendance records:');
      verificationRecords.forEach(record => {
        console.log(`  Record ${record.id}: studentId=${record.studentid}, userId=${record.userid}`);
        console.log(`    User name: ${record.username}`);
        console.log(`    Student name: ${record.studentname}`);
      });
    } else {
      console.log('No records need fixing.');
    }
    
    console.log('\n=== FIX COMPLETE ===');
    
  } catch (error) {
    console.error('Error fixing attendance data:', error);
  }
  
  process.exit(0);
}

fixAttendanceData();