import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useLocation, Link } from 'wouter';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import PasswordResetModal from '@/components/PasswordResetModal';
import { StudentClaimForm } from '@/components/StudentClaimForm';

interface Child {
  name: string;
  gender: string;
  educationLevel: string;
  grade: string;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [children, setChildren] = useState<Child[]>([{ name: '', gender: '', educationLevel: '', grade: '' }]);
  const [studentEducationLevel, setStudentEducationLevel] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentGender, setStudentGender] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get school context if available
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');
  const currentSchoolId = sessionStorage.getItem('currentSchoolId');
  
  // Check if the selected school still exists by validating it
  const [schoolValidated, setSchoolValidated] = useState(false);
  const [validSchool, setValidSchool] = useState(selectedSchool);
  
  // Validate school exists on component mount ONLY ONCE
  useEffect(() => {
    if (schoolValidated) return;
    
    const validateSchool = async () => {
      if (selectedSchool && selectedSchool.code) {
        try {
          const response = await fetch("/api/school/select", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schoolCode: selectedSchool.code }),
          });
          
          if (!response.ok) {
            localStorage.removeItem('selectedSchool');
            sessionStorage.removeItem('currentSchoolId');
            sessionStorage.removeItem('schoolCode');
            setValidSchool(null);
          } else {
            const result = await response.json();
            setValidSchool(result.school);
          }
        } catch (error) {
          localStorage.removeItem('selectedSchool');
          sessionStorage.removeItem('currentSchoolId');
          sessionStorage.removeItem('schoolCode');
          setValidSchool(null);
        }
      } else {
        setValidSchool(selectedSchool);
      }
      setSchoolValidated(true);
    };
    
    validateSchool();
  }, []); // Empty dependency array - run only once on mount

  // New state for step-by-step flow
  const [currentStep, setCurrentStep] = useState<'action' | 'userType' | 'form'>('action');
  const [selectedAction, setSelectedAction] = useState<'login' | 'register' | 'student-claim' | null>(null);
  const [selectedUserType, setSelectedUserType] = useState<'admin' | 'teacher' | 'parent' | 'student' | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [showTeacherSecret, setShowTeacherSecret] = useState(false);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(''); // Clear previous error
    
    // Basic validation
    if (!email || !password) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      setLoading(false);
      return;
    }
    
    try {
      // Direct login API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
      
      setErrorMessage(''); // Clear error on success
      
      // Reload the page to trigger AuthContext refresh
      window.location.reload();
    } catch (error) {
      // Enhanced error handling with specific Arabic messages
      let errorMsg = 'خطأ غير متوقع';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes('password') || message.includes('كلمة المرور') || message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
          errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (message.includes('email') || message.includes('البريد الإلكتروني') || message.includes('auth/user-not-found')) {
          errorMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (message.includes('network') || message.includes('الشبكة')) {
          errorMsg = 'خطأ في الاتصال بالشبكة';
        } else if (message.includes('too-many-requests')) {
          errorMsg = 'الكثير من المحاولات. يرجى المحاولة لاحقاً';
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
      
      // Clear password field on failed login
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    if (children.length < 5) {
      setChildren([...children, { name: '', gender: '', educationLevel: '', grade: '' }]);
    }
  };

  const removeChild = (index: number) => {
    if (children.length > 1) {
      setChildren(children.filter((_, i) => i !== index));
    }
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    const updatedChildren = [...children];
    updatedChildren[index][field] = value;
    
    // Reset grade when education level changes
    if (field === 'educationLevel') {
      updatedChildren[index].grade = '';
    }
    
    setChildren(updatedChildren);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate children data
    const validChildren = children.filter(child => 
      child.name.trim() && child.educationLevel && child.grade
    );
    
    if (validChildren.length === 0) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب إدخال بيانات طفل واحد على الأقل',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      // Direct register API call
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          phone, 
          role: 'user',
          children: validChildren 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في إنشاء الحساب');
      }
      
      toast({ title: 'تم إنشاء الحساب بنجاح' });
      
      // Reload the page to trigger AuthContext refresh
      window.location.reload();
    } catch (error) {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات المدخلة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!studentEducationLevel || !studentGrade || !studentGender) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب اختيار المستوى التعليمي والسنة الدراسية والجنس',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      // Direct register API call for student
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          phone, 
          role: 'student',
          gender: studentGender,
          educationLevel: studentEducationLevel,
          grade: studentGrade
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في إنشاء الحساب');
      }
      
      toast({ title: 'تم إنشاء الحساب بنجاح' });
      
      // Reload the page to trigger AuthContext refresh
      window.location.reload();
    } catch (error) {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات المدخلة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!secretKey.trim()) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب إدخال المفتاح السري للإدارة',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          password, 
          adminKey: secretKey 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل المدير');
      }
      
      toast({ title: 'تم إنشاء حساب المدير بنجاح' });
      
      // Reload the page to trigger AuthContext refresh
      window.location.reload();
    } catch (error) {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات والمفتاح السري',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!secretKey.trim()) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب إدخال المفتاح السري للمعلمين',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    if (!gender.trim()) {
      toast({ 
        title: 'خطأ في البيانات', 
        description: 'يجب اختيار الجنس',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          phone, 
          password, 
          gender,
          teacherKey: secretKey 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل المعلم');
      }
      
      toast({ title: 'تم إنشاء حساب المعلم بنجاح' });
      
      // Reload the page to trigger AuthContext refresh
      window.location.reload();
    } catch (error) {
      toast({ 
        title: 'خطأ في إنشاء الحساب', 
        description: error instanceof Error ? error.message : 'تأكد من صحة البيانات والمفتاح السري',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-bg p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-6">
          {!schoolValidated ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">جاري التحقق من المدرسة...</p>
            </div>
          ) : (
            <>
              {validSchool?.logoUrl ? (
                <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden shadow-lg border-2 border-gray-200">
                  <img 
                    src={validSchool.logoUrl} 
                    alt={`${validSchool.name} Logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                  </svg>
                </div>
              )}
              <CardTitle className="text-2xl font-bold text-gray-800" style={{ color: validSchool?.primaryColor || '#1f2937' }}>
                {validSchool ? validSchool.name : 'مدرستي'}
              </CardTitle>
              <CardDescription>
                {validSchool ? 'منصة المدرسة الإلكترونية' : 'TaalimFlow'}
              </CardDescription>
              
              {!validSchool && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    لا توجد مدرسة محددة. يرجى العودة إلى الصفحة الرئيسية لاختيار مدرسة.
                  </p>
                  <Button 
                    onClick={() => navigate('/')}
                    className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              )}
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Only show forms if school is validated and exists */}
          {schoolValidated && validSchool && (
            <>
              {/* Step 1: Choose Action */}
              {currentStep === 'action' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">مرحباً بك</h2>
                <p className="text-gray-600">اختر الإجراء المناسب</p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    setSelectedAction('login');
                    setCurrentStep('form');
                  }}
                  className="w-full py-6 text-lg"
                  variant="outline"
                >
                  تسجيل الدخول
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedAction('register');
                    setCurrentStep('userType');
                  }}
                  className="w-full py-6 text-lg"
                >
                  إنشاء حساب جديد
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedAction('student-claim');
                    setCurrentStep('form');
                  }}
                  className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  ربط حساب طالب موجود
                </Button>
              </div>
              

            </div>
          )}

          {/* Step 2: Choose User Type (only for registration) */}
          {currentStep === 'userType' && selectedAction === 'register' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">اختر نوع الحساب</h2>
                <p className="text-gray-600">حدد نوع المستخدم المناسب</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => {
                    setSelectedUserType('admin');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">مدير</div>
                    <div className="text-sm text-gray-500">إدارة المدرسة</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedUserType('teacher');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM5 13.18l7 3.82 7-3.82V13L12 17l-7-4v.18z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">معلم</div>
                    <div className="text-sm text-gray-500">هيئة التدريس</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedUserType('parent');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">ولي أمر</div>
                    <div className="text-sm text-gray-500">حساب للآباء والأمهات</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedUserType('student');
                    setCurrentStep('form');
                  }}
                  className="p-6 h-auto flex flex-col items-center justify-center space-y-3"
                  variant="outline"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM5 13.18l7 3.82 7-3.82V13L12 17l-7-4v.18z"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">طالب</div>
                    <div className="text-sm text-gray-500">حساب للطلاب</div>
                  </div>
                </Button>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={() => setCurrentStep('action')}
                  variant="ghost"
                  className="text-gray-600"
                >
                  ← رجوع
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Forms */}
          {currentStep === 'form' && (
            <div className="space-y-6">
              {/* Login Form */}
              {selectedAction === 'login' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">تسجيل الدخول</h2>
                    <p className="text-gray-600">أدخل بيانات حسابك</p>
                  </div>
                  
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="أدخل بريدك الإلكتروني"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowPasswordReset(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Parent Registration Form */}
              {selectedAction === 'register' && selectedUserType === 'parent' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب ولي أمر</h2>
                    <p className="text-gray-600">أدخل بيانات ولي الأمر والأطفال</p>
                  </div>
                  
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">اسم ولي الأمر</Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="أدخل اسم ولي الأمر"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">رقم الهاتف</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0555123456 أو +213555123456"
                          pattern="^(\+213|0)(5|6|7)[0-9]{8}$"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">رقم هاتف جزائري (يبدأ بـ 05، 06، أو 07)</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="أدخل بريدك الإلكتروني"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Children Section */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">بيانات الأطفال</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addChild}
                          disabled={children.length >= 5}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة طفل
                        </Button>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto space-y-4">
                        {children.map((child, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-gray-700">الطفل {index + 1}</h4>
                              {children.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeChild(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label htmlFor={`child-name-${index}`} className="text-sm">اسم الطفل</Label>
                                <Input
                                  id={`child-name-${index}`}
                                  type="text"
                                  value={child.name}
                                  onChange={(e) => updateChild(index, 'name', e.target.value)}
                                  placeholder="أدخل اسم الطفل"
                                  required
                                  className="mt-1"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`child-gender-${index}`} className="text-sm">الجنس</Label>
                                <Select
                                  value={child.gender}
                                  onValueChange={(value) => updateChild(index, 'gender', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="اختر الجنس" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">ذكر</SelectItem>
                                    <SelectItem value="female">أنثى</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor={`child-level-${index}`} className="text-sm">المرحلة التعليمية</Label>
                                <Select
                                  value={child.educationLevel}
                                  onValueChange={(value) => updateChild(index, 'educationLevel', value)}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="اختر المرحلة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                                    <SelectItem value="المتوسط">المتوسط</SelectItem>
                                    <SelectItem value="الثانوي">الثانوي</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {child.educationLevel && (
                                <div className="md:col-span-3">
                                  <Label htmlFor={`child-grade-${index}`} className="text-sm">السنة الدراسية</Label>
                                  <Select
                                    value={child.grade}
                                    onValueChange={(value) => updateChild(index, 'grade', value)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="اختر السنة الدراسية" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {educationLevels[child.educationLevel as keyof typeof educationLevels]?.map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                          {grade}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        يمكن تسجيل حتى 5 أطفال في الحساب الواحد
                      </p>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب ولي أمر'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Student Registration Form */}
              {selectedAction === 'register' && selectedUserType === 'student' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب طالب</h2>
                    <p className="text-gray-600">أدخل بيانات الطالب الشخصية والدراسية</p>
                  </div>
                  
                  <form onSubmit={handleStudentRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student-name">اسم الطالب</Label>
                        <Input
                          id="student-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="أدخل اسم الطالب"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="student-phone">رقم الهاتف</Label>
                        <Input
                          id="student-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0555123456 أو +213555123456"
                          pattern="^(\+213|0)(5|6|7)[0-9]{8}$"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">رقم هاتف جزائري (يبدأ بـ 05، 06، أو 07)</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student-email">البريد الإلكتروني</Label>
                        <Input
                          id="student-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="أدخل بريدك الإلكتروني"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="student-password">كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            id="student-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 border-t pt-4">
                      <Label className="text-base font-medium">المعلومات الشخصية والدراسية</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="student-gender">الجنس</Label>
                          <Select
                            value={studentGender}
                            onValueChange={setStudentGender}
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
                        
                        <div>
                          <Label htmlFor="student-education-level">المستوى التعليمي</Label>
                          <Select
                            value={studentEducationLevel}
                            onValueChange={(value) => {
                              setStudentEducationLevel(value);
                              setStudentGrade(''); // Reset grade when education level changes
                            }}
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
                        
                        {studentEducationLevel && (
                          <div>
                            <Label htmlFor="student-grade">السنة الدراسية</Label>
                            <Select
                              value={studentGrade}
                              onValueChange={setStudentGrade}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="اختر السنة الدراسية" />
                              </SelectTrigger>
                              <SelectContent>
                                {educationLevels[studentEducationLevel as keyof typeof educationLevels]?.map((grade) => (
                                  <SelectItem key={grade} value={grade}>
                                    {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب طالب'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Admin Registration Form */}
              {selectedAction === 'register' && selectedUserType === 'admin' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب مدير</h2>
                    <p className="text-gray-600">أدخل بيانات المدير والمفتاح السري</p>
                  </div>
                  
                  <form onSubmit={handleAdminRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin-name">اسم المدير</Label>
                        <Input
                          id="admin-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="أدخل اسم المدير"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="admin-phone">رقم الهاتف</Label>
                        <Input
                          id="admin-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0555123456 أو +213555123456"
                          pattern="^(\+213|0)(5|6|7)[0-9]{8}$"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="أدخل البريد الإلكتروني"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="admin-password">كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            id="admin-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="admin-secret">المفتاح السري للإدارة</Label>
                      <div className="relative">
                        <Input
                          id="admin-secret"
                          type={showAdminSecret ? "text" : "password"}
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="أدخل المفتاح السري للإدارة"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowAdminSecret(!showAdminSecret)}
                        >
                          {showAdminSecret ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">يجب الحصول على المفتاح السري من إدارة المدرسة</p>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب مدير'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Teacher Registration Form */}
              {selectedAction === 'register' && selectedUserType === 'teacher' && (
                <div>
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">إنشاء حساب معلم</h2>
                    <p className="text-gray-600">أدخل بيانات المعلم والمفتاح السري</p>
                  </div>
                  
                  <form onSubmit={handleTeacherRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher-name">اسم المعلم</Label>
                        <Input
                          id="teacher-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="أدخل اسم المعلم"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teacher-phone">رقم الهاتف</Label>
                        <Input
                          id="teacher-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0555123456 أو +213555123456"
                          pattern="^(\+213|0)(5|6|7)[0-9]{8}$"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher-email">البريد الإلكتروني</Label>
                        <Input
                          id="teacher-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="أدخل البريد الإلكتروني"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="teacher-password">كلمة المرور</Label>
                        <div className="relative">
                          <Input
                            id="teacher-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="teacher-gender">الجنس</Label>
                      <Select
                        value={gender}
                        onValueChange={setGender}
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
                    
                    <div>
                      <Label htmlFor="teacher-secret">المفتاح السري للمعلمين</Label>
                      <div className="relative">
                        <Input
                          id="teacher-secret"
                          type={showTeacherSecret ? "text" : "password"}
                          value={secretKey}
                          onChange={(e) => setSecretKey(e.target.value)}
                          placeholder="أدخل المفتاح السري للمعلمين"
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowTeacherSecret(!showTeacherSecret)}
                        >
                          {showTeacherSecret ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">يجب الحصول على المفتاح السري من إدارة المدرسة</p>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب معلم'}
                    </Button>
                  </form>
                </div>
              )}

              {/* Student Claim Form */}
              {selectedAction === 'student-claim' && (
                <StudentClaimForm
                  onSuccess={() => {
                    // Refresh auth state or redirect
                    window.location.reload();
                  }}
                  onCancel={() => {
                    setCurrentStep('action');
                  }}
                />
              )}

              {/* Back Button */}
              <div className="text-center">
                <Button 
                  onClick={() => {
                    if (selectedAction === 'login' || selectedAction === 'student-claim') {
                      setCurrentStep('action');
                    } else if (selectedAction === 'register') {
                      setCurrentStep('userType');
                    }
                  }}
                  variant="ghost"
                  className="text-gray-600"
                >
                  ← رجوع
                </Button>
              </div>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Error Message Display */}
      {errorMessage && (
        <div className="fixed bottom-4 left-4 right-4 mx-auto max-w-md">
          <div className="bg-red-500 text-white p-4 rounded-lg shadow-lg border border-red-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage('')}
                className="text-white hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Password Reset Modal */}
      <PasswordResetModal
        isOpen={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </div>
  );
}
