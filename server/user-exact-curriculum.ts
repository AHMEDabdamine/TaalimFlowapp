import { db } from './db.js';
import { teachingModules } from '../shared/schema.js';

// EXACTLY the 29 subjects from user - NO MORE, NO LESS
const exactSubjects = [
  // Primary - EXACTLY 3
  { nameAr: 'العربية والرياضيات', level: 'الابتدائي', grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي'] },
  { nameAr: 'اللغة الإنجليزية', level: 'الابتدائي', grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي'] },
  { nameAr: 'اللغة الفرنسية', level: 'الابتدائي', grades: ['الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي'] },

  // Middle - EXACTLY 7  
  { nameAr: 'اللغة العربية', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'اللغة الإنجليزية', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'اللغة الفرنسية', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'التاريخ والجغرافيا', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'الرياضيات', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'العلوم الطبيعية', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },
  { nameAr: 'الفيزياء', level: 'المتوسط', grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'] },

  // Secondary - EXACTLY 19
  { nameAr: 'اللغة العربية وآدابها', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'اللغة الإنجليزية', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'اللغة الفرنسية', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'اللغة الألمانية', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'اللغة الإسبانية', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'اللغة الأمازيغية', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الرياضيات', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'العلوم الطبيعية والحياة', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'العلوم الفيزيائية', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'التاريخ والجغرافيا', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الفلسفة', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'التربية الإسلامية', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الإعلام الآلي', level: 'الثانوي', grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الاقتصاد والمناجمنت', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'القانون', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'المحاسبة', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الهندسة الكهربائية', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الهندسة المدنية', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] },
  { nameAr: 'الهندسة الميكانيكية', level: 'الثانوي', grades: ['الثانية ثانوي', 'الثالثة ثانوي'] }
];

export async function createUserExactCurriculum() {
  console.log('Creating EXACTLY your 29 subjects...');
  let created = 0;
  
  for (const subject of exactSubjects) {
    for (const grade of subject.grades) {
      await db.insert(teachingModules).values({
        name: subject.nameAr,
        nameAr: subject.nameAr,
        educationLevel: subject.level,
        grade: grade,
        description: `${subject.nameAr} - ${subject.level} - ${grade}`,
        schoolId: null
      });
      created++;
      console.log(`✅ ${subject.nameAr} - ${grade}`);
    }
  }
  
  console.log(`✅ Created exactly ${created} entries for your 29 subjects`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createUserExactCurriculum()
    .then(() => process.exit(0))
    .catch(console.error);
}