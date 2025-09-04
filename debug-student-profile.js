// Debug script to test getStudentCompleteProfile for school 8 students
import { storage } from './server/storage.js';

async function testStudentProfile() {
  console.log('🔬 Testing getStudentCompleteProfile for school 8 students...');
  
  // Test student 26 in school 8 (should be assigned to group 27)
  console.log('\n--- Testing Student 26 in School 8 ---');
  try {
    const profile = await storage.getStudentCompleteProfile(26, 'student', 8);
    console.log('Profile returned:', profile ? 'YES' : 'NO');
    if (profile) {
      console.log('Student name:', profile.name);
      console.log('Enrolled groups count:', profile.enrolledGroups?.length || 0);
      console.log('Enrolled groups:', profile.enrolledGroups);
    }
  } catch (error) {
    console.error('Error testing student 26:', error);
  }
  
  // Test student 24 in school 8 (should be assigned to group 28)
  console.log('\n--- Testing Student 24 in School 8 ---');
  try {
    const profile = await storage.getStudentCompleteProfile(24, 'student', 8);
    console.log('Profile returned:', profile ? 'YES' : 'NO');
    if (profile) {
      console.log('Student name:', profile.name);
      console.log('Enrolled groups count:', profile.enrolledGroups?.length || 0);
      console.log('Enrolled groups:', profile.enrolledGroups);
    }
  } catch (error) {
    console.error('Error testing student 24:', error);
  }
  
  // Test student 25 in school 8 (should be assigned to group 29)
  console.log('\n--- Testing Student 25 in School 8 ---');
  try {
    const profile = await storage.getStudentCompleteProfile(25, 'student', 8);
    console.log('Profile returned:', profile ? 'YES' : 'NO');
    if (profile) {
      console.log('Student name:', profile.name);
      console.log('Enrolled groups count:', profile.enrolledGroups?.length || 0);
      console.log('Enrolled groups:', profile.enrolledGroups);
    }
  } catch (error) {
    console.error('Error testing student 25:', error);
  }
  
  console.log('\n🔬 Testing completed');
  process.exit(0);
}

testStudentProfile().catch(console.error);