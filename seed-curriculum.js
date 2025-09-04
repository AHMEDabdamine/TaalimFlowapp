const { execSync } = require('child_process');

console.log('🌱 Starting curriculum standardization...');

try {
  // Run the seeding script using tsx
  execSync('npx tsx server/curriculum-seeder.ts', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  console.log('✅ Curriculum standardization completed successfully!');
} catch (error) {
  console.error('❌ Error during curriculum seeding:', error.message);
  process.exit(1);
}