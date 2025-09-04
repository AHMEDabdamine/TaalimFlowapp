// Quick test script to debug student groups
import fetch from 'node-fetch';

console.log('Testing student groups API...');

// Test QR scan first
const testQRScan = async () => {
  try {
    console.log('1. Testing QR scan endpoint...');
    const response = await fetch('http://localhost:5000/api/scan-student-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData: 'student:1:1:verified' })
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('✅ QR scan successful');
      console.log('Profile:', JSON.stringify(profile, null, 2));
      return profile;
    } else {
      const error = await response.json();
      console.log('❌ QR scan failed:', error);
      return null;
    }
  } catch (err) {
    console.error('❌ QR scan error:', err);
    return null;
  }
};

// Test groups endpoint
const testGroupsAPI = async (studentId) => {
  try {
    console.log('2. Testing groups endpoint...');
    const response = await fetch(`http://localhost:5000/api/students/${studentId}/groups?type=student`);
    
    if (response.ok) {
      const groups = await response.json();
      console.log('✅ Groups API successful');
      console.log('Groups:', JSON.stringify(groups, null, 2));
    } else {
      const error = await response.json();
      console.log('❌ Groups API failed:', error);
    }
  } catch (err) {
    console.error('❌ Groups API error:', err);
  }
};

// Run tests
const profile = await testQRScan();
if (profile && profile.id) {
  await testGroupsAPI(profile.id);
}