import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function testLogin() {
  try {
    console.log('🔍 Testing super admin login...');
    
    // Test the exact request we're sending
    const testData = {
      email: 'mou3atheacc@gmail.com',
      password: 'SUPER_ADMIN_2024_MASTER_KEY'
    };
    
    console.log('Request data:', testData);
    
    const response = await fetch('http://localhost:5000/api/auth/super-admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
    // Also test database connectivity and password validation directly
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const userCheck = await pool.query('SELECT id, email, role, banned, password FROM users WHERE email = $1', ['mou3atheacc@gmail.com']);
    
    if (userCheck.rows.length > 0) {
      console.log('✅ Super admin user found in DB:', {
        id: userCheck.rows[0].id,
        email: userCheck.rows[0].email,
        role: userCheck.rows[0].role,
        banned: userCheck.rows[0].banned,
        passwordType: userCheck.rows[0].password.startsWith('$2b$') ? 'bcrypt' : 'plaintext'
      });
      
      // Test password validation directly
      const testPassword = 'SUPER_ADMIN_2024_MASTER_KEY';
      const storedPassword = userCheck.rows[0].password;
      
      if (storedPassword.startsWith('$2b$')) {
        const bcryptResult = await bcrypt.compare(testPassword, storedPassword);
        console.log('🔐 Bcrypt password test result:', bcryptResult);
      } else {
        const plainResult = storedPassword === testPassword;
        console.log('🔐 Plain text password test result:', plainResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Test login error:', error.message);
  }
}

testLogin();