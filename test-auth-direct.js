import { Pool, neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function testAuthenticationDirect() {
  try {
    console.log('🔍 Testing authentication directly...');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Get user from database
    const email = 'mou3atheacc@gmail.com';
    const password = 'SUPER_ADMIN_2024_MASTER_KEY';
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email, 
      role: user.role,
      banned: user.banned
    });
    
    // Test password validation
    let isValidPassword = false;
    
    if (user.password.startsWith('$2b$')) {
      // Bcrypt comparison
      isValidPassword = await bcrypt.compare(password, user.password);
      console.log('🔐 Bcrypt comparison result:', isValidPassword);
    } else {
      // Plain text comparison
      isValidPassword = (user.password === password);
      console.log('🔐 Plain text comparison result:', isValidPassword);
    }
    
    // Check role and ban status
    const isValidRole = user.role === 'super_admin';
    const isNotBanned = !user.banned;
    
    console.log('🔍 Final authentication result:', {
      passwordValid: isValidPassword,
      roleValid: isValidRole,
      notBanned: isNotBanned,
      overallResult: isValidPassword && isValidRole && isNotBanned
    });
    
    if (isValidPassword && isValidRole && isNotBanned) {
      console.log('✅ AUTHENTICATION SUCCESSFUL - Super admin should be able to log in!');
    } else {
      console.log('❌ AUTHENTICATION FAILED');
    }
    
  } catch (error) {
    console.error('❌ Direct authentication test error:', error);
  }
}

testAuthenticationDirect();