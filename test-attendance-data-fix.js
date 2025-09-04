// Test to understand and fix attendance data issue
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use the built database from dist
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkAndFixAttendanceData() {
  try {
    console.log('=== ATTENDANCE DATA ANALYSIS ===');
    
    // 1. Check current attendance records
    console.log('\n1. Current attendance records for school 8:');
    const currentRecords = await pool.query(`
      SELECT 
        ga.id,
        ga.studentId,
        ga.userId,
        ga.studentType,
        ga.status,
        ga.groupId,
        u.name as userName
      FROM group_attendance ga
      LEFT JOIN users u ON ga.userId = u.id
      WHERE ga.schoolId = 8
      ORDER BY ga.id DESC
      LIMIT 5
    `);
    
    currentRecords.rows.forEach(record => {
      console.log(`  Record ${record.id}: studentId=${record.studentid}, userId=${record.userid}, user=${record.username}`);
    });
    
    // 2. Check group assignments to understand correct mapping
    console.log('\n2. Group assignments for reference:');
    const assignments = await pool.query(`
      SELECT 
        studentId,
        userId,
        studentType,
        groupId
      FROM group_mixed_assignments
      WHERE userId = 34
      ORDER BY groupId
    `);
    
    assignments.rows.forEach(assignment => {
      console.log(`  Assignment: studentId=${assignment.studentid}, userId=${assignment.userid}, type=${assignment.studenttype}, group=${assignment.groupid}`);
    });
    
    // 3. Find and fix records where studentId = userId (incorrect data)
    console.log('\n3. Finding records where studentId equals userId (incorrect):');
    const incorrectRecords = await pool.query(`
      SELECT 
        ga.id,
        ga.studentId,
        ga.userId,
        gma.studentId as correctStudentId
      FROM group_attendance ga
      JOIN group_mixed_assignments gma 
        ON ga.groupId = gma.groupId 
        AND ga.userId = gma.userId
        AND ga.studentType = gma.studentType
      WHERE ga.schoolId = 8
        AND ga.studentId = ga.userId
    `);
    
    console.log(`Found ${incorrectRecords.rows.length} records with incorrect studentId:`);
    incorrectRecords.rows.forEach(record => {
      console.log(`  Record ${record.id}: current studentId=${record.studentid}, should be=${record.correctstudentid}`);
    });
    
    // 4. Fix the records
    if (incorrectRecords.rows.length > 0) {
      console.log('\n4. Fixing incorrect records...');
      for (const record of incorrectRecords.rows) {
        await pool.query(`
          UPDATE group_attendance 
          SET studentId = $1
          WHERE id = $2
        `, [record.correctstudentid, record.id]);
        console.log(`  ✓ Fixed record ${record.id}: studentId ${record.studentid} → ${record.correctstudentid}`);
      }
      
      // 5. Verify the fix
      console.log('\n5. Verification after fix:');
      const verifyRecords = await pool.query(`
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
        LIMIT 3
      `);
      
      verifyRecords.rows.forEach(record => {
        console.log(`  Record ${record.id}:`);
        console.log(`    studentId=${record.studentid}, userId=${record.userid}`);
        console.log(`    userName=${record.username}, studentName=${record.studentname}`);
      });
      
      console.log('\n✅ ATTENDANCE DATA FIXED!');
      console.log('Now the debug should show: User ID = 34 (for name lookup), Student ID = 18 (for attendance)');
    } else {
      console.log('✅ No records need fixing.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndFixAttendanceData();