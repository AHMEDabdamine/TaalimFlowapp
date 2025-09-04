import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

import { 
  QrCode, 
  Camera, 
  CameraOff, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Printer,
  UserCheck,
  RotateCcw,
  Search,
  Filter,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StudentProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: 'student' | 'child';
  educationLevel?: string;
  selectedSubjects?: string[];
  profilePicture?: string;
  verified: boolean;
  parentName?: string;
  parentPhone?: string;
  attendanceStats: {
    totalClasses: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
  };
  paymentStats: {
    totalDue: number;
    paidCount: number;
    unpaidCount: number;
    totalAmount: number;
  };
  enrolledGroups: Array<{
    id: number;
    name: string;
    educationLevel: string;
    subjectName: string;
    teacherName: string;
  }>;
  recentAttendance: Array<{
    id: number;
    date: string;
    status: string;
    groupName: string;
    notes?: string;
  }>;
  recentPayments: Array<{
    id: number;
    year: number;
    month: number;
    amount?: string;
    isPaid: boolean;
    paidAt?: string;
    notes?: string;
  }>;
}

// Component to show attendance table for a specific group
function GroupAttendanceTable({ 
  groupId, 
  studentId, 
  studentType, 
  studentName,
  userId,
  refreshTrigger,
  groupPaymentStatus
}: { 
  groupId: number;
  studentId: number;
  studentType: 'student' | 'child';
  studentName: string;
  userId: number; // Add userId prop for attendance lookup
  refreshTrigger?: number; // Add optional refresh trigger prop
  groupPaymentStatus: {[groupId: number]: {[month: number]: boolean}}; // Payment status shared from parent
}) {
  const [scheduledDates, setScheduledDates] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [paymentStatusByMonth, setPaymentStatusByMonth] = useState<{[key: string]: any}>({});

  // Group dates by month similar to Groups page
  const monthGroups = scheduledDates.reduce((acc: { [key: string]: string[] }, date: string) => {
    const monthKey = date.substring(0, 7); // YYYY-MM format
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(date);
    return acc;
  }, {});

  const monthKeys = Object.keys(monthGroups).sort().reverse();
  
  // Initialize to current month if available, otherwise start from first month
  useEffect(() => {
    if (monthKeys.length > 0) {
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthIdx = monthKeys.indexOf(currentMonthKey);
      if (currentMonthIdx >= 0) {
        setCurrentMonthIndex(currentMonthIdx);
      } else {
        setCurrentMonthIndex(0); // Default to first available month
      }
    }
  }, [monthKeys.length]);

  const currentMonthKey = monthKeys[currentMonthIndex];
  const currentMonthDates = currentMonthKey ? monthGroups[currentMonthKey].sort() : [];

  const getMonthDisplayName = (monthKey: string) => {
    if (!monthKey || typeof monthKey !== 'string') {
      return '';
    }
    
    const parts = monthKey.split('-');
    if (parts.length !== 2) {
      return monthKey;
    }
    
    const [year, month] = parts;
    
    // Ensure year is exactly 4 digits and month is 1-2 digits
    if (year.length !== 4 || !/^\d{4}$/.test(year)) {
      return monthKey;
    }
    
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex > 11) {
      return monthKey;
    }
    
    const result = `${monthNames[monthIndex]} ${year}`;
    return result;
  };

  const goToPreviousMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthIndex < monthKeys.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  // Add payment status sync effect to ensure attendance table updates immediately
  useEffect(() => {
    // Force refresh payment data when refreshTrigger changes
    if (refreshTrigger && refreshTrigger > 0) {
      
      // Re-fetch payment data for all relevant months immediately
      const currentYear = new Date().getFullYear();
      const monthsToCheck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // All months
      
      const refreshPaymentStatus = async () => {
        try {
          const paymentPromises = monthsToCheck.map(async (month) => {
            const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
            try {
              const response = await fetch(`/api/groups/${groupId}/payment-status/${currentYear}/${month}`, {
                method: 'GET',
                credentials: 'include', // Include session cookies for authentication
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                const paymentData = await response.json();
                const studentPayment = paymentData.find((record: any) => 
                  record.studentId === studentId && record.studentType === studentType
                );
                return { monthKey, payment: studentPayment };
              }
            } catch (error) {
            }
            return { monthKey, payment: null };
          });
          
          const refreshResults = await Promise.all(paymentPromises);
          const refreshedPayments: {[key: string]: any} = {};
          
          refreshResults.forEach(result => {
            if (result.payment) {
              refreshedPayments[result.monthKey] = result.payment;
            }
          });
          
          if (Object.keys(refreshedPayments).length > 0) {
            setPaymentStatusByMonth(prev => ({
              ...prev,
              ...refreshedPayments
            }));
          }
        } catch (error) {
        }
      };
      
      // Delay the refresh slightly to ensure database has been updated
      setTimeout(refreshPaymentStatus, 500);
    }
  }, [refreshTrigger, groupId, studentId, studentType]);

  // Fetch all group data once and on refresh trigger
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch scheduled dates for the group with authentication
        const scheduledResponse = await fetch(`/api/groups/${groupId}/scheduled-dates`, {
          method: 'GET',
          credentials: 'include', // Include session cookies for authentication
          headers: {
            'Content-Type': 'application/json'
          }
        });
        let dates: string[] = [];
        if (scheduledResponse.ok) {
          const scheduledData = await scheduledResponse.json();
          dates = scheduledData.dates || [];
          setScheduledDates(dates);
        }

        // Fetch attendance history for the group with authentication
        const attendanceResponse = await fetch(`/api/groups/${groupId}/attendance-history`, {
          method: 'GET',
          credentials: 'include', // Include session cookies for authentication
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          // Store ALL attendance history (same as Groups.tsx) - no filtering at fetch time
          // The frontend will filter by userId when needed (same logic as Groups.tsx)
          setAttendanceHistory(attendanceData);
        }

        // Only fetch payment data if we have dates
        if (dates.length > 0) {
          // Create month groups from dates
          const monthGroups = dates.reduce((acc: { [key: string]: string[] }, date: string) => {
            const monthKey = date.substring(0, 7); // YYYY-MM format
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(date);
            return acc;
          }, {});

          // Fetch payment status for all months that have scheduled dates
          const paymentPromises = Object.keys(monthGroups).map(async (monthKey) => {
            const [year, month] = monthKey.split('-');
            const response = await fetch(`/api/groups/${groupId}/payment-status/${year}/${month}`, {
              method: 'GET',
              credentials: 'include', // Include session cookies for authentication
              headers: {
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const paymentData = await response.json();
              const studentPayment = paymentData.find((record: any) => 
                record.userId === userId && record.studentType === studentType
              );
              return { monthKey, payment: studentPayment };
            }
            return { monthKey, payment: null };
          });
          
          const paymentResults = await Promise.all(paymentPromises);
          const paymentsByMonth: {[key: string]: any} = {};
          paymentResults.forEach(result => {
            paymentsByMonth[result.monthKey] = result.payment;
          });
          setPaymentStatusByMonth(paymentsByMonth);
          
          // Set current payment status for the selected month
          const currentDate = new Date();
          const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          setPaymentStatus(paymentsByMonth[currentMonthKey]);
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId, studentId, studentType, refreshTrigger]); // Add refreshTrigger to dependency array

  // Update payment status when month changes
  useEffect(() => {
    if (currentMonthKey && paymentStatusByMonth[currentMonthKey] !== undefined) {
      setPaymentStatus(paymentStatusByMonth[currentMonthKey]);
    }
  }, [currentMonthKey, paymentStatusByMonth]);

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات الحضور...</p>
      </div>
    );
  }

  if (scheduledDates.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400">لا توجد مواعيد مجدولة لهذه المجموعة</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">جدول الحضور الشهري - المواعيد المجدولة</h4>
        
        {monthKeys.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-300">
                {currentMonthKey ? getMonthDisplayName(currentMonthKey) : ''}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentMonthIndex + 1} / {monthKeys.length}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={currentMonthIndex === monthKeys.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {monthKeys.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600" dir="rtl">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-right font-medium dark:text-gray-200">اسم الطالب</th>
                <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium min-w-[80px] dark:text-gray-200">حالة الدفع</th>
                {currentMonthDates.map((date) => (
                  <th key={date} className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium min-w-[80px] dark:text-gray-200">
                    <div className="text-xs">
                      {new Date(date).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'numeric'
                      })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">
                  <div className="font-medium dark:text-gray-200">{studentName}</div>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    {(() => {
                      // Extract month number from currentMonthKey (YYYY-MM format)
                      const currentMonth = parseInt(currentMonthKey.split('-')[1]);
                      const currentYear = parseInt(currentMonthKey.split('-')[0]);
                      
                      // Check payment status by filtering payment records by year, month, and student
                      let isMonthPaid = false;
                      
                      // Look up payment record directly from paymentStatusByMonth with year/month key
                      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
                      const paymentRecord = paymentStatusByMonth[monthKey];
                      isMonthPaid = paymentRecord ? paymentRecord.isPaid : false;
                      
                      
                      return (
                        <>
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            isMonthPaid
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {isMonthPaid ? '✅' : '❌'}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {isMonthPaid ? 'مدفوع' : 'غير مدفوع'}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </td>
                {currentMonthDates.map((date) => {
                  // Find attendance record by both userId and date - same logic as Groups.tsx
                  const attendanceRecord = attendanceHistory.find((record: any) => 
                    record.userId === userId &&
                    record.attendanceDate?.split('T')[0] === date
                  );
                  
                  return (
                    <td key={date} className="border border-gray-300 dark:border-gray-600 p-1 text-center">
                      <div className={`w-8 h-8 rounded text-xs font-bold mx-auto flex items-center justify-center ${
                        attendanceRecord?.status === 'present' 
                          ? 'bg-green-500 text-white' 
                          : attendanceRecord?.status === 'absent'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}>
                        {attendanceRecord?.status === 'present' ? '✓' : 
                         attendanceRecord?.status === 'absent' ? '✗' : '?'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {/* Monthly Statistics */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
              <h5 className="font-medium text-green-800 dark:text-green-300">حضور الشهر</h5>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {attendanceHistory.filter(r => 
                  r.userId === userId &&
                  r.status === 'present' && 
                  currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                ).length}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
              <h5 className="font-medium text-red-800 dark:text-red-300">غياب الشهر</h5>
              <p className="text-xl font-bold text-red-900 dark:text-red-100">
                {attendanceHistory.filter(r => 
                  r.userId === userId &&
                  r.status === 'absent' && 
                  currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                ).length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
              <h5 className="font-medium text-blue-800 dark:text-blue-300">نسبة حضور الشهر</h5>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {(() => {
                  const monthRecords = attendanceHistory.filter(r => 
                    r.userId === userId &&
                    currentMonthDates.includes(r.attendanceDate?.split('T')[0])
                  );
                  const presentCount = monthRecords.filter(r => r.status === 'present').length;
                  return monthRecords.length > 0 ? Math.round((presentCount / monthRecords.length) * 100) : 0;
                })()}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">لا توجد مواعيد مجدولة متاحة</p>
        </div>
      )}
    </div>
  );
}

const months = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

function DesktopQRScanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  
  // Enhanced payment form state for ticket printer
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Group-based payment state
  const [selectedGroups, setSelectedGroups] = useState<{[key: number]: {months: number[], groupName: string, subjectName: string}}>({});
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Unified payment status for all groups and months - ✅ FIX: Use year-month keys
  const [groupPaymentStatus, setGroupPaymentStatus] = useState<{[groupId: number]: {[yearMonth: string]: boolean}}>({});
  
  // Ticket state
  const [generatedTicket, setGeneratedTicket] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);

  // Refresh trigger for attendance tables
  const [attendanceRefreshTrigger, setAttendanceRefreshTrigger] = useState(0);

  // Collapsible state for tables
  const [isGroupsCollapsed, setIsGroupsCollapsed] = useState(true);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(true);
  
  // Individual amounts for each group - key format: "groupId"
  const [groupAmounts, setGroupAmounts] = useState<{[groupId: string]: string}>({});


  // Check if user has permission to use desktop scanner
  if (!user || !['admin', 'teacher'].includes(user.role)) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            غير مسموح لك باستخدام الماسح المكتبي. يجب أن تكون مدير أو معلم.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Search and filter functions
  const handleSearchWithFilters = async (educationLevel?: string, role?: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (educationLevel !== undefined) params.append('educationLevel', educationLevel);
      else if (selectedEducationLevel) params.append('educationLevel', selectedEducationLevel);
      if (role !== undefined) params.append('role', role);
      else if (selectedRole) params.append('role', selectedRole);
      
      // Use new QR scanner endpoint that searches both students and children
      const response = await fetch(`/api/qr-scanner/search?${params.toString()}`);

      if (response.ok) {
        const results = await response.json();
        // The results already include both students and children
        setSearchResults(results);
        setShowStudentList(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "خطأ في البحث",
          description: errorData.message || "حدث خطأ أثناء البحث",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "خطأ في البحث",
        description: "حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedEducationLevel) params.append('educationLevel', selectedEducationLevel);
      if (selectedRole) params.append('role', selectedRole);
      
      // Use new QR scanner endpoint that searches both students and children
      const response = await fetch(`/api/qr-scanner/search?${params.toString()}`);

      if (response.ok) {
        const results = await response.json();
        // The results already include both students and children
        setSearchResults(results);
        setShowStudentList(true);
      } else {
        const errorData = await response.json();
        toast({
          title: "خطأ في البحث",
          description: errorData.error || "فشل في البحث عن الطلاب",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الشبكة",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Load all students on component mount
  useEffect(() => {
    if (user && ['admin', 'teacher'].includes(user.role)) {
      handleSearch();
    }
  }, [user]);

  const handleSelectStudent = async (student: any) => {
    setIsProcessing(true);
    try {
      
      // Check if this is a child or a regular student
      if (student.type === 'child') {
        // Direct child selection - create child QR code
        const response = await fetch('/api/scan-student-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            qrData: `child:${student.id}:${user?.schoolId}:verified`
          })
        });
        
        if (response.ok) {
          const profileData = await response.json();
          setScannedProfile(profileData);
          setShowStudentList(false);
          toast({
            title: "تم تحميل ملف الطفل",
            description: `تم تحميل ملف ${profileData.name} بنجاح`
          });
          return;
        } else {
          const errorData = await response.json();
          toast({
            title: "خطأ في تحميل ملف الطفل",
            description: errorData.error || "فشل في تحميل ملف الطفل",
            variant: "destructive"
          });
          return;
        }
      } else if (student.role === 'user') {
        // Parent user - get their children
        const childrenResponse = await fetch(`/api/children?parentId=${student.id}`);
        if (childrenResponse.ok) {
          const children = await childrenResponse.json();
          if (children.length > 0) {
            // For now, select the first child - in a real implementation you'd show a selection dialog
            const child = children[0];
            const response = await fetch('/api/scan-student-qr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                qrData: `child:${child.id}:${user?.schoolId}:verified`
              })
            });
            
            if (response.ok) {
              const profileData = await response.json();
              setScannedProfile(profileData);
              setShowStudentList(false);
              toast({
                title: "تم تحميل ملف الطفل",
                description: `تم تحميل ملف ${profileData.name} بنجاح`
              });
              return;
            }
          } else {
            toast({
              title: "لا توجد أطفال",
              description: "لا يوجد أطفال مسجلين لهذا الولي",
              variant: "destructive"
            });
            return;
          }
        }
      } else {
        // Regular student selection
        const response = await fetch('/api/scan-student-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            qrData: `student:${student.id}:${user?.schoolId}:verified`
          })
        });

        if (response.ok) {
          const profileData = await response.json();
          setScannedProfile(profileData);
          setShowStudentList(false);
          toast({
            title: "تم تحميل ملف الطالب",
            description: `تم تحميل ملف ${profileData.name} بنجاح`
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "خطأ في تحميل الملف",
            description: errorData.error || "فشل في تحميل ملف الطالب",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "خطأ في الشبكة",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanup = useCallback(() => {
    setIsScanning(false);
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
      }
    }
    // Also stop all video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    try {
      setError(null);
      setScannedProfile(null);
      setIsScanning(true);

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('متصفحك لا يدعم استخدام الكاميرا');
        setIsScanning(false);
        return;
      }

      // Initialize code reader
      codeReaderRef.current = new BrowserQRCodeReader();

      // Get video devices
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        console.log('Available cameras:', videoInputDevices);
        setDevices(videoInputDevices);

        if (videoInputDevices.length === 0) {
          setError('لم يتم العثور على كاميرا في جهازك');
          setIsScanning(false);
          return;
        }

        // Try to use the first available camera
        const deviceId = videoInputDevices[0].deviceId;
        setSelectedDeviceId(deviceId);
        await startCamera(deviceId);

      } catch (deviceErr) {
        console.error('Error listing devices:', deviceErr);
        setError('خطأ في العثور على الكاميرات المتاحة');
        setIsScanning(false);
      }

    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('خطأ في تهيئة الماسح الضوئي');
      setIsScanning(false);
    }
  }, []);

  const startCamera = useCallback(async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) {
      setError('خطأ في تهيئة الكاميرا');
      setIsScanning(false);
      return;
    }

    try {
      console.log('Starting camera with device:', deviceId);
      
      const videoElement = videoRef.current;
      
      // Manually get MediaStream first
      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Use back camera if available
        }
      };
      
      console.log('Getting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set the stream to video element
      videoElement.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        videoElement.addEventListener('loadedmetadata', resolve, { once: true });
        videoElement.addEventListener('error', reject, { once: true });
        
        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Video loading timeout')), 5000);
      });
      
      console.log('Video loaded, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      
      // Now start QR code scanning using ZXing on the video element
      const scanningControls = await codeReaderRef.current.decodeFromVideoElement(
        videoElement,
        (result, error) => {
          if (result) {
            console.log('🎯 QR code detected successfully:', result.getText());
            console.log('QR code format:', result.getBarcodeFormat());
            console.log('QR code raw bytes:', result.getRawBytes());
            handleQRScan(result.getText());
          }
          
          if (error) {
            // Only log non-NotFoundException errors, but still log them for debugging
            if (error.name !== 'NotFoundException') {
              console.error('❌ Decode error:', error.name, error.message);
            } else {
              // Occasionally log NotFoundException to confirm scanning is active
              if (Math.random() < 0.01) { // Log 1% of the time
                console.log('🔍 Scanning active - no QR code found in frame');
              }
            }
          }
        }
      );
      
      // Store both stream and scanning controls for cleanup
      controlsRef.current = {
        stop: () => {
          scanningControls.stop();
          stream.getTracks().forEach(track => track.stop());
          videoElement.srcObject = null;
        }
      };

      console.log('Camera and QR scanning started successfully');

    } catch (err: any) {
      console.error('Error starting camera:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('يرجى السماح بالوصول للكاميرا');
      } else if (err.name === 'NotFoundError') {
        setError('لم يتم العثور على الكاميرا المحددة');
      } else if (err.name === 'NotReadableError') {
        setError('الكاميرا مستخدمة من تطبيق آخر');
      } else if (err.message === 'Video loading timeout') {
        setError('انتهت مهلة تحميل الفيديو. جرب كاميرا أخرى');
      } else {
        setError('خطأ في تشغيل الكاميرا: ' + (err.message || 'خطأ غير معروف'));
      }
      setIsScanning(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    await initializeScanner();
  }, [initializeScanner]);

  const stopScanning = useCallback(() => {
    console.log('Stopping QR scanner...');
    cleanup();
  }, [cleanup]);

  const switchCamera = useCallback(async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(nextDeviceId);
    cleanup();
    await startCamera(nextDeviceId);
  }, [devices, selectedDeviceId, cleanup, startCamera]);

  const retry = useCallback(() => {
    cleanup();
    initializeScanner();
  }, [cleanup, initializeScanner]);

  const handleQRScan = async (qrData: string) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Processing QR data:', qrData);
      console.log('🔄 QR data length:', qrData.length);
      console.log('🔄 QR data first 100 chars:', qrData.substring(0, 100));
      
      const response = await fetch('/api/scan-student-qr', {
        method: 'POST',
        credentials: 'include', // Include session cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData })
      });

      console.log('📡 API response status:', response.status);
      console.log('📡 API response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error response:', error);
        throw new Error(error.error || 'خطأ في مسح الرمز');
      }

      const profile = await response.json();
      console.log('✅ Profile received:', profile);
      console.log('✅ Profile enrolled groups:', profile.enrolledGroups);
      
      // CRITICAL DEBUG: Check the actual enrolled groups data structure
      if (profile.enrolledGroups && profile.enrolledGroups.length > 0) {
        profile.enrolledGroups.forEach((group: any, index: number) => {
          console.log(`✅ Enrolled Group ${index + 1}:`, {
            id: group.id,
            name: group.name,
            subjectName: group.subjectName,
            educationLevel: group.educationLevel,
            teacherName: group.teacherName
          });
        });
      } else {
        console.error('❌ NO ENROLLED GROUPS FOUND - This is the problem!');
      }
      
      // Fetch payment data for each group if groups exist
      if (profile.enrolledGroups && profile.enrolledGroups.length > 0) {
        const groupsWithPayments = await Promise.all(
          profile.enrolledGroups.map(async (group: any) => {
            try {
              const paymentResponse = await fetch('/api/scan-student-qr/get-payments', {
                method: 'POST',
                credentials: 'include', // Include session cookies for authentication
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  studentId: profile.id,
                  studentType: profile.type,
                  groupId: group.id,
                  year: 2025 // Current year
                })
              });
              
              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                return {
                  ...group,
                  paidMonths: paymentData.paidMonths || []
                };
              }
            } catch (error) {
              console.error('Error fetching payments for group', group.id, error);
            }
            
            return {
              ...group,
              paidMonths: []
            };
          })
        );
        
        profile.enrolledGroups = groupsWithPayments;
        setAvailableGroups(groupsWithPayments);
        console.log('✅ Updated profile with payment data:', profile.enrolledGroups);
      } else {
        console.log('⚠️ No enrolled groups to fetch payments for');
        setAvailableGroups([]); // Set empty array for payment form
      }
      
      console.log('✅ Final profile being set to scannedProfile state:', JSON.stringify(profile, null, 2));
      setScannedProfile(profile);
      stopScanning();
      
      toast({
        title: "تم مسح الرمز بنجاح",
        description: `تم العثور على الطالب: ${profile.name}`
      });
      
    } catch (error: any) {
      console.error('❌ QR scan error:', error);
      setError(error.message || 'خطأ في مسح الرمز');
      stopScanning();
      
      // Show error toast
      toast({
        title: "خطأ في مسح الرمز",
        description: error.message || 'خطأ في مسح الرمز',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAttendance = async (status: 'present' | 'absent' | 'late' | 'excused') => {
    if (!scannedProfile) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/scan-student-qr/mark-attendance', {
        method: 'POST',
        credentials: 'include', // Include session cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: scannedProfile.id,
          studentType: scannedProfile.type,
          status
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل الحضور');
      }

      const result = await response.json();
      toast({
        title: "تم تسجيل الحضور",
        description: result.message
      });
      
      // Refresh the profile to show updated attendance
      await handleQRScan(`${scannedProfile.type}:${scannedProfile.id}:${user?.schoolId}:verified`);
      
    } catch (error: any) {
      console.error('Attendance error:', error);
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!scannedProfile || !paymentAmount) return;

    try {
      setIsProcessing(true);
      const response = await fetch('/api/scan-student-qr/record-payment', {
        method: 'POST',
        credentials: 'include', // Include session cookies for authentication
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: scannedProfile.id,
          studentType: scannedProfile.type,
          amount: parseFloat(paymentAmount),
          paymentMethod: 'cash',
          notes: paymentNotes,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'خطأ في تسجيل الدفعة');
      }

      const result = await response.json();
      toast({
        title: "تم تسجيل الدفعة",
        description: result.message
      });
      
      // Reset payment form
      setPaymentAmount('');
      setPaymentNotes('');
      
      // Refresh the profile to show updated payments
      await handleQRScan(`${scannedProfile.type}:${scannedProfile.id}:${user?.schoolId}:verified`);
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "خطأ في تسجيل الدفعة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: 'حاضر', className: 'bg-green-100 text-green-800' },
      absent: { label: 'غائب', className: 'bg-red-100 text-red-800' },
      late: { label: 'متأخر', className: 'bg-yellow-100 text-yellow-800' },
      excused: { label: 'عذر', className: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Fetch student's enrolled groups when profile is loaded
  useEffect(() => {
    if (scannedProfile && scannedProfile.id) {
      fetchStudentGroups();
    }
  }, [scannedProfile]);

  const fetchStudentGroups = async () => {
    if (!scannedProfile) return;
    
    setLoadingGroups(true);
    try {
      console.log('🔄 Fetching groups and payments for student:', scannedProfile.id, 'type:', scannedProfile.type);
      
      // First fetch groups with authentication
      const groupsResponse = await fetch(`/api/students/${scannedProfile.id}/groups?type=${scannedProfile.type}`, {
        method: 'GET',
        credentials: 'include', // Include session cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('🔄 Groups API response status:', groupsResponse.status);
      
      let groups = [];
      if (groupsResponse.ok) {
        groups = await groupsResponse.json();
        console.log('✅ Fetched student groups from API:', groups);
      } else {
        // Use enrolled groups from profile as fallback
        if (scannedProfile.enrolledGroups && scannedProfile.enrolledGroups.length > 0) {
          console.log('🔄 Using enrolled groups from profile:', scannedProfile.enrolledGroups);
          groups = scannedProfile.enrolledGroups;
        } else {
          console.log('⚠️ No groups available');
          setAvailableGroups([]);
          return;
        }
      }

      // Now fetch comprehensive payment data for each group using unified API approach
      const unifiedPaymentStatus: {[groupId: number]: {[month: number]: boolean}} = {};
      const groupsWithPayments = await Promise.all(
        groups.map(async (group: any) => {
          try {
            console.log(`🔄 Fetching unified payment status for group ${group.id}`);
            
            // Use the same API that attendance table uses for consistency
            // ✅ FIX: Use academic year months instead of just current year
            const academicMonths = generateAcademicYearMonths(8, 2025);
            const paymentPromises = [];
            
            // Check payment status for all academic year months with correct years
            for (const {month, year} of academicMonths) {
              const promise = fetch(`/api/groups/${group.id}/payment-status/${year}/${month}`, {
                method: 'GET',
                credentials: 'include', // Include session cookies for authentication
                headers: {
                  'Content-Type': 'application/json'
                }
              })
                .then(response => {
                  if (response.status === 401) {
                    console.log(`🔐 Authentication required for month ${month} payment status`);
                    return [];
                  }
                  return response.ok ? response.json() : [];
                })
                .then(paymentData => {
                  // **FIX: Check payment status using correct ID logic**
                  // For direct students: look for scannedProfile.id in studentId
                  // For children: look for parent's userId or child's studentId 
                  const studentPayment = paymentData.find((record: any) => {
                    if (scannedProfile.type === "student") {
                      // Direct student: match by studentId (which should equal userId)
                      return record.studentId === scannedProfile.id;
                    } else if (scannedProfile.type === "child") {
                      // Child: match by studentId (child ID) - group payment API returns student records
                      return record.studentId === scannedProfile.id && record.studentType === "child";
                    }
                    return record.studentId === scannedProfile.id;
                  });
                  const isPaid = studentPayment?.isPaid || false;
                  if (isPaid) {
                    console.log(`✅ Month ${month} confirmed as PAID from API for ${scannedProfile.type} ${scannedProfile.id}`);
                  }
                  return { month, isPaid };
                })
                .catch((error) => {
                  console.error(`❌ Error fetching month ${month} payment status:`, error);
                  return { month, isPaid: false };
                });
              
              paymentPromises.push(promise);
            }

            const paymentResults = await Promise.all(paymentPromises);
            
            // Build payment status map for this group - ✅ FIX: Use year-month keys
            const groupPaymentMap: {[yearMonth: string]: boolean} = {};
            const paidMonths: {month: number, year: number}[] = [];
            
            paymentResults.forEach((result, index) => {
              const academicMonth = academicMonths[index];
              const yearMonthKey = `${academicMonth.year}-${academicMonth.month}`;
              groupPaymentMap[yearMonthKey] = result.isPaid;
              if (result.isPaid) {
                paidMonths.push({month: academicMonth.month, year: academicMonth.year});
              }
            });

            unifiedPaymentStatus[group.id] = groupPaymentMap;
            
            console.log(`✅ Group ${group.id} unified payment status:`, groupPaymentMap);
            console.log(`✅ Paid months for group ${group.id}:`, paidMonths);

            return {
              ...group,
              paidMonths
            };
          } catch (error) {
            console.error(`❌ Error fetching unified payments for group ${group.id}:`, error);
            unifiedPaymentStatus[group.id] = {};
            return {
              ...group,
              paidMonths: []
            };
          }
        })
      );
      
      // Update both states: availableGroups for the payment form and unified status for sync
      setAvailableGroups(groupsWithPayments);
      setGroupPaymentStatus(unifiedPaymentStatus);
      
      console.log('✅ Final groups with unified payment data:', groupsWithPayments);
      console.log('✅ Unified payment status map:', unifiedPaymentStatus);
      
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      // Fallback to enrolled groups from the profile
      if (scannedProfile.enrolledGroups && scannedProfile.enrolledGroups.length > 0) {
        console.log('🔄 Fallback to enrolled groups:', scannedProfile.enrolledGroups);
        const groupsWithEmptyPayments = scannedProfile.enrolledGroups.map(group => ({
          ...group,
          paidMonths: []
        }));
        setAvailableGroups(groupsWithEmptyPayments);
      } else {
        console.log('⚠️ No enrolled groups available as fallback');
        setAvailableGroups([]);
      }
    } finally {
      setLoadingGroups(false);
    }
  };

  // Smart refresh function that preserves local payment updates while fetching fresh API data
  const smartRefreshPaymentStatus = async () => {
    if (!scannedProfile) return;
    
    try {
      console.log('🔄 Smart refresh: fetching fresh payment data while preserving local updates...');
      
      // Store current payment status to preserve local updates
      const currentPaymentStatus = { ...groupPaymentStatus };
      console.log('💾 Preserved current payment status:', currentPaymentStatus);
      
      // Fetch fresh groups and payment data
      const groupsResponse = await fetch(`/api/students/${scannedProfile.id}/groups?type=${scannedProfile.type}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!groupsResponse.ok) {
        console.log('⚠️ API refresh failed, keeping current state');
        return;
      }
      
      const groups = await groupsResponse.json();
      console.log('✅ Fresh groups fetched for smart refresh:', groups);
      
      // Fetch fresh payment data for each group
      const freshPaymentStatus: {[groupId: number]: {[month: number]: boolean}} = {};
      const academicMonths = generateAcademicYearMonths(8, 2025); // Use academic year logic
      
      await Promise.all(
        groups.map(async (group: any) => {
          try {
            const paymentPromises = [];
            
            // Use academic year months instead of hardcoded current year
            for (const {month, year} of academicMonths) {
              const promise = fetch(`/api/groups/${group.id}/payment-status/${year}/${month}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
                .then(response => response.ok ? response.json() : [])
                .then(paymentData => {
                  const studentPayment = paymentData.find((record: any) => 
                    record.studentId === scannedProfile.id && record.studentType === scannedProfile.type
                  );
                  console.log(`🔍 Smart refresh check - Group ${group.id} Month ${month} Year ${year}:`, 
                    studentPayment?.isPaid ? 'PAID ✅' : 'NOT PAID ❌'
                  );
                  return { month, isPaid: studentPayment?.isPaid || false };
                })
                .catch(() => ({ month, isPaid: false }));
              
              paymentPromises.push(promise);
            }
            
            const paymentResults = await Promise.all(paymentPromises);
            const groupPaymentMap: {[month: number]: boolean} = {};
            
            paymentResults.forEach(result => {
              groupPaymentMap[result.month] = result.isPaid;
            });
            
            freshPaymentStatus[group.id] = groupPaymentMap;
            
          } catch (error) {
            console.error(`❌ Smart refresh failed for group ${group.id}:`, error);
            freshPaymentStatus[group.id] = {};
          }
        })
      );
      
      console.log('📊 Fresh payment status from API:', freshPaymentStatus);
      
      // Intelligent merge: if either current OR fresh says paid, then it's paid
      const mergedPaymentStatus: {[groupId: number]: {[month: number]: boolean}} = {};
      
      // Start with fresh data
      Object.keys(freshPaymentStatus).forEach(groupIdStr => {
        const groupId = parseInt(groupIdStr);
        mergedPaymentStatus[groupId] = { ...freshPaymentStatus[groupId] };
      });
      
      // Merge in current local updates (local updates take precedence for paid status)
      Object.keys(currentPaymentStatus).forEach(groupIdStr => {
        const groupId = parseInt(groupIdStr);
        if (!mergedPaymentStatus[groupId]) mergedPaymentStatus[groupId] = {};
        
        Object.keys(currentPaymentStatus[groupId]).forEach(monthStr => {
          const month = parseInt(monthStr);
          const currentIsPaid = currentPaymentStatus[groupId][month];
          const freshIsPaid = mergedPaymentStatus[groupId][month] || false;
          
          // If either says paid, then it's paid (OR logic for maximum data retention)
          mergedPaymentStatus[groupId][month] = currentIsPaid || freshIsPaid;
          
          if (currentIsPaid && !freshIsPaid) {
            console.log(`🔄 Preserving local update: Group ${groupId} Month ${month} remains PAID`);
          } else if (!currentIsPaid && freshIsPaid) {
            console.log(`✅ API confirmed: Group ${groupId} Month ${month} is PAID`);
          }
        });
      });
      
      console.log('🎯 Final merged payment status:', mergedPaymentStatus);
      
      // Update state with merged result
      setGroupPaymentStatus(mergedPaymentStatus);
      setAvailableGroups(groups.map((group: any) => ({
        ...group,
        paidMonths: Object.entries(mergedPaymentStatus[group.id] || {})
          .filter(([_, isPaid]) => isPaid)
          .map(([month, _]) => parseInt(month))
      })));
      
      console.log('✅ Smart refresh completed with merged data');
      
    } catch (error) {
      console.error('❌ Smart refresh failed:', error);
      // Keep current state on error
    }
  };

  const handleGroupSelection = (groupId: number, selected: boolean) => {
    if (selected) {
      const group = availableGroups.find(g => g.id === groupId);
      if (group) {
        setSelectedGroups(prev => ({
          ...prev,
          [groupId]: {
            months: [],
            groupName: group.name,
            subjectName: group.subjectName || group.nameAr
          }
        }));
      }
    } else {
      setSelectedGroups(prev => {
        const newState = { ...prev };
        delete newState[groupId];
        return newState;
      });
    }
  };

  const handleMonthToggle = (groupId: number, month: number) => {
    setSelectedGroups(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        months: prev[groupId].months.includes(month)
          ? prev[groupId].months.filter(m => m !== month)
          : [...prev[groupId].months, month]
      }
    }));
  };



  const generatePaymentTicket = async () => {
    // Prevent multiple submissions
    if (isGeneratingTicket) {
      console.log('❌ Already generating ticket, ignoring duplicate request');
      return;
    }

    console.log('=== PAYMENT TICKET GENERATION START ===');
    console.log('Scanned Profile:', scannedProfile);
    console.log('Payment Amount:', paymentAmount);
    console.log('Selected Groups:', selectedGroups);
    console.log('User Role:', user?.role);
    
    // Validate that all selected groups have amounts entered
    const hasEmptyAmounts = Object.keys(selectedGroups).some(groupId => {
      const hasMonths = selectedGroups[parseInt(groupId)].months.length > 0;
      const hasAmount = groupAmounts[groupId] && parseFloat(groupAmounts[groupId]) > 0;
      return hasMonths && !hasAmount;
    });
    
    if (!scannedProfile || Object.keys(selectedGroups).length === 0 || hasEmptyAmounts) {
      console.log('❌ Validation failed: Missing basic requirements');
      toast({
        title: "معلومات ناقصة",
        description: hasEmptyAmounts ? "يرجى إدخال المبلغ لجميع المجموعات المحددة" : "يرجى تحديد المجموعات والأشهر والمبلغ",
        variant: "destructive"
      });
      return;
    }

    // Validate that at least one month is selected
    const hasSelectedMonths = Object.values(selectedGroups).some(group => group.months.length > 0);
    console.log('Has selected months:', hasSelectedMonths);
    
    if (!hasSelectedMonths) {
      console.log('❌ Validation failed: No months selected');
      toast({
        title: "معلومات ناقصة", 
        description: "يرجى تحديد الأشهر المراد دفعها",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingTicket(true);
      setIsProcessing(true);

      // Calculate total amount from all group amounts
      const totalAmount = Object.values(groupAmounts).reduce((total, amount) => {
        return total + (parseFloat(amount) || 0);
      }, 0);

      // Create transactions for each selected group/month combination
      const transactions = [];
      const academicMonths = generateAcademicYearMonths(8, 2025); // Get correct year for each month
      
      for (const [groupId, groupData] of Object.entries(selectedGroups)) {
        // Get the total amount entered for this group
        const groupTotalAmount = parseFloat(groupAmounts[groupId]) || 0;
        // Calculate per-month amount (divide by number of months selected)
        const perMonthAmount = groupTotalAmount / groupData.months.length;
        
        for (const month of groupData.months) {
          // Find the correct year for this month in the academic year
          const academicMonth = academicMonths.find(am => am.month === month);
          const correctYear = academicMonth ? academicMonth.year : new Date().getFullYear();
          
          const transaction = {
            studentId: scannedProfile.id,
            studentType: scannedProfile.type,
            groupId: parseInt(groupId),
            amount: Math.round(perMonthAmount), // Each month gets portion of group amount
            paymentMethod: 'cash', // Always cash
            notes: paymentNotes,
            month,
            year: correctYear // Use correct academic year (2025 for Aug-Dec, 2026 for Jan-July)
          };
          transactions.push(transaction);
        }
      }

      console.log('Creating payment records and receipt:', transactions);
      
      // 🆕 SAVE PAYMENTS TO DATABASE
      let result = { receiptId: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}` };
      
      try {
        console.log('🔄 Attempting to save payment records to database...');
        const paymentResponse = await fetch('/api/scan-student-qr/create-ticket-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            transactions,
            totalAmount: totalAmount, // Use calculated total amount
            receiptId: result.receiptId,
            studentName: scannedProfile.name
          })
        });

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log('✅ Payment records saved successfully:', paymentData);
          result = paymentData;
        } else {
          const errorText = await paymentResponse.text();
          console.log('⚠️ Database payment save failed, using local receipt:', errorText);
          // Continue with local receipt even if database save fails
        }
      } catch (dbError) {
        console.error('⚠️ Database error, using local receipt:', dbError);
        // Continue with local receipt even if database connection fails
      }

      // Generate ticket data
      const ticket = {
        receiptId: result.receiptId || `REC-${Date.now()}`,
        studentName: scannedProfile.name,
        paymentDate: new Date().toLocaleDateString('en-US'),
        amount: totalAmount, // Show total calculated amount on receipt
        groups: Object.entries(selectedGroups).map(([groupId, groupData]) => ({
          groupName: groupData.groupName,
          subjectName: groupData.subjectName,
          months: groupData.months.map(m => getMonthName(m)),
          groupAmount: parseFloat(groupAmounts[groupId]) || 0, // Individual group amount
          perMonthAmount: (parseFloat(groupAmounts[groupId]) || 0) / groupData.months.length // Amount per month
        }))
      };

      // 🆕 AUTOMATIC GAIN ENTRIES: Create separate financial gain entry for each month
      try {
        console.log('🔄 Creating automatic gain entries for receipt:', ticket.receiptId);
        
        // Create a separate financial entry for each month selected
        const gainEntryPromises = [];
        
        for (const [groupId, groupData] of Object.entries(selectedGroups)) {
          // Get the total amount entered for this group and calculate per-month amount
          const groupTotalAmount = parseFloat(groupAmounts[groupId]) || 0;
          const perMonthAmount = groupTotalAmount / groupData.months.length;
          
          for (const month of groupData.months) {
            // Find the correct year for this month
            const academicMonth = academicMonths.find(am => am.month === month);
            const correctYear = academicMonth ? academicMonth.year : new Date().getFullYear();
            
            const monthName = getMonthName(month);
            const paymentDetails = `المجموعة : ${groupData.groupName} - ${monthName} ${correctYear}`;
            
            const gainEntryPromise = fetch('/api/gain-loss-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                type: 'gain',
                amount: perMonthAmount.toFixed(2), // Amount per month (portion of group total)
                remarks: `إيصال دفع رقم: ${ticket.receiptId} - الطالب: ${scannedProfile.name} - ${paymentDetails}`,
                year: correctYear,
                month: month,
                receiptId: ticket.receiptId // Add receipt ID for deletion tracking
              })
            });
            
            gainEntryPromises.push(gainEntryPromise);
          }
        }

        // Execute all gain entry creations
        const gainResponses = await Promise.allSettled(gainEntryPromises);
        
        console.log('🔍 Financial entries responses:', gainResponses.map(result => ({
          status: result.status,
          ok: result.status === 'fulfilled' ? result.value.ok : false,
          statusCode: result.status === 'fulfilled' ? result.value.status : 'N/A',
          error: result.status === 'rejected' ? result.reason : null
        })));
        
        const successfulEntries = gainResponses.filter(result => 
          result.status === 'fulfilled' && result.value.ok
        ).length;
        
        if (successfulEntries > 0) {
          console.log(`✅ Created ${successfulEntries} automatic gain entries successfully`);
          // Invalidate gain-loss cache to refresh the data
          queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
          toast({
            title: "تم إنشاء إيصال الدفع بنجاح",
            description: `إيصال رقم: ${ticket.receiptId} - تم إضافة ${successfulEntries} قيد للأرباح تلقائياً`
          });
        } else {
          console.error('❌ Failed to create any automatic gain entries');
          toast({
            title: "تم إنشاء إيصال الدفع بنجاح",
            description: `إيصال رقم: ${ticket.receiptId} - لإضافة المبلغ للأرباح، افتح حاسبة الأرباح والخسائر وأضف المبلغ يدوياً`
          });
        }
      } catch (gainError) {
        console.error('❌ Error creating automatic gain entries:', gainError);
        toast({
          title: "تم إنشاء إيصال الدفع بنجاح",
          description: `إيصال رقم: ${ticket.receiptId} - لإضافة المبلغ للأرباح، افتح حاسبة الأرباح والخسائر`
        });
      }

      setGeneratedTicket(ticket);
      setShowTicket(true);

      // 🔄 SMART STATE UPDATE: Update payment status without losing existing data
      console.log('🔄 Updating payment status with smart merge strategy...');
      try {
        // First, immediately update local state with the new payment information
        const paymentDetails = Object.entries(selectedGroups);
        console.log('🔄 Immediately updating local payment state before API refresh...');
        
        setGroupPaymentStatus(prev => {
          const updated = { ...prev };
          // Update all groups that were involved in this payment - ✅ FIX: Use year-month keys
          const academicMonths = generateAcademicYearMonths(8, 2025);
          Object.entries(selectedGroups).forEach(([groupIdStr, groupData]) => {
            const groupId = parseInt(groupIdStr);
            if (!updated[groupId]) updated[groupId] = {};
            groupData.months.forEach(month => {
              const academicMonth = academicMonths.find(am => am.month === month);
              const yearMonthKey = `${academicMonth?.year || new Date().getFullYear()}-${month}`;
              updated[groupId][yearMonthKey] = true;
              console.log(`✅ Immediately marked Group ${groupId} Month ${month}/${academicMonth?.year} as PAID`);
            });
          });
          return updated;
        });
        
        // Force attendance table refresh with the updated payment status
        setAttendanceRefreshTrigger(prev => {
          const newTrigger = prev + 100; // Large increment to ensure refresh
          console.log(`🔄 Attendance refresh trigger updated: ${prev} -> ${newTrigger}`);
          return newTrigger;
        });
        
        // Wait for database to propagate changes, then do a smart refresh
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Fetch fresh data from API but merge intelligently with existing state
        console.log('🔄 Smart refresh: fetching latest data while preserving local updates...');
        await smartRefreshPaymentStatus();
        
        // Additional verification: Double-check payment status via API after local update
        setTimeout(async () => {
          console.log('🔍 Final verification: checking payment status after 1 second...');
          const academicMonths = generateAcademicYearMonths(8, 2025); // Get correct years for verification
          
          for (const [groupIdStr, groupData] of paymentDetails) {
            const groupId = parseInt(groupIdStr);
            for (const month of groupData.months) {
              try {
                // Use correct academic year for verification (same as transaction creation)
                const academicMonth = academicMonths.find(am => am.month === month);
                const correctYear = academicMonth ? academicMonth.year : new Date().getFullYear();
                
                const verifyResponse = await fetch(`/api/groups/${groupId}/payment-status/${correctYear}/${month}`, {
                  method: 'GET',
                  credentials: 'include', // Include session cookies for authentication
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                if (verifyResponse.ok) {
                  const verifyData = await verifyResponse.json();
                  const studentVerify = verifyData.find((record: any) => 
                    record.studentId === scannedProfile.id && record.studentType === scannedProfile.type
                  );
                  console.log(`🎯 Final check - Group ${groupId} Month ${month} Year ${correctYear}:`, 
                    studentVerify?.isPaid ? 'PAID ✅' : 'NOT PAID ❌'
                  );
                }
              } catch (verifyError) {
                console.error(`❌ Final verification failed for group ${groupId} month ${month}:`, verifyError);
              }
            }
          }
        }, 1000);
        
        console.log('✅ Student payment data refreshed and local state updated');
        
      } catch (refreshError) {
        console.error('⚠️ Error refreshing student payment data:', refreshError);
        // Still proceed even if refresh fails - user can manually refresh
      }

      // Reset form
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedGroups({});
      setGroupAmounts({}); // Reset individual group amounts

    } catch (error: any) {
      console.error('Ticket generation error:', error);
      toast({
        title: "خطأ في إنشاء الإيصال",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setIsGeneratingTicket(false);
    }
  };

  const getTotalSelectedMonths = () => {
    return Object.values(selectedGroups).reduce((total, group) => total + group.months.length, 0);
  };

  const getMonthName = (monthNum: number, year?: number) => {
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    // Ensure monthNum is a valid integer
    const validMonthNum = parseInt(String(monthNum), 10);
    if (isNaN(validMonthNum) || validMonthNum < 1 || validMonthNum > 12) {
      return `شهر غير صحيح (${monthNum})`;
    }
    
    const monthName = monthNames[validMonthNum - 1];
    return year ? `${monthName} ${year}` : monthName;
  };

  // Generate academic year months starting from a specific month (e.g., August = 8)
  // Returns array of {month, year} objects for a full academic year
  const generateAcademicYearMonths = (startMonth: number = 8, academicStartYear: number = new Date().getFullYear()) => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthNum = ((startMonth - 1 + i) % 12) + 1;
      // If we've gone past December, increment the year
      const year = (startMonth + i > 12) ? academicStartYear + 1 : academicStartYear;
      months.push({ month: monthNum, year });
    }
    return months;
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      'cash': 'نقدي',
      'bank': 'تحويل بنكي', 
      'card': 'بطاقة',
      'cheque': 'شيك'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const reprintReceipt = async (payment: any) => {
    // Get school information from localStorage
    const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');
    
    // Find group information using groupId
    let groupInfo = { name: payment.notes || 'مجموعة غير محددة', subjectName: 'مادة غير محددة' };
    
    if (payment.groupId || (payment as any).groupId) {
      const groupId = payment.groupId || (payment as any).groupId;
      try {
        // Find the group in availableGroups (already loaded)
        const foundGroup = availableGroups.find((g: any) => g.id === groupId);
        if (foundGroup) {
          groupInfo = {
            name: foundGroup.name,
            subjectName: foundGroup.subjectName || foundGroup.nameAr || foundGroup.name
          };
        }
      } catch (error) {
        console.log('Could not fetch group info, using fallback');
      }
    }
    
    // Create receipt data from payment information
    const receiptData = {
      receiptId: payment.receiptId || `REC-${payment.id}-${Date.now()}`,
      studentName: scannedProfile?.name || 'غير محدد',
      paymentDate: payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US'),
      amount: parseFloat(payment.amount) || 0,
      groups: [{
        groupName: groupInfo.name,
        subjectName: groupInfo.subjectName,
        months: [getMonthName(payment.month, payment.year)]
      }]
    };

    // Create receipt HTML content
    const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال دفع - ${receiptData.receiptId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Noto Sans Arabic', Arial, sans-serif;
          background: white;
          color: #333;
          line-height: 1.6;
          direction: rtl;
          text-align: right;
        }
        .receipt-container {
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .school-name {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .school-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .receipt-id {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-box {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .group-item {
          background: #eff6ff;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
          border-left: 3px solid #2563eb;
        }
        .group-name {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 4px;
        }
        .subject-name {
          color: #374151;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .months {
          color: #6b7280;
          font-size: 12px;
        }
        .summary {
          background: #f0f9ff;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
          margin-bottom: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .total-amount {
          color: #059669;
          font-size: 18px;
        }
        .payment-method {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .receipt-container { 
            max-width: 100%; 
            margin: 0; 
            border: none; 
            box-shadow: none; 
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="title">إيصال دفع</div>
          <div class="school-name">${selectedSchool?.name || 'مؤسسة تعليمية'}</div>
          ${selectedSchool?.fullAddress ? `<div class="school-info">العنوان: ${selectedSchool.fullAddress}</div>` : ''}
          ${selectedSchool?.adminPhone ? `<div class="school-info">الهاتف: ${selectedSchool.adminPhone}</div>` : ''}
          ${selectedSchool?.schoolEmail ? `<div class="school-info">البريد الإلكتروني: ${selectedSchool.schoolEmail}</div>` : ''}
          <div class="receipt-id">رقم الإيصال: ${receiptData.receiptId}</div>
          <div class="receipt-id">تاريخ الدفع: ${receiptData.paymentDate}</div>
        </div>

        <div class="section">
          <div class="section-title">معلومات الطالب:</div>
          <div class="info-box">
            الاسم: ${receiptData.studentName}
          </div>
        </div>

        <div class="section">
          <div class="section-title">تفاصيل الدفع:</div>
          ${receiptData.groups.map((group: any) => `
            <div class="group-item">
              <div class="group-name">${group.groupName}</div>
              <div class="subject-name">${group.subjectName}</div>
              <div class="months">الأشهر المدفوعة: ${group.months.join(', ')}</div>
            </div>
          `).join('')}
        </div>

        <div class="summary">
          <div class="total-row">
            <span>المبلغ الإجمالي:</span>
            <span class="total-amount">${receiptData.amount.toFixed(2)} دج</span>
          </div>
          <div class="payment-method">
            <span>طريقة الدفع:</span>
            <span>نقدي</span>
          </div>
        </div>

        <div class="footer">
          شكراً لكم على دفع الرسوم في الوقت المحدد
          <br><br>
          تم إنشاء هذا الإيصال باستعمال برنامج TaalimFlow
        </div>
      </div>
    </body>
    </html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  const printTicket = () => {
    if (!generatedTicket) return;
    
    // Get school information from localStorage
    const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');
    
    // Create receipt HTML content
    const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال دفع - ${generatedTicket.receiptId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Noto Sans Arabic', Arial, sans-serif;
          background: white;
          color: #333;
          line-height: 1.6;
          direction: rtl;
          text-align: right;
        }
        .receipt-container {
          max-width: 400px;
          margin: 20px auto;
          padding: 20px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .school-name {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 8px;
        }
        .school-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .receipt-id {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        .section {
          margin-bottom: 15px;
        }
        .section-title {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-box {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .group-item {
          background: #eff6ff;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
          border-left: 3px solid #2563eb;
        }
        .group-name {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 2px;
        }
        .subject-name {
          font-size: 12px;
          color: #2563eb;
          margin-bottom: 4px;
        }
        .months {
          font-size: 12px;
          color: #666;
        }
        .summary {
          border-top: 2px solid #eee;
          padding-top: 15px;
          margin-top: 15px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .total-amount {
          font-size: 20px;
          font-weight: bold;
          color: #16a34a;
        }
        .payment-method {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .receipt-container { 
            max-width: 100%; 
            margin: 0; 
            border: none; 
            box-shadow: none; 
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="title">إيصال دفع</div>
          <div class="school-name">${selectedSchool?.name || 'مؤسسة تعليمية'}</div>
          ${selectedSchool?.fullAddress ? `<div class="school-info">العنوان: ${selectedSchool.fullAddress}</div>` : ''}
          ${selectedSchool?.adminPhone ? `<div class="school-info">الهاتف: ${selectedSchool.adminPhone}</div>` : ''}
          ${selectedSchool?.schoolEmail ? `<div class="school-info">البريد الإلكتروني: ${selectedSchool.schoolEmail}</div>` : ''}
          <div class="receipt-id">رقم الإيصال: ${generatedTicket.receiptId}</div>
          <div class="receipt-id">تاريخ الدفع: ${generatedTicket.paymentDate}</div>
        </div>

        <div class="section">
          <div class="section-title">معلومات الطالب:</div>
          <div class="info-box">
            الاسم: ${generatedTicket.studentName}
          </div>
        </div>

        <div class="section">
          <div class="section-title">تفاصيل الدفع:</div>
          ${generatedTicket.groups.map((group: any) => `
            <div class="group-item">
              <div class="group-name">${group.groupName}</div>
              <div class="subject-name">${group.subjectName}</div>
              <div class="months">الأشهر المدفوعة: ${group.months.join(', ')}</div>
            </div>
          `).join('')}
        </div>

        <div class="summary">
          <div class="total-row">
            <span>المبلغ الإجمالي:</span>
            <span class="total-amount">${generatedTicket.amount.toFixed(2)} دج</span>
          </div>
          <div class="payment-method">
            <span>طريقة الدفع:</span>
            <span>نقدي</span>
          </div>
        </div>

        <div class="footer">
          شكراً لكم على دفع الرسوم في الوقت المحدد
          <br><br>
          تم إنشاء هذا الإيصال باستعمال برنامج TaalimFlow
        </div>
      </div>
    </body>
    </html>`;

    // Open in new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        
        // Refresh the page after printing to clear any data inconsistencies
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        // Optional: close window after printing (uncomment if desired)
        // printWindow.onafterprint = () => printWindow.close();
      };
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Unified Scanner and Search Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            الماسح المكتبي لرموز الطلاب والبحث
          </CardTitle>
          <CardDescription>
            قم بمسح رمز الطالب أو ابحث يدوياً للوصول إلى ملفه الشخصي وإدارة الحضور والمدفوعات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* QR Scanner Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-5 w-5" />
                <h3 className="font-semibold">مسح الرمز</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                {!isScanning ? (
                  <Button onClick={startScanning} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    بدء المسح
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex items-center gap-2">
                    <CameraOff className="h-4 w-4" />
                    إيقاف المسح
                  </Button>
                )}
              </div>
              
              {isScanning && (
                <div>
                  <div className="relative">
                    <video 
                      ref={videoRef} 
                      className="w-full border-2 border-green-400 rounded-lg bg-gray-900"
                      style={{ aspectRatio: '4/3', maxHeight: '300px' }}
                      autoPlay
                      playsInline
                      muted
                      controls={false}
                    />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-32 h-32 border-2 border-white border-dashed rounded-lg relative">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-500"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-500"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500"></div>
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                      جاهز للمسح
                    </div>
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                        <span className="text-white font-semibold text-sm">جاري معالجة الرمز...</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-2 space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      وجه الكاميرا نحو رمز QR الخاص بالطالب
                    </p>
                    
                    {devices.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={switchCamera}
                        disabled={!isScanning}
                        className="text-xs"
                      >
                        <RotateCcw className="w-3 h-3 ml-1" />
                        تبديل الكاميرا ({devices.length} متاح)
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                  <div className="mt-3">
                    <Button onClick={retry} size="sm" variant="outline">
                      <RotateCcw className="h-4 w-4 ml-2" />
                      إعادة المحاولة
                    </Button>
                  </div>
                </Alert>
              )}
            </div>
            
            {/* Search Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <h3 className="font-semibold">البحث اليدوي</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStudentList(!showStudentList)}
                >
                  {showStudentList ? 'إخفاء النتائج' : 'عرض النتائج'}
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex gap-2">
                <Input
                  placeholder="ابحث بالاسم، الرقم، أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching || isProcessing}
                  size="sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center gap-2"
                size="sm"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
              </Button>

              {/* Filters */}
              {showFilters && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                  <div>
                    <Label className="text-sm font-medium mb-2">المستوى التعليمي</Label>
                    <Select value={selectedEducationLevel} onValueChange={(value) => {
                      setSelectedEducationLevel(value);
                      // Auto-search when filter changes
                      setTimeout(() => handleSearchWithFilters(value, selectedRole), 10);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المستوى التعليمي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المستويات</SelectItem>
                        <SelectItem value="الابتدائي">الابتدائي</SelectItem>
                        <SelectItem value="المتوسط">المتوسط</SelectItem>
                        <SelectItem value="الثانوي">الثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2">نوع المستخدم</Label>
                    <Select value={selectedRole} onValueChange={(value) => {
                      setSelectedRole(value);
                      // Auto-search when filter changes
                      setTimeout(() => handleSearchWithFilters(selectedEducationLevel, value), 10);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المستخدم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">الكل</SelectItem>
                        <SelectItem value="student">طلاب مسجلين</SelectItem>
                        <SelectItem value="child">أطفال</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Quick Search Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSelectedEducationLevel('الابتدائي');
                    setSelectedRole('');
                    // Use setTimeout to ensure state is updated before search
                    setTimeout(() => handleSearchWithFilters('الابتدائي', ''), 10);
                  }}
                >
                  الابتدائي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSelectedEducationLevel('المتوسط');
                    setSelectedRole('');
                    setTimeout(() => handleSearchWithFilters('المتوسط', ''), 10);
                  }}
                >
                  المتوسط
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSelectedEducationLevel('الثانوي');
                    setSelectedRole('');
                    setTimeout(() => handleSearchWithFilters('الثانوي', ''), 10);
                  }}
                >
                  الثانوي
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setSelectedEducationLevel('');
                    setSelectedRole('child');
                    setTimeout(() => handleSearchWithFilters('', 'child'), 10);
                  }}
                >
                  الأطفال
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {showStudentList && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              نتائج البحث ({searchResults.length} طالب)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">جاري البحث...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((student) => (
                  <div key={student.id} className="border dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium dark:text-gray-200">{student.name}</h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400">#{student.id}</div>
                          {student.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">{student.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={student.type === 'student' ? 'default' : 'secondary'}>
                          {student.type === 'student' ? 'طالب مسجل' : 'طفل'}
                        </Badge>
                        {student.verified && (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            محقق
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleSelectStudent(student)}
                          disabled={isProcessing}
                          className="ml-2"
                        >
                          اختيار
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>لا توجد نتائج. جرب البحث بكلمات مختلفة أو غير الفلاتر</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {scannedProfile && (
        <div className="grid gap-6">
          {/* Student Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={scannedProfile.profilePicture} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold dark:text-gray-200">{scannedProfile.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant={scannedProfile.type === 'student' ? 'default' : 'secondary'}>
                        {scannedProfile.type === 'student' ? 'طالب' : 'طفل'}
                      </Badge>
                      {scannedProfile.verified && (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <UserCheck className="h-3 w-3 ml-1" />
                          محقق
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scannedProfile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">{scannedProfile.email}</span>
                  </div>
                )}
                {scannedProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">{scannedProfile.phone}</span>
                  </div>
                )}
                {scannedProfile.parentName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">ولي الأمر: {scannedProfile.parentName}</span>
                  </div>
                )}
                {scannedProfile.parentPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">هاتف ولي الأمر: {scannedProfile.parentPhone}</span>
                  </div>
                )}
                {scannedProfile.educationLevel && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-300">المستوى: {scannedProfile.educationLevel}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Groups with Attendance/Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setIsGroupsCollapsed(!isGroupsCollapsed)}>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  المجموعات المسجل فيها
                </div>
                {isGroupsCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </CardTitle>
            </CardHeader>
            {!isGroupsCollapsed && (
            <CardContent>
              <div className="space-y-6">
                {scannedProfile.enrolledGroups?.length > 0 ? (
                  scannedProfile.enrolledGroups.map((group) => (
                    <div key={group.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm">
                      {/* Group Header */}
                      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-1">{group.name}</h4>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                                  {group.subjectName || 'مادة غير محددة'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>📚 المستوى:</span>
                                <span className="font-medium">{group.educationLevel}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                            <div className="flex items-center gap-1">
                              <span>👨‍🏫</span>
                              <span className="font-medium">{group.teacherName || 'معلم غير محدد'}</span>
                            </div>

                          </div>
                        </div>
                        
                        {/* Group Stats Row */}
                        <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400">رمز المجموعة: {group.id}</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">نشط</span>
                          </div>
                        </div>
                      </div>

                      {/* Attendance Table */}
                      <div className="p-4">
                        <GroupAttendanceTable 
                          groupId={group.id}
                          studentId={scannedProfile.id}
                          studentType={scannedProfile.type}
                          studentName={scannedProfile.name}
                          userId={(scannedProfile as any).userId || scannedProfile.id}
                          refreshTrigger={attendanceRefreshTrigger}
                          groupPaymentStatus={groupPaymentStatus}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">لا توجد مجموعات مسجل فيها</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        هذا الطالب غير مسجل في أي مجموعة تعليمية حالياً
                      </p>
                      
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between cursor-pointer" onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}>
                  <span>إحصائيات الحضور</span>
                  {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
              {!isStatsCollapsed && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">حاضر</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {scannedProfile.attendanceStats?.presentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">غائب</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {scannedProfile.attendanceStats?.absentCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">متأخر</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {scannedProfile.attendanceStats?.lateCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">إجمالي الحصص</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {scannedProfile.attendanceStats?.totalClasses || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between cursor-pointer" onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}>
                  <span>إحصائيات المدفوعات</span>
                  {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
              {!isStatsCollapsed && (
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">مدفوع</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {scannedProfile.paymentStats?.paidCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">غير مدفوع</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {scannedProfile.paymentStats?.unpaidCount || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border dark:border-gray-700 rounded">
                    <span className="text-sm dark:text-gray-300">إجمالي المبلغ</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {scannedProfile.paymentStats?.totalAmount || 0} دج
                    </span>
                  </div>
                </div>
              </CardContent>
              )}
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          <Tabs defaultValue="payment-form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {user.role === 'admin' && <TabsTrigger value="payment-form">تسجيل الدفعة</TabsTrigger>}
              <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            </TabsList>


            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    سجل المدفوعات الأخير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scannedProfile.recentPayments?.length > 0 ? scannedProfile.recentPayments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 border dark:border-gray-600 rounded">
                        <div>
                          <div className="font-medium dark:text-gray-200">
                            {getMonthName(payment.month, payment.year)}
                          </div>
                          {payment.amount && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{payment.amount} دج</div>
                          )}
                          {payment.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-500">{payment.notes}</div>
                          )}
                          {(payment as any).groupId && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              مجموعة رقم: {(payment as any).groupId}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              مدفوع
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reprintReceipt(payment)}
                              className="h-6 px-2 text-xs"
                              title="إعادة طباعة الإيصال"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                          </div>
                          {payment.paidAt && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(payment.paidAt).toLocaleDateString('ar-DZ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        لا توجد مدفوعات مسجلة
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user.role === 'admin' && (
              <TabsContent value="payment-form" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Printer className="h-5 w-5" />
                      طابعة إيصال الدفع
                    </CardTitle>
                    <CardDescription>
                      تحديد المجموعات والأشهر لإنشاء إيصال دفع شامل
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Groups Selection */}
                    <div>
                      <Label className="text-base font-medium">اختيار المجموعات والأشهر</Label>
                      <div className="mt-3 space-y-4">
                        {loadingGroups ? (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">جاري تحميل المجموعات...</p>
                          </div>
                        ) : availableGroups.length > 0 ? (
                          <>
                            {availableGroups.map((group: any) => (
                            <div key={group.id} className="border dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    id={`group-${group.id}`}
                                    checked={selectedGroups[group.id] !== undefined}
                                    onChange={(e) => handleGroupSelection(group.id, e.target.checked)}
                                    className="ml-2"
                                  />
                                  <label htmlFor={`group-${group.id}`} className="cursor-pointer">
                                    <div className="font-medium dark:text-gray-200">{group.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {group.subjectName || group.nameAr} - {group.educationLevel}
                                    </div>
                                  </label>
                                </div>
                              </div>
                              
                              {selectedGroups[group.id] && (
                                <div className="border-t dark:border-gray-600 pt-3">
                                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                    الأشهر المراد دفعها:
                                  </Label>
                                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                    {(() => {
                                      // Generate academic year months starting from August 2025 
                                      // For now, default to August start - in future could be from group.startMonth
                                      const academicMonths = generateAcademicYearMonths(8, 2025);
                                      
                                      return academicMonths.map(({month, year}) => {
                                        // Use unified payment status for consistent data across components - ✅ FIX: Use year-month key
                                        const yearMonthKey = `${year}-${month}`;
                                        const isPaid = groupPaymentStatus[group.id]?.[yearMonthKey] === true;
                                        const isSelected = selectedGroups[group.id]?.months.includes(month) || false;
                                        
                                        return (
                                          <label 
                                            key={`${month}-${year}`} 
                                            className={`flex items-center space-x-2 cursor-pointer p-2 rounded text-sm transition-colors ${
                                              isPaid 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' 
                                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
                                            } ${isSelected && !isPaid ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleMonthToggle(group.id, month)}
                                              className="ml-1"
                                              disabled={isPaid}
                                            />
                                            <span className={`${isPaid ? 'font-medium' : ''}`}>
                                              {getMonthName(month, year)}
                                              {isPaid && <span className="mr-1 text-green-600">✓</span>}
                                            </span>
                                          </label>
                                        );
                                      });
                                    })()}
                                  </div>
                                  
                                  {/* Payment Status Summary */}
                                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs dark:text-gray-300">
                                    <div className="flex justify-between items-center mb-1">
                                      <span>الأشهر المدفوعة:</span>
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        {Object.values(groupPaymentStatus[group.id] || {}).filter(Boolean).length} من 12
                                      </span>
                                    </div>
                                    {(() => {
                                      // ✅ FIX: Parse year-month keys to show both 2025 and 2026 payments
                                      const unifiedPaidMonths = Object.entries(groupPaymentStatus[group.id] || {})
                                        .filter(([_, isPaid]) => isPaid)
                                        .map(([yearMonth, _]) => {
                                          const [year, month] = yearMonth.split('-');
                                          return {month: parseInt(month), year: parseInt(year)};
                                        })
                                        .sort((a, b) => a.month - b.month);
                                      
                                      return unifiedPaidMonths.length > 0 && (
                                        <div className="text-green-700 dark:text-green-400">
                                          {unifiedPaidMonths.map(({month, year}) => {
                                            return getMonthName(month, year);
                                          }).join(', ')}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {selectedGroups[group.id]?.months.length > 0 && (
                                    <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                      الأشهر المحددة: {selectedGroups[group.id].months.map(m => {
                                        // Determine correct year for academic year display
                                        const academicMonths = generateAcademicYearMonths(8, 2025);
                                        const academicMonth = academicMonths.find(am => am.month === m);
                                        const displayYear = academicMonth ? academicMonth.year : new Date().getFullYear();
                                        return getMonthName(m, displayYear);
                                      }).join(', ')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            ))}
                          </>
                        ) : (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>لا توجد مجموعات متاحة لهذا الطالب</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Details */}
                    <Separator />
                    <div className="mt-4">
                      <Label className="dark:text-gray-300 text-lg font-semibold block mb-4">تفاصيل المبالغ لكل مجموعة</Label>
                      
                      {/* Individual amount inputs for each group */}
                      <div className="space-y-4">
                        {Object.entries(selectedGroups).map(([groupId, groupData]) => {
                          if (groupData.months.length === 0) return null;
                          
                          return (
                            <div key={groupId} className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                              <div className="mb-3">
                                <h4 className="font-medium text-sm dark:text-gray-200">{groupData.subjectName}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {groupData.groupName} - الأشهر المحددة: {groupData.months.map(m => getMonthName(m)).join('، ')}
                                </p>
                              </div>
                              
                              <div>
                                <Label htmlFor={`amount-${groupId}`} className="dark:text-gray-300 text-sm">
                                  المبلغ الإجمالي للمجموعة ({groupData.months.length} شهر)
                                </Label>
                                <Input
                                  id={`amount-${groupId}`}
                                  type="number"
                                  placeholder="أدخل المبلغ لهذه المجموعة"
                                  value={groupAmounts[groupId] || ''}
                                  onChange={(e) => setGroupAmounts(prev => ({
                                    ...prev,
                                    [groupId]: e.target.value
                                  }))}
                                  className="mt-1"
                                />
                                
                                {/* Show per-month amount calculation */}
                                {groupAmounts[groupId] && !isNaN(parseFloat(groupAmounts[groupId])) && groupData.months.length > 0 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    المبلغ لكل شهر: {(parseFloat(groupAmounts[groupId]) / groupData.months.length).toFixed(2)} دج
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Payment Summary */}
                      {Object.keys(selectedGroups).length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-blue-800 dark:text-blue-300">المجموع الكلي:</span>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {Object.values(groupAmounts).reduce((total, amount) => {
                                return total + (parseFloat(amount) || 0);
                              }, 0).toFixed(2)} دج
                            </span>
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            مجموع جميع المبالغ المدخلة للمجموعات المحددة
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={generatePaymentTicket}
                        className="mt-4 w-full"
                        disabled={
                          isGeneratingTicket || 
                          Object.keys(selectedGroups).length === 0 || 
                          Object.values(groupAmounts).every(amount => !amount)
                        }
                      >
                        {isGeneratingTicket ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                            جاري إنشاء الإيصال...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 ml-2" />
                            إنشاء إيصال الدفع
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* Ticket Print Preview */}
        {showTicket && generatedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="mb-4">
                <div className="font-semibold dark:text-gray-200 mb-2">معلومات الطالب:</div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <div className="dark:text-gray-300">الاسم: <span className="font-medium">{generatedTicket.studentName}</span></div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="mb-4">
                <div className="font-semibold dark:text-gray-200 mb-2">تفاصيل الدفع:</div>
                <div className="space-y-2">
                  {generatedTicket.groups.map((group: any, index: number) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                      <div className="font-medium text-blue-800 dark:text-blue-300">{group.groupName}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">{group.subjectName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        الأشهر المدفوعة: {group.months.join(', ')} ({group.months.length} أشهر)
                      </div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                        المبلغ الإجمالي: {group.groupAmount.toFixed(2)} دج
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        المبلغ الشهري: {group.perMonthAmount.toFixed(2)} دج/شهر
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t dark:border-gray-600 pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="dark:text-gray-300">المبلغ الإجمالي:</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {generatedTicket.amount.toFixed(2)} دج
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>طريقة الدفع:</span>
                  <span>نقدي</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-600 pt-3">
                شكراً لكم على دفع الرسوم في الوقت المحدد
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-6 print:hidden">
                <Button 
                  onClick={printTicket}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة
                </Button>
                <Button 
                  onClick={() => setShowTicket(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

export default DesktopQRScanner;
