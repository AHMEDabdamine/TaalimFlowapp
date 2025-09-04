#!/usr/bin/env tsx

import { db } from '../server/db';
import { users, teachingModules } from '@shared/schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// Teaching modules data based on standardized Algerian curriculum - no grades, just education levels
const STANDARDIZED_SUBJECTS = [
  // Primary Education (الابتدائي) - 3 subjects
  { name: 'Arabic and Mathematics', nameAr: 'العربية والرياضيات', educationLevel: 'الابتدائي' },
  { name: 'English Language', nameAr: 'اللغة الإنجليزية', educationLevel: 'الابتدائي' },
  { name: 'French Language', nameAr: 'اللغة الفرنسية', educationLevel: 'الابتدائي' },

  // Middle Education (المتوسط) - 7 subjects
  { name: 'Arabic Language', nameAr: 'اللغة العربية', educationLevel: 'المتوسط' },
  { name: 'English Language', nameAr: 'اللغة الإنجليزية', educationLevel: 'المتوسط' },
  { name: 'French Language', nameAr: 'اللغة الفرنسية', educationLevel: 'المتوسط' },
  { name: 'History and Geography', nameAr: 'التاريخ والجغرافيا', educationLevel: 'المتوسط' },
  { name: 'Mathematics', nameAr: 'الرياضيات', educationLevel: 'المتوسط' },
  { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية', educationLevel: 'المتوسط' },
  { name: 'Physics', nameAr: 'الفيزياء', educationLevel: 'المتوسط' },

  // Secondary Education (الثانوي) - 19 subjects
  { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها', educationLevel: 'الثانوي' },
  { name: 'English Language', nameAr: 'اللغة الإنجليزية', educationLevel: 'الثانوي' },
  { name: 'French Language', nameAr: 'اللغة الفرنسية', educationLevel: 'الثانوي' },
  { name: 'German Language', nameAr: 'اللغة الألمانية', educationLevel: 'الثانوي' },
  { name: 'Spanish Language', nameAr: 'اللغة الإسبانية', educationLevel: 'الثانوي' },
  { name: 'Amazigh Language', nameAr: 'اللغة الأمازيغية', educationLevel: 'الثانوي' },
  { name: 'Mathematics', nameAr: 'الرياضيات', educationLevel: 'الثانوي' },
  { name: 'Natural and Life Sciences', nameAr: 'العلوم الطبيعية والحياة', educationLevel: 'الثانوي' },
  { name: 'Physical Sciences', nameAr: 'العلوم الفيزيائية', educationLevel: 'الثانوي' },
  { name: 'History and Geography', nameAr: 'التاريخ والجغرافيا', educationLevel: 'الثانوي' },
  { name: 'Philosophy', nameAr: 'الفلسفة', educationLevel: 'الثانوي' },
  { name: 'Islamic Education', nameAr: 'التربية الإسلامية', educationLevel: 'الثانوي' },
  { name: 'Computer Science', nameAr: 'الإعلام الآلي', educationLevel: 'الثانوي' },
  { name: 'Economics and Management', nameAr: 'الاقتصاد والمناجمنت', educationLevel: 'الثانوي' },
  { name: 'Law', nameAr: 'القانون', educationLevel: 'الثانوي' },
  { name: 'Accounting', nameAr: 'المحاسبة', educationLevel: 'الثانوي' },
  { name: 'Electrical Engineering', nameAr: 'الهندسة الكهربائية', educationLevel: 'الثانوي' },
  { name: 'Civil Engineering', nameAr: 'الهندسة المدنية', educationLevel: 'الثانوي' },
  { name: 'Mechanical Engineering', nameAr: 'الهندسة الميكانيكية', educationLevel: 'الثانوي' }
];

async function seedTeachingModules() {
  console.log('\n📚 Seeding teaching modules...');
  
  try {
    // Check if teaching modules already exist
    const existingModules = await db.select().from(teachingModules).limit(1);
    
    if (existingModules.length > 0) {
      console.log('⚠️  Teaching modules already exist, skipping seeding');
      return;
    }

    console.log('📝 Creating standardized teaching modules...');
    let createdCount = 0;
    
    for (const subject of STANDARDIZED_SUBJECTS) {
      try {
        await db.insert(teachingModules).values({
          name: subject.name,
          nameAr: subject.nameAr,
          educationLevel: subject.educationLevel,
          grade: null, // No grade specified as requested
          description: `${subject.nameAr} - ${subject.educationLevel}`,
          schoolId: null // Global subject
        });
        
        createdCount++;
        console.log(`   ✅ Created: ${subject.nameAr} (${subject.educationLevel})`);
      } catch (error) {
        console.log(`   ⚠️  Error creating ${subject.nameAr}:`, (error as Error).message);
      }
    }
    
    console.log(`\n✅ Teaching modules seeding completed! Created ${createdCount} modules`);
    console.log('   📊 Summary:');
    console.log('   - Primary (الابتدائي): 3 subjects');
    console.log('   - Middle (المتوسط): 7 subjects');
    console.log('   - Secondary (الثانوي): 19 subjects');
    console.log(`   - Total: ${createdCount} standardized subjects`);
    
  } catch (error) {
    console.error('❌ Error seeding teaching modules:', error);
  }
}

async function createSuperAdmin() {
  console.log('🔧 Creating Super Admin Account...\n');

  // Prompt for admin details (for now using defaults, can be enhanced with prompts)
  const email = process.argv[2] || 'super@admin.com';
  const password = process.argv[3] || 'super123admin';
  const name = process.argv[4] || 'Super Administrator';

  try {
    // Check if super admin with this email already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('❌ A user with this email already exists!');
      console.log('📧 Email:', email);
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the super admin
    const superAdmin = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role: 'super_admin',
        phone: '0000000000',
        gender: 'male',
        verified: true,
        banned: false,
      })
      .returning();

    console.log('✅ Super Admin created successfully!\n');
    console.log('👤 Name:', name);
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!\n');

    // Seed teaching modules after creating super admin
    await seedTeachingModules();

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Usage info
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔧 Super Admin Creation Tool

Usage:
  npm run create-super-admin [email] [password] [name]

Examples:
  npm run create-super-admin
  npm run create-super-admin admin@school.com mypassword123 "School Admin"

Default values:
  Email: super@admin.com
  Password: super123admin
  Name: Super Administrator
`);
  process.exit(0);
}

createSuperAdmin();