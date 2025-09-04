import { db } from './db.js';
import { teachingModules } from '../shared/schema.js';

// EXACT subjects from user specification - NO changes allowed
const userProvidedCurriculum = [
  // الابتدائي (Primary Level) - EXACTLY 3 subjects
  { nameAr: 'العربية والرياضيات', educationLevel: 'الابتدائي' },
  { nameAr: 'اللغة الإنجليزية', educationLevel: 'الابتدائي' },
  { nameAr: 'اللغة الفرنسية', educationLevel: 'الابتدائي' },

  // المتوسط (Middle Level) - EXACTLY 7 subjects
  { nameAr: 'اللغة العربية', educationLevel: 'المتوسط' },
  { nameAr: 'اللغة الإنجليزية', educationLevel: 'المتوسط' },
  { nameAr: 'اللغة الفرنسية', educationLevel: 'المتوسط' },
  { nameAr: 'التاريخ والجغرافيا', educationLevel: 'المتوسط' },
  { nameAr: 'الرياضيات', educationLevel: 'المتوسط' },
  { nameAr: 'العلوم الطبيعية', educationLevel: 'المتوسط' },
  { nameAr: 'الفيزياء', educationLevel: 'المتوسط' },

  // الثانوي (Secondary Level) - EXACTLY 19 subjects
  { nameAr: 'اللغة العربية وآدابها', educationLevel: 'الثانوي' },
  { nameAr: 'اللغة الإنجليزية', educationLevel: 'الثانوي' },
  { nameAr: 'اللغة الفرنسية', educationLevel: 'الثانوي' },
  { nameAr: 'اللغة الألمانية', educationLevel: 'الثانوي' },
  { nameAr: 'اللغة الإسبانية', educationLevel: 'الثانوي' },
  { nameAr: 'اللغة الأمازيغية', educationLevel: 'الثانوي' },
  { nameAr: 'الرياضيات', educationLevel: 'الثانوي' },
  { nameAr: 'العلوم الطبيعية والحياة', educationLevel: 'الثانوي' },
  { nameAr: 'العلوم الفيزيائية', educationLevel: 'الثانوي' },
  { nameAr: 'التاريخ والجغرافيا', educationLevel: 'الثانوي' },
  { nameAr: 'الفلسفة', educationLevel: 'الثانوي' },
  { nameAr: 'التربية الإسلامية', educationLevel: 'الثانوي' },
  { nameAr: 'الإعلام الآلي', educationLevel: 'الثانوي' },
  { nameAr: 'الاقتصاد والمناجمنت', educationLevel: 'الثانوي' },
  { nameAr: 'القانون', educationLevel: 'الثانوي' },
  { nameAr: 'المحاسبة', educationLevel: 'الثانوي' },
  { nameAr: 'الهندسة الكهربائية', educationLevel: 'الثانوي' },
  { nameAr: 'الهندسة المدنية', educationLevel: 'الثانوي' },
  { nameAr: 'الهندسة الميكانيكية', educationLevel: 'الثانوي' }
];

const gradesByLevel = {
  'الابتدائي': ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي', 'جميع المستويات'],
  'المتوسط': ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط', 'جميع المستويات'],
  'الثانوي': ['الأولى ثانوي', 'الثانية ثانوي', 'آداب وفلسفة', 'أدبي', 'علمي', 'تقني رياضي', 'تسيير واقتصاد', 'لغات أجنبية', 'جميع المستويات']
};

export async function seedFinalExactCurriculum() {
  console.log('🌱 Creating FINAL EXACT curriculum from user specifications...');
  
  let totalCreated = 0;
  
  for (const subject of userProvidedCurriculum) {
    const grades = gradesByLevel[subject.educationLevel];
    
    for (const grade of grades) {
      try {
        await db.insert(teachingModules).values({
          name: subject.nameAr, // Using Arabic name as English name too
          nameAr: subject.nameAr,
          educationLevel: subject.educationLevel,
          grade: grade,
          description: `${subject.nameAr} - ${subject.educationLevel} - ${grade}`,
          schoolId: null // Global subject
        });
        
        totalCreated++;
        console.log(`✅ Created: ${subject.nameAr} - ${subject.educationLevel} - ${grade}`);
      } catch (error) {
        console.log(`⚠️ Error creating: ${subject.nameAr} - ${subject.educationLevel} - ${grade}:`, error);
      }
    }
  }
  
  console.log(`✅ FINAL curriculum seeding completed! Created ${totalCreated} subject entries.`);
  console.log('📊 Exact Summary:');
  console.log('  - Primary (الابتدائي): 3 subjects');
  console.log('  - Middle (المتوسط): 7 subjects');  
  console.log('  - Secondary (الثانوي): 19 subjects');
  console.log('  - Total unique subjects: 29');
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFinalExactCurriculum()
    .then(() => {
      console.log('🎉 FINAL EXACT curriculum implementation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding final curriculum:', error);
      process.exit(1);
    });
}