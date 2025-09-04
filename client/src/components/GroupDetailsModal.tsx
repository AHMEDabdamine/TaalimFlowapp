import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GroupDetailsModalProps {
  group: any;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  userRole: string;
}

export function GroupDetailsModal({ group, isOpen, onClose, currentUserId, userRole }: GroupDetailsModalProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // Attendance history query for table
  const { data: attendanceHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/groups', group?.id, 'attendance-history'],
    queryFn: async () => {
      if (!group) return [];
      const response = await apiRequest('GET', `/api/groups/${group.id}/attendance-history`);
      return await response.json();
    },
    enabled: !!group && isOpen
  });

  // Scheduled dates query for attendance table
  const { data: scheduledDatesData } = useQuery<{dates: string[]}>({
    queryKey: ['/api/groups', group?.id, 'scheduled-dates'],
    queryFn: async () => {
      if (!group) return { dates: [] };
      const response = await apiRequest('GET', `/api/groups/${group.id}/scheduled-dates`);
      return await response.json();
    },
    enabled: !!group && isOpen
  });

  // Helper function to group dates by month
  const groupDatesByMonth = (dates: string[]) => {
    const monthGroups: { [key: string]: string[] } = {};
    
    dates.forEach(date => {
      const dateObj = new Date(date);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(date);
    });
    
    return monthGroups;
  };

  // Process scheduled dates into monthly groups
  const monthlyGroups = scheduledDatesData?.dates ? groupDatesByMonth(scheduledDatesData.dates) : {};
  const monthKeys = Object.keys(monthlyGroups).sort();
  const currentMonthKey = monthKeys[currentMonthIndex] || '';
  const currentMonthDates = monthlyGroups[currentMonthKey] || [];

  // Set initial month to current month when data loads
  useEffect(() => {
    if (scheduledDatesData?.dates && scheduledDatesData.dates.length > 0) {
      const currentDate = new Date();
      const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthlyGroups = groupDatesByMonth(scheduledDatesData.dates);
      const monthKeys = Object.keys(monthlyGroups).sort();
      const currentIndex = monthKeys.findIndex(key => key === currentMonthKey);
      
      if (currentIndex !== -1) {
        setCurrentMonthIndex(currentIndex);
      }
    }
  }, [scheduledDatesData]);

  const getMonthDisplayName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
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

  // Extract year and month from the currently viewed month in attendance table
  const getViewingYearMonth = () => {
    if (!currentMonthKey) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    const [year, month] = currentMonthKey.split('-').map(Number);
    return { year, month };
  };
  
  const { year: viewingYear, month: viewingMonth } = getViewingYearMonth();
  
  const { data: paymentStatuses = [] } = useQuery<any[]>({
    queryKey: ['/api/groups', group?.id, 'payment-status', viewingYear, viewingMonth],
    queryFn: async () => {
      if (!group) return [];
      const response = await apiRequest('GET', `/api/groups/${group.id}/payment-status/${viewingYear}/${viewingMonth}`);
      return await response.json();
    },
    enabled: !!group && isOpen && !!currentMonthKey
  });

  // Get payment status for student (default to unpaid if no record exists)
  const getStudentPaymentStatus = (studentId: number) => {
    const paymentRecord = paymentStatuses.find((payment: any) => payment.studentId === studentId);
    return paymentRecord || { studentId, isPaid: false };
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold flex items-center">
                <Calendar className="w-5 h-5 ml-2 text-green-600" />
                إدارة الحضور - {group.nameAr || group.subjectName || group.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {group.description} - {group.educationLevel}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              إغلاق
            </Button>
          </div>
        </div>

        <div className="p-6">
          {group.studentsAssigned && group.studentsAssigned.length > 0 ? (
            <div className="space-y-6">
              {/* Monthly Carousel Attendance View */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-800">جدول الحضور الشهري - المواعيد المجدولة</h4>
                  
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
                        <div className="text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg text-blue-700">
                          {currentMonthKey ? getMonthDisplayName(currentMonthKey) : ''}
                        </div>
                        <div className="text-xs text-gray-500">
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

                {scheduledDatesData?.dates && scheduledDatesData.dates.length > 0 ? (
                  monthKeys.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" dir="rtl">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-right font-medium text-gray-900 dark:text-gray-100">اسم الطالب</th>
                            <th className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                              <div>حالة الدفع</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                                {getMonthDisplayName(currentMonthKey)}
                              </div>
                            </th>
                            {currentMonthDates.map((date) => (
                              <th key={date} className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
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
                          {group.studentsAssigned
                            .filter((student: any) => {
                              // Filter to show only current user's data for students/children
                              if (userRole === 'student' || userRole === 'child') {
                                return student.id === currentUserId;
                              }
                              return true;
                            })
                            .map((student: any) => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="border border-gray-300 dark:border-gray-600 p-3 font-medium">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                                {(() => {
                                  const paymentStatus = getStudentPaymentStatus(student.id);
                                  
                                  // If it's a virtual record with no payment requirement
                                  if (paymentStatus?.isVirtual && !paymentStatus?.mustPay) {
                                    return (
                                      <span className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                                        {paymentStatus?.paymentNote || 'Nothing to pay'}
                                      </span>
                                    );
                                  }
                                  
                                  // Show payment status for actual payment records
                                  return (
                                    <div className="flex flex-col items-center space-y-1">
                                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                                        paymentStatus?.isPaid
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                      }`}>
                                        {paymentStatus?.isPaid ? '✅' : '❌'}
                                      </span>
                                      {paymentStatus?.paymentNote && (
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                          {paymentStatus.paymentNote}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              {currentMonthDates.map((date) => {
                                const attendanceRecord = attendanceHistory.find((record: any) => 
                                  record.studentId === student.id && 
                                  record.attendanceDate?.split('T')[0] === date
                                );
                                
                                return (
                                  <td key={date} className="border border-gray-300 dark:border-gray-600 p-1 text-center">
                                    <div
                                      className={`w-8 h-8 rounded text-xs font-bold flex items-center justify-center ${
                                        attendanceRecord?.status === 'present' 
                                          ? 'bg-green-500 text-white' 
                                          : attendanceRecord?.status === 'absent'
                                          ? 'bg-red-500 text-white'
                                          : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                      }`}
                                      title={`${student.name} - ${date} - ${
                                        attendanceRecord?.status === 'present' ? 'حاضر' : 
                                        attendanceRecord?.status === 'absent' ? 'غائب' : 'غير مسجل'
                                      }`}
                                    >
                                      {attendanceRecord?.status === 'present' ? '✓' : 
                                       attendanceRecord?.status === 'absent' ? '✗' : '?'}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Monthly Statistics */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-green-800 dark:text-green-300">حضور الشهر</h5>
                          <p className="text-xl font-bold text-green-900 dark:text-green-100">
                            {Array.isArray(attendanceHistory) ? 
                              attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return record.status === 'present' && 
                                       currentMonthDates.includes(recordDate) && 
                                       isCurrentUserRecord;
                              }).length : 0}
                          </p>
                        </div>
                        <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-red-800 dark:text-red-300">غياب الشهر</h5>
                          <p className="text-xl font-bold text-red-900 dark:text-red-100">
                            {Array.isArray(attendanceHistory) ? 
                              attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return record.status === 'absent' && 
                                       currentMonthDates.includes(recordDate) && 
                                       isCurrentUserRecord;
                              }).length : 0}
                          </p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                          <h5 className="font-medium text-blue-800 dark:text-blue-300">نسبة حضور الشهر</h5>
                          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                            {(() => {
                              if (!Array.isArray(attendanceHistory)) return 0;
                              const monthRecords = attendanceHistory.filter((record: any) => {
                                const recordDate = record.attendanceDate?.split('T')[0];
                                const isCurrentUserRecord = (userRole === 'student' || userRole === 'child') 
                                  ? record.studentId === currentUserId 
                                  : true;
                                return currentMonthDates.includes(recordDate) && isCurrentUserRecord;
                              });
                              const presentCount = monthRecords.filter(record => record.status === 'present').length;
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
                  )
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">لا توجد حصص مجدولة لهذه المجموعة</p>
                    <p className="text-sm text-gray-500 mt-2">يجب ربط المجموعة بجدول الحصص أولاً</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">لا يوجد طلاب مسجلين في هذه المجموعة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}