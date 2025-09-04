import { db } from './db';
import { users, teachingModules } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

// Teaching modules data - only education levels without grades
const teachingModulesData = [
  // Primary Education (الابتدائي) - 3 subjects
  {
    name: 'Arabic and Mathematics',
    nameAr: 'العربية والرياضيات',
    educationLevel: 'الابتدائي',
    description: 'العربية والرياضيات - الابتدائي'
  },
  {
    name: 'English Language',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'الابتدائي',
    description: 'اللغة الإنجليزية - الابتدائي'
  },
  {
    name: 'French Language',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'الابتدائي',
    description: 'اللغة الفرنسية - الابتدائي'
  },

  // Middle Education (المتوسط) - 7 subjects
  {
    name: 'Arabic Language',
    nameAr: 'اللغة العربية',
    educationLevel: 'المتوسط',
    description: 'اللغة العربية - المتوسط'
  },
  {
    name: 'English Language',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'المتوسط',
    description: 'اللغة الإنجليزية - المتوسط'
  },
  {
    name: 'French Language',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'المتوسط',
    description: 'اللغة الفرنسية - المتوسط'
  },
  {
    name: 'History and Geography',
    nameAr: 'التاريخ والجغرافيا',
    educationLevel: 'المتوسط',
    description: 'التاريخ والجغرافيا - المتوسط'
  },
  {
    name: 'Mathematics',
    nameAr: 'الرياضيات',
    educationLevel: 'المتوسط',
    description: 'الرياضيات - المتوسط'
  },
  {
    name: 'Natural Sciences',
    nameAr: 'العلوم الطبيعية',
    educationLevel: 'المتوسط',
    description: 'العلوم الطبيعية - المتوسط'
  },
  {
    name: 'Physics',
    nameAr: 'الفيزياء',
    educationLevel: 'المتوسط',
    description: 'الفيزياء - المتوسط'
  },

  // Secondary Education (الثانوي) - 19 subjects
  {
    name: 'Arabic Language and Literature',
    nameAr: 'اللغة العربية وآدابها',
    educationLevel: 'الثانوي',
    description: 'اللغة العربية وآدابها - الثانوي'
  },
  {
    name: 'English Language',
    nameAr: 'اللغة الإنجليزية',
    educationLevel: 'الثانوي',
    description: 'اللغة الإنجليزية - الثانوي'
  },
  {
    name: 'French Language',
    nameAr: 'اللغة الفرنسية',
    educationLevel: 'الثانوي',
    description: 'اللغة الفرنسية - الثانوي'
  },
  {
    name: 'German Language',
    nameAr: 'اللغة الألمانية',
    educationLevel: 'الثانوي',
    description: 'اللغة الألمانية - الثانوي'
  },
  {
    name: 'Spanish Language',
    nameAr: 'اللغة الإسبانية',
    educationLevel: 'الثانوي',
    description: 'اللغة الإسبانية - الثانوي'
  },
  {
    name: 'Amazigh Language',
    nameAr: 'اللغة الأمازيغية',
    educationLevel: 'الثانوي',
    description: 'اللغة الأمازيغية - الثانوي'
  },
  {
    name: 'Mathematics',
    nameAr: 'الرياضيات',
    educationLevel: 'الثانوي',
    description: 'الرياضيات - الثانوي'
  },
  {
    name: 'Natural and Life Sciences',
    nameAr: 'العلوم الطبيعية والحياة',
    educationLevel: 'الثانوي',
    description: 'العلوم الطبيعية والحياة - الثانوي'
  },
  {
    name: 'Physical Sciences',
    nameAr: 'العلوم الفيزيائية',
    educationLevel: 'الثانوي',
    description: 'العلوم الفيزيائية - الثانوي'
  },
  {
    name: 'History and Geography',
    nameAr: 'التاريخ والجغرافيا',
    educationLevel: 'الثانوي',
    description: 'التاريخ والجغرافيا - الثانوي'
  },
  {
    name: 'Philosophy',
    nameAr: 'الفلسفة',
    educationLevel: 'الثانوي',
    description: 'الفلسفة - الثانوي'
  },
  {
    name: 'Islamic Education',
    nameAr: 'التربية الإسلامية',
    educationLevel: 'الثانوي',
    description: 'التربية الإسلامية - الثانوي'
  },
  {
    name: 'Computer Science',
    nameAr: 'الإعلام الآلي',
    educationLevel: 'الثانوي',
    description: 'الإعلام الآلي - الثانوي'
  },
  {
    name: 'Economics and Management',
    nameAr: 'الاقتصاد والمناجمنت',
    educationLevel: 'الثانوي',
    description: 'الاقتصاد والمناجمنت - الثانوي'
  },
  {
    name: 'Law',
    nameAr: 'القانون',
    educationLevel: 'الثانوي',
    description: 'القانون - الثانوي'
  },
  {
    name: 'Accounting',
    nameAr: 'المحاسبة',
    educationLevel: 'الثانوي',
    description: 'المحاسبة - الثانوي'
  },
  {
    name: 'Electrical Engineering',
    nameAr: 'الهندسة الكهربائية',
    educationLevel: 'الثانوي',
    description: 'الهندسة الكهربائية - الثانوي'
  },
  {
    name: 'Civil Engineering',
    nameAr: 'الهندسة المدنية',
    educationLevel: 'الثانوي',
    description: 'الهندسة المدنية - الثانوي'
  },
  {
    name: 'Mechanical Engineering',
    nameAr: 'الهندسة الميكانيكية',
    educationLevel: 'الثانوي',
    description: 'الهندسة الميكانيكية - الثانوي'
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Checking if database seeding is needed...');
    
    // Check if any super admin exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log('✅ Super admin already exists, skipping user seeding');
    } else {
      console.log('🚀 No super admin found, creating default super admin...');

      // Create default super admin account
      const defaultPassword = 'super123admin'; // Change this to something secure
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const superAdmin = await db
        .insert(users)
        .values({
          name: 'Super Administrator',
          email: 'super@admin.com',
          password: hashedPassword,
          role: 'super_admin',
          phone: '0000000000',
          gender: 'male',
          verified: true,
          banned: false,
        })
        .returning();

      console.log('✅ Default super admin created successfully!');
      console.log('📧 Email: super@admin.com');
      console.log('🔑 Password: super123admin');
      console.log('⚠️  IMPORTANT: Please change the password after first login!');
    }

    // Check if teaching modules already exist
    const existingModules = await db
      .select()
      .from(teachingModules)
      .limit(1);

    if (existingModules.length > 0) {
      console.log('✅ Teaching modules already exist, skipping module seeding');
      return;
    }

    console.log('📚 Creating standardized teaching modules...');

    // Create teaching modules
    let totalCreated = 0;
    for (const module of teachingModulesData) {
      try {
        await db.insert(teachingModules).values({
          name: module.name,
          nameAr: module.nameAr,
          educationLevel: module.educationLevel,
          description: module.description,
          schoolId: null // Global modules
        });
        
        totalCreated++;
        console.log(`✅ Created: ${module.nameAr} - ${module.educationLevel}`);
      } catch (error) {
        console.log(`⚠️  Error creating: ${module.nameAr}:`, error);
      }
    }

    console.log(`✅ Teaching modules seeding completed! Created ${totalCreated} modules.`);
    console.log('📊 Module Summary:');
    console.log('✅ Primary (الابتدائي): 3 subjects');
    console.log('✅ Middle (المتوسط): 7 subjects'); 
    console.log('✅ Secondary (الثانوي): 19 subjects');
    console.log(`✅ Total: ${totalCreated} standardized global modules`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}