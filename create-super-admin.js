// Script to create a new super admin user in the database
import { db } from './server/db.js';
import { users, schools, teachingModules } from './shared/schema.js';
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
        console.log(`   ⚠️  Error creating ${subject.nameAr}:`, error.message);
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
  console.log('🔧 Creating new super admin user and seeding teaching modules...\n');
  
  try {
    // Super admin details - you can modify these
    const superAdminData = {
      email: 'superadmin@school.dz',
      password: 'SuperAdmin2025!', // Change this to a secure password
      name: 'Super Administrator',
      phone: '+213555000000',
      role: 'super_admin',
      phoneVerified: true,
      emailVerified: true,
      verified: true,
      schoolId: null, // Super admin has no specific school
    };

    console.log('1️⃣ Checking if super admin already exists...');
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, superAdminData.email));
    
    if (existingSuperAdmin.length > 0) {
      console.log('⚠️  Super admin with this email already exists!');
      console.log('   Email:', existingSuperAdmin[0].email);
      console.log('   Name:', existingSuperAdmin[0].name);
      console.log('   Role:', existingSuperAdmin[0].role);
      console.log('   ID:', existingSuperAdmin[0].id);
      
      // Ask if user wants to update the existing super admin
      console.log('\n🔄 Updating existing super admin with new password...');
      const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
      
      await db
        .update(users)
        .set({
          password: hashedPassword,
          name: superAdminData.name,
          phone: superAdminData.phone,
          phoneVerified: true,
          emailVerified: true,
          verified: true,
          role: 'super_admin',
          schoolId: null
        })
        .where(eq(users.id, existingSuperAdmin[0].id));
      
      console.log('✅ Super admin updated successfully!');
      console.log('   ID:', existingSuperAdmin[0].id);
      console.log('   Email:', superAdminData.email);
      console.log('   Password:', superAdminData.password);
      
      // Seed teaching modules after updating super admin
      await seedTeachingModules();
      return;
    }

    console.log('2️⃣ Hashing password...');
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

    console.log('3️⃣ Creating super admin user...');
    const [newSuperAdmin] = await db
      .insert(users)
      .values({
        ...superAdminData,
        password: hashedPassword,
      })
      .returning();

    console.log('✅ Super admin created successfully!');
    console.log('\n📋 Super Admin Details:');
    console.log('   ID:', newSuperAdmin.id);
    console.log('   Email:', newSuperAdmin.email);
    console.log('   Name:', newSuperAdmin.name);
    console.log('   Phone:', newSuperAdmin.phone);
    console.log('   Role:', newSuperAdmin.role);
    console.log('   Password:', superAdminData.password); // Show original password
    console.log('   School ID:', newSuperAdmin.schoolId || 'None (Super Admin)');
    console.log('   Verified:', newSuperAdmin.verified);

    // Test database connection by listing all schools
    console.log('\n4️⃣ Testing database connection - listing existing schools:');
    const allSchools = await db.select().from(schools);
    console.log(`   Found ${allSchools.length} schools in database:`);
    allSchools.forEach((school, index) => {
      console.log(`   ${index + 1}. ${school.name} (ID: ${school.id}, Code: ${school.code})`);
    });

    console.log('\n✅ Super admin setup completed successfully!');
    console.log('🔑 You can now login with:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);

    // Seed teaching modules after creating super admin
    await seedTeachingModules();
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
  }
  
  process.exit(0);
}

createSuperAdmin().catch(console.error);