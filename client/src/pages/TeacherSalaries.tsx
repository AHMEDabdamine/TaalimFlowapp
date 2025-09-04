import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Users, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  User,
  GraduationCap,
  Clock,
  Calendar,
  Calculator,
  RefreshCw,
  FileText,
  Printer,
  History
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  schoolId: number;
  profilePicture?: string;
  verified?: boolean;
  createdAt?: string;
}

interface Group {
  id: number;
  name: string;
  subjectName: string;
  subjectNameAr: string;
  educationLevel: string;
  grade: string;
  teacherId: number;
  studentsAssigned: Array<{
    id: number;
    name: string;
  }>;
}

interface BulkCalculationResult {
  month: string;
  totalTeachers: number;
  totalGroups: number;
  totalSalary: number;
  teacherBreakdown: {
    teacherId: number;
    teacherName: string;
    groupCount: number;
    salary: number;
    groups: {
      groupName: string;
      subject: string;
      level: string;
      attendance: number;
      lessons: number;
      amount: number;
      percentage: number;
      groupSalary: number;
    }[];
  }[];
}

export default function TeacherSalaries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTeacher, setExpandedTeacher] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // State for group payment settings with localStorage persistence
  const [groupPayments, setGroupPayments] = useState<{ [groupId: number]: { amount: string; teacherPercentage: string } }>(() => {
    try {
      const saved = localStorage.getItem('teacherSalariesGroupPayments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // State for bulk calculation results
  const [bulkResults, setBulkResults] = useState<BulkCalculationResult | null>(null);

  // State for individual teacher calculation results
  const [individualResults, setIndividualResults] = useState<{ [teacherId: number]: number }>({});
  const [showPaymentHistory, setShowPaymentHistory] = useState<{ [teacherId: number]: boolean }>({});
  const [selectedPayments, setSelectedPayments] = useState<{ [key: string]: boolean }>({});
  
  // Query to load existing payment statuses
  const { data: paymentStatuses } = useQuery({
    queryKey: ['/api/teacher-payment-status'],
    enabled: !!user && user.role === 'admin'
  });

  // Initialize selectedPayments based on loaded payment statuses
  useEffect(() => {
    if (paymentStatuses && Array.isArray(paymentStatuses)) {
      const paymentMap: { [key: string]: boolean } = {};
      
      // Create payment status map from the database
      paymentStatuses.forEach((status: any) => {
        const monthKey = `${status.teacherId}-${status.paymentMonth}`;
        
        // Set month-based key for payment history
        paymentMap[monthKey] = status.isPaid;
        
        // If current bulk results exist and this status matches the bulk month,
        // also set the bulk key for the bulk calculation checkbox
        if (bulkResults && status.paymentMonth === bulkResults.month) {
          const bulkKey = `${status.teacherId}-bulk`;
          paymentMap[bulkKey] = status.isPaid;
        }
      });
      
      setSelectedPayments(prev => ({
        ...prev,
        ...paymentMap
      }));
    }
  }, [paymentStatuses, bulkResults]);

  // Additional effect to sync bulk checkboxes when bulk results change
  useEffect(() => {
    if (bulkResults && paymentStatuses && Array.isArray(paymentStatuses)) {
      const updatedPayments: { [key: string]: boolean } = {};
      
      // Check if we have payment status for the bulk calculation month
      bulkResults.teacherBreakdown.forEach((result) => {
        const monthKey = `${result.teacherId}-${bulkResults.month}`;
        const bulkKey = `${result.teacherId}-bulk`;
        
        // Find existing payment status for this teacher and month
        const existingStatus = paymentStatuses.find(
          (status: any) => status.teacherId === result.teacherId && status.paymentMonth === bulkResults.month
        );
        
        if (existingStatus) {
          updatedPayments[bulkKey] = existingStatus.isPaid;
          updatedPayments[monthKey] = existingStatus.isPaid;
        }
      });
      
      // Update only if we have changes
      if (Object.keys(updatedPayments).length > 0) {
        setSelectedPayments(prev => ({
          ...prev,
          ...updatedPayments
        }));
      }
    }
  }, [bulkResults]);

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin'
  });

  // Fetch all groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: user?.role === 'admin'
  });

  // Generate current month dates for filtering
  const getCurrentMonthDates = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const dates = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  };

  const currentMonthDates = getCurrentMonthDates(selectedMonth);

  // Fetch attendance history for all groups (we'll process this client-side for each group)
  const { data: allGroupAttendance = {} } = useQuery<{ [groupId: number]: any[] }>({
    queryKey: ['/api/groups/all-attendance', groups.map(g => g.id)],
    queryFn: async () => {
      if (groups.length === 0) return {};
      
      const attendanceData: { [groupId: number]: any[] } = {};
      
      // Fetch attendance for each group
      await Promise.all(
        groups.map(async (group) => {
          try {
            const response = await fetch(`/api/groups/${group.id}/attendance-history`);
            if (response.ok) {
              const data = await response.json();
              attendanceData[group.id] = Array.isArray(data) ? data : [];
            } else {
              attendanceData[group.id] = [];
            }
          } catch (error) {
            console.error(`Error fetching attendance for group ${group.id}:`, error);
            attendanceData[group.id] = [];
          }
        })
      );
      
      return attendanceData;
    },
    enabled: user?.role === 'admin' && groups.length > 0
  });

  // Get scheduled lesson dates for the selected month
  const getScheduledLessonsForMonth = (groupId: number) => {
    // This should get the actual scheduled dates from the group's schedule
    // For now, we'll use the attendance data approach but filter by unique dates only
    const attendance = allGroupAttendance[groupId] || [];
    const uniqueDates = new Set();
    
    attendance.forEach((r: any) => {
      const recordDate = r.attendanceDate?.split('T')[0];
      if (currentMonthDates.includes(recordDate)) {
        uniqueDates.add(recordDate);
      }
    });
    
    return uniqueDates.size;
  };

  // Calculate monthly attendance counts for each group
  const getAttendanceCountsForGroup = (groupId: number) => {
    const attendance = allGroupAttendance[groupId] || [];
    const presentCount = attendance.filter((r: any) => {
      const recordDate = r.attendanceDate?.split('T')[0];
      return r.status === 'present' && currentMonthDates.includes(recordDate);
    }).length;
    
    // Get actual number of scheduled lessons for this month
    const scheduledLessons = getScheduledLessonsForMonth(groupId);
    
    return { present: presentCount, total: scheduledLessons };
  };

  // Handle payment input changes
  const updateGroupPayment = (groupId: number, field: 'amount' | 'teacherPercentage', value: string) => {
    const newPayments = {
      ...groupPayments,
      [groupId]: {
        ...groupPayments[groupId],
        amount: field === 'amount' ? value : groupPayments[groupId]?.amount || '',
        teacherPercentage: field === 'teacherPercentage' ? value : groupPayments[groupId]?.teacherPercentage || ''
      }
    };
    
    setGroupPayments(newPayments);
    
    // Save to localStorage
    try {
      localStorage.setItem('teacherSalariesGroupPayments', JSON.stringify(newPayments));
    } catch (error) {
      console.error('Failed to save group payments to localStorage:', error);
    }
  };

  // Calculate salaries for all teachers
  const calculateAllTeacherSalaries = () => {
    const teacherBreakdown: BulkCalculationResult['teacherBreakdown'] = [];
    let totalSalary = 0;
    let totalGroups = 0;

    filteredTeachers.forEach(teacher => {
      const teacherGroups = getTeacherGroups(teacher.id);
      let teacherSalary = 0;
      const groupDetails: BulkCalculationResult['teacherBreakdown'][0]['groups'] = [];

      teacherGroups.forEach(group => {
        const payment = groupPayments[group.id];
        const attendanceCounts = getAttendanceCountsForGroup(group.id);
        
        // Use payment data if available, otherwise use defaults for calculation
        const amount = parseFloat(payment?.amount || '1000') || 1000; // Default 1000 DZD
        const percentage = parseFloat(payment?.teacherPercentage || '50') || 50; // Default 50%
        
        // Calculate based on: (amount * percentage) / (100 * lessons_count) * total_attendance
        const lessonsCount = attendanceCounts.total;
        const totalAttendance = attendanceCounts.present;
        const groupSalary = lessonsCount > 0 ? (amount * percentage) / (100 * lessonsCount) * totalAttendance : 0;
        teacherSalary += groupSalary;

        // Add group details (show all groups, even those without payment data)
        groupDetails.push({
          groupName: group.name || group.subjectNameAr || 'مجموعة غير محددة',
          subject: group.subjectNameAr || group.subjectName || 'مادة غير محددة',
          level: group.educationLevel || 'مستوى غير محدد',
          attendance: totalAttendance,
          lessons: lessonsCount,
          amount: amount,
          percentage: percentage,
          groupSalary: groupSalary
        });
      });

      // Include ALL teachers, even those with 0 salary
      teacherBreakdown.push({
        teacherId: teacher.id,
        teacherName: teacher.name,
        groupCount: teacherGroups.length,
        salary: teacherSalary,
        groups: groupDetails
      });
      totalSalary += teacherSalary;
      totalGroups += teacherGroups.length;
    });

    // Get month name for display
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ar-DZ', { 
      year: 'numeric', 
      month: 'long',
      calendar: 'gregory'
    });

    setBulkResults({
      month: monthName,
      totalTeachers: filteredTeachers.length,
      totalGroups,
      totalSalary,
      teacherBreakdown: teacherBreakdown.sort((a, b) => b.salary - a.salary) // Sort by highest salary
    });
  };

  // Calculate salary for individual teacher
  const calculateIndividualTeacherSalary = (teacherId: number) => {
    console.log('🧮 Calculating salary for teacher:', teacherId);
    const teacherGroups = getTeacherGroups(teacherId);
    console.log('📚 Teacher groups:', teacherGroups);
    let teacherSalary = 0;

    teacherGroups.forEach(group => {
      const payment = groupPayments[group.id];
      console.log(`💰 Payment data for group ${group.id}:`, payment);
      
      if (payment?.amount && payment?.teacherPercentage) {
        const amount = parseFloat(payment.amount) || 0;
        const percentage = parseFloat(payment.teacherPercentage) || 0;
        const attendanceCounts = getAttendanceCountsForGroup(group.id);
        
        console.log(`📊 Group ${group.id} calculation data:`, {
          amount,
          percentage,
          attendanceCounts,
          lessonsCount: attendanceCounts.total,
          totalAttendance: attendanceCounts.present
        });
        
        // Calculate based on: (amount * percentage) / (100 * lessons_count) * total_attendance
        const lessonsCount = attendanceCounts.total;
        const totalAttendance = attendanceCounts.present;
        
        // Add safety check for division by zero
        if (lessonsCount === 0) {
          console.warn(`⚠️ Group ${group.id} has 0 lessons, skipping calculation`);
          return;
        }
        
        const groupSalary = (amount * percentage) / (100 * lessonsCount) * totalAttendance;
        console.log(`💵 Group ${group.id} salary calculation:`, {
          formula: `(${amount} * ${percentage}) / (100 * ${lessonsCount}) * ${totalAttendance}`,
          result: groupSalary
        });
        
        teacherSalary += groupSalary;
      } else {
        console.log(`❌ Group ${group.id} missing payment data:`, { amount: payment?.amount, percentage: payment?.teacherPercentage });
      }
    });

    console.log(`🎯 Final teacher ${teacherId} salary:`, teacherSalary);
    
    // Save payment record for history tracking
    if (teacherSalary > 0) {
      savePaymentRecord(teacherId, teacherSalary, selectedMonth);
    }
    
    setIndividualResults(prev => ({
      ...prev,
      [teacherId]: teacherSalary
    }));
  };

  // Create individual payslip function
  const createPayslip = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    const salary = individualResults[teacherId];
    
    if (!teacher || salary === undefined) {
      alert('يرجى حساب الأجر أولاً');
      return;
    }

    // Get teacher groups with comprehensive details
    const teacherGroups = groups.filter((group: Group) => group.teacherId === teacherId);
    const groupDetails = teacherGroups.map((group: Group) => {
      const payment = groupPayments[group.id];
      const counts = getAttendanceCountsForGroup(group.id);
      const scheduledLessons = getScheduledLessonsForMonth(group.id);
      
      return {
        groupName: group.name || group.subjectNameAr,
        subject: group.subjectNameAr || group.subjectName,
        level: group.educationLevel,
        grade: group.grade,
        students: group.studentsAssigned?.length || 0,
        attendance: counts.present,
        lessons: scheduledLessons || counts.total,
        amount: payment?.amount || 0,
        percentage: payment?.teacherPercentage || 0
      };
    });

    // Generate comprehensive payslip data
    const payslipData = {
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      month: selectedMonth,
      totalSalary: salary,
      groups: groupDetails,
      generatedAt: new Date().toLocaleDateString('ar-DZ', { 
        calendar: 'gregory',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      schoolInfo: JSON.parse(localStorage.getItem('selectedSchool') || '{}')
    };

    // Store payslip data for history tracking
    const paymentHistoryKey = `teacherPaymentHistory_${teacherId}`;
    const existingHistory = JSON.parse(localStorage.getItem(paymentHistoryKey) || '[]');
    
    // Check if payslip for this month already exists
    const existingPayslipIndex = existingHistory.findIndex((p: any) => p.month === selectedMonth);
    
    if (existingPayslipIndex >= 0) {
      // Update existing payslip
      existingHistory[existingPayslipIndex] = {
        ...payslipData,
        amount: salary,
        paidDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new payslip
      existingHistory.push({
        ...payslipData,
        amount: salary,
        paidDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    
    localStorage.setItem(paymentHistoryKey, JSON.stringify(existingHistory));
    localStorage.setItem('currentPayslip', JSON.stringify(payslipData));
    
    // Show enhanced success message
    toast({
      title: 'تم إنشاء كشف الراتب بنجاح',
      description: `كشف راتب ${teacher.name} لشهر ${selectedMonth} - ${salary.toLocaleString()} دج`,
      variant: 'default'
    });
  };

  // Print individual payslip function
  const printPayslip = (teacherId: number) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    const salary = individualResults[teacherId];
    
    if (!teacher || salary === undefined) {
      alert('يرجى حساب الأجر أولاً');
      return;
    }

    // Get teacher groups with comprehensive details
    const teacherGroups = groups.filter((group: Group) => group.teacherId === teacherId);
    const groupDetails = teacherGroups.map((group: Group) => {
      const payment = groupPayments[group.id];
      const counts = getAttendanceCountsForGroup(group.id);
      const scheduledLessons = getScheduledLessonsForMonth(group.id);
      
      return {
        groupName: group.name || group.subjectNameAr,
        subject: group.subjectNameAr || group.subjectName,
        level: group.educationLevel,
        grade: group.grade,
        students: group.studentsAssigned?.length || 0,
        attendance: counts.present,
        lessons: scheduledLessons || counts.total,
        amount: payment?.amount || 0,
        percentage: payment?.teacherPercentage || 0
      };
    });

    // Create printable HTML content using unified template
    const printContent = generateUnifiedPayslipHTML(teacher, salary, groupDetails, selectedMonth);
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Generate unified payslip HTML template with comprehensive information
  const generateUnifiedPayslipHTML = (teacher: any, salary: number, teacherGroups: any[], month: string, issuedDate?: string) => {
    const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || '{}');
    const schoolName = selectedSchool.name || 'المؤسسة التعليمية';
    const schoolLogo = selectedSchool.logoUrl;
    const currentDate = issuedDate || new Date().toLocaleDateString('ar-DZ', { 
      calendar: 'gregory', 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const groupRows = teacherGroups.map((group) => {
      const groupSalary = (group.amount * group.percentage) / (100 * group.lessons) * group.attendance;
      
      return `
        <tr>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: right; font-weight: 500;">${group.groupName}</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center;">${group.subject}</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center; font-size: 11px;">${group.level}${group.grade ? ' - ' + group.grade : ''}</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center; color: #2563eb; font-weight: bold;">${group.attendance}</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center; color: #ea580c; font-weight: bold;">${group.lessons}</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center;">${group.amount.toLocaleString()} دج</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center;">${group.percentage}%</td>
          <td style="border: 1px solid #2563eb; padding: 8px; text-align: center; background-color: #dbeafe; font-weight: bold; color: #059669;">${groupSalary.toLocaleString()} دج</td>
        </tr>
      `;
    }).join('');

    const totalStudents = teacherGroups.reduce((total, group) => total + (group.students || 0), 0);
    const totalGroups = teacherGroups.length;
    const totalAttendance = teacherGroups.reduce((total, group) => total + group.attendance, 0);
    const totalLessons = teacherGroups.reduce((total, group) => total + group.lessons, 0);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف راتب - ${teacher.name} - ${month}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
          
          body { 
            font-family: 'Noto Sans Arabic', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            direction: rtl; 
            background: white;
            font-size: 14px;
            line-height: 1.4;
          }
          
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid #2563eb;
            border-radius: 8px;
            overflow: hidden;
            background: white;
          }
          
          .header { 
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            color: white;
            text-align: center; 
            padding: 20px;
            position: relative;
          }
          
          .school-logo {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 3px solid white;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .school-logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .school-name { 
            font-size: 24px; 
            font-weight: 700; 
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .document-title { 
            font-size: 20px; 
            font-weight: 600;
            opacity: 0.95;
          }
          
          .teacher-info {
            padding: 20px;
            background: #f8fafc;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
            font-size: 12px;
          }
          
          .info-value {
            font-weight: 500;
            color: #1f2937;
            font-size: 14px;
          }
          
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 15px;
          }
          
          .stat-item {
            background: #2563eb;
            color: white;
            padding: 8px;
            border-radius: 6px;
            text-align: center;
          }
          
          .stat-number {
            font-size: 16px;
            font-weight: 700;
            display: block;
          }
          
          .stat-label {
            font-size: 10px;
            opacity: 0.9;
            margin-top: 2px;
          }
          
          .groups-section {
            padding: 20px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #2563eb;
          }
          
          .groups-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .groups-table th {
            background: #2563eb;
            color: white;
            font-weight: 600;
            padding: 12px 8px;
            text-align: center;
            font-size: 12px;
            border: 1px solid #1e40af;
          }
          
          .groups-table td {
            padding: 10px 8px;
            font-size: 12px;
            border: 1px solid #2563eb;
          }
          
          .groups-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .groups-table tbody tr:hover {
            background-color: #e0e7ff;
          }
          
          .total-section { 
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            padding: 20px;
            margin: 20px;
            border-radius: 8px;
            border: 2px solid #2563eb;
            text-align: center;
          }
          
          .total-label {
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 8px;
          }
          
          .total-amount { 
            font-size: 28px; 
            font-weight: 700; 
            color: #1e40af;
            text-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
          }
          
          .footer { 
            padding: 20px;
            background: #f9fafb;
            border-top: 2px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 20px;
          }
          
          .signature-line {
            border-bottom: 2px solid #6b7280;
            height: 40px;
            margin-bottom: 8px;
          }
          
          @media print { 
            body { margin: 0; padding: 10px; }
            .payslip-container { border: 2px solid #2563eb; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            ${schoolLogo ? `
              <div class="school-logo">
                <img src="${schoolLogo}" alt="${schoolName}" />
              </div>
            ` : ''}
            <div class="school-name">${schoolName}</div>
            <div class="document-title">كشف راتب المعلم</div>
          </div>
          
          <div class="teacher-info">
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">اسم الأستاذ</div>
                <div class="info-value">${teacher.name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">الشهر</div>
                <div class="info-value">${month}</div>
              </div>
            </div>
            
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-number">${totalGroups}</span>
                <div class="stat-label">مجموعة</div>
              </div>
              <div class="stat-item">
                <span class="stat-number">${totalStudents}</span>
                <div class="stat-label">طالب</div>
              </div>
              <div class="stat-item">
                <span class="stat-number">${totalAttendance}</span>
                <div class="stat-label">إجمالي الحضور</div>
              </div>
              <div class="stat-item">
                <span class="stat-number">${totalLessons}</span>
                <div class="stat-label">إجمالي الدروس</div>
              </div>
            </div>
          </div>

          <div class="groups-section">
            <div class="section-title">تفاصيل المجموعات والأجور</div>
            <table class="groups-table">
              <thead>
                <tr>
                  <th>اسم المجموعة</th>
                  <th>المادة</th>
                  <th>المستوى والصف</th>
                  <th>الحضور</th>
                  <th>عدد الدروس</th>
                  <th>المبلغ (دج)</th>
                  <th>النسبة (%)</th>
                  <th>الأجر (دج)</th>
                </tr>
              </thead>
              <tbody>
                ${groupRows}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <div class="total-label">إجمالي الراتب الشهري</div>
            <div class="total-amount">${salary.toLocaleString()} دج</div>
          </div>
          
          <div class="footer">
            <div class="signature-box">
              <div class="signature-label">توقيع المعلم</div>
              <div class="signature-line"></div>
            </div>
            <div class="signature-box">
              <div class="signature-label">توقيع الإدارة</div>
              <div class="signature-line"></div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 10px;">التاريخ: ${currentDate}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Toggle payment history visibility
  const togglePaymentHistory = (teacherId: number) => {
    setShowPaymentHistory(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  // Get payment history for a teacher
  const getPaymentHistory = (teacherId: number) => {
    const savedPayments = localStorage.getItem('teacherPaymentHistory');
    let paymentHistory = [];
    
    if (savedPayments) {
      try {
        paymentHistory = JSON.parse(savedPayments);
      } catch (error) {
        console.error('Error parsing payment history:', error);
        return [];
      }
    }
    
    // Filter payments for this teacher
    const teacherPayments = paymentHistory.filter((payment: any) => payment.teacherId === teacherId);
    
    // Sort by date (most recent first)
    return teacherPayments.sort((a: any, b: any) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
  };

  // Save payment record (called when salary is calculated)
  const savePaymentRecord = (teacherId: number, salary: number, month: string) => {
    const savedPayments = localStorage.getItem('teacherPaymentHistory');
    let paymentHistory = [];
    
    if (savedPayments) {
      try {
        paymentHistory = JSON.parse(savedPayments);
      } catch (error) {
        console.error('Error parsing payment history:', error);
      }
    }
    
    // Get teacher groups and their details for this month
    const teacherGroups = groups.filter((group: Group) => group.teacherId === teacherId);
    const groupDetails = teacherGroups.map((group: Group) => {
      const payment = groupPayments[group.id];
      const counts = getAttendanceCountsForGroup(group.id);
      const scheduledLessons = getScheduledLessonsForMonth(group.id);
      
      return {
        groupName: group.name || group.subjectNameAr,
        subject: group.subjectNameAr,
        level: group.educationLevel,
        students: group.studentsAssigned?.length || 0,
        attendance: counts.present,
        lessons: scheduledLessons,
        amount: payment?.amount || 0,
        percentage: payment?.teacherPercentage || 0,
        groupSalary: payment?.amount && payment?.teacherPercentage ? 
          (parseFloat(payment.amount) * parseFloat(payment.teacherPercentage)) / (100 * scheduledLessons) * counts.present : 0
      };
    });
    
    // Check if payment for this teacher and month already exists
    const existingPaymentIndex = paymentHistory.findIndex(
      (payment: any) => payment.teacherId === teacherId && payment.month === month
    );
    
    const paymentRecord = {
      teacherId,
      month,
      amount: salary,
      paidDate: new Date().toISOString(),
      calculatedAt: new Date().toISOString(),
      groupsCount: teacherGroups.length,
      totalStudents: groupDetails.reduce((sum, group) => sum + group.students, 0),
      totalLessons: groupDetails.reduce((sum, group) => sum + group.lessons, 0),
      totalAttendance: groupDetails.reduce((sum, group) => sum + group.attendance, 0),
      groups: groupDetails
    };
    
    if (existingPaymentIndex >= 0) {
      // Update existing record
      paymentHistory[existingPaymentIndex] = paymentRecord;
    } else {
      // Add new record
      paymentHistory.push(paymentRecord);
    }
    
    // Save back to localStorage
    localStorage.setItem('teacherPaymentHistory', JSON.stringify(paymentHistory));
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.email && teacher.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get groups assigned to a specific teacher
  const getTeacherGroups = (teacherId: number) => {
    return groups.filter(group => group.teacherId === teacherId);
  };

  // Get total students count for a teacher
  const getTotalStudents = (teacherId: number) => {
    const teacherGroups = getTeacherGroups(teacherId);
    return teacherGroups.reduce((total, group) => total + (group.studentsAssigned?.length || 0), 0);
  };

  // Toggle expanded teacher view
  const toggleTeacherExpansion = (teacherId: number) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  // Generate month options for the selector
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    // Generate 24 months: 12 months back, current month, 11 months forward
    for (let i = -12; i <= 11; i++) {
      const targetDate = new Date(currentYear, currentMonth - 1 + i, 1);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const value = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${arabicMonths[month - 1]} ${year}`;
      options.push({ value, label });
    }
    
    return options;
  };

  const getEducationLevelColor = (level: string) => {
    switch (level) {
      case 'الابتدائي':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'المتوسط':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'الثانوي':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Create bulk payslips for all teachers
  const createBulkPayslips = () => {
    if (!bulkResults) return;
    
    const currentDate = new Date().toLocaleDateString('ar-DZ', { 
      calendar: 'gregory',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate comprehensive payslips for all teachers
    bulkResults.teacherBreakdown.forEach(teacherResult => {
      const teacher = teachers?.find(t => t.id === teacherResult.teacherId);
      if (!teacher) return;

      // Create comprehensive payslip data structure
      const payslipData = {
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        month: bulkResults.month,
        totalSalary: teacherResult.salary,
        groups: teacherResult.groups.map(group => ({
          ...group,
          // Ensure all required fields are present
          groupName: group.groupName || group.subject,
          grade: (group as any).grade || '',
          students: (group as any).students || 0
        })),
        generatedAt: currentDate,
        schoolInfo: JSON.parse(localStorage.getItem('selectedSchool') || '{}'),
        totalGroups: teacherResult.groupCount,
        batchGenerated: true
      };

      // Store payslip in payment history with enhanced structure
      const paymentHistoryKey = `teacherPaymentHistory_${teacher.id}`;
      const existingHistory = JSON.parse(localStorage.getItem(paymentHistoryKey) || '[]');
      
      // Check if payslip for this month already exists
      const existingPayslipIndex = existingHistory.findIndex((p: any) => p.month === bulkResults.month);
      
      const paymentRecord = {
        ...payslipData,
        amount: teacherResult.salary,
        paidDate: new Date().toISOString(),
        method: 'bulk',
        status: 'generated'
      };
      
      if (existingPayslipIndex >= 0) {
        // Update existing payslip
        existingHistory[existingPayslipIndex] = {
          ...paymentRecord,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new payslip
        existingHistory.push({
          ...paymentRecord,
          createdAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem(paymentHistoryKey, JSON.stringify(existingHistory));
    });

    toast({
      title: 'تم إنشاء كشوف الرواتب بنجاح',
      description: `تم إنشاء ${bulkResults.teacherBreakdown.length} كشف راتب لشهر ${bulkResults.month} بنجاح`,
      variant: 'default'
    });
  };

  // Print bulk payslips for all teachers using unified template
  const printBulkPayslips = () => {
    if (!bulkResults) return;
    
    const currentDate = new Date().toLocaleDateString('ar-DZ', { 
      calendar: 'gregory',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Generate combined print document using unified template
    let combinedHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>كشوف رواتب جماعية - ${bulkResults.month}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
            body { font-family: 'Noto Sans Arabic', Arial, sans-serif; margin: 0; padding: 10px; direction: rtl; }
            .payslip-page { page-break-after: always; margin-bottom: 20px; }
            .payslip-page:last-child { page-break-after: avoid; }
            @media print { body { margin: 0; padding: 5px; } .payslip-page { page-break-after: always; margin-bottom: 10px; } }
          </style>
        </head>
        <body>
    `;

    bulkResults.teacherBreakdown.forEach((teacherResult, index) => {
      const teacher = teachers?.find(t => t.id === teacherResult.teacherId);
      if (!teacher) return;

      // Prepare group details with comprehensive information
      const groupDetails = teacherResult.groups.map(group => ({
        groupName: group.groupName || group.subject,
        subject: group.subject,
        level: group.level,
        grade: (group as any).grade || '',
        students: (group as any).students || 0,
        attendance: group.attendance,
        lessons: group.lessons,
        amount: group.amount,
        percentage: group.percentage
      }));

      // Generate individual payslip using unified template
      const payslipHTML = generateUnifiedPayslipHTML(
        teacher, 
        teacherResult.salary, 
        groupDetails, 
        bulkResults.month,
        currentDate
      );

      // Extract body content from the generated HTML
      const bodyMatch = payslipHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      const bodyContent = bodyMatch ? bodyMatch[1] : payslipHTML;

      combinedHTML += `
        <div class="payslip-page">
          ${bodyContent}
        </div>
      `;
    });

    combinedHTML += '</body></html>';

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(combinedHTML);
      printWindow.document.close();
      
      // Add a small delay before printing to ensure content is fully loaded
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    
    toast({
      title: 'تم فتح كشوف الرواتب للطباعة',
      description: `تم إعداد ${bulkResults.teacherBreakdown.length} كشف راتب للطباعة`,
      variant: 'default'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">أجور الأساتذة</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">إدارة أجور المعلمين ومجموعاتهم المكلفين بها</p>
          </div>
        </div>

        {/* Search and Month Selector */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 w-full md:w-48">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر الشهر" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="البحث عن معلم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filteredTeachers.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المعلمين</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{groups.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي المجموعات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {groups.reduce((total, group) => total + (group.studentsAssigned?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">إجمالي الطلاب</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Calculation Button */}
      <div className="mb-6">
        <Button
          onClick={calculateAllTeacherSalaries}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={filteredTeachers.length === 0 || teachersLoading || groupsLoading}
        >
          <Calculator className="w-4 h-4 mr-2" />
          حساب أجور جميع المعلمين
        </Button>
      </div>

      {/* Bulk Results Display */}
      {bulkResults && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            نتائج حساب الأجور - {bulkResults.month}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المعلمين</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalTeachers}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المجموعات</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalGroups}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأجور</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{bulkResults.totalSalary.toLocaleString()} دج</p>
            </div>
          </div>
          <div className="space-y-4">
            {bulkResults.teacherBreakdown.map((result) => (
              <div key={result.teacherId} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {/* Teacher Header */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments[`${result.teacherId}-bulk`] || false}
                        onChange={async (e) => {
                          const key = `${result.teacherId}-bulk`;
                          const isChecked = e.target.checked;
                          
                          // Update checkbox state locally first
                          setSelectedPayments(prev => ({
                            ...prev,
                            [key]: isChecked
                          }));

                          // Save payment status to database
                          try {
                            await apiRequest('POST', '/api/teacher-payment-status', {
                              teacherId: result.teacherId,
                              paymentMonth: bulkResults.month,
                              isPaid: isChecked
                            });
                          } catch (statusError) {
                            console.error('Failed to save payment status:', statusError);
                            // Revert the local state if API call fails
                            setSelectedPayments(prev => ({
                              ...prev,
                              [key]: !isChecked
                            }));
                          }

                          // If checked, record as expense in gain/loss system
                          if (isChecked) {
                            try {
                              const financialEntry = {
                                type: 'loss' as const,
                                amount: result.salary.toString(),
                                remarks: `راتب ${result.teacherName} - ${bulkResults.month}`,
                                year: new Date().getFullYear(),
                                month: new Date().getMonth() + 1,
                                receiptId: null
                              };
                              
                              await apiRequest('POST', '/api/financial-entries', financialEntry);
                              
                              toast({
                                title: 'تم تسجيل المصروف بنجاح',
                                description: `تم إضافة راتب ${result.teacherName} إلى نظام الأرباح والخسائر`,
                                variant: 'default'
                              });
                            } catch (error: any) {
                              console.error('Failed to record salary payment as expense:', error);
                              
                              toast({
                                title: 'خطأ في تسجيل المصروف',
                                description: 'فشل في تسجيل راتب المعلم في نظام الأرباح والخسائر',
                                variant: 'destructive'
                              });
                              
                              // Uncheck the checkbox since the operation failed
                              setSelectedPayments(prev => ({
                                ...prev,
                                [key]: false
                              }));
                            }
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <h5 className="font-bold text-blue-800 dark:text-blue-200">
                          {result.teacherName}
                        </h5>
                        <p className="text-xs text-blue-600 dark:text-blue-300">
                          {result.groupCount} مجموعات
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        {result.salary.toLocaleString()} دج
                      </span>
                      <p className="text-xs text-blue-600 dark:text-blue-300">إجمالي الراتب</p>
                    </div>
                  </div>
                </div>

                {/* Groups Details Table */}
                {result.groups && result.groups.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">اسم المجموعة</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المادة</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المستوى</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">الحضور</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">عدد الدروس</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المبلغ</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">النسبة</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">الأجر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.groups.map((group, groupIndex) => (
                          <tr key={groupIndex} className="border-t border-gray-200 dark:border-gray-600">
                            <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                              {group.groupName}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                              {group.subject}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                              {group.level}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-blue-600 dark:text-blue-400">
                              {group.attendance}
                            </td>
                            <td className="px-3 py-2 text-center font-medium text-orange-600 dark:text-orange-400">
                              {group.lessons}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                              {group.amount} دج
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                              {group.percentage}%
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                              {group.groupSalary.toLocaleString()} دج
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Bulk Actions */}
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700 flex justify-center gap-4">
            <Button
              onClick={createBulkPayslips}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!bulkResults || bulkResults.teacherBreakdown.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              إنشاء كشوف رواتب جماعية
            </Button>
            
            <Button
              onClick={printBulkPayslips}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              disabled={!bulkResults || bulkResults.teacherBreakdown.length === 0}
            >
              <Printer className="w-4 h-4 mr-2" />
              طباعة الكشوف الجماعية
            </Button>
          </div>
        </div>
      )}

      {/* Teachers List */}
      <div className="space-y-4">
        {teachersLoading || groupsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد معلمين</p>
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => {
            const teacherGroups = getTeacherGroups(teacher.id);
            const totalStudents = getTotalStudents(teacher.id);
            const isExpanded = expandedTeacher === teacher.id;

            return (
              <Card key={teacher.id} className="border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Teacher Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {teacher.name}
                          </h3>
                        </div>
                        {teacher.email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Summary Stats */}
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Badge variant="secondary">{teacherGroups.length}</Badge>
                          <span className="text-sm text-gray-500">المجموعات:</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <Badge variant="secondary">{totalStudents}</Badge>
                          <span className="text-sm text-gray-500">الطلاب:</span>
                        </div>
                      </div>

                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTeacherExpansion(teacher.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">

                      {/* Assigned Groups */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          المجموعات المكلف بها ({teacherGroups.length})
                        </h4>
                        
                        {teacherGroups.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">لا توجد مجموعات مكلف بها</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teacherGroups.map((group) => (
                              <div
                                key={group.id}
                                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {group.name}
                                  </h5>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getEducationLevelColor(group.educationLevel)}`}
                                  >
                                    {group.educationLevel}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <BookOpen className="w-3 h-3 inline mr-1" />
                                    {group.subjectNameAr || group.subjectName}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <Users className="w-3 h-3 inline mr-1" />
                                    {group.studentsAssigned?.length || 0} طالب
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    الحضور: <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {(() => {
                                        const counts = getAttendanceCountsForGroup(group.id);
                                        return `${counts.present}`;
                                      })()}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 ml-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      {(() => {
                                        const counts = getAttendanceCountsForGroup(group.id);
                                        return `${counts.total} دروس`;
                                      })()}
                                    </span>
                                  </p>
                                  {group.grade && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      <GraduationCap className="w-3 h-3 inline mr-1" />
                                      {group.grade}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Payment Settings */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      المبلغ المدفوع (دج)
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={groupPayments[group.id]?.amount || ''}
                                      onChange={(e) => updateGroupPayment(group.id, 'amount', e.target.value)}
                                      className="h-8 text-xs"
                                      min="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      نسبة الأستاذ (%)
                                    </label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={groupPayments[group.id]?.teacherPercentage || ''}
                                      onChange={(e) => updateGroupPayment(group.id, 'teacherPercentage', e.target.value)}
                                      className="h-8 text-xs"
                                      min="0"
                                      max="100"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Individual Teacher Calculation Result */}
                      {individualResults[teacher.id] !== undefined && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              إجمالي الأجر لشهر {selectedMonth}:
                            </span>
                            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {individualResults[teacher.id].toLocaleString()} دج
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => calculateIndividualTeacherSalary(teacher.id)}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          حساب الأجر
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => togglePaymentHistory(teacher.id)}
                        >
                          <History className="w-4 h-4 mr-2" />
                          الأشهر المدفوعة
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => createPayslip(teacher.id)}
                          disabled={individualResults[teacher.id] === undefined}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          إنشاء كشف راتب
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => printPayslip(teacher.id)}
                          disabled={individualResults[teacher.id] === undefined}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          طباعة
                        </Button>
                      </div>

                      {/* Payment History Section */}
                      {showPaymentHistory[teacher.id] && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                            <History className="w-4 h-4 mr-2" />
                            سجل المدفوعات
                          </h4>
                          {(() => {
                            const paymentHistory = getPaymentHistory(teacher.id);
                            if (paymentHistory.length === 0) {
                              return (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                  لا توجد سجلات دفع سابقة
                                </p>
                              );
                            }
                            return (
                              <div className="space-y-4">
                                {paymentHistory.map((payment: any, index: number) => (
                                  <div key={index} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                    {/* Header */}
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="checkbox"
                                            checked={selectedPayments[`${teacher.id}-${payment.month}`] || false}
                                            onChange={async (e) => {
                                              const key = `${teacher.id}-${payment.month}`;
                                              const isChecked = e.target.checked;
                                              
                                              // Update checkbox state locally first
                                              setSelectedPayments(prev => ({
                                                ...prev,
                                                [key]: isChecked
                                              }));

                                              // Save payment status to database
                                              try {
                                                await apiRequest('POST', '/api/teacher-payment-status', {
                                                  teacherId: teacher.id,
                                                  paymentMonth: payment.month,
                                                  isPaid: isChecked
                                                });
                                                console.log('Payment status saved successfully');
                                              } catch (statusError) {
                                                console.error('Failed to save payment status:', statusError);
                                                // Optionally revert the local state if API call fails
                                                setSelectedPayments(prev => ({
                                                  ...prev,
                                                  [key]: !isChecked
                                                }));
                                              }

                                              // If checked, record as expense in gain/loss system
                                              if (isChecked) {
                                                try {
                                                  const teacherName = teachers?.find(t => t.id === teacher.id)?.name || 'معلم غير محدد';
                                                  const paymentDate = new Date(payment.paidDate);
                                                  
                                                  const financialEntry = {
                                                    type: 'loss' as const,
                                                    amount: payment.amount.toString(),
                                                    remarks: `راتب ${teacherName} - ${payment.month}`,
                                                    year: paymentDate.getFullYear(),
                                                    month: paymentDate.getMonth() + 1,
                                                    receiptId: null
                                                  };
                                                  
                                                  console.log('Sending financial entry:', financialEntry);
                                                  
                                                  await apiRequest('POST', '/api/financial-entries', financialEntry);
                                                  console.log('Financial entry created successfully');
                                                  
                                                  // Show success toast
                                                  toast({
                                                    title: 'تم تسجيل المصروف بنجاح',
                                                    description: `تم إضافة راتب ${teacherName} إلى نظام الأرباح والخسائر`,
                                                    variant: 'default'
                                                  });
                                                } catch (error: any) {
                                                  console.error('Failed to record salary payment as expense:', error);
                                                  
                                                  // Extract error message from the thrown error
                                                  let errorMessage = 'فشل في تسجيل راتب المعلم في نظام الأرباح والخسائر';
                                                  if (error.message) {
                                                    errorMessage = error.message.includes('HTTP error!') 
                                                      ? error.message.split('message: ')[1] || errorMessage
                                                      : error.message;
                                                  }
                                                  
                                                  toast({
                                                    title: 'خطأ في تسجيل المصروف',
                                                    description: errorMessage,
                                                    variant: 'destructive'
                                                  });
                                                  
                                                  // Uncheck the checkbox since the operation failed
                                                  setSelectedPayments(prev => ({
                                                    ...prev,
                                                    [key]: false
                                                  }));
                                                }
                                              }
                                            }}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                          />
                                          <div>
                                            <h5 className="font-bold text-blue-800 dark:text-blue-200">
                                              شهر {payment.month}
                                            </h5>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">
                                              تاريخ الحساب: {new Date(payment.paidDate).toLocaleDateString('ar-DZ')}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                            {payment.amount.toLocaleString()} دج
                                          </span>
                                          <p className="text-xs text-blue-600 dark:text-blue-300">إجمالي الراتب</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Groups Table */}
                                    {payment.groups && payment.groups.length > 0 && (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                          <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                              <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">اسم المجموعة</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المادة</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المستوى</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">الحضور</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">عدد الدروس</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">المبلغ</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">النسبة</th>
                                              <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">الأجر</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {payment.groups.map((group: any, groupIndex: number) => (
                                              <tr key={groupIndex} className="border-t border-gray-200 dark:border-gray-600">
                                                <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                                                  {group.groupName}
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                                  {group.subject}
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                                  {group.level}
                                                </td>
                                                <td className="px-3 py-2 text-center font-medium text-blue-600 dark:text-blue-400">
                                                  {group.attendance}
                                                </td>
                                                <td className="px-3 py-2 text-center font-medium text-orange-600 dark:text-orange-400">
                                                  {group.lessons}
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                                  {group.amount} دج
                                                </td>
                                                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                                                  {group.percentage}%
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                                                  {group.groupSalary ? group.groupSalary.toLocaleString() : '0'} دج
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}