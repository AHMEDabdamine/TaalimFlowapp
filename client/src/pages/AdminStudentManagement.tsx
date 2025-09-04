import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { RoleProtection } from '@/components/RoleProtection';
import { UserPlus, Users, Copy, CheckCircle, Edit, Trash2, QrCode, Printer, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Student {
  id: number;
  name: string;
  phone?: string;
  gender: string;
  educationLevel: string;
  grade: string;
  selectedSubjects: string[] | null;
  verified: boolean;
  userId: number | null;
  createdAt: string;
}

interface TeachingModule {
  id: number;
  name: string;
  description?: string;
  educationLevel: string;
}

export default function AdminStudentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    educationLevel: '',
    grade: '',
    selectedSubjects: [] as string[]
  });

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    educationLevel: '',
    grade: '',
    selectedSubjects: [] as string[]
  });

  // QR Code related state
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  // Generated credentials and print receipt state
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
    studentName: string;
    studentId: number;
  } | null>(null);
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);

  // QR Code generation mutation
  const generateQRMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await fetch(`/api/qrcode/student/${studentId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate QR code');
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeData(data.qrCode);
      toast({
        title: '✅ تم إنشاء رمز QR بنجاح',
        description: 'يمكن للطالب استخدام هذا الرمز لربط حسابه'
      });
    },
    onError: () => {
      toast({
        title: '❌ خطأ في إنشاء رمز QR',
        description: 'حاول مرة أخرى',
        variant: 'destructive'
      });
    }
  });

  // Fetch unclaimed students
  const { data: unclaimedStudents, isLoading, refetch } = useQuery<Student[]>({
    queryKey: ['/api/admin/unclaimed-students'],
    enabled: !!user && user.role === 'admin'
  });

  // Fetch teaching modules for subject selection
  const { data: teachingModules = [], isLoading: modulesLoading, error: modulesError } = useQuery<TeachingModule[]>({
    queryKey: ['/api/teaching-modules'],
    enabled: !!user && user.role === 'admin'
  });
  


  // Pre-register student mutation
  const preRegisterMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/preregister-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to pre-register student');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم التسجيل بنجاح',
        description: `تم تسجيل الطالب ${data.student.name} برقم ${data.student.id} وتم إنشاء حساب المستخدم تلقائياً`
      });
      
      // Store generated credentials if they exist
      if (data.generatedCredentials) {
        setGeneratedCredentials({
          email: data.generatedCredentials.email,
          password: data.generatedCredentials.password,
          studentName: data.student.name,
          studentId: data.student.id,
        });
        setShowPrintReceipt(true);
      }
      
      setFormData({ name: '', phone: '', gender: '', educationLevel: '', grade: '', selectedSubjects: [] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unclaimed-students'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التسجيل',
        description: error.message || 'فشل في تسجيل الطالب',
        variant: 'destructive'
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editFormData }) => {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update student');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '✅ تم التحديث بنجاح',
        description: `تم تحديث بيانات الطالب ${data.student.name}`
      });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unclaimed-students'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التحديث',
        description: error.message || 'فشل في تحديث بيانات الطالب',
        variant: 'destructive'
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete student');
      return response.json();
    },
    onSuccess: (data, studentId) => {
      toast({
        title: '✅ تم الحذف بنجاح',
        description: 'تم حذف الطالب من النظام'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/unclaimed-students'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في الحذف',
        description: error.message || 'فشل في حذف الطالب',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.educationLevel || !formData.grade) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    
    // Add "السنة" prefix to grade if not already present
    const processedFormData = {
      ...formData,
      grade: formData.grade.startsWith('السنة') ? formData.grade : `السنة ${formData.grade}`
    };
    
    preRegisterMutation.mutate(processedFormData);
  };

  const copyStudentId = (studentId: number, studentName: string) => {
    navigator.clipboard.writeText(studentId.toString());
    toast({
      title: '📋 تم النسخ',
      description: `تم نسخ رقم الطالب ${studentName}: ${studentId}`
    });
  };

  // Handle QR code generation and display
  const handleShowQRCode = async (student: Student) => {
    setSelectedStudentForQR(student);
    setIsQRDialogOpen(true);
    setQrCodeData(null);
    
    try {
      // Try to fetch existing QR code first
      const response = await fetch(`/api/qrcode/student/${student.id}`);
      if (response.ok) {
        const data = await response.json();
        setQrCodeData(data.qrCode);
      } else {
        // Generate new QR code if none exists
        generateQRMutation.mutate(student.id);
      }
    } catch (error) {
      // Generate new QR code on error
      generateQRMutation.mutate(student.id);
    }
  };

  const handleRegenerateQR = () => {
    if (selectedStudentForQR) {
      generateQRMutation.mutate(selectedStudentForQR.id);
    }
  };;

  // Function to get grades for each education level
  const getGradesForLevel = (educationLevel: string): string[] => {
    switch (educationLevel) {
      case 'الابتدائي':
        return ['السنة الأولى ابتدائي', 'السنة الثانية ابتدائي', 'السنة الثالثة ابتدائي', 'السنة الرابعة ابتدائي', 'السنة الخامسة ابتدائي'];
      case 'المتوسط':
        return ['السنة الأولى متوسط', 'السنة الثانية متوسط', 'السنة الثالثة متوسط', 'السنة الرابعة متوسط'];
      case 'الثانوي':
        return ['السنة الأولى ثانوي', 'السنة الثانية ثانوي', 'السنة الثالثة ثانوي'];
      default:
        return [];
    }
  };

  // Function to get available subjects for education level
  const getAvailableSubjects = (educationLevel: string) => {
    if (!teachingModules) return [];
    
    return teachingModules.filter(module => module.educationLevel === educationLevel);
  };

  // Function to get subject names from IDs
  const getSubjectNames = (subjectIds: string[] | null) => {
    if (!subjectIds || subjectIds.length === 0) return 'لم يتم اختيار مواد';
    
    const names = subjectIds
      .map(id => teachingModules.find(module => module.id.toString() === id)?.name)
      .filter(Boolean);
    
    return names.length > 0 ? names.join(', ') : 'مواد غير محددة';
  };

  // Open edit dialog
  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      phone: student.phone || '',
      gender: student.gender,
      educationLevel: student.educationLevel,
      grade: student.grade,
      selectedSubjects: student.selectedSubjects || []
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    if (!editFormData.name || !editFormData.gender || !editFormData.educationLevel || !editFormData.grade) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    
    // Add "السنة" prefix to grade if not already present
    const processedEditFormData = {
      ...editFormData,
      grade: editFormData.grade.startsWith('السنة') ? editFormData.grade : `السنة ${editFormData.grade}`
    };
    
    updateStudentMutation.mutate({ 
      id: editingStudent.id, 
      data: processedEditFormData 
    });
  };

  // Handle delete student
  const handleDeleteStudent = (studentId: number) => {
    deleteStudentMutation.mutate(studentId);
  };

  const educationLevels = [
    { value: 'الابتدائي', label: 'التعليم الابتدائي' },
    { value: 'المتوسط', label: 'التعليم المتوسط' },
    { value: 'الثانوي', label: 'التعليم الثانوي' }
  ];

  const getGrades = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
      case 'المتوسط':
        return ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط'];
      case 'الثانوي':
        return ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي'];
      default:
        return [];
    }
  };

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">إدارة الطلاب المسبقة</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pre-registration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                تسجيل طالب مسبقاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الطالب *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الطالب الكامل"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="أدخل رقم الهاتف"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">الجنس *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ذكر">ذكر</SelectItem>
                      <SelectItem value="أنثى">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="educationLevel">المرحلة التعليمية *</Label>
                  <Select 
                    value={formData.educationLevel} 
                    onValueChange={(value) => setFormData({ ...formData, educationLevel: value, grade: '', selectedSubjects: [] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المرحلة التعليمية" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="grade">الصف الدراسي *</Label>
                  <Select 
                    value={formData.grade} 
                    onValueChange={(value) => setFormData({ ...formData, grade: value })}
                    disabled={!formData.educationLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف الدراسي" />
                    </SelectTrigger>
                    <SelectContent>
                      {getGrades(formData.educationLevel).map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Selection */}
                {formData.educationLevel && (
                  <div>
                    <Label>المواد الدراسية (اختياري)</Label>
                    <div className="mt-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 max-h-48 overflow-y-auto">
                      {getAvailableSubjects(formData.educationLevel).length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {getAvailableSubjects(formData.educationLevel).map((module) => (
                            <div key={module.id} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`subject-${module.id}`}
                                checked={formData.selectedSubjects.includes(module.id.toString())}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      selectedSubjects: [...formData.selectedSubjects, module.id.toString()]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedSubjects: formData.selectedSubjects.filter(id => id !== module.id.toString())
                                    });
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`subject-${module.id}`}
                                className="text-sm font-normal cursor-pointer text-gray-900 dark:text-gray-100"
                              >
                                {module.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد مواد متاحة لهذه المرحلة التعليمية</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      يمكن للطالب تعديل اختيار المواد لاحقاً من حسابه
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={preRegisterMutation.isPending}
                >
                  {preRegisterMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الطالب'}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">كيفية عمل النظام:</h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. قم بتسجيل الطالب هنا مع بياناته الأساسية</li>
                  <li>2. سيحصل الطالب على رقم طلابي فريد ويتم التحقق منه تلقائياً</li>
                  <li>3. يمكن إضافة الطلاب المسجلين مسبقاً للمجموعات مباشرةً</li>
                  <li>4. أعطي الرقم للطالب ليسجل حسابه</li>
                  <li>5. يستخدم الطالب الرقم لربط حسابه</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Unclaimed Students List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                الطلاب غير المربوطين ({unclaimedStudents?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-gray-600 dark:text-gray-400">جاري التحميل...</p>
              ) : unclaimedStudents && unclaimedStudents.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {unclaimedStudents.map((student: Student) => (
                    <div key={student.id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-gray-100">{student.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {student.educationLevel} - {student.grade}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {student.gender}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            <strong>المواد:</strong> {getSubjectNames(student.selectedSubjects)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            #{student.id}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyStudentId(student.id, student.name)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 ml-1" />
                            نسخ الرقم
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowQRCode(student)}
                            className="text-xs bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-800/30 text-green-700 dark:text-green-400"
                          >
                            <QrCode className="w-3 h-3 ml-1" />
                            QR
                          </Button>
                          <button
                            onClick={() => openEditDialog(student)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-md border border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="تعديل بيانات الطالب"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-md border border-red-200 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="حذف الطالب"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الطالب "{student.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteStudent(student.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-600 dark:text-gray-400">لا توجد طلاب غير مربوطين</p>
              )}

              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">إرشادات للطلاب:</h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  أخبر الطلاب بالذهاب إلى صفحة التسجيل واختيار "ربط حساب طالب موجود" 
                  واستخدام الرقم المعطى لهم
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الطالب</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <Label htmlFor="edit-name">اسم الطالب *</Label>
              <Input
                id="edit-name"
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
                placeholder="أدخل اسم الطالب الكامل"
              />
            </div>

            {/* Phone Field */}
            <div>
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
              />
            </div>

            {/* Gender Field */}
            <div>
              <Label htmlFor="edit-gender">الجنس *</Label>
              <Select 
                value={editFormData.gender} 
                onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Education Level Field */}
            <div>
              <Label htmlFor="edit-education-level">المرحلة التعليمية *</Label>
              <Select 
                value={editFormData.educationLevel} 
                onValueChange={(value) => {
                  setEditFormData({ 
                    ...editFormData, 
                    educationLevel: value,
                    grade: '',
                    selectedSubjects: [] 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المرحلة التعليمية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                  <SelectItem value="المتوسط">المتوسط</SelectItem>
                  <SelectItem value="الثانوي">الثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Field */}
            {editFormData.educationLevel && (
              <div>
                <Label htmlFor="edit-grade">الصف *</Label>
                <Select 
                  value={editFormData.grade} 
                  onValueChange={(value) => setEditFormData({ ...editFormData, grade: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {getGradesForLevel(editFormData.educationLevel).map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subject Selection */}
            {editFormData.educationLevel && (
              <div>
                <Label>اختيار المواد الدراسية</Label>
                <p className="text-sm text-gray-600 mb-2">
                  اختر المواد التي يدرسها الطالب (اختياري)
                </p>
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                  {getAvailableSubjects(editFormData.educationLevel).map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-subject-${subject.id}`}
                        checked={editFormData.selectedSubjects.includes(subject.id.toString())}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditFormData({
                              ...editFormData,
                              selectedSubjects: [...editFormData.selectedSubjects, subject.id.toString()]
                            });
                          } else {
                            setEditFormData({
                              ...editFormData,
                              selectedSubjects: editFormData.selectedSubjects.filter(id => id !== subject.id.toString())
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`edit-subject-${subject.id}`} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  تم اختيار {editFormData.selectedSubjects.length} مادة
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={updateStudentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateStudentMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>رمز QR للطالب</DialogTitle>
          </DialogHeader>
          
          {selectedStudentForQR && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-semibold text-lg">{selectedStudentForQR.name}</h4>
                <p className="text-sm text-gray-600">رقم الطالب: #{selectedStudentForQR.id}</p>
                <p className="text-sm text-gray-600">
                  {selectedStudentForQR.educationLevel} - {selectedStudentForQR.grade}
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {qrCodeData ? (
                  <div className="text-center">
                    <img 
                      src={qrCodeData} 
                      alt="QR Code" 
                      className="mx-auto mb-4 max-w-full h-auto"
                      style={{ maxWidth: '200px' }}
                    />
                    <p className="text-sm text-green-600 font-medium">
                      يمكن للطالب مسح هذا الرمز لربط حسابه
                    </p>
                  </div>
                ) : generateQRMutation.isPending ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">جاري إنشاء رمز QR...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">لم يتم إنشاء رمز QR بعد</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {qrCodeData && (
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerateQR}
                    disabled={generateQRMutation.isPending}
                    className="flex-1"
                  >
                    إعادة إنشاء
                  </Button>
                )}
                <Button 
                  onClick={() => setIsQRDialogOpen(false)}
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">كيفية الاستخدام:</h4>
                <p className="text-sm text-blue-700">
                  أرسل هذا الرمز للطالب ليقوم بمسحه أثناء التسجيل لربط حسابه بسهولة
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Receipt Modal */}
      {showPrintReceipt && generatedCredentials && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-5 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold dark:text-white">بيانات دخول الطالب</h2>
                <button
                  onClick={() => setShowPrintReceipt(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5 dark:text-white" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">اسم الطالب</label>
                    <p className="text-sm font-semibold dark:text-white">{generatedCredentials.studentName}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">رقم الطالب</label>
                    <p className="text-sm font-semibold dark:text-white">#{generatedCredentials.studentId}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">البريد الإلكتروني</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.email);
                          toast({ title: 'تم نسخ البريد الإلكتروني' });
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-mono dark:text-white break-all">{generatedCredentials.email}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-500 dark:text-gray-400">كلمة المرور</label>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCredentials.password);
                          toast({ title: 'تم نسخ كلمة المرور' });
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-mono dark:text-white font-bold">{generatedCredentials.password}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-center">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    احتفظ بهذه البيانات في مكان آمن
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const printContent = document.getElementById('print-receipt');
                    if (printContent) {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(printContent.innerHTML);
                        printWindow.document.close();
                        printWindow.print();
                        printWindow.close();
                      }
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Printer className="w-4 h-4 ml-1" />
                  طباعة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPrintReceipt(false)}
                  size="sm"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
          
          {/* Hidden Print Content */}
          <div id="print-receipt" className="hidden">
            <div style={{ fontFamily: 'Arial', padding: '40px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #ccc', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#333' }}>
                  {JSON.parse(localStorage.getItem('selectedSchool') || '{}').name || 'المدرسة'}
                </h1>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>TaalimFlow - نظام إدارة المدارس</p>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '15px', color: '#333' }}>بيانات تسجيل الدخول</h2>
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>اسم الطالب</label>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>{generatedCredentials.studentName}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>رقم الطالب</label>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>#{generatedCredentials.studentId}</p>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>البريد الإلكتروني</label>
                    <p style={{ fontSize: '14px', fontFamily: 'monospace', margin: 0, backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', color: '#333' }}>{generatedCredentials.email}</p>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '5px' }}>كلمة المرور</label>
                    <p style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 'bold', margin: 0, backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', color: '#333' }}>{generatedCredentials.password}</p>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
                  احتفظ بهذه البيانات في مكان آمن
                </p>
                <p style={{ fontSize: '10px', color: '#999', margin: 0 }}>
                  تاريخ الإنشاء: {new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </RoleProtection>
  );
}