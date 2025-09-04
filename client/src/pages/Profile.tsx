import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FirebaseEmailVerification } from '@/lib/firebase-email';
import { ensureFirebaseInitialized } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Settings, Shield, GraduationCap, Users, Mail, Save, Plus, Trash2, Baby, LogOut, CheckCircle, XCircle, BookOpen, Calendar, Bell, Moon, Sun } from 'lucide-react';
import { GroupDetailsModal } from '@/components/GroupDetailsModal';
import NotificationSettings from '@/components/NotificationSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ProfilePicture } from '@/components/ProfilePicture';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { StudentIDCard } from '@/components/StudentIDCard';

interface Child {
  id: number;
  name: string;
  gender?: string;
  educationLevel: string;
  grade: string;
  parentId: number;
  createdAt: string;
}

interface ChildGroup {
  childId: number;
  childName: string;
  groups: EnrolledGroup[];
}

interface EnrolledGroup {
  id: number;
  name: string;
  nameAr?: string;
  subjectName?: string;
  educationLevel: string;
  teacherId?: number;
  teacherName?: string;
  studentsAssigned?: any[];
  description?: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<EnrolledGroup | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [newChild, setNewChild] = useState({
    name: '',
    gender: '',
    educationLevel: '',
    grade: ''
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Check Firebase email verification status
  useEffect(() => {
    const checkEmailVerification = () => {
      setIsEmailVerified(FirebaseEmailVerification.isEmailVerified());
    };
    
    checkEmailVerification();
    
    // Check every 5 seconds when the component is mounted
    const interval = setInterval(checkEmailVerification, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch student data for ID card (only for students)
  const { data: studentData } = useQuery({
    queryKey: ['/api/students/me'],
    enabled: user?.role === 'student'
  });

  // Fetch current school information
  const { data: schoolData } = useQuery({
    queryKey: ['/api/school/current'],
    enabled: !!user?.schoolId
  });

  // Fetch teaching modules for subjects
  const { data: teachingModules } = useQuery({
    queryKey: ['/api/teaching-modules'],
    enabled: user?.role === 'student'
  });

  const handleProfilePictureUpdate = (pictureUrl: string) => {
    // Update all related queries when profile picture changes
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/students/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/school/current'] });
    toast({
      title: "تم بنجاح",
      description: "تم تحديث صورتك الشخصية",
    });
  };

  const educationLevels = {
    'الابتدائي': [
      '5 سنوات',
      'السنة الأولى ابتدائي',
      'السنة الثانية ابتدائي',
      'السنة الثالثة ابتدائي',
      'السنة الرابعة ابتدائي',
      'السنة الخامسة ابتدائي'
    ],
    'المتوسط': [
      'السنة الأولى متوسط',
      'السنة الثانية متوسط',
      'السنة الثالثة متوسط',
      'السنة الرابعة متوسط'
    ],
    'الثانوي': [
      'السنة الأولى ثانوي',
      'السنة الثانية ثانوي',
      'السنة الثالثة ثانوي'
    ]
  };

  // Fetch children data only for non-student users
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user && user.role !== 'student',
  });

  // Fetch children's group enrollments
  const { data: childrenGroups = [], isLoading: childrenGroupsLoading } = useQuery<ChildGroup[]>({
    queryKey: ['/api/children/groups'],
    enabled: !!user && user.role !== 'student' && children.length > 0,
  });

  // Fetch student data for current user if they are a student
  const { data: currentStudent } = useQuery({
    queryKey: ['/api/students/me'],
    enabled: !!user && user.role === 'student',
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (childData: typeof newChild) => {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setNewChild({ name: '', gender: '', educationLevel: '', grade: '' });
      setShowAddChild(false);
      toast({ title: 'تم إضافة الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في إضافة الطفل', 
        variant: 'destructive' 
      });
    }
  });

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: number) => {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({ title: 'تم حذف الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في حذف الطفل', 
        variant: 'destructive' 
      });
    }
  });

  const setupFirebaseAccount = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Initialize Firebase
      const { auth } = await ensureFirebaseInitialized();
      if (!auth) {
        throw new Error('Failed to initialize Firebase');
      }

      // Create Firebase account with user's email and a default password
      const defaultPassword = 'TempPass123!';
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, defaultPassword);
      const firebaseUser = userCredential.user;

      // Update the database with the Firebase UID
      const response = await fetch('/api/auth/update-firebase-uid', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ firebaseUid: firebaseUser.uid }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update Firebase UID');
      }

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      toast({
        title: 'تم إعداد التحقق بنجاح',
        description: 'تم إنشاء حساب Firebase. يمكنك الآن استخدام التحقق من البريد الإلكتروني.',
      });

    } catch (error: any) {
      let errorMessage = 'حدث خطأ في إعداد التحقق';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'هذا البريد الإلكتروني مستخدم بالفعل في Firebase';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'كلمة المرور ضعيفة';
      }

      toast({
        title: 'خطأ في الإعداد',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث البيانات');
      }

      const { user: updatedUser } = await response.json();
      
      // Update all related queries when profile data changes
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/school/current'] });
      
      toast({ 
        title: 'تم تحديث الملف الشخصي بنجاح',
        description: 'تم حفظ تغييراتك بنجاح'
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({ 
        title: 'حدث خطأ أثناء تحديث البيانات', 
        description: error.message || 'يرجى المحاولة مرة أخرى',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChild.name || !newChild.educationLevel || !newChild.grade) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }

    if (children.length >= 5) {
      toast({ title: 'لا يمكن إضافة أكثر من 5 أطفال', variant: 'destructive' });
      return;
    }

    addChildMutation.mutate(newChild);
  };

  const handleDeleteChild = (childId: number) => {
    if (window.confirm('هل أنت متأكد من حذف بيانات هذا الطفل؟')) {
      deleteChildMutation.mutate(childId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4" />;
      case 'student':
        return <User className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'مدير';
      case 'teacher':
        return 'معلم';
      case 'student':
        return 'طالب';
      default:
        return 'ولي أمر';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">يرجى تسجيل الدخول</h2>
          <p className="text-gray-600">تحتاج إلى تسجيل الدخول لعرض الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">الملف الشخصي</h2>
          <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
            {getRoleIcon(user.role)}
            {getRoleLabel(user.role)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
              onError={(e) => {
                console.error('Header profile picture failed to load:', user.profilePicture);
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-md"><span class="text-white text-xl font-bold">${user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}</span></div>`;
                }
              }}
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">
                {user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">منذ {new Date(user.createdAt).toLocaleDateString('en-US')}</p>
          </div>
          {/* Verification status only for students - admins and teachers don't need verification */}
          {user.role === 'student' && (
            <div className="flex flex-col items-center gap-2">
              {studentData?.verified ? (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">متحقق</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">غير متحقق</span>
                </div>
              )}
              {!studentData?.verified && (
                <p className="text-xs text-gray-500 text-center">
                  يرجى زيارة المدرسة لتأكيد هويتك
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full ${user.role === 'student' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            الإشعارات
          </TabsTrigger>
          {user.role !== 'student' && (
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              الأطفال
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          {/* Profile Picture Section */}
          <ProfilePicture 
            currentPicture={user?.profilePicture || undefined}
            userName={user?.name || ''}
            onUpdate={handleProfilePictureUpdate}
          />

          {/* Student ID Card Section - Only show for verified students */}
          {user.role === 'student' && studentData && 'verified' in studentData && studentData.verified && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  بطاقة الهوية
                </CardTitle>
                <CardDescription>
                  بطاقة هويتك كطالب في المدرسة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <StudentIDCard
                    student={{
                      id: (studentData as any).id,
                      name: user.name,
                      educationLevel: (studentData as any).educationLevel,
                      grade: (studentData as any).grade,
                      selectedSubjects: (studentData as any).selectedSubjects || [],
                      type: 'student',
                      profilePicture: user.profilePicture || undefined
                    }}
                    schoolInfo={{
                      id: user.schoolId || 0,
                      name: (schoolData as any)?.name || 'مدرستي'
                    }}
                    subjects={teachingModules || []}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تحديث البيانات الشخصية
              </CardTitle>
              <CardDescription>
                يمكنك تحديث معلوماتك الشخصية من هنا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
                

                
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
                </Button>
              </form>
            </CardContent>
          </Card>



          {/* Email Verification Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                تحقق من البريد الإلكتروني
              </CardTitle>
              <CardDescription>
                تحقق من بريدك الإلكتروني لمزيد من الأمان
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isEmailVerified ? 'bg-green-100' : 'bg-gray-200'
                  }`}>
                    {isEmailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Mail className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 break-all">{user.email}</p>
                    <p className={`text-sm mt-1 ${
                      isEmailVerified ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {isEmailVerified ? 'تم التحقق من البريد الإلكتروني عبر Firebase' : 'لم يتم التحقق من البريد الإلكتروني'}
                    </p>
                    {!user.firebaseUid && (
                      <p className="text-xs text-amber-600 mt-1">
                        يجب إعداد حساب Firebase للتحقق من البريد الإلكتروني
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  {!user.firebaseUid ? (
                    <Button 
                      onClick={() => setupFirebaseAccount()}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {loading ? 'جاري الإعداد...' : 'إعداد التحقق'}
                    </Button>
                  ) : !isEmailVerified ? (
                    <Button 
                      onClick={() => setShowEmailVerification(true)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      تحقق الآن
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-500" />
                )}
                إعدادات المظهر
              </CardTitle>
              <CardDescription>
                اختر المظهر المفضل لديك للتطبيق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'light' ? (
                    <Moon className="w-6 h-6 text-gray-600" />
                  ) : (
                    <Sun className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {theme === 'light' ? 'الوضع النهاري' : 'الوضع الليلي'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {theme === 'light' ? 'مظهر مشرق ومناسب للنهار' : 'مظهر داكن ومريح للعينين'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={toggleTheme}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="w-4 h-4" />
                      تفعيل الوضع الليلي
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      تفعيل الوضع النهاري
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Section for Students - Only for verified students */}
          {user.role === 'student' && currentStudent && 'id' in currentStudent && studentData && 'verified' in studentData && studentData.verified && (
            <QRCodeDisplay
              studentId={(currentStudent as any).id}
              type="student"
              studentName={user.name}
              isAdmin={false}
            />
          )}

          {/* Message for unverified students */}
          {user.role === 'student' && currentStudent && (!studentData || !('verified' in studentData) || !studentData.verified) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  رمز الاستجابة السريعة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <Shield className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">التحقق مطلوب</h3>
                  <p className="text-gray-600 mb-4">
                    يجب التحقق من هويتك أولاً للحصول على رمز الاستجابة السريعة الخاص بك
                  </p>
                  <p className="text-sm text-yellow-600">
                    يرجى زيارة المدرسة لتأكيد هويتك وتفعيل الرمز
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {user.role !== 'student' && (
          <TabsContent value="children" className="space-y-4">
            {/* Children's Groups Section */}
            {childrenGroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    مجموعات الأطفال
                  </CardTitle>
                  <CardDescription>
                    عرض المجموعات المسجل بها أطفالك
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {childrenGroups.map((childGroup) => (
                      <div key={childGroup.childId}>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <GraduationCap className="w-4 h-4 ml-2" />
                          {childGroup.childName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {childGroup.groups.map((group) => {
                            // Extract year level from group name or description
                            const yearLevel = (() => {
                              const groupText = group.name + ' ' + (group.description || '');
                              if (groupText.includes('الأولى')) return '1';
                              if (groupText.includes('الثانية')) return '2';
                              if (groupText.includes('الثالثة')) return '3';
                              if (groupText.includes('الرابعة')) return '4';
                              if (groupText.includes('الخامسة')) return '5';
                              return null;
                            })();

                            const getBadgeColor = () => {
                              switch (group.educationLevel) {
                                case 'الابتدائي': return 'bg-green-100 text-green-800';
                                case 'المتوسط': return 'bg-blue-100 text-blue-800';
                                case 'الثانوي': return 'bg-purple-100 text-purple-800';
                                default: return 'bg-gray-100 text-gray-800';
                              }
                            };

                            const getTeacherName = () => {
                              if (group.teacherName) {
                                const [firstName, ...rest] = group.teacherName.split(' ');
                                const isFemaleName = firstName.endsWith('ة');
                                const title = isFemaleName ? 'الأستاذة' : 'الأستاذ';
                                return `${title} ${group.teacherName}`;
                              }
                              return 'غير محدد';
                            };

                            return (
                              <Card key={group.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    {/* Level + Year Badge */}
                                    <div className="flex justify-start">
                                      <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor()}`}>
                                        {yearLevel ? `${group.educationLevel} ${yearLevel}` : group.educationLevel}
                                      </span>
                                    </div>
                                    
                                    {/* Title */}
                                    <h3 className="font-semibold text-gray-800">{group.nameAr || group.subjectName || group.name}</h3>
                                    
                                    {/* Teacher */}
                                    <div className="text-sm text-gray-600">
                                      <span className="font-medium">المعلم:</span> {getTeacherName()}
                                    </div>
                                    
                                    {/* View Details Button */}
                                    <div className="pt-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                                        onClick={() => {
                                          setSelectedGroup(group);
                                          setSelectedChildId(childGroup.childId);
                                          setShowGroupDetails(true);
                                        }}
                                      >
                                        <Calendar className="w-4 h-4 mr-1" />
                                        عرض الحضور والمدفوعات
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Children Management Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Baby className="w-5 h-5" />
                      إدارة الأطفال
                    </CardTitle>
                    <CardDescription>
                      عرض وإدارة بيانات الأطفال المسجلين
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowAddChild(true)}
                    disabled={children.length >= 5}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة طفل
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {childrenLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">جاري تحميل البيانات...</p>
                  </div>
                ) : children.length === 0 ? (
                  <div className="text-center py-8">
                    <Baby className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد أطفال مسجلين</h3>
                    <p className="text-gray-600 mb-4">يمكنك إضافة حتى 5 أطفال للمتابعة</p>
                    <Button 
                      onClick={() => setShowAddChild(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة طفل
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {children.map((child: Child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                              <Baby className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{child.name}</h4>
                              <p className="text-sm text-gray-600">
                                {child.gender === 'male' ? 'ذكر' : child.gender === 'female' ? 'أنثى' : ''} • {child.educationLevel} - {child.grade}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteChild(child.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* QR Code Display for Child - Only if parent is verified */}
                        {user?.verified ? (
                          <QRCodeDisplay
                            studentId={child.id}
                            type="child"
                            studentName={child.name}
                            isAdmin={user?.role === 'admin'}
                          />
                        ) : (
                          <Card className="mt-4">
                            <CardContent className="p-4">
                              <div className="text-center">
                                <Shield className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                  رمز الاستجابة السريعة متاح بعد التحقق من هويتك
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {showAddChild && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">إضافة طفل جديد</h3>
                  <form onSubmit={handleAddChild} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="childName">اسم الطفل</Label>
                      <Input
                        id="childName"
                        value={newChild.name}
                        onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                        placeholder="أدخل اسم الطفل"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="childGender">الجنس</Label>
                      <Select
                        value={newChild.gender}
                        onValueChange={(value) => setNewChild({ ...newChild, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="childEducationLevel">المستوى التعليمي</Label>
                      <Select
                        value={newChild.educationLevel}
                        onValueChange={(value) => setNewChild({ ...newChild, educationLevel: value, grade: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المستوى التعليمي" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(educationLevels).map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newChild.educationLevel && (
                      <div className="space-y-2">
                        <Label htmlFor="childGrade">السنة الدراسية</Label>
                        <Select
                          value={newChild.grade}
                          onValueChange={(value) => setNewChild({ ...newChild, grade: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="اختر السنة الدراسية" />
                          </SelectTrigger>
                          <SelectContent>
                            {educationLevels[newChild.educationLevel as keyof typeof educationLevels]?.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddChild(false)}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={addChildMutation.isPending}
                      >
                        {addChildMutation.isPending ? 'جاري الإضافة...' : 'إضافة الطفل'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </TabsContent>
        )}
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
      
      {/* Logout Section */}
      <div className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">تسجيل الخروج</h3>
                <p className="text-sm text-gray-600">الخروج من حسابك الحالي</p>
              </div>
              <Button 
                onClick={() => logout()}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        email={user.email}
        onVerificationSuccess={() => {
          // Update Firebase email verification status
          setIsEmailVerified(true);
          setShowEmailVerification(false);
        }}
      />

      {/* Group Details Modal for Children */}
      <GroupDetailsModal
        group={selectedGroup}
        isOpen={showGroupDetails}
        onClose={() => {
          setShowGroupDetails(false);
          setSelectedGroup(null);
          setSelectedChildId(null);
        }}
        currentUserId={selectedChildId || 0}
        userRole="child"
      />
    </div>
  );
}