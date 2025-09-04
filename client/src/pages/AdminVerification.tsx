import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Users, GraduationCap, Clock, Calendar, Trash2, BookOpen, Download, IdCard } from 'lucide-react';
import QRCode from 'qrcode';
import { StudentIDCard } from '@/components/StudentIDCard';

interface UnverifiedChild {
  id: number;
  parentId: number;
  name: string;
  educationLevel: string;
  grade: string;
  createdAt: string;
  verified: boolean;
}

interface UnverifiedStudent {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  createdAt: string;
  verified: boolean;
  name: string;
}

interface VerifiedChild {
  id: number;
  parentId: number;
  name: string;
  educationLevel: string;
  grade: string;
  verified: boolean;
  verifiedAt: string;
  verifiedBy: number;
  verificationNotes: string;
  selectedSubjects?: string[];
}

interface VerifiedStudent {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  verified: boolean;
  verifiedAt: string;
  verifiedBy: number;
  verificationNotes: string;
  name: string;
  selectedSubjects?: string[];
}

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade: string | null;
  description: string | null;
}

// Helper function to format education level display
const formatEducationLevel = (educationLevel: string, grade: string) => {
  // Extract year number from grade string
  const extractYearNumber = (gradeStr: string) => {
    if (gradeStr.includes('الأولى')) return '1';
    if (gradeStr.includes('الثانية')) return '2';
    if (gradeStr.includes('الثالثة')) return '3';
    if (gradeStr.includes('الرابعة')) return '4';
    if (gradeStr.includes('الخامسة')) return '5';
    return gradeStr; // fallback to original if no match
  };

  const yearNumber = extractYearNumber(grade);
  
  if (educationLevel === 'الابتدائي') {
    return `ابتدائي ${yearNumber}`;
  } else if (educationLevel === 'المتوسط') {
    return `متوسط ${yearNumber}`;
  } else if (educationLevel === 'الثانوي') {
    return `ثانوي ${yearNumber}`;
  }
  return `${educationLevel} - ${grade}`;
};

export default function AdminVerification() {
  const { user } = useAuth();
  const [unverifiedChildren, setUnverifiedChildren] = useState<UnverifiedChild[]>([]);
  const [unverifiedStudents, setUnverifiedStudents] = useState<UnverifiedStudent[]>([]);
  const [verifiedChildren, setVerifiedChildren] = useState<VerifiedChild[]>([]);
  const [verifiedStudents, setVerifiedStudents] = useState<VerifiedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedItem, setSelectedItem] = useState<{type: string, id: number, data?: any} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [teachingModules, setTeachingModules] = useState<TeachingModule[]>([]);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<TeachingModule[]>([]);
  const [verifierAdminName, setVerifierAdminName] = useState<string>('');
  const [verifiedItemSubjects, setVerifiedItemSubjects] = useState<string[]>([]);
  const [showIDCard, setShowIDCard] = useState(false);
  
  // Get selected school from localStorage
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');

  // Check if user has admin privileges
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-700">صلاحيات المدير مطلوبة</CardTitle>
              <CardDescription className="text-gray-600">
                يجب أن تكون مديراً للوصول إلى هذه الصفحة
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                هذه الصفحة مخصصة للمدراء فقط لإدارة التحقق من الأطفال والطلاب
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                العودة إلى الصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Function to fetch admin details by ID
  const fetchAdminDetails = async (adminId: number) => {
    try {
      const response = await fetch(`/api/users/${adminId}`);
      if (response.ok) {
        const admin = await response.json();
        return admin.name || 'مدير غير معروف';
      }
    } catch (error) {
      console.error('Error fetching admin details:', error);
    }
    return 'مدير غير معروف';
  };

  // Function to get subject names from IDs
  const getSubjectNamesFromIds = (subjectIds: string[]): string[] => {
    if (!subjectIds || subjectIds.length === 0) return [];
    
    return subjectIds.map(id => {
      const subject = teachingModules.find(module => module.id.toString() === id);
      return subject ? subject.nameAr : `مادة غير معروفة (${id})`;
    });
  };

  // Function to load verification details when viewing verified items
  const loadVerificationDetails = async (item: any) => {
    if (item.data?.verifiedBy) {
      const adminName = await fetchAdminDetails(item.data.verifiedBy);
      setVerifierAdminName(adminName);
    }
    
    if (item.data?.selectedSubjects) {
      const subjectNames = getSubjectNamesFromIds(item.data.selectedSubjects);
      setVerifiedItemSubjects(subjectNames);
    } else {
      setVerifiedItemSubjects([]);
    }
  };

  // Function to generate QR code data for a student/child
  const generateQRCodeData = (type: 'student' | 'child', id: number, schoolId: number) => {
    // Generate a simple QR code format that matches what the scanner expects
    return `${type}:${id}:${schoolId}:verified`;
  };

  // Function to export verified users to CSV with QR code images
  const exportSimpleCSV = async () => {
    try {
      toast({
        title: '⏳ جاري تحضير البيانات...',
        description: 'يتم إنشاء أكواد QR...'
      });

      const csvData = [];
      
      // Add header
      csvData.push(['الاسم الكامل', 'المستوى والسنة', 'رمز QR']);

      // Add verified children
      for (const child of verifiedChildren) {
        const qrText = `STUDENT_${child.id}_${user?.schoolId}_child`;
        const qrImage = await QRCode.toDataURL(qrText, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        csvData.push([
          child.name,
          formatEducationLevel(child.educationLevel, child.grade),
          qrImage
        ]);
      }

      // Add verified students  
      for (const student of verifiedStudents) {
        const qrText = `STUDENT_${student.id}_${user?.schoolId}_student`;
        const qrImage = await QRCode.toDataURL(qrText, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        csvData.push([
          student.name,
          formatEducationLevel(student.educationLevel, student.grade),
          qrImage
        ]);
      }

      // Convert to CSV string
      const csvString = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `verified_users_simple_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "تم تصدير البيانات",
        description: "تم تصدير قائمة الطلاب المبسطة مع أكواد QR بنجاح",
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "خطأ في التصدير", 
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  const exportVerifiedUsersToCSV = async () => {
    try {
      toast({
        title: '⏳ جاري تحضير البيانات...',
        description: 'يتم إنشاء رموز QR وتحضير الملف'
      });

      // Prepare CSV data
      const csvData = [];
      
      // CSV Headers
      csvData.push([
        'النوع',
        'الاسم', 
        'المستوى التعليمي',
        'السنة الدراسية',
        'المواد المختارة',
        'تاريخ التحقق',
        'تم التحقق بواسطة',
        'ملاحظات التحقق',
        'رمز QR (نص)',
        'رمز QR (صورة)'
      ]);

      // Process verified children
      for (const child of verifiedChildren) {
        const subjectNames = child.selectedSubjects ? getSubjectNamesFromIds(child.selectedSubjects).join(' | ') : 'لا توجد';
        const qrCodeData = generateQRCodeData('child', child.id, user?.schoolId || 0);
        
        try {
          // Generate QR code as data URL
          const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          csvData.push([
            'طفل',
            child.name,
            formatEducationLevel(child.educationLevel, child.grade),
            child.grade,
            subjectNames,
            new Date(child.verifiedAt).toLocaleDateString('en-US'),
            'مدير',
            child.verificationNotes || 'لا توجد ملاحظات',
            qrCodeData,
            qrCodeImage
          ]);
        } catch (qrError) {
          console.error('Error generating QR code for child:', child.id, qrError);
          csvData.push([
            'طفل',
            child.name,
            formatEducationLevel(child.educationLevel, child.grade),
            child.grade,
            subjectNames,
            new Date(child.verifiedAt).toLocaleDateString('en-US'),
            'مدير',
            child.verificationNotes || 'لا توجد ملاحظات',
            qrCodeData,
            'خطأ في إنشاء رمز QR'
          ]);
        }
      }

      // Process verified students
      for (const student of verifiedStudents) {
        const subjectNames = student.selectedSubjects ? getSubjectNamesFromIds(student.selectedSubjects).join(' | ') : 'لا توجد';
        const qrCodeData = generateQRCodeData('student', student.id, user?.schoolId || 0);
        
        try {
          // Generate QR code as data URL
          const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          csvData.push([
            'طالب',
            student.name,
            formatEducationLevel(student.educationLevel, student.grade),
            student.grade,
            subjectNames,
            new Date(student.verifiedAt).toLocaleDateString('en-US'),
            'مدير',
            student.verificationNotes || 'لا توجد ملاحظات',
            qrCodeData,
            qrCodeImage
          ]);
        } catch (qrError) {
          console.error('Error generating QR code for student:', student.id, qrError);
          csvData.push([
            'طالب',
            student.name,
            formatEducationLevel(student.educationLevel, student.grade),
            student.grade,
            subjectNames,
            new Date(student.verifiedAt).toLocaleDateString('en-US'),
            'مدير',
            student.verificationNotes || 'لا توجد ملاحظات',
            qrCodeData,
            'خطأ في إنشاء رمز QR'
          ]);
        }
      }

      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`)
          .join(',')
      ).join('\n');

      // Add BOM for proper Arabic display in Excel
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob and download
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `verified_users_with_qr_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: '✅ تم تصدير البيانات بنجاح',
        description: `تم تصدير ${verifiedChildren.length + verifiedStudents.length} سجل مع رموز QR`
      });

    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: '❌ خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const fetchData = async () => {
    try {
      const [
        unverifiedChildrenResponse,
        unverifiedStudentsResponse,
        verifiedChildrenResponse,
        verifiedStudentsResponse,
        teachingModulesResponse
      ] = await Promise.all([
        fetch('/api/admin/unverified-children'),
        fetch('/api/admin/unverified-students'),
        fetch('/api/admin/verified-children'),
        fetch('/api/admin/verified-students'),
        fetch('/api/teaching-modules')
      ]);

      if (unverifiedChildrenResponse.ok) {
        const children = await unverifiedChildrenResponse.json();
        setUnverifiedChildren(children);
      }

      if (unverifiedStudentsResponse.ok) {
        const students = await unverifiedStudentsResponse.json();
        setUnverifiedStudents(students);
      }

      if (verifiedChildrenResponse.ok) {
        const children = await verifiedChildrenResponse.json();
        setVerifiedChildren(children);
      }

      if (verifiedStudentsResponse.ok) {
        const students = await verifiedStudentsResponse.json();
        setVerifiedStudents(students);
      }

      if (teachingModulesResponse.ok) {
        const modules = await teachingModulesResponse.json();
        setTeachingModules(modules);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب البيانات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle education level change and reset grade/subjects
  const handleEducationLevelChange = (level: string) => {
    setSelectedEducationLevel(level);
    setSelectedGrade(''); // Reset grade when level changes
    setAvailableSubjects([]);
    setSelectedSubjects([]); // Reset selected subjects when level changes
  };

  // Handle grade change and update available subjects
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    const subjects = teachingModules.filter(module => 
      module.educationLevel === selectedEducationLevel
    );
    setAvailableSubjects(subjects);
    setSelectedSubjects([]); // Reset selected subjects when grade changes
  };

  // Get available grades based on selected education level
  const getAvailableGrades = () => {
    if (selectedEducationLevel === 'الابتدائي') {
      return [
        { value: 'الأولى ابتدائي', label: 'السنة الأولى ابتدائي' },
        { value: 'الثانية ابتدائي', label: 'السنة الثانية ابتدائي' },
        { value: 'الثالثة ابتدائي', label: 'السنة الثالثة ابتدائي' },
        { value: 'الرابعة ابتدائي', label: 'السنة الرابعة ابتدائي' },
        { value: 'الخامسة ابتدائي', label: 'السنة الخامسة ابتدائي' }
      ];
    } else if (selectedEducationLevel === 'المتوسط') {
      return [
        { value: 'الأولى متوسط', label: 'السنة الأولى متوسط' },
        { value: 'الثانية متوسط', label: 'السنة الثانية متوسط' },
        { value: 'الثالثة متوسط', label: 'السنة الثالثة متوسط' },
        { value: 'الرابعة متوسط', label: 'السنة الرابعة متوسط' }
      ];
    } else if (selectedEducationLevel === 'الثانوي') {
      return [
        { value: 'الأولى ثانوي', label: 'السنة الأولى ثانوي' },
        { value: 'الثانية ثانوي', label: 'السنة الثانية ثانوي' },
        { value: 'الثالثة ثانوي', label: 'السنة الثالثة ثانوي' }
      ];
    }
    return [];
  };

  // Handle subject selection toggle
  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Reset modal state when opening
  const handleOpenModal = (type: string, id: number, data?: any) => {
    setSelectedItem({type, id, data});
    setShowModal(true);
    setVerificationNotes('');
    setSelectedEducationLevel('');
    setSelectedGrade('');
    setSelectedSubjects([]);
    setAvailableSubjects([]);
  };

  const handleVerify = async (type: string, id: number) => {
    try {
      const response = await fetch(`/api/admin/verify-${type}/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notes: verificationNotes,
          educationLevel: selectedEducationLevel,
          grade: selectedGrade,
          selectedSubjects: selectedSubjects 
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم التحقق بنجاح',
          description: `تم التحقق من ${type === 'child' ? 'الطفل' : 'الطالب'} بنجاح`,
        });

        // Refresh data and reset form
        await fetchData();
        setVerificationNotes('');
        setSelectedEducationLevel('');
        setSelectedGrade('');
        setSelectedSubjects([]);
        setAvailableSubjects([]);
        setSelectedItem(null);
        setShowModal(false);
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ في التحقق',
          description: error.error || 'فشل في التحقق',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error verifying:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في عملية التحقق',
        variant: 'destructive'
      });
    }
  };

  const handleUndoVerification = async (type: string, id: number) => {
    try {
      const endpoint = type === 'verified-child' ? 'child' : 'student';
      const response = await fetch(`/api/admin/undo-verify-${endpoint}/${id}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: `تم إلغاء التحقق من ${type === 'verified-child' ? 'الطفل' : 'الطالب'}`,
        });
        
        setShowModal(false);
        setSelectedItem(null);
        fetchData();
      } else {
        throw new Error('Failed to undo verification');
      }
    } catch (error) {
      console.error('Error undoing verification:', error);
      toast({
        title: "خطأ",
        description: "فشل في إلغاء التحقق",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">صلاحيات المدير مطلوبة</CardTitle>
            <CardDescription className="text-center">
              هذه الصفحة متاحة للمدراء فقط
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            لوحة التحقق من الأطفال والطلاب
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            راجع وتحقق من الأطفال والطلاب الذين قدموا وثائقهم في المدرسة
          </p>
        </div>

        <Tabs defaultValue="unverified" className="w-full">
          <div className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <TabsTrigger 
                value="unverified" 
                className="flex items-center gap-2 p-3 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
              >
                <Clock className="w-4 h-4" />
                غير متحقق منهم ({unverifiedChildren.length + unverifiedStudents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="verified" 
                className="flex items-center gap-2 p-3 text-sm font-medium text-gray-700 dark:text-gray-300 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <CheckCircle className="w-4 h-4" />
                متحقق منهم ({verifiedChildren.length + verifiedStudents.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unverified" className="space-y-4 mt-2">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" dir="rtl">
                <CardTitle className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                  <Clock className="w-4 h-4 text-orange-600" />
                  الأطفال والطلاب غير المتحقق منهم
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300 text-xs">
                  قائمة الأطفال والطلاب الذين يحتاجون للتحقق من وثائقهم
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {unverifiedChildren.length === 0 && unverifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 text-lg">لا توجد أطفال أو طلاب بحاجة للتحقق</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">جميع الطلبات قد تم التحقق منها بنجاح</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Unverified Children */}
                    {unverifiedChildren.map((child) => (
                      <div 
                        key={`child-${child.id}`} 
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                              طفل
                            </Badge>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{child.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {formatEducationLevel(child.educationLevel, child.grade)}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleOpenModal('child', child.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          تحقق
                        </Button>
                      </div>
                    ))}
                    
                    {/* Unverified Students */}
                    {unverifiedStudents.map((student) => (
                      <div 
                        key={`student-${student.id}`} 
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800 text-xs border border-purple-300">
                              طالب
                            </Badge>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{student.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {formatEducationLevel(student.educationLevel, student.grade)}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleOpenModal('student', student.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          تحقق
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verified" className="space-y-4 mt-2">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <CardHeader className="pb-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600" dir="rtl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      الأطفال والطلاب المتحقق منهم
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 text-xs">
                      قائمة الأطفال والطلاب الذين تم التحقق من وثائقهم بنجاح
                    </CardDescription>
                  </div>
                  {(verifiedChildren.length > 0 || verifiedStudents.length > 0) && (
                    <div className="flex gap-2">
                      <Button
                        onClick={exportVerifiedUsersToCSV}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 text-xs bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        <Download className="w-4 h-4" />
                        تصدير كامل
                      </Button>
                      <Button
                        onClick={exportSimpleCSV}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        تصدير مبسط
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {verifiedChildren.length === 0 && verifiedStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 text-lg">لا توجد أطفال أو طلاب متحقق منهم بعد</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">ابدأ بالتحقق من الطلبات المعلقة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Verified Children */}
                    {verifiedChildren.map((child) => (
                      <div 
                        key={`verified-child-${child.id}`} 
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                              طفل
                            </Badge>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{child.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {formatEducationLevel(child.educationLevel, child.grade)}
                          </p>
                          {/* Show selected subjects in verified child card */}
                          {child.selectedSubjects && child.selectedSubjects.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">المواد المختارة:</p>
                              <div className="flex flex-wrap gap-1">
                                {getSubjectNamesFromIds(child.selectedSubjects).slice(0, 3).map((subject, index) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200"
                                  >
                                    {subject}
                                  </span>
                                ))}
                                {getSubjectNamesFromIds(child.selectedSubjects).length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{getSubjectNamesFromIds(child.selectedSubjects).length - 3} أخرى
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const selectedData = {type: 'verified-child', id: child.id, data: child};
                            setSelectedItem(selectedData);
                            await loadVerificationDetails(selectedData);
                            setShowModal(true);
                          }}
                          className="text-xs"
                        >
                          تفاصيل
                        </Button>
                      </div>
                    ))}
                    
                    {/* Verified Students */}
                    {verifiedStudents.map((student) => (
                      <div 
                        key={`verified-student-${student.id}`} 
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className="bg-purple-100 text-purple-800 text-xs border border-purple-300">
                              طالب
                            </Badge>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{student.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {formatEducationLevel(student.educationLevel, student.grade)}
                          </p>
                          {/* Show selected subjects in verified student card */}
                          {student.selectedSubjects && student.selectedSubjects.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">المواد المختارة:</p>
                              <div className="flex flex-wrap gap-1">
                                {getSubjectNamesFromIds(student.selectedSubjects).slice(0, 3).map((subject, index) => (
                                  <span 
                                    key={index}
                                    className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200"
                                  >
                                    {subject}
                                  </span>
                                ))}
                                {getSubjectNamesFromIds(student.selectedSubjects).length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{getSubjectNamesFromIds(student.selectedSubjects).length - 3} أخرى
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const selectedData = {type: 'verified-student', id: student.id, data: student};
                            setSelectedItem(selectedData);
                            await loadVerificationDetails(selectedData);
                            setShowModal(true);
                          }}
                          className="text-xs"
                        >
                          تفاصيل
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Custom Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                {selectedItem?.type.startsWith('verified') ? (
                  // Details modal for verified items
                  <div>
                    <div className="text-center mb-6" dir="rtl">
                      <div className="inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">تفاصيل التحقق</span>
                      </div>
                      <h2 className="text-base font-bold mt-4 text-gray-900 dark:text-gray-100">
                        {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800" dir="rtl">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800 dark:text-green-200 text-sm">تم التحقق بنجاح</span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          تم التحقق من هذا {selectedItem?.type === 'verified-child' ? 'الطفل' : 'الطالب'} وتأكيد صحة البيانات المقدمة.
                        </p>
                      </div>
                      
                      {/* Verification Details */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600" dir="rtl">
                        <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100 text-sm">
                          تفاصيل التحقق
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <span className="text-sm">
                              <strong className="text-gray-900 dark:text-gray-100">تاريخ التحقق:</strong> 
                              <span className="text-gray-700 dark:text-gray-300 mr-1">
                                {selectedItem?.data?.verifiedAt && new Date(selectedItem.data.verifiedAt).toLocaleDateString('en-US')}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                            <Users className="w-5 h-5 text-purple-500" />
                            <span className="text-sm">
                              <strong className="text-gray-900 dark:text-gray-100">تم التحقق بواسطة:</strong> 
                              <span className="text-gray-700 dark:text-gray-300 mr-1">{verifierAdminName}</span>
                            </span>
                          </div>
                          
                          {/* Selected Subjects */}
                          {verifiedItemSubjects.length > 0 && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                              <BookOpen className="w-5 h-5 text-green-500 mt-0.5" />
                              <div className="flex-1">
                                <strong className="text-gray-900 dark:text-gray-100 text-sm block mb-2">المواد المختارة:</strong>
                                <div className="grid grid-cols-1 gap-1">
                                  {verifiedItemSubjects.map((subject, index) => (
                                    <span 
                                      key={index}
                                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 inline-block"
                                    >
                                      {subject}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-green-600 mt-2">
                                  المجموع: {verifiedItemSubjects.length} مادة
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedItem?.data?.verificationNotes && (
                            <div className="mt-4">
                              <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">ملاحظات التحقق:</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                                {selectedItem.data.verificationNotes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Student ID Card Preview */}
                      {showIDCard && selectedItem?.data && (
                        <div className="mt-4">
                          <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100 text-sm text-center">
                            بطاقة الهوية
                          </h3>
                          <div className="flex justify-center">
                            <StudentIDCard
                              student={{
                                id: selectedItem.data.id,
                                name: selectedItem.data.name,
                                educationLevel: selectedItem.data.educationLevel,
                                grade: selectedItem.data.grade,
                                selectedSubjects: selectedItem.data.selectedSubjects,
                                type: selectedItem.type === 'verified-child' ? 'child' : 'student',
                                profilePicture: selectedItem.data.profilePicture
                              }}
                              schoolInfo={{
                                id: user?.schoolId || 0,
                                name: selectedSchool?.name || 'مدرستي'
                              }}
                              subjects={teachingModules}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setSelectedItem(null);
                            setShowIDCard(false);
                          }}
                          className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 dark:text-gray-100"
                        >
                          إغلاق
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowIDCard(!showIDCard)}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                        >
                          <IdCard className="w-4 h-4 mr-2" />
                          {showIDCard ? 'إخفاء البطاقة' : 'عرض بطاقة الهوية'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => selectedItem && handleUndoVerification(selectedItem.type, selectedItem.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          إلغاء التحقق
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Verification modal for unverified items
                  <div>
                    <div className="text-center mb-6" dir="rtl">
                      <div className="inline-flex items-center gap-2 bg-orange-600 text-white px-3 py-1 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold text-sm">عملية التحقق</span>
                      </div>
                      <h2 className="text-base font-bold mt-4 text-gray-900 dark:text-gray-100">
                        تحقق من {selectedItem?.type === 'child' ? 'الطفل' : 'الطالب'}
                      </h2>
                    </div>
                    <div className="space-y-4">
                      {/* Education Level Selection */}
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800" dir="rtl">
                        <Label className="text-xs font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                          <BookOpen className="w-4 h-4 inline mr-1" />
                          المستوى التعليمي المطلوب
                        </Label>
                        <Select value={selectedEducationLevel} onValueChange={handleEducationLevelChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر المستوى التعليمي" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                            <SelectItem value="المتوسط">المتوسط</SelectItem>
                            <SelectItem value="الثانوي">الثانوي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Grade Selection */}
                      {selectedEducationLevel && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800" dir="rtl">
                          <Label className="text-xs font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                            <GraduationCap className="w-4 h-4 inline mr-1" />
                            السنة الدراسية المطلوبة
                          </Label>
                          <Select value={selectedGrade} onValueChange={handleGradeChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر السنة الدراسية" />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableGrades().map((grade) => (
                                <SelectItem key={grade.value} value={grade.value}>
                                  {grade.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Subject Selection */}
                      {selectedEducationLevel && selectedGrade && availableSubjects.length > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800" dir="rtl">
                          <Label className="text-xs font-semibold text-gray-900 dark:text-gray-100 block mb-3">
                            <GraduationCap className="w-4 h-4 inline mr-1" />
                            المواد التي يريد دراستها
                          </Label>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {availableSubjects.map((subject) => (
                              <div 
                                key={subject.id} 
                                className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded border border-purple-200 dark:border-gray-600"
                              >
                                <Checkbox
                                  id={`subject-${subject.id}`}
                                  checked={selectedSubjects.includes(subject.id.toString())}
                                  onCheckedChange={() => handleSubjectToggle(subject.id.toString())}
                                />
                                <Label 
                                  htmlFor={`subject-${subject.id}`}
                                  className="text-sm text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
                                >
                                  {subject.nameAr}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {selectedSubjects.length > 0 && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                              تم اختيار {selectedSubjects.length} مادة
                            </p>
                          )}
                        </div>
                      )}

                      {/* Verification Notes */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800" dir="rtl">
                        <Label htmlFor="notes" className="text-xs font-semibold text-gray-900 dark:text-gray-100 block mb-2">
                          ملاحظات التحقق (اختياري)
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="أدخل أي ملاحظات حول عملية التحقق..."
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          className="mt-2 border-gray-300 text-sm"
                        />
                      </div>
                      <div className="flex gap-3 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowModal(false);
                            setVerificationNotes('');
                            setSelectedEducationLevel('');
                            setSelectedGrade('');
                            setSelectedSubjects([]);
                            setAvailableSubjects([]);
                            setSelectedItem(null);
                            setShowIDCard(false);
                          }}
                          className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600 dark:text-gray-100"
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={() => selectedItem && handleVerify(selectedItem.type, selectedItem.id)}
                          disabled={!selectedEducationLevel || !selectedGrade || selectedSubjects.length === 0}
                          className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          تأكيد التحقق
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}