import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CreditCard, User, Clock, CheckCircle, XCircle, DollarSign, Users, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { GroupDetailsModal } from '@/components/GroupDetailsModal';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface AttendanceRecord {
  id: number;
  groupId: number;
  groupName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

interface PaymentRecord {
  id: number;
  groupId: number;
  groupName: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  description: string;
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

interface Child {
  id: number;
  name: string;
  schoolId: number;
  parentId: number;
  educationLevel?: string;
  birthDate?: string;
  gender?: string;
}

export default function StudentStatus() {
  const { user } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<EnrolledGroup | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // For parent accounts, fetch children first
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: user?.role === 'parent',
  });

  // Determine which ID to use for fetching data
  const targetUserId = user?.role === 'parent' ? selectedChildId : user?.id;
  const targetUserType = user?.role === 'parent' ? 'child' : 'student';
  const targetStudentId = targetUserId; // The ID used for student records

  // Fetch all groups and filter for ones this student is enrolled in
  const { data: allGroups = [], isLoading: groupsLoading } = useQuery<any[]>({
    queryKey: ['/api/groups'],
    enabled: !!targetUserId,
  });

  // Simple approach: Check all students in all groups to see if any have this user's email
  // This works around the API authentication issue
  const currentUserEmail = user?.email;
  
  // Filter groups where the current user appears in the studentsAssigned list
  const enrolledGroups = allGroups.filter(group => {
    if (!group.studentsAssigned || !Array.isArray(group.studentsAssigned)) return false;
    
    // Check if current user is in the studentsAssigned list by matching email
    return group.studentsAssigned.some((student: any) => {
      if (!student) return false;
      
      // Match by email (most reliable way to identify the user)
      return student.email === currentUserEmail;
    });
  });

  // Fetch attendance records from all enrolled groups
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/student/attendance`, targetUserId, enrolledGroups.map(g => g.id)],
    queryFn: async () => {
      if (!targetUserId || enrolledGroups.length === 0) return [];
      
      const allAttendanceRecords: AttendanceRecord[] = [];
      
      // Fetch attendance from each enrolled group
      for (const group of enrolledGroups) {
        try {
          const response = await fetch(`/api/groups/${group.id}/attendance-history`);
          if (response.ok) {
            const groupAttendance = await response.json();
            
            // Filter attendance records for this specific user
            const userAttendance = groupAttendance.filter((record: any) => {
              return targetUserType === 'student' ? 
                record.userId === targetUserId :
                record.studentId === targetUserId;
            }).map((record: any) => ({
              id: record.id,
              date: record.attendanceDate || record.date,
              status: record.status,
              groupName: group.name || group.subjectNameAr,
              groupId: group.id
            }));
            
            allAttendanceRecords.push(...userAttendance);
          }
        } catch (error) {
          console.error(`Error fetching attendance for group ${group.id}:`, error);
        }
      }
      
      // Sort by date, newest first
      return allAttendanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!targetUserId && enrolledGroups.length > 0,
  });

  // Fetch payment records using the correct student matching
  const { data: allPaymentRecords = [], isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: [`/api/student/payments`, targetUserId, enrolledGroups.length],
    queryFn: async () => {
      if (!enrolledGroups.length || !targetUserId) return [];
      
      const currentDate = new Date();
      const allPayments = [];
      
      // Fetch payment data for the last 6 months across all groups
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        for (const group of enrolledGroups) {
          try {
            const response = await fetch(`/api/groups/${group.id}/payment-status/${year}/${month}`);
            if (response.ok) {
              const groupPayments = await response.json();
              // Match payment records based on user type
              const userPayment = groupPayments.find((p: any) => {
                return targetUserType === 'student' ? 
                  p.userId === targetUserId :
                  p.studentId === targetUserId;
              });
              
              if (userPayment && !userPayment.isVirtual) {
                allPayments.push({
                  id: userPayment.id,
                  groupId: group.id,
                  groupName: group.name || group.subjectNameAr,
                  amount: userPayment.amount || 0,
                  year,
                  month,
                  isPaid: userPayment.isPaid,
                  paymentNote: userPayment.paymentNote,
                  dueDate: `${year}-${month.toString().padStart(2, '0')}-01`,
                  paidDate: userPayment.paidDate,
                  description: `رسوم شهر ${month}/${year}`
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching payments for group ${group.id}:`, error);
          }
        }
      }
      
      return allPayments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    },
    enabled: !!targetUserId && enrolledGroups.length > 0,
  });

  // Calculate attendance statistics (excluding late status)
  const totalSessions = attendanceRecords.length;
  const presentSessions = attendanceRecords.filter(record => record.status === 'present' || record.status === 'late').length;
  const absentSessions = attendanceRecords.filter(record => record.status === 'absent').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

  // Calculate payment statistics from real data
  const paymentRecords = allPaymentRecords || [];
  const totalAmount = paymentRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
  const paidAmount = paymentRecords.filter(record => record.isPaid).reduce((sum, record) => sum + (record.amount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const overduePayments = paymentRecords.filter(record => 
    !record.isPaid && new Date(record.dueDate) < new Date()
  ).length;

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'late': return <Clock className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'late': return 'متأخر';
      case 'absent': return 'غائب';
      default: return 'غير محدد';
    }
  };

  // Set default child selection for parents
  const handleChildSelection = (childId: string) => {
    setSelectedChildId(parseInt(childId));
  };

  // Auto-select first child for parents if none selected
  if (user?.role === 'parent' && children.length > 0 && !selectedChildId) {
    setSelectedChildId(children[0].id);
  }

  if (attendanceLoading || paymentsLoading || groupsLoading || (user?.role === 'parent' && childrenLoading)) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // For parents with no children
  if (user?.role === 'parent' && children.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">لا توجد أطفال مسجلين</h2>
            <p className="text-gray-600">يجب تسجيل الأطفال أولاً لعرض حضورهم ومدفوعاتهم</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedChild = children.find(child => child.id === selectedChildId);
  const displayName = user?.role === 'parent' && selectedChild ? selectedChild.name : user?.name;

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20 space-y-6" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.role === 'parent' ? 'حضور ومدفوعات الأطفال' : 'حضور ومدفوعات الطالب'}
        </h1>
        <p className="text-gray-600">متابعة حالة الحضور والمدفوعات المالية</p>
      </div>

      {/* Child Selection for Parents */}
      {user?.role === 'parent' && children.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 ml-2 text-blue-600" />
            اختيار الطفل لعرض بياناته
          </h3>
          <Select value={selectedChildId?.toString()} onValueChange={handleChildSelection}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="اختر الطفل" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id.toString()}>
                  {child.name} {child.educationLevel && `- ${child.educationLevel}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedChild && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">البيانات المعروضة للطفل: {selectedChild.name}</h4>
              {selectedChild.educationLevel && (
                <p className="text-sm text-blue-700 mt-1">المستوى التعليمي: {selectedChild.educationLevel}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Enrolled Groups Section */}
      {enrolledGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-6 h-6 ml-2 text-blue-600" />
            المجموعات المسجل بها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledGroups.map((group) => {
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
                      <h3 className="font-semibold text-gray-800">{group.nameAr || group.name}</h3>
                      
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
      )}




      {/* Detailed Groups Attendance Tables */}
      {enrolledGroups.length > 0 && enrolledGroups.map((group) => (
        <GroupAttendanceTable 
          key={group.id} 
          group={group} 
          targetUserId={targetUserId} 
          targetUserType={targetUserType}
          displayName={displayName}
        />
      ))}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-6 h-6 text-blue-600 ml-2" />
              <h2 className="text-xl font-bold">سجل الحضور</h2>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{presentSessions}</p>
                <p className="text-sm text-gray-600">حاضر</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{absentSessions}</p>
                <p className="text-sm text-gray-600">غائب</p>
              </div>
            </div>

            {/* Recent Attendance Records */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات حضور متاحة</p>
              ) : (
                attendanceRecords.slice(0, 10).map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="flex items-center">
                      {getAttendanceStatusIcon(record.status)}
                      <div className="mr-3">
                        <p className="font-medium">{record.groupName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.date).toLocaleDateString('ar-DZ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getAttendanceStatusColor(record.status)}>
                      {getAttendanceStatusText(record.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <CreditCard className="w-6 h-6 text-green-600 ml-2" />
              <h2 className="text-xl font-bold">المدفوعات المالية</h2>
            </div>

            {/* Payment Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{paidAmount}</p>
                <p className="text-sm text-gray-600">مدفوع</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{pendingAmount}</p>
                <p className="text-sm text-gray-600">معلق</p>
              </div>
            </div>

            {/* Payment Records */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paymentRecords.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد سجلات مدفوعات متاحة</p>
              ) : (
                paymentRecords.map((record) => (
                  <div key={record.id} className="p-3 bg-white border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{record.groupName}</p>
                        <p className="text-sm text-gray-600">{record.description}</p>
                        {record.paymentNote && (
                          <p className="text-xs text-blue-600 mt-1">
                            {record.paymentNote}
                          </p>
                        )}
                      </div>
                      <Badge className={record.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {record.isPaid ? 'مدفوع' : 'غير مدفوع'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>المبلغ: {record.amount || 'غير محدد'} دج</span>
                      <span>
                        الاستحقاق: {new Date(record.dueDate).toLocaleDateString('ar-DZ')}
                      </span>
                    </div>
                    {record.isPaid && record.paidDate && (
                      <p className="text-xs text-green-600 mt-1">
                        تم الدفع في: {new Date(record.paidDate).toLocaleDateString('ar-DZ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Details Modal */}
      <GroupDetailsModal
        group={selectedGroup}
        isOpen={showGroupDetails}
        onClose={() => {
          setShowGroupDetails(false);
          setSelectedGroup(null);
        }}
        currentUserId={user?.id || 0}
        userRole={user?.role || 'student'}
      />
    </div>
  );
}

// Detailed Group Attendance Table Component
function GroupAttendanceTable({ group, targetUserId, targetUserType, displayName }: {
  group: any;
  targetUserId: number | null;
  targetUserType: string;
  displayName: string | undefined;
}) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { user } = useAuth();

  // Get scheduled dates for this group first
  const { data: scheduledDatesData } = useQuery<any>({
    queryKey: [`/api/groups/${group.id}/scheduled-dates`],
    enabled: !!group.id,
  });

  // Helper function to group dates by month (same as Groups page)
  const groupDatesByMonth = (dates: string[]) => {
    const monthGroups: { [key: string]: string[] } = {};

    dates.forEach((date) => {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });

    // Sort dates within each month
    Object.keys(monthGroups).forEach((monthKey) => {
      monthGroups[monthKey].sort();
    });

    return monthGroups;
  };

  // Group dates by month and get available months
  const monthGroups = scheduledDatesData?.dates ? groupDatesByMonth(scheduledDatesData.dates) : {};
  const monthKeys = Object.keys(monthGroups).sort();
  
  // Start with the latest month that has data, or current month
  const currentDate = new Date();
  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const initialMonthIndex = monthKeys.includes(currentMonthKey) 
    ? monthKeys.indexOf(currentMonthKey)
    : Math.max(0, monthKeys.length - 1);
  
  const [actualCurrentMonthIndex, setActualCurrentMonthIndex] = useState(initialMonthIndex);
  
  const selectedMonthKey = monthKeys[actualCurrentMonthIndex] || monthKeys[0] || currentMonthKey;
  const [currentYear, currentMonth] = selectedMonthKey.split('-').map(Number);

  // Navigation functions
  const goToPreviousMonth = () => {
    if (actualCurrentMonthIndex > 0) {
      setActualCurrentMonthIndex(actualCurrentMonthIndex - 1);
    }
  };

  const goToNextMonth = () => {
    if (actualCurrentMonthIndex < monthKeys.length - 1) {
      setActualCurrentMonthIndex(actualCurrentMonthIndex + 1);
    }
  };

  const getMonthDisplayName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && actualCurrentMonthIndex < monthKeys.length - 1) {
      goToNextMonth();
    }
    if (isRightSwipe && actualCurrentMonthIndex > 0) {
      goToPreviousMonth();
    }
  };
  

  // Get attendance history for this group
  const { data: attendanceHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/groups/${group.id}/attendance-history`],
    enabled: !!group.id,
  });

  // Get payment status for current viewing month
  const { data: paymentStatuses = [] } = useQuery<any[]>({
    queryKey: [`/api/groups/${group.id}/payment-status/${currentYear}/${currentMonth}`],
    enabled: !!group.id,
  });

  // Get dates for the selected month
  const currentMonthDates = monthGroups[selectedMonthKey] || [];
  
  // Filter attendance for current user
  const userAttendanceHistory = attendanceHistory.filter((record: any) => {
    return targetUserType === 'student' ? 
      record.userId === targetUserId :
      record.studentId === targetUserId;
  });

  // Find user's payment record
  const userPaymentRecord = paymentStatuses.find((payment: any) => {
    return targetUserType === 'student' ? 
      payment.userId === targetUserId :
      payment.studentId === targetUserId;
  });

  const isMonthPaid = userPaymentRecord ? userPaymentRecord.isPaid : false;
  const paymentAmount = userPaymentRecord?.amount;

  // Calculate monthly stats
  const monthlyPresent = userAttendanceHistory.filter((r: any) => {
    const recordDate = r.attendanceDate?.split('T')[0];
    return r.status === 'present' && currentMonthDates.includes(recordDate);
  }).length;

  const monthlyAbsent = userAttendanceHistory.filter((r: any) => {
    const recordDate = r.attendanceDate?.split('T')[0];
    return r.status === 'absent' && currentMonthDates.includes(recordDate);
  }).length;

  const attendanceRate = (monthlyPresent + monthlyAbsent) > 0 ? 
    Math.round((monthlyPresent / (monthlyPresent + monthlyAbsent)) * 100) : 0;

  // No data available if no scheduled dates or no months available
  if (!scheduledDatesData?.dates || scheduledDatesData.dates.length === 0 || monthKeys.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-6 h-6 ml-2 text-blue-600" />
              {group.nameAr || group.name}
            </h3>
            <p className="text-sm text-gray-600">المستوى: {group.educationLevel}</p>
            {group.teacherName && (
              <p className="text-sm text-gray-600">المعلم: {group.teacherName}</p>
            )}
          </div>

          {/* Monthly Attendance and Payment Table */}
          <div className="bg-white rounded-lg border">
            <div className="sticky top-0 z-10 bg-white border-b p-3 md:p-4 rounded-t-lg">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <h4 className="font-semibold text-gray-800 text-sm mb-3 text-center">
                  جدول الحضور والدفع الشهري
                </h4>
                <div className="text-xs text-gray-600 text-center mb-3">{displayName}</div>
                
                {monthKeys.length > 0 && (
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      disabled={actualCurrentMonthIndex === 0}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div className="text-xs font-medium px-2 py-1 bg-blue-50 rounded text-blue-700 truncate">
                        {getMonthDisplayName(selectedMonthKey)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {actualCurrentMonthIndex + 1} / {monthKeys.length}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      disabled={actualCurrentMonthIndex === monthKeys.length - 1}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">
                  جدول الحضور والدفع الشهري - {displayName}
                </h4>

                {monthKeys.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousMonth}
                      disabled={actualCurrentMonthIndex === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg text-blue-700">
                        {getMonthDisplayName(selectedMonthKey)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {actualCurrentMonthIndex + 1} / {monthKeys.length}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextMonth}
                      disabled={actualCurrentMonthIndex === monthKeys.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Month Progress Bar */}
              {monthKeys.length > 1 && (
                <div className="mt-3 md:mb-2">
                  <div className="flex items-center gap-1 px-2 md:px-0">
                    {monthKeys.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          index === actualCurrentMonthIndex 
                            ? 'bg-blue-600' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div 
              className="p-2 md:p-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentMonthDates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300" dir="rtl">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-1 md:p-2 text-right font-medium text-xs md:text-sm min-w-[80px] md:min-w-[120px]">اسم الطالب</th>
                        <th className="border border-gray-300 p-1 md:p-2 text-center font-medium text-xs md:text-sm min-w-[70px] md:min-w-[80px]">حالة الدفع</th>
                        {currentMonthDates.map((date: string) => (
                          <th key={date} className="border border-gray-300 p-1 md:p-2 text-center font-medium min-w-[40px] md:min-w-[80px]">
                            <div className="text-xs">
                              {new Date(date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'numeric',
                              })}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 md:p-3 font-medium">
                          <div className="font-medium text-gray-800 text-xs md:text-sm">
                            <div className="truncate">{displayName}</div>
                            {targetUserType === 'child' && (
                              <span className="mt-1 text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded inline-block">
                                طفل
                              </span>
                            )}
                          </div>
                        </td>
                        
                        <td className="border border-gray-300 p-1 md:p-2 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium ${
                                isMonthPaid
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isMonthPaid ? '✅' : '❌'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600 hidden md:block">
                              {isMonthPaid ? 'مدفوع' : 'غير مدفوع'}
                            </span>
                            {paymentAmount !== undefined && paymentAmount !== null && (
                              <span className="text-xs font-semibold text-gray-700">
                                {paymentAmount} دج
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {currentMonthDates.map((date: string) => {
                          const attendanceRecord = userAttendanceHistory.find(
                            (record: any) => record.attendanceDate?.split('T')[0] === date
                          );
                          
                          return (
                            <td key={date} className="border border-gray-300 p-0.5 md:p-1 text-center">
                              <div className={`w-6 h-6 md:w-8 md:h-8 rounded text-xs font-bold flex items-center justify-center ${
                                attendanceRecord?.status === 'present'
                                  ? 'bg-green-500 text-white'
                                  : attendanceRecord?.status === 'absent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                              }`}>
                                {attendanceRecord?.status === 'present'
                                  ? '✓'
                                  : attendanceRecord?.status === 'absent'
                                    ? '✗'
                                    : '?'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>

                  {/* Monthly Statistics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 md:gap-4">
                    <div className="bg-green-100 rounded-lg p-2 md:p-3 text-center">
                      <h5 className="font-medium text-green-800 text-xs md:text-sm">حضور الشهر</h5>
                      <p className="text-lg md:text-xl font-bold text-green-900">{monthlyPresent}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-2 md:p-3 text-center">
                      <h5 className="font-medium text-red-800 text-xs md:text-sm">غياب الشهر</h5>
                      <p className="text-lg md:text-xl font-bold text-red-900">{monthlyAbsent}</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-2 md:p-3 text-center">
                      <h5 className="font-medium text-blue-800 text-xs md:text-sm">نسبة حضور الشهر</h5>
                      <p className="text-lg md:text-xl font-bold text-blue-900">{attendanceRate}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">لا توجد حصص مجدولة لهذا الشهر</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}