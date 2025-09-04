import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, Users, Phone, Mail, Calendar, Plus, Edit, Trash, BookOpen, Clock, GraduationCap, BookOpenText, Timer, CreditCard, FileText } from 'lucide-react';

export default function Courses() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChildSelectionModal, setShowChildSelectionModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [processingPayment, setProcessingPayment] = useState<{ [key: number]: boolean }>({});
  const [showManualRegistrationModal, setShowManualRegistrationModal] = useState(false);
  const [showNewStudentRegistrationModal, setShowNewStudentRegistrationModal] = useState(false);
  const [selectedStudentForRegistration, setSelectedStudentForRegistration] = useState<any>(null);
  const [newStudentData, setNewStudentData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    courseDate: '',
    courseTime: '',
    educationLevel: '',
    grade: '',
    subjectId: ''
  });

  const { data: courses = [], isLoading: loading } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    enabled: !!user && !authLoading,
  });

  const { data: children = [] } = useQuery({
    queryKey: ['/api/children'],
    enabled: !!user && !authLoading,
  });

  // Query for course registrations (load for all users to check registration status)
  const { data: courseRegistrations = [], isLoading: registrationsLoading, error: registrationsError } = useQuery({
    queryKey: ['/api/course-registrations'],
    enabled: !!user && !authLoading,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  // Query for teaching modules/subjects
  const { data: teachingModules = [] } = useQuery({
    queryKey: ['/api/teaching-modules'],
    enabled: !!user && !authLoading,
  });

  // Query for all students (for manual registration)
  const { data: allStudents = [] } = useQuery({
    queryKey: ['/api/qr-scanner/search'],
    enabled: !!user && !authLoading && user.role === 'admin',
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/courses', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء الدورة بنجاح' });
      setShowCreateForm(false);
      setCourseData({
        title: '',
        description: '',
        duration: '',
        price: '',
        courseDate: '',
        courseTime: '',
        educationLevel: '',
        grade: '',
        subjectId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في إنشاء الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في تحديث الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث الدورة بنجاح' });
      setEditingCourse(null);
      setCourseData({
        title: '',
        description: '',
        duration: '',
        price: '',
        courseDate: '',
        courseTime: '',
        educationLevel: '',
        grade: '',
        subjectId: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في تحديث الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await apiRequest('DELETE', `/api/courses/${courseId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في حذف الدورة');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف الدورة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في حذف الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const joinCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/course-registrations', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في التسجيل');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم التسجيل في الدورة بنجاح' });
      setShowJoinForm(false);
      setShowChildSelectionModal(false);
      setSelectedCourse(null);
      setSelectedChild(null);
      queryClient.invalidateQueries({ queryKey: ['/api/course-registrations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في التسجيل في الدورة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  // Manual registration mutation for admin
  const manualRegistrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/course-registrations', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في التسجيل اليدوي');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تسجيل الطالب بنجاح' });
      setShowManualRegistrationModal(false);
      setSelectedStudentForRegistration(null);
      resetNewStudentForm();
      queryClient.invalidateQueries({ queryKey: ['/api/course-registrations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في التسجيل اليدوي', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  // Handle manual student registration for existing students
  const handleManualRegistration = (student: any) => {
    if (!selectedCourseForView) return;

    const registrationData = {
      courseId: selectedCourseForView.id,
      registrantType: 'self',
      fullName: student.fullName || student.name,
      phone: student.phone || student.contactInfo?.phone || '',
      email: student.email || student.contactInfo?.email || '',
      childId: null,
      childName: null,
      childAge: null,
    };

    manualRegistrationMutation.mutate(registrationData);
  };

  // Handle new student registration (without user account)
  const handleNewStudentRegistration = () => {
    if (!selectedCourseForView || !newStudentData.fullName || !newStudentData.phone) {
      toast({
        title: 'بيانات ناقصة',
        description: 'الاسم الكامل ورقم الهاتف مطلوبان',
        variant: 'destructive'
      });
      return;
    }

    const registrationData = {
      courseId: selectedCourseForView.id,
      registrantType: 'self',
      fullName: newStudentData.fullName,
      phone: newStudentData.phone,
      email: newStudentData.email || '',
      childId: null,
      childName: null,
      childAge: null,
      isNewStudent: true, // Flag to indicate this is a new student without an account
    };

    manualRegistrationMutation.mutate(registrationData);
  };

  // Reset new student form
  const resetNewStudentForm = () => {
    setNewStudentData({
      fullName: '',
      phone: '',
      email: ''
    });
    setShowNewStudentRegistrationModal(false);
  };

  // Get available students for manual registration (exclude already registered)
  const getAvailableStudentsForRegistration = () => {
    if (!selectedCourseForView || !allStudents) return [];
    
    const registeredUserIds = getRegistrationsForCourse(selectedCourseForView.id)
      .map((reg: any) => reg.userId);
    
    return allStudents.filter((student: any) => 
      !registeredUserIds.includes(student.userId)
    );
  };

  // Payment handler for course subscription fees
  const handleCoursePayment = async (registration: any, course: any) => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'غير مسموح',
        description: 'فقط المسؤولون يمكنهم تسجيل الدفعات',
        variant: 'destructive'
      });
      return;
    }

    const registrationId = registration.id;
    const coursePrice = parseFloat(course.price) || 0;
    
    if (coursePrice <= 0) {
      toast({
        title: 'خطأ في السعر',
        description: 'يجب أن يكون سعر الدورة أكبر من صفر',
        variant: 'destructive'
      });
      return;
    }

    setProcessingPayment(prev => ({ ...prev, [registrationId]: true }));

    try {
      const currentDate = new Date();
      const receiptId = `COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Create financial gain entry
      const financialEntry = {
        schoolId: user.schoolId,
        type: 'gain',
        amount: coursePrice.toString(), // Convert to string for decimal validation
        remarks: `دفع رسوم اشتراك الدورة: ${course.title} - المسجل: ${registration.fullName} - نوع التسجيل: ${registration.registrantType === 'child' ? 'طفل' : 'مباشر'}`,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        recordedBy: user.id,
        receiptId: receiptId
      };

      const response = await apiRequest('POST', '/api/financial-entries', financialEntry);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في إنشاء سجل الدفع');
      }

      const createdEntry = await response.json();

      // Update course registration payment status
      const updateResponse = await apiRequest('PUT', `/api/course-registrations/${registrationId}/payment`, {
        paymentStatus: 'paid',
        paidAt: currentDate.toISOString(),
        paidBy: user.id,
        receiptId: receiptId
      });

      if (!updateResponse.ok) {
        console.warn('Failed to update payment status in registration');
      }

      // Generate and display receipt
      generateCoursePaymentReceipt({
        receiptId,
        registrationInfo: registration,
        courseInfo: course,
        amount: coursePrice,
        date: currentDate,
        adminName: user.firstName + ' ' + user.lastName
      });

      toast({
        title: 'تم تسجيل الدفع بنجاح',
        description: `تم إنشاء إيصال رقم: ${receiptId}`
      });

      // Refresh financial entries and course registrations
      queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial-reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/course-registrations'] });

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'خطأ في تسجيل الدفع',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(prev => ({ ...prev, [registrationId]: false }));
    }
  };

  // Generate and display payment receipt
  const generateCoursePaymentReceipt = (receiptData: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = receiptData.date.toLocaleDateString('en-GB');
    const currentTime = receiptData.date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>إيصال دفع رسوم الدورة</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            direction: rtl;
            background: white;
          }
          .receipt { 
            max-width: 400px; 
            margin: 0 auto; 
            border: 2px solid #333; 
            padding: 20px;
            background: white;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 15px; 
            margin-bottom: 20px; 
          }
          .title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .subtitle { 
            font-size: 14px; 
            color: #666; 
          }
          .section { 
            margin-bottom: 15px; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
          }
          .section-title { 
            font-weight: bold; 
            color: #333; 
            margin-bottom: 8px; 
            font-size: 14px; 
          }
          .field { 
            margin-bottom: 5px; 
            font-size: 13px; 
          }
          .field strong { 
            color: #444; 
          }
          .amount { 
            text-align: center; 
            font-size: 20px; 
            font-weight: bold; 
            background: #f5f5f5; 
            padding: 15px; 
            border: 2px solid #333; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #ddd; 
            padding-top: 15px; 
            margin-top: 20px; 
          }
          .receipt-id { 
            background: #f0f0f0; 
            padding: 8px; 
            text-align: center; 
            font-family: monospace; 
            font-size: 12px; 
            margin-bottom: 15px; 
          }
          @media print {
            body { margin: 0; }
            .receipt { max-width: none; margin: 0; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">إيصال دفع رسوم الدورة</div>
            <div class="subtitle">Receipt for Course Subscription Fee</div>
          </div>

          <div class="receipt-id">
            رقم الإيصال: ${receiptData.receiptId}
          </div>

          <div class="section">
            <div class="section-title">📚 معلومات الدورة</div>
            <div class="field"><strong>اسم الدورة:</strong> ${receiptData.courseInfo.title}</div>
            <div class="field"><strong>المدة:</strong> ${receiptData.courseInfo.duration || 'غير محدد'}</div>
            ${receiptData.courseInfo.grade ? `<div class="field"><strong>الصف:</strong> ${receiptData.courseInfo.grade}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">👤 معلومات المسجل</div>
            <div class="field"><strong>الاسم الكامل:</strong> ${receiptData.registrationInfo.fullName}</div>
            <div class="field"><strong>رقم الهاتف:</strong> ${receiptData.registrationInfo.phone}</div>
          </div>

          <div class="amount">
            المبلغ المدفوع: ${receiptData.amount} دج
          </div>

          <div class="section">
            <div class="section-title">ℹ️ تفاصيل الدفع</div>
            <div class="field"><strong>التاريخ:</strong> ${currentDate}</div>
            <div class="field"><strong>الوقت:</strong> ${currentTime}</div>
            <div class="field"><strong>المسؤول:</strong> ${receiptData.adminName}</div>
            <div class="field"><strong>نوع الدفع:</strong> رسوم اشتراك الدورة</div>
          </div>

          <div class="footer">
            <div>شكراً لك على دفع رسوم الدورة</div>
            <div>تم إنشاء هذا الإيصال تلقائياً في ${currentDate} ${currentTime}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  // Helper function to check if current user is already registered for a course
  const isUserRegistered = (courseId: number) => {
    if (!courseRegistrations || !user?.id || !courseId) return false;
    
    // Debug: Display all registered users and current user ID
    console.log('=== REGISTRATION DEBUG ===');
    console.log('Current user ID:', user.id, '(type:', typeof user.id, ')');
    console.log('Checking course ID:', courseId, '(type:', typeof courseId, ')');
    console.log('All course registrations:');
    (courseRegistrations as any[])?.forEach((reg: any, index: number) => {
      console.log(`  [${index}] User ID: ${reg.userId} (type: ${typeof reg.userId}), Course ID: ${reg.courseId} (type: ${typeof reg.courseId}), Name: ${reg.fullName}, Type: ${reg.registrantType}`);
    });
    
    // Check if the logged-in user's ID exists in course registrations for this specific course
    const isRegistered = (courseRegistrations as any[])?.some((reg: any) => {
      const userMatch = Number(reg.userId) === Number(user.id);
      const courseMatch = Number(reg.courseId) === Number(courseId);
      console.log(`  Checking registration: userId ${reg.userId} vs ${user.id} = ${userMatch}, courseId ${reg.courseId} vs ${courseId} = ${courseMatch}`);
      return userMatch && courseMatch;
    });
    
    console.log('Final result - Is user registered?', isRegistered);
    console.log('=== END DEBUG ===');
    
    return Boolean(isRegistered);
  };

  // Helper function to check if a child is already registered for a course
  const isChildRegistered = (courseId: number, childId: number) => {
    if (!courseRegistrations || !user?.id) return false;
    
    return (courseRegistrations as any[])?.some((reg: any) => 
      Number(reg.courseId) === Number(courseId) && 
      Number(reg.userId) === Number(user.id) && 
      Number(reg.childId) === Number(childId) &&
      reg.registrantType === 'child'
    );
  };

  const getRegistrationsForCourse = (courseId: number) => {
    if (!courseRegistrations || !courseId) return [];
    
    return (courseRegistrations as any[])?.filter((reg: any) => {
      return Number(reg.courseId) === Number(courseId);
    }) || [];
  };

  // Helper function to get subject name
  const getSubjectName = (subjectId: number | string | null | undefined) => {
    if (!subjectId || !teachingModules) return null;
    const module = (teachingModules as any[]).find((module: any) => 
      module.id === Number(subjectId)
    );
    return module?.nameAr || null;
  };

  // Countdown component for course start time
  const CourseCountdown = ({ courseDate, courseTime }: { courseDate: string, courseTime: string }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
      const calculateTimeLeft = () => {
        if (!courseDate || !courseTime) return;

        const courseDateTime = new Date(`${courseDate}T${courseTime}`);
        const now = new Date();
        const difference = courseDateTime.getTime() - now.getTime();

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

          if (days > 0) {
            setTimeLeft(`${days} يوم ${hours} ساعة`);
          } else if (hours > 0) {
            setTimeLeft(`${hours} ساعة ${minutes} دقيقة`);
          } else {
            setTimeLeft(`${minutes} دقيقة`);
          }
          setIsExpired(false);
        } else {
          setTimeLeft('بدأت الدورة');
          setIsExpired(true);
        }
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

      return () => clearInterval(timer);
    }, [courseDate, courseTime]);

    if (!timeLeft) return null;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
        isExpired 
          ? 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border border-red-200 dark:border-red-800'
          : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 border border-indigo-200 dark:border-indigo-800'
      }`}>
        <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${
          isExpired 
            ? 'text-red-600 dark:text-red-400' 
            : 'text-indigo-600 dark:text-indigo-400'
        }`} />
        <span className={`whitespace-nowrap ${
          isExpired 
            ? 'text-red-700 dark:text-red-300' 
            : 'text-indigo-700 dark:text-indigo-300'
        }`}>
          {isExpired ? timeLeft : `يبدأ خلال ${timeLeft}`}
        </span>
      </div>
    );
  };

  const handleViewRegistrations = (course: Course) => {
    setSelectedCourseForView(course);
    setShowRegistrationsModal(true);
  };

  const handleCreateCourse = () => {
    createCourseMutation.mutate(courseData);
  };

  const handleUpdateCourse = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseData });
    }
  };

  const handleJoinCourse = () => {
    if (selectedCourse && user?.id && user?.name && user?.phone && user?.email) {
      console.log('Using user data for course registration:', {
        courseId: selectedCourse.id,
        userId: user.id,
        registrantType: 'self',
        fullName: user.name,
        phone: user.phone,
        email: user.email
      });
      
      joinCourseMutation.mutate({
        courseId: selectedCourse.id,
        registrantType: 'self',
        fullName: user.name,
        phone: user.phone,
        email: user.email,
        childId: null,
        childName: null,
        childAge: null
      });
    }
  };

  const handleJoinCourseForChild = () => {
    if (selectedCourse && selectedChild && user?.id && user?.phone && user?.email) {
      console.log('Registering child for course:', {
        courseId: selectedCourse.id,
        childId: selectedChild.id,
        childName: selectedChild.name
      });
      
      joinCourseMutation.mutate({
        courseId: selectedCourse.id,
        registrantType: 'child',
        childId: selectedChild.id,
        fullName: selectedChild.name,
        phone: user.phone,
        email: user.email,
        childName: selectedChild.name,
        childAge: selectedChild.age || null
      });
    }
  };

  const handleRegisterClick = (course: Course) => {
    setSelectedCourse(course);
    // Check if user has children to show selection modal
    if (children && Array.isArray(children) && children.length > 0) {
      setShowChildSelectionModal(true);
    } else {
      setShowJoinForm(true);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseData({
      title: course.title,
      description: course.description,
      duration: course.duration || '',
      price: course.price,
      courseDate: course.courseDate,
      courseTime: course.courseTime,
      educationLevel: course.educationLevel || '',
      grade: course.grade || '',
      subjectId: course.subjectId?.toString() || ''
    });
    setShowCreateForm(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">يرجى تسجيل الدخول للوصول إلى الدورات</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              الدورات
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              استكشف الدورات المتاحة وسجل فيها أو سجل أطفالك
            </p>
          </div>
          
          {user.role === 'admin' && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة دورة جديدة
            </Button>
          )}
        </div>


        {/* Courses Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="mb-2">
                        <CardTitle className="text-lg text-right">{course.title}</CardTitle>
                      </div>
                      
                      {/* Course Info - Compact Layout */}
                      <div className="space-y-1.5">
                        {/* Date and Time Badge */}
                        <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1.5 rounded-full text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="text-blue-700 dark:text-blue-300">
                            {(() => {
                              const formattedDate = course.courseDate ? 
                                course.courseDate.split('-').reverse().join('/') : '';
                              const formattedTime = course.courseTime || '';
                              return `${formattedDate} | ${formattedTime}`;
                            })()}
                          </span>
                        </div>
                        
                        {/* Compact Info Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {/* Countdown Timer */}
                          <CourseCountdown courseDate={course.courseDate} courseTime={course.courseTime} />
                          
                          {/* Duration */}
                          {course.duration && (
                            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800 px-2.5 py-1.5 rounded-full text-xs font-medium">
                              <Timer className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <span className="text-green-700 dark:text-green-300 whitespace-nowrap">{course.duration}</span>
                            </div>
                          )}

                          {/* Grade */}
                          {course.grade && (
                            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800 px-2.5 py-1.5 rounded-full text-xs font-medium">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <span className="text-purple-700 dark:text-purple-300 whitespace-nowrap">{course.grade}</span>
                            </div>
                          )}

                          {/* Subject */}
                          {getSubjectName(course.subjectId) && (
                            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border border-orange-200 dark:border-orange-800 px-2.5 py-1.5 rounded-full text-xs font-medium">
                              <BookOpenText className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                              <span className="text-orange-700 dark:text-orange-300 whitespace-nowrap">{getSubjectName(course.subjectId)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {user.role === 'admin' && (
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCourseMutation.mutate(course.id)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 text-right leading-relaxed">
                    {course.description}
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">السعر:</span>
                      <span className="text-green-600 font-bold text-lg">{course.price} دج</span>
                    </div>
                  </div>

                  {user.role === 'admin' ? (
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleViewRegistrations(course)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      عرض التسجيلات
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full transition-all duration-200 ${isUserRegistered(course.id) 
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60 hover:bg-gray-400 dark:hover:bg-gray-600' 
                        : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'
                      }`}
                      disabled={isUserRegistered(course.id)}
                      onClick={() => {
                        if (!isUserRegistered(course.id)) {
                          handleRegisterClick(course);
                        }
                      }}
                    >
                      {isUserRegistered(course.id) ? 'مُسجل بالفعل' : 'سجل الآن'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد دورات متاحة حالياً</p>
          </div>
        )}
      </div>

      {/* Create/Edit Course Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                {editingCourse ? 'تعديل الدورة' : 'إضافة دورة جديدة'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCourse(null);
                  setCourseData({
                    title: '',
                    description: '',
                    duration: '',
                    price: '',
                    courseDate: '',
                    courseTime: '',
                    educationLevel: '',
                    grade: '',
                    subjectId: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الدورة</Label>
                <Input
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                  placeholder="أدخل عنوان الدورة"
                  className="text-right"
                />
              </div>
              
              <div>
                <Label htmlFor="description">وصف الدورة</Label>
                <textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="أدخل وصف مفصل للدورة"
                  className="w-full p-2 border rounded-lg text-right h-24 resize-none dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              
              <div>
                <Label htmlFor="duration">المدة</Label>
                <Input
                  id="duration"
                  value={courseData.duration}
                  onChange={(e) => setCourseData({ ...courseData, duration: e.target.value })}
                  placeholder="مثال: 3 أشهر أو 12 أسبوع"
                  className="text-right"
                />
              </div>
              
              <div>
                <Label htmlFor="price">السعر</Label>
                <div className="relative">
                  <Input
                    id="price"
                    type="number"
                    value={courseData.price}
                    onChange={(e) => setCourseData({ ...courseData, price: e.target.value })}
                    placeholder="5000"
                    className="text-right pl-10"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">دج</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseDate">التاريخ</Label>
                  <Input
                    id="courseDate"
                    type="date"
                    value={courseData.courseDate}
                    onChange={(e) => setCourseData({ ...courseData, courseDate: e.target.value })}
                    className="text-right"
                  />
                </div>
                
                <div>
                  <Label htmlFor="courseTime">الوقت</Label>
                  <Input
                    id="courseTime"
                    type="time"
                    value={courseData.courseTime}
                    onChange={(e) => setCourseData({ ...courseData, courseTime: e.target.value })}
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="educationLevel">المستوى التعليمي</Label>
                  <Select
                    value={courseData.educationLevel}
                    onValueChange={(value) => setCourseData({ ...courseData, educationLevel: value, grade: '', subjectId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                      <SelectItem value="المتوسط">المتوسط</SelectItem>
                      <SelectItem value="الثانوي">الثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="grade">السنة</Label>
                  <Select
                    value={courseData.grade}
                    onValueChange={(value) => setCourseData({ ...courseData, grade: value, subjectId: '' })}
                    disabled={!courseData.educationLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseData.educationLevel === 'الابتدائي' && (
                        <>
                          <SelectItem value="الأولى ابتدائي">الأولى ابتدائي</SelectItem>
                          <SelectItem value="الثانية ابتدائي">الثانية ابتدائي</SelectItem>
                          <SelectItem value="الثالثة ابتدائي">الثالثة ابتدائي</SelectItem>
                          <SelectItem value="الرابعة ابتدائي">الرابعة ابتدائي</SelectItem>
                          <SelectItem value="الخامسة ابتدائي">الخامسة ابتدائي</SelectItem>
                        </>
                      )}
                      {courseData.educationLevel === 'المتوسط' && (
                        <>
                          <SelectItem value="الأولى متوسط">الأولى متوسط</SelectItem>
                          <SelectItem value="الثانية متوسط">الثانية متوسط</SelectItem>
                          <SelectItem value="الثالثة متوسط">الثالثة متوسط</SelectItem>
                          <SelectItem value="الرابعة متوسط">الرابعة متوسط</SelectItem>
                        </>
                      )}
                      {courseData.educationLevel === 'الثانوي' && (
                        <>
                          <SelectItem value="الأولى ثانوي">الأولى ثانوي</SelectItem>
                          <SelectItem value="الثانية ثانوي">الثانية ثانوي</SelectItem>
                          <SelectItem value="الثالثة ثانوي">الثالثة ثانوي</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subjectId">المادة</Label>
                <Select
                  value={courseData.subjectId}
                  onValueChange={(value) => setCourseData({ ...courseData, subjectId: value })}
                  disabled={!courseData.educationLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {(teachingModules as any[])
                      .filter((module: any) => 
                        module.educationLevel === courseData.educationLevel
                      )
                      .map((module: any) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.nameAr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCourse(null);
                    setCourseData({
                      title: '',
                      description: '',
                      duration: '',
                      price: '',
                      courseDate: '',
                      courseTime: '',
                      educationLevel: '',
                      grade: '',
                      subjectId: ''
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={editingCourse ? handleUpdateCourse : handleCreateCourse}
                  disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {(createCourseMutation.isPending || updateCourseMutation.isPending) ? 
                    'جاري المعالجة...' : 
                    editingCourse ? 'تحديث الدورة' : 'إنشاء الدورة'
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Selection Modal */}
      {showChildSelectionModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">اختر المتدرب</h2>
              <button
                onClick={() => {
                  setShowChildSelectionModal(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Self registration option */}
              <Button
                onClick={() => {
                  setShowChildSelectionModal(false);
                  setShowJoinForm(true);
                }}
                disabled={isUserRegistered(selectedCourse.id)}
                className={`w-full text-right ${isUserRegistered(selectedCourse.id) 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUserRegistered(selectedCourse.id) ? 'أنت مُسجل بالفعل' : 'سجل نفسي'}
              </Button>
              
              {/* Children registration options */}
              {children && Array.isArray(children) && children.length > 0 ? (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">أو سجل أحد الأطفال:</p>
                  {(children as any[]).map((child: any) => (
                    <Button
                      key={child.id}
                      onClick={() => {
                        setSelectedChild(child);
                        setShowChildSelectionModal(false);
                        handleJoinCourseForChild();
                      }}
                      disabled={isChildRegistered(selectedCourse.id, child.id)}
                      variant="outline"
                      className={`w-full mb-2 text-right ${isChildRegistered(selectedCourse.id, child.id) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                      }`}
                    >
                      {isChildRegistered(selectedCourse.id, child.id) ? 
                        `${child.name} (مُسجل بالفعل)` : 
                        child.name
                      }
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Join Course Modal (Self Registration) */}
      {showJoinForm && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">التسجيل في {selectedCourse.title}</h2>
              </div>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setSelectedCourse(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>الوصف:</strong> {selectedCourse.description}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>السعر:</strong> {selectedCourse.price} دج
                </p>
                {selectedCourse.duration && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>المدة:</strong> {selectedCourse.duration}
                  </p>
                )}
                {getSubjectName(selectedCourse.subjectId) && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>المادة:</strong> {getSubjectName(selectedCourse.subjectId)}
                  </p>
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>التاريخ والوقت:</strong> {selectedCourse.courseDate} - {selectedCourse.courseTime}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                  سيتم التسجيل باستخدام بيانات حسابك:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>الاسم:</strong> {user?.name}<br/>
                  <strong>الهاتف:</strong> {user?.phone}<br/>
                  <strong>البريد:</strong> {user?.email}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowJoinForm(false);
                    setSelectedCourse(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleJoinCourse}
                  disabled={joinCourseMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {joinCourseMutation.isPending ? 'جاري التسجيل...' : 'سجل الآن'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Registrations Modal (Admin Only) */}
      {showRegistrationsModal && selectedCourseForView && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                تسجيلات الدورة: {selectedCourseForView.title}
              </h2>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedCourseForView(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>التاريخ:</strong> {selectedCourseForView.courseDate}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>الوقت:</strong> {selectedCourseForView.courseTime}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    <strong>السعر:</strong> {selectedCourseForView.price} دج
                  </p>
                </div>
                <div>
                  {selectedCourseForView.duration && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المدة:</strong> {selectedCourseForView.duration}
                    </p>
                  )}
                  {selectedCourseForView.educationLevel && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المستوى:</strong> {selectedCourseForView.educationLevel}
                      {selectedCourseForView.grade && ` - ${selectedCourseForView.grade}`}
                    </p>
                  )}
                  {getSubjectName(selectedCourseForView.subjectId) && (
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>المادة:</strong> {getSubjectName(selectedCourseForView.subjectId)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {(() => {
                    const courseRegs = getRegistrationsForCourse(selectedCourseForView.id);
                    console.log('Course registrations for course', selectedCourseForView.id, ':', courseRegs);
                    console.log('All course registrations:', courseRegistrations);
                    
                    return courseRegs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            <span className="font-medium">عدد التسجيلات: {courseRegs.length}</span>
                          </div>
                          {user?.role === 'admin' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setShowManualRegistrationModal(true)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Users className="w-4 h-4 ml-1" />
                                تسجيل طالب مسجل
                              </Button>
                              <Button
                                onClick={() => setShowNewStudentRegistrationModal(true)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Plus className="w-4 h-4 ml-1" />
                                إضافة طالب جديد
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid gap-4">
                          {courseRegs.map((registration: any) => (
                            <Card key={registration.id} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.fullName}</p>
                                    <p className="text-sm text-gray-500">اسم المستخدم</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.phone}</p>
                                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.email}</p>
                                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-gray-500" />
                                  <p className="text-sm text-gray-500">
                                    تاريخ التسجيل: {new Date(registration.createdAt).toLocaleDateString('en-GB')}
                                  </p>
                                </div>
                                
                                {user?.role === 'admin' && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-green-600">
                                      {selectedCourseForView.price} دج
                                    </span>
                                    
                                    {/* Payment Status Badge */}
                                    {registration.paymentStatus === 'paid' ? (
                                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        مدفوع
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        غير مدفوع
                                      </div>
                                    )}

                                    {/* Payment Button - Only show if not paid */}
                                    {registration.paymentStatus !== 'paid' && (
                                      <Button
                                        onClick={() => handleCoursePayment(registration, selectedCourseForView)}
                                        disabled={processingPayment[registration.id]}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {processingPayment[registration.id] ? (
                                          <>
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-1"></div>
                                            جاري المعالجة...
                                          </>
                                        ) : (
                                          <>
                                            <CreditCard className="w-4 h-4 ml-1" />
                                            دفع الرسوم
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {/* Receipt Button - Only show if paid */}
                                    {registration.paymentStatus === 'paid' && registration.receiptId && (
                                      <Button
                                        onClick={() => generateCoursePaymentReceipt({
                                          receiptId: registration.receiptId,
                                          registrationInfo: registration,
                                          courseInfo: selectedCourseForView,
                                          amount: parseFloat(selectedCourseForView.price) || 0,
                                          date: registration.paidAt ? new Date(registration.paidAt) : new Date(),
                                          adminName: user.firstName + ' ' + user.lastName
                                        })}
                                        size="sm"
                                        variant="outline"
                                        title="عرض الإيصال"
                                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                      >
                                        <FileText className="w-4 h-4 ml-1" />
                                        عرض الإيصال
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">لا توجد تسجيلات لهذه الدورة حتى الآن</p>
                        {user?.role === 'admin' && (
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => setShowManualRegistrationModal(true)}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Users className="w-4 h-4 ml-1" />
                              تسجيل طالب مسجل
                            </Button>
                            <Button
                              onClick={() => setShowNewStudentRegistrationModal(true)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Plus className="w-4 h-4 ml-1" />
                              إضافة طالب جديد
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedCourseForView(null);
                }}
                variant="outline"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Registration Modal */}
      {showManualRegistrationModal && selectedCourseForView && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                تسجيل طالب يدوياً - {selectedCourseForView.title}
              </h2>
              <button
                onClick={() => {
                  setShowManualRegistrationModal(false);
                  setSelectedStudentForRegistration(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {(() => {
                const availableStudents = getAvailableStudentsForRegistration();
                
                return availableStudents.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      اختر طالباً لتسجيله في الدورة ({availableStudents.length} طالب متاح)
                    </p>
                    
                    {availableStudents.map((student: any) => (
                      <Card key={student.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="font-medium">{student.fullName || student.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {student.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {student.phone}
                                  </span>
                                )}
                                {student.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {student.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            onClick={() => handleManualRegistration(student)}
                            disabled={manualRegistrationMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {manualRegistrationMutation.isPending ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-1"></div>
                                جاري التسجيل...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 ml-1" />
                                تسجيل
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">جميع الطلاب مسجلون في هذه الدورة بالفعل</p>
                  </div>
                );
              })()}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                onClick={() => {
                  setShowManualRegistrationModal(false);
                  setSelectedStudentForRegistration(null);
                }}
                variant="outline"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* New Student Registration Modal */}
      {showNewStudentRegistrationModal && selectedCourseForView && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                إضافة طالب جديد
              </h2>
              <button
                onClick={resetNewStudentForm}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                الدورة: {selectedCourseForView.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="block text-sm font-medium mb-1">
                  الاسم الكامل *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={newStudentData.fullName}
                  onChange={(e) => setNewStudentData(prev => ({
                    ...prev,
                    fullName: e.target.value
                  }))}
                  placeholder="أدخل الاسم الكامل للطالب"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="block text-sm font-medium mb-1">
                  رقم الهاتف *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newStudentData.phone}
                  onChange={(e) => setNewStudentData(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  placeholder="أدخل رقم الهاتف"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-1">
                  البريد الإلكتروني (اختياري)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end gap-2">
              <Button
                onClick={resetNewStudentForm}
                variant="outline"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleNewStudentRegistration}
                disabled={manualRegistrationMutation.isPending || !newStudentData.fullName || !newStudentData.phone}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {manualRegistrationMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-1"></div>
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 ml-1" />
                    تسجيل الطالب
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}