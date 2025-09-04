#!/usr/bin/env node

/**
 * Debug script to test child attendance issue using only built-in modules
 */

async function debugChildAttendance() {
  console.log("🔍 Starting child attendance debug test...\n");
  
  // Read environment variable manually
  const fs = await import('fs');
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    try {
      const envContent = fs.readFileSync('.env', 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
          databaseUrl = line.split('=', 2)[1];
          break;
        }
      }
    } catch (e) {
      console.log("Could not read .env file");
    }
  }
  
  console.log("DATABASE_URL:", databaseUrl ? "Present" : "Missing");
  
  if (!databaseUrl) {
    console.log("❌ No database URL found. Cannot continue test.");
    return;
  }
  
  // Simple database connection test using node-postgres
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: databaseUrl
  });
  
  try {
    await client.connect();
    console.log("✅ Database connected successfully\n");
  
    // Test 1: Get group assignments directly from database
    console.log("📝 Step 1: Looking for groups with mixed assignments...");
    
    const testSchoolId = 4;
    
    // Query groups with assignments
    const groupsQuery = `
      SELECT g.id, g.name, COUNT(gma.id) as assignment_count
      FROM "groups" g
      LEFT JOIN "groupMixedAssignments" gma ON g.id = gma."groupId"
      WHERE g."schoolId" = $1
      GROUP BY g.id, g.name
      HAVING COUNT(gma.id) > 0
      ORDER BY g.id
      LIMIT 3;
    `;
    
    const groupsResult = await client.query(groupsQuery, [testSchoolId]);
    console.log(`Found ${groupsResult.rows.length} groups with assignments in school ${testSchoolId}`);
    
    for (const group of groupsResult.rows) {
      console.log(`\n🔍 Testing Group: ${group.name} (ID: ${group.id})`);
      console.log(`  Assignment count: ${group.assignment_count}`);
      
      // Test 2: Get detailed assignments for this group
      console.log(`\n📝 Step 2: Getting assignments for group ${group.id}...`);
      
      const assignmentsQuery = `
        SELECT 
          gma."studentId",
          gma."userId", 
          gma."studentType",
          CASE 
            WHEN gma."studentType" = 'student' THEN s.name
            WHEN gma."studentType" = 'child' THEN c.name
          END as name,
          CASE 
            WHEN gma."studentType" = 'student' THEN s."educationLevel"
            WHEN gma."studentType" = 'child' THEN c."educationLevel"
          END as education_level,
          CASE 
            WHEN gma."studentType" = 'student' THEN u.email
            WHEN gma."studentType" = 'child' THEN pu.email
          END as email
        FROM "groupMixedAssignments" gma
        LEFT JOIN "students" s ON gma."studentType" = 'student' AND gma."studentId" = s.id
        LEFT JOIN "children" c ON gma."studentType" = 'child' AND gma."studentId" = c.id
        LEFT JOIN "users" u ON s."userId" = u.id
        LEFT JOIN "users" pu ON c."parentId" = pu.id
        WHERE gma."groupId" = $1
        ORDER BY gma."studentType", name;
      `;
      
      const assignmentsResult = await client.query(assignmentsQuery, [group.id]);
      console.log(`Found ${assignmentsResult.rows.length} assignments:`);
      
      assignmentsResult.rows.forEach((assignment, index) => {
        console.log(`  ${index + 1}. ${assignment.name} (Student ID: ${assignment.studentId})`);
        console.log(`     User ID: ${assignment.userId}`);
        console.log(`     Type: ${assignment.studentType}`);
        console.log(`     Email: ${assignment.email}`);
        console.log(`     Education Level: ${assignment.education_level}`);
        console.log("");
      });
      
      // Test 3: Check if any child assignments have missing userId
      const childAssignments = assignmentsResult.rows.filter(a => a.studentType === 'child');
      if (childAssignments.length > 0) {
        console.log(`\n📝 Step 3: Analyzing ${childAssignments.length} child assignments...`);
        childAssignments.forEach(child => {
          const hasUserId = child.userId ? "✅" : "❌";
          console.log(`${hasUserId} ${child.name} - UserId: ${child.userId || 'MISSING'}`);
        });
      }
      
      // Only test the first group to avoid too much output
      break;
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

// Run the debug test
debugChildAttendance().then(() => {
  console.log("\n✅ Debug test completed!");
  process.exit(0);
}).catch(error => {
  console.error("❌ Debug test failed:", error);
  process.exit(1);
});