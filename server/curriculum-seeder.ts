import { db } from './db';
import { teachingModules } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Comprehensive Algerian curriculum based on the standardized system
export const ALGERIAN_CURRICULUM = {
  // Primary Education (الابتدائي)
  primary: {
    'الأولى ابتدائي': [
      { name: 'Arabic and Mathematics', nameAr: 'العربية والرياضيات' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' }
    ],
    'الثانية ابتدائي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الثالثة ابتدائي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History and Geography', nameAr: 'التاريخ والجغرافيا' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الرابعة ابتدائي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الخامسة ابتدائي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'جميع المستويات': [
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ]
  },

  // Middle School Education (المتوسط)
  middle: {
    'الأولى متوسط': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Arabic Language', nameAr: 'اللغة العربية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الثانية متوسط': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Arabic Language', nameAr: 'اللغة العربية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الثالثة متوسط': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Arabic Language', nameAr: 'اللغة العربية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الرابعة متوسط': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'Civic Education', nameAr: 'التربية المدنية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Chemistry', nameAr: 'الكيمياء' },
      { name: 'Biology', nameAr: 'علم الأحياء' },
      { name: 'Arabic Language', nameAr: 'اللغة العربية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'جميع المستويات': [
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Arabic Language', nameAr: 'اللغة العربية' }
    ]
  },

  // Secondary Education (الثانوي)
  secondary: {
    'الأولى ثانوي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Chemistry', nameAr: 'الكيمياء' },
      { name: 'Biology', nameAr: 'الأحياء' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Natural Sciences and Life', nameAr: 'العلوم الطبيعية والحياة' },
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'الثانية ثانوي': [
      { name: 'Arabic Language', nameAr: 'العربية' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'French Language', nameAr: 'الفرنسية' },
      { name: 'English Language', nameAr: 'الإنجليزية' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Natural Sciences', nameAr: 'العلوم الطبيعية' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Chemistry', nameAr: 'الكيمياء' },
      { name: 'Biology', nameAr: 'الأحياء' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Natural Sciences and Life', nameAr: 'العلوم الطبيعية والحياة' },
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'علمي': [
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Chemistry', nameAr: 'الكيمياء' },
      { name: 'Biology', nameAr: 'الأحياء' },
      { name: 'Natural Sciences and Life', nameAr: 'العلوم الطبيعية والحياة' },
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' }
    ],
    'أدبي': [
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'تسيير واقتصاد': [
      { name: 'Economics', nameAr: 'الاقتصاد' },
      { name: 'Management', nameAr: 'التسيير' },
      { name: 'Accounting', nameAr: 'المحاسبة' },
      { name: 'Commercial Law', nameAr: 'القانون التجاري' },
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' }
    ],
    'تقني رياضي': [
      { name: 'Mathematics', nameAr: 'الرياضيات' },
      { name: 'Physics', nameAr: 'الفيزياء' },
      { name: 'Chemistry', nameAr: 'الكيمياء' },
      { name: 'Engineering Sciences', nameAr: 'العلوم الهندسية' },
      { name: 'Technical Drawing', nameAr: 'الرسم التقني' },
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' }
    ],
    'آداب وفلسفة': [
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' }
    ],
    'لغات أجنبية': [
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'English Language', nameAr: 'اللغة الإنجليزية' },
      { name: 'French Language', nameAr: 'اللغة الفرنسية' },
      { name: 'German Language', nameAr: 'اللغة الألمانية' },
      { name: 'Spanish Language', nameAr: 'اللغة الإسبانية' },
      { name: 'Italian Language', nameAr: 'اللغة الإيطالية' },
      { name: 'Philosophy', nameAr: 'الفلسفة' },
      { name: 'History', nameAr: 'التاريخ' },
      { name: 'Geography', nameAr: 'الجغرافيا' },
      { name: 'Islamic Education', nameAr: 'التربية الإسلامية' }
    ],
    'جميع المستويات': [
      { name: 'Arabic Language and Literature', nameAr: 'اللغة العربية وآدابها' },
      { name: 'Amazigh Language', nameAr: 'اللغة الأمازيغية' },
      { name: 'German Language', nameAr: 'اللغة الألمانية' },
      { name: 'Spanish Language', nameAr: 'اللغة الإسبانية' }
    ]
  }
};

/**
 * Seeds the standardized Algerian curriculum for all schools
 */
export async function seedStandardizedCurriculum(): Promise<void> {
  console.log('🌱 Starting curriculum standardization...');

  // First, clear existing global subjects to avoid duplicates
  await db.delete(teachingModules).where(eq(teachingModules.schoolId, null));
  
  const modulesToInsert = [];

  // Primary Education
  for (const [grade, subjects] of Object.entries(ALGERIAN_CURRICULUM.primary)) {
    for (const subject of subjects) {
      modulesToInsert.push({
        schoolId: null, // Global subjects
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'الابتدائي',
        grade: grade,
        description: `${subject.nameAr} - ${grade}`
      });
    }
  }

  // Middle School Education
  for (const [grade, subjects] of Object.entries(ALGERIAN_CURRICULUM.middle)) {
    for (const subject of subjects) {
      modulesToInsert.push({
        schoolId: null,
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'المتوسط',
        grade: grade,
        description: `${subject.nameAr} - ${grade}`
      });
    }
  }

  // Secondary Education
  for (const [grade, subjects] of Object.entries(ALGERIAN_CURRICULUM.secondary)) {
    for (const subject of subjects) {
      modulesToInsert.push({
        schoolId: null,
        name: subject.name,
        nameAr: subject.nameAr,
        educationLevel: 'الثانوي',
        grade: grade,
        description: `${subject.nameAr} - ${grade}`
      });
    }
  }

  // Insert all modules in batches
  const batchSize = 50;
  for (let i = 0; i < modulesToInsert.length; i += batchSize) {
    const batch = modulesToInsert.slice(i, i + batchSize);
    await db.insert(teachingModules).values(batch);
  }

  console.log(`✅ Successfully seeded ${modulesToInsert.length} standardized curriculum subjects`);
}

/**
 * Ensures a specific school has access to all standardized subjects
 */
export async function ensureSchoolHasStandardizedCurriculum(schoolId: number): Promise<void> {
  console.log(`🏫 Ensuring school ${schoolId} has standardized curriculum...`);
  
  // This function can be called when a new school is created
  // The global subjects (schoolId = null) are already available to all schools
  // Individual schools can add their own custom subjects on top
  
  console.log(`✅ School ${schoolId} now has access to standardized curriculum`);
}

// Run the seeding function if this script is executed directly
seedStandardizedCurriculum()
  .then(() => {
    console.log('🎉 Curriculum seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding curriculum:', error);
    process.exit(1);
  });