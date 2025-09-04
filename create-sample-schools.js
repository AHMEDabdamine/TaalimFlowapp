// Script to create sample schools for testing
import { db } from './server/db.js';
import { schools, users } from './shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createSampleSchools() {
  console.log('🏫 Creating sample schools for testing...\n');
  
  try {
    // Sample schools data
    const schoolsData = [
      {
        name: 'مدرسة النجاح الخاصة',
        code: 'najah-school-001',
        location: 'الجزائر العاصمة',
        adminKey: 'NAJAH_ADMIN_2025',
        teacherKey: 'NAJAH_TEACHER_2025',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        settings: {
          academicYear: '2024-2025',
          currency: 'DZD',
          timezone: 'Africa/Algiers'
        }
      },
      {
        name: 'معهد الإبداع التعليمي',
        code: 'ibdaa-institute-002',
        location: 'وهران',
        adminKey: 'IBDAA_ADMIN_2025',
        teacherKey: 'IBDAA_TEACHER_2025',
        primaryColor: '#059669',
        secondaryColor: '#047857',
        settings: {
          academicYear: '2024-2025',
          currency: 'DZD',
          timezone: 'Africa/Algiers'
        }
      },
      {
        name: 'مركز التفوق الأكاديمي',
        code: 'excellence-center-003',
        location: 'قسنطينة',
        adminKey: 'EXCEL_ADMIN_2025',
        teacherKey: 'EXCEL_TEACHER_2025',
        primaryColor: '#dc2626',
        secondaryColor: '#b91c1c',
        settings: {
          academicYear: '2024-2025',
          currency: 'DZD',
          timezone: 'Africa/Algiers'
        }
      }
    ];

    console.log('1️⃣ Creating schools...');
    const createdSchools = [];
    
    for (let i = 0; i < schoolsData.length; i++) {
      const schoolData = schoolsData[i];
      
      // Check if school already exists
      const existingSchool = await db
        .select()
        .from(schools)
        .where(eq(schools.code, schoolData.code));
      
      if (existingSchool.length > 0) {
        console.log(`   ⚠️  School ${schoolData.name} already exists (ID: ${existingSchool[0].id})`);
        createdSchools.push(existingSchool[0]);
        continue;
      }
      
      const [newSchool] = await db
        .insert(schools)
        .values(schoolData)
        .returning();
      
      console.log(`   ✅ Created: ${newSchool.name} (ID: ${newSchool.id})`);
      createdSchools.push(newSchool);
    }

    console.log('\n2️⃣ Creating sample admin users for each school...');
    
    for (let i = 0; i < createdSchools.length; i++) {
      const school = createdSchools[i];
      const adminEmail = `admin@${school.code}.dz`;
      
      // Check if admin already exists
      const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail));
      
      if (existingAdmin.length > 0) {
        console.log(`   ⚠️  Admin for ${school.name} already exists`);
        continue;
      }
      
      const adminPassword = `Admin${school.id}2025!`;
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const [newAdmin] = await db
        .insert(users)
        .values({
          schoolId: school.id,
          email: adminEmail,
          password: hashedPassword,
          name: `مدير ${school.name}`,
          phone: `+21355${1000 + school.id}`,
          role: 'admin',
          phoneVerified: true,
          emailVerified: true,
          verified: true,
        })
        .returning();
      
      console.log(`   ✅ Created admin for ${school.name}:`);
      console.log(`      Email: ${adminEmail}`);
      console.log(`      Password: ${adminPassword}`);
    }

    console.log('\n3️⃣ Summary of created schools:');
    const allSchools = await db.select().from(schools);
    allSchools.forEach((school, index) => {
      console.log(`   ${index + 1}. ${school.name}`);
      console.log(`      Code: ${school.code}`);
      console.log(`      Location: ${school.location}`);
      console.log(`      Admin Key: ${school.adminKey}`);
      console.log(`      Teacher Key: ${school.teacherKey}`);
      console.log(`      ID: ${school.id}`);
      console.log('');
    });

    console.log('✅ Sample schools setup completed successfully!');
    console.log('\n🔑 Login credentials:');
    console.log('Super Admin:');
    console.log('  Email: superadmin@school.dz');
    console.log('  Password: SuperAdmin2025!');
    console.log('');
    
    createdSchools.forEach((school, index) => {
      console.log(`School Admin ${index + 1} (${school.name}):`);
      console.log(`  Email: admin@${school.code}.dz`);
      console.log(`  Password: Admin${school.id}2025!`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating sample schools:', error);
  }
  
  process.exit(0);
}

createSampleSchools().catch(console.error);