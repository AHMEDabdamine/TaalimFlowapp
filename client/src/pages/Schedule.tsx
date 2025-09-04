import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Edit2, Trash2, X, User, Link, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface ScheduleTable {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleCell {
  id: number;
  dayOfWeek: number;
  period: number;
  duration: number;
  startTime?: string;
  endTime?: string;
  educationLevel: string;
  grade?: string;
  gender?: string; // 'male', 'female', 'mixed'
  subject: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
  } | null;
  teacher: {
    id: number;
    name: string;
    gender: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade?: string;
}

interface Teacher {
  id: number;
  name: string;
  gender: string;
  specializations: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
    grade: string;
  }[];
}

interface Teacher {
  id: number;
  name: string;
  gender: string;
  email: string;
  phone: string;
  role: string;
  specializations: {
    id: number;
    name: string;
    nameAr: string;
    educationLevel: string;
    grade?: string;
  }[];
}

export default function Schedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showTableForm, setShowTableForm] = useState(false);
  const [showCellForm, setShowCellForm] = useState(false);
  const [editingTable, setEditingTable] = useState<ScheduleTable | null>(null);
  const [editingCell, setEditingCell] = useState<ScheduleCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: number; period: number } | null>(null);
  
  // Group linking state
  const [showGroupLinkModal, setShowGroupLinkModal] = useState(false);
  const [linkingCell, setLinkingCell] = useState<ScheduleCell | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  
  // Days of the week (starting with Friday) and time slots (30-minute intervals)
  const daysOfWeek = ['الجمعة', 'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = [
    { period: 1, time: '8:00', label: '8:00' },
    { period: 2, time: '8:30', label: '8:30' },
    { period: 3, time: '9:00', label: '9:00' },
    { period: 4, time: '9:30', label: '9:30' },
    { period: 5, time: '10:00', label: '10:00' },
    { period: 6, time: '10:30', label: '10:30' },
    { period: 7, time: '11:00', label: '11:00' },
    { period: 8, time: '11:30', label: '11:30' },
    { period: 9, time: '12:00', label: '12:00' },
    { period: 10, time: '12:30', label: '12:30' },
    { period: 11, time: '13:00', label: '13:00' },
    { period: 12, time: '13:30', label: '13:30' },
    { period: 13, time: '14:00', label: '14:00' },
    { period: 14, time: '14:30', label: '14:30' },
    { period: 15, time: '15:00', label: '15:00' },
    { period: 16, time: '15:30', label: '15:30' },
    { period: 17, time: '16:00', label: '16:00' },
    { period: 18, time: '16:30', label: '16:30' },
    { period: 19, time: '17:00', label: '17:00' },
    { period: 20, time: '17:30', label: '17:30' },
    { period: 21, time: '18:00', label: '18:00' },
    { period: 22, time: '18:30', label: '18:30' },
    { period: 23, time: '19:00', label: '19:00' },
    { period: 24, time: '19:30', label: '19:30' },
    { period: 25, time: '20:00', label: '20:00' },
    { period: 26, time: '20:30', label: '20:30' },
    { period: 27, time: '21:00', label: '21:00' },
    { period: 28, time: '21:30', label: '21:30' },
    { period: 29, time: '22:00', label: '22:00' },
    { period: 30, time: '22:30', label: '22:30' },
  ];
  
  // Education levels with detailed grades
  const educationLevels = [
    { 
      level: 'الابتدائي', 
      grades: ['الأولى ابتدائي', 'الثانية ابتدائي', 'الثالثة ابتدائي', 'الرابعة ابتدائي', 'الخامسة ابتدائي']
    },
    { 
      level: 'المتوسط', 
      grades: ['الأولى متوسط', 'الثانية متوسط', 'الثالثة متوسط', 'الرابعة متوسط']
    },
    { 
      level: 'الثانوي', 
      grades: ['الأولى ثانوي', 'الثانية ثانوي', 'الثالثة ثانوي']
    }
  ];
  
  const [tableForm, setTableForm] = useState({ name: '', description: '' });
  const [cellForm, setCellForm] = useState({
    educationLevel: '',
    grade: '',
    gender: '',
    subjectId: '',
    teacherId: '',
    duration: 1,
    day: '',
    period: '',
    startTime: '',
    endTime: ''
  });

  const durationOptions = [
    { value: 1, label: '1.5 ساعة' },
    { value: 2, label: '2 ساعات' },
    { value: 3, label: '3 ساعات' },
    { value: 4, label: '4.5 ساعات' }
  ];

  // Get level colors function
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'all':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-700',
          text: 'text-yellow-800 dark:text-yellow-200',
          badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
        };
      case 'الابتدائي':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          text: 'text-green-800 dark:text-green-200',
          badge: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
        };
      case 'المتوسط':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-200',
          badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
        };
      case 'الثانوي':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-purple-200 dark:border-purple-700',
          text: 'text-purple-800 dark:text-purple-200',
          badge: 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-700/20',
          border: 'border-gray-200 dark:border-gray-700',
          text: 'text-gray-800 dark:text-gray-200',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        };
    }
  };

  // Simple level and year format with gender (same as Groups page)
  const getSimpleLevelFormat = (educationLevel: string, grade?: string, subject?: any, gender?: string): string => {
    let levelShort = '';
    
    if (educationLevel === 'all') return 'جميع المستويات';
    else if (educationLevel === 'الثانوي') levelShort = 'ثانوي';
    else if (educationLevel === 'المتوسط') levelShort = 'متوسط';
    else if (educationLevel === 'الابتدائي') levelShort = 'ابتدائي';
    else return educationLevel;
    
    let yearNumber = '';
    
    // Extract year number from grade if available
    if (grade) {
      if (grade.includes('الثالثة') || grade.includes('3')) yearNumber = ' 3';
      else if (grade.includes('الثانية') || grade.includes('2')) yearNumber = ' 2';  
      else if (grade.includes('الأولى') || grade.includes('1')) yearNumber = ' 1';
      else if (grade.includes('الرابعة') || grade.includes('4')) yearNumber = ' 4';
      else if (grade.includes('الخامسة') || grade.includes('5')) yearNumber = ' 5';
    }
    
    // If no grade, try to infer from subject specialization
    if (!yearNumber && subject) {
      const subjectName = (subject.nameAr || subject.name || '').toLowerCase();
      
      if (educationLevel === 'الثانوي') {
        // 3rd year secondary specializations
        if (subjectName.includes('اقتصاد') || subjectName.includes('مناجمنت') || subjectName.includes('تسيير')) {
          yearNumber = ' 3';
        }
        else if (subjectName.includes('هندسة') || subjectName.includes('تقني')) {
          yearNumber = ' 3';
        }
        else if (subjectName.includes('علوم طبيعية') || subjectName.includes('فيزياء') || subjectName.includes('كيمياء') || subjectName.includes('أحياء')) {
          yearNumber = ' 3';
        }
        else if (subjectName.includes('رياضيات') || subjectName.includes('رياضة')) {
          yearNumber = ' 3';
        }
        else if (subjectName.includes('آداب') || subjectName.includes('فلسفة') || subjectName.includes('تاريخ وجغرافيا')) {
          yearNumber = ' 3';
        }
        else if (subjectName.includes('لغات أجنبية') || subjectName.includes('إنجليزية') || subjectName.includes('فرنسية')) {
          yearNumber = ' 3';
        }
      }
      
      if (educationLevel === 'المتوسط') {
        if (subjectName.includes('تاريخ') || subjectName.includes('جغرافيا')) {
          yearNumber = ' 4';
        }
        else if (subjectName.includes('فيزياء') || subjectName.includes('علوم طبيعية')) {
          yearNumber = ' 4';
        }
      }
      
      if (educationLevel === 'الابتدائي') {
        if (subjectName.includes('علوم') || subjectName.includes('طبيعة')) {
          yearNumber = ' 5';
        }
        else if (subjectName.includes('تاريخ') || subjectName.includes('جغرافيا')) {
          yearNumber = ' 4';
        }
      }
    }
    
    // Add gender information if available
    let genderText = '';
    if (gender) {
      if (gender === 'male') genderText = ' - ذكور';
      else if (gender === 'female') genderText = ' - إناث';
      else if (gender === 'mixed') genderText = ' - مختلط';
    }
    
    return `${levelShort}${yearNumber}${genderText}`;
  };

  // Fetch schedule tables
  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['/api/schedule-tables']
  });

  // Fetch schedule cells for selected table
  const { data: cells = [], isLoading: cellsLoading } = useQuery({
    queryKey: [`/api/schedule-cells/${selectedTable}`],
    enabled: selectedTable !== null
  });

  // Fetch teaching modules
  const { data: modules = [] } = useQuery({
    queryKey: ['/api/teaching-modules']
  });

  // Fetch teachers with specializations
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/teachers-with-specializations']
  });

  // Memoized filtered subjects for performance optimization
  const filteredSubjects = useMemo(() => {
    if (!modules || modules.length === 0) return [];
    
    // Filter modules by education level and grade
    let filtered = modules.filter((module: TeachingModule) => {
      // Match education level (both Arabic and English formats)
      const levelMatch = cellForm.educationLevel === '' || 
        cellForm.educationLevel === 'all' ||
        module.educationLevel === cellForm.educationLevel ||
        (cellForm.educationLevel === 'الابتدائي' && module.educationLevel === 'Primary') ||
        (cellForm.educationLevel === 'المتوسط' && module.educationLevel === 'Middle') ||
        (cellForm.educationLevel === 'الثانوي' && module.educationLevel === 'Secondary');
      
      if (!levelMatch) return false;
      
      // Match grade if selected
      if (cellForm.grade && module.grade) {
        return module.grade === cellForm.grade || module.grade === 'جميع المستويات';
      }
      
      return true;
    });
    
    // Remove duplicates by Arabic name
    const uniqueModules = filtered.reduce((acc: TeachingModule[], current: TeachingModule) => {
      const existingModule = acc.find(m => m.nameAr === current.nameAr);
      if (!existingModule) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Sort alphabetically by Arabic name
    return uniqueModules.sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
  }, [modules, cellForm.educationLevel, cellForm.grade]);

  // Memoized filtered teachers for performance optimization  
  const filteredTeachers = useMemo(() => {
    if (!teachers || teachers.length === 0) return [];
    
    // If no education level selected or "all levels" selected, show all teachers
    if (cellForm.educationLevel === '' || cellForm.educationLevel === 'all') return teachers;
    
    const matchingTeachers = teachers.filter((teacher: Teacher) => {
      // If teacher has no specializations, show them (they can be assigned to any level)
      if (!teacher.specializations || teacher.specializations.length === 0) return true;
      
      // If teacher has specializations, check if any match the selected level
      return teacher.specializations.some(spec => 
        spec.educationLevel === cellForm.educationLevel ||
        (cellForm.educationLevel === 'الابتدائي' && spec.educationLevel === 'Primary') ||
        (cellForm.educationLevel === 'المتوسط' && spec.educationLevel === 'Middle') ||
        (cellForm.educationLevel === 'الثانوي' && spec.educationLevel === 'Secondary')
      );
    });
    
    // If no matching teachers found, return all teachers
    return matchingTeachers.length > 0 ? matchingTeachers : teachers;
  }, [teachers, cellForm.educationLevel]);

  // Memoized available grades for the selected education level
  const availableGrades = useMemo(() => {
    if (!cellForm.educationLevel) return [];
    
    const level = educationLevels.find(level => level.level === cellForm.educationLevel);
    return level ? level.grades : [];
  }, [cellForm.educationLevel]);

  // Fetch compatible groups for linking
  const { data: compatibleGroups = [] } = useQuery({
    queryKey: ['/api/groups/compatible', linkingCell?.subject?.id, linkingCell?.teacher?.id, linkingCell?.educationLevel],
    queryFn: async () => {
      if (!linkingCell?.subject?.id || !linkingCell?.teacher?.id || !linkingCell?.educationLevel) {
        return [];
      }
      
      const params = new URLSearchParams({
        subjectId: linkingCell.subject.id.toString(),
        teacherId: linkingCell.teacher.id.toString(),
        educationLevel: linkingCell.educationLevel || 'all'
      });
      
      const response = await apiRequest('GET', `/api/groups/compatible?${params.toString()}`);
      return await response.json();
    },
    enabled: !!linkingCell && !!linkingCell.subject?.id && !!linkingCell.teacher?.id,
  });

  // Fetch linked groups for all cells
  const { data: linkedGroups = [] } = useQuery({
    queryKey: ['/api/schedule-cells/linked-groups', selectedTable],
    enabled: selectedTable !== null,
  });

  // Create schedule table
  const createTableMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating table with data:', data);
      const result = await apiRequest('POST', '/api/schedule-tables', data);
      console.log('Table created successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Table creation successful, refreshing queries...');
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      queryClient.refetchQueries({ queryKey: ['/api/schedule-tables'] });
      setShowTableForm(false);
      setTableForm({ name: '', description: '' });
      console.log('Modal closed and form reset');
    },
    onError: (error) => {
      console.error('Error creating schedule table:', error);
      alert('حدث خطأ في إنشاء الجدول. تأكد من تسجيل الدخول كمدير.');
    }
  });

  // Update schedule table
  const updateTableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/schedule-tables/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      setEditingTable(null);
      setTableForm({ name: '', description: '' });
    },
    onError: (error) => {
      console.error('Error updating schedule table:', error);
      alert('حدث خطأ في تحديث الجدول. تأكد من تسجيل الدخول كمدير.');
    }
  });

  // Delete schedule table
  const deleteTableMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/schedule-tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-tables'] });
      setSelectedTable(null);
    }
  });

  // Create schedule cell
  const createCellMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating cell with data:', data);
      const result = await apiRequest('POST', '/api/schedule-cells', data);
      console.log('Cell created successfully:', result);
      return result;
    },
    onSuccess: () => {
      console.log('Cell creation successful, refreshing queries...');
      queryClient.invalidateQueries({ queryKey: [`/api/schedule-cells/${selectedTable}`] });
      queryClient.refetchQueries({ queryKey: [`/api/schedule-cells/${selectedTable}`] });
      setShowCellForm(false);
      setSelectedCell(null);
      setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
      console.log('Cell modal closed and form reset');
    },
    onError: (error: any) => {
      console.error('Error creating schedule cell:', error);
      alert('حدث خطأ في إنشاء الحصة: ' + (error.message || 'خطأ غير معروف'));
    }
  });

  // Update schedule cell
  const updateCellMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/schedule-cells/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedule-cells/${selectedTable}`] });
      setEditingCell(null);
      setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
    }
  });

  // Delete schedule cell
  const deleteCellMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/schedule-cells/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/schedule-cells/${selectedTable}`] });
    }
  });

  // Link groups to schedule cell
  const linkGroupsMutation = useMutation({
    mutationFn: async ({ cellId, groupIds }: { cellId: number; groupIds: number[] }) => {
      return await apiRequest('POST', `/api/schedule-cells/${cellId}/link-groups`, { groupIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-cells/linked-groups', selectedTable] });
      setShowGroupLinkModal(false);
      setLinkingCell(null);
      setSelectedGroups([]);
    },
    onError: (error) => {
      console.error('Error linking groups:', error);
      alert('حدث خطأ في ربط المجموعات');
    }
  });

  // Handle table form submit
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting table form:', tableForm);
    if (editingTable) {
      updateTableMutation.mutate({ id: editingTable.id, data: tableForm });
    } else {
      createTableMutation.mutate(tableForm);
    }
  };

  // Handle cell form submit
  const handleCellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedTable || !cellForm.educationLevel || !cellForm.subjectId || !cellForm.teacherId || !cellForm.day || !cellForm.startTime || !cellForm.endTime) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // Auto-calculate period based on start time matching timeSlots array (30-minute intervals)
    let period = parseInt(cellForm.period) || 1;
    if (cellForm.startTime) {
      const [hour, minute] = cellForm.startTime.split(':').map(Number);
      const timeSlot = timeSlots.find(slot => {
        const [slotHour, slotMin] = slot.time.split(':').map(Number);
        return slotHour === hour && slotMin === minute;
      });
      
      if (timeSlot) {
        period = timeSlot.period;
      }
    }

    const cellData = {
      scheduleTableId: selectedTable,
      dayOfWeek: parseInt(cellForm.day),
      period: period,
      duration: parseInt(cellForm.duration.toString()),
      startTime: cellForm.startTime || null,
      endTime: cellForm.endTime || null,
      educationLevel: cellForm.educationLevel,
      grade: cellForm.grade || null,
      gender: cellForm.gender || null,
      subjectId: parseInt(cellForm.subjectId),
      teacherId: parseInt(cellForm.teacherId),
    };

    console.log('Submitting cell data:', cellData);

    if (editingCell) {
      updateCellMutation.mutate({ id: editingCell.id, data: cellData });
    } else {
      createCellMutation.mutate(cellData);
    }
  };

  // Group linking handlers
  const openGroupLinkModal = (cell: ScheduleCell) => {
    setLinkingCell(cell);
    setShowGroupLinkModal(true);
    // Get currently linked groups for this cell
    const cellLinkedGroups = linkedGroups.filter((lg: any) => lg.scheduleCellId === cell.id);
    setSelectedGroups(cellLinkedGroups.map((lg: any) => lg.groupId));
  };

  const handleGroupToggle = (groupId: number) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleLinkGroups = () => {
    if (linkingCell) {
      linkGroupsMutation.mutate({ cellId: linkingCell.id, groupIds: selectedGroups });
    }
  };

  const getCellLinkedGroups = (cellId: number) => {
    return linkedGroups.filter((lg: any) => lg.scheduleCellId === cellId);
  };

  // Get cell at specific day/period
  const getCellAtPosition = (day: number, period: number) => {
    return cells.find(cell => cell.dayOfWeek === day && cell.period === period);
  };

  // Check if cell is occupied by a longer duration cell (horizontally)
  const isCellOccupiedHorizontally = (day: number, period: number) => {
    for (let i = 1; i < period; i++) {
      const previousCell = getCellAtPosition(day, period - i);
      if (previousCell) {
        let actualSpan = 1;
        if (previousCell.startTime && previousCell.endTime) {
          const [startHour, startMin] = previousCell.startTime.split(':').map(Number);
          const [endHour, endMin] = previousCell.endTime.split(':').map(Number);
          const startTotalMin = startHour * 60 + startMin;
          const endTotalMin = endHour * 60 + endMin;
          const durationMin = endTotalMin - startTotalMin;
          
          // Use same logic as the table rendering - based on 30-minute intervals
          actualSpan = Math.max(1, Math.ceil(durationMin / 30)); // Each slot is 30 minutes
          if (durationMin === 90) actualSpan = 3; // 1.5 hours = 3 slots
          else if (durationMin === 120) actualSpan = 4; // 2 hours = 4 slots
          else if (durationMin === 150) actualSpan = 5; // 2.5 hours = 5 slots  
          else if (durationMin === 180) actualSpan = 6; // 3 hours = 6 slots
          else if (durationMin === 210) actualSpan = 7; // 3.5 hours = 7 slots
          else if (durationMin === 240) actualSpan = 8; // 4 hours = 8 slots
          else if (durationMin === 270) actualSpan = 9; // 4.5 hours = 9 slots
        } else {
          actualSpan = previousCell.duration;
        }
        
        if (actualSpan > i) {
          return true;
        }
      }
    }
    return false;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isAdmin ? 'إدارة الجداول الدراسية' : 'الجداول الدراسية'}
        </h2>
        {isAdmin && (
          <Button 
            onClick={() => setShowTableForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            إنشاء جدول جديد
          </Button>
        )}
      </div>

      {/* Schedule Tables List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tables.map((table: ScheduleTable) => (
          <Card 
            key={table.id} 
            className={`cursor-pointer transition-all ${
              selectedTable === table.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedTable(table.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{table.name}</CardTitle>
                  {table.description && (
                    <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex space-x-reverse space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable(table);
                        setTableForm({ name: table.name, description: table.description || '' });
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('هل أنت متأكد من حذف هذا الجدول؟')) {
                          deleteTableMutation.mutate(table.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Schedule Grid */}
      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle>
              جدول: {tables.find(t => t.id === selectedTable)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowCellForm(true)}
                  className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0"
                >
                  <div className="flex items-center space-x-reverse space-x-2">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="text-sm tracking-wide">إضافة حصة جديدة</span>
                  </div>
                </Button>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
              <table className="w-full border-collapse">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="border-r border-slate-600 p-4 text-center font-bold text-white w-32 bg-slate-900">
                      <div className="flex items-center justify-center space-x-reverse space-x-2">
                        <Calendar className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm tracking-wide font-bold">اليوم</span>
                      </div>
                    </th>
                    {timeSlots.map((slot, index) => (
                      <th key={slot.period} className="border-r border-slate-600 p-1 text-center font-semibold w-12 min-w-12 bg-slate-900 hover:bg-slate-800 transition-colors duration-300">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Clock className="w-2 h-2 text-slate-900" />
                          </div>
                          <div className="text-white text-sm font-bold tracking-wide bg-blue-600 px-2 py-1 rounded shadow-md">
                            {slot.label}
                          </div>
                          <div className="text-white text-xs font-bold bg-green-600 px-1 py-0.5 rounded-full shadow-sm">
                            {parseInt(slot.time.split(':')[0]) < 12 ? 'ص' : 'م'}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-600">
                  {daysOfWeek.map((day, dayIndex) => (
                    <tr key={dayIndex} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                      <td className="border-r border-gray-200 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-700 text-center font-bold text-slate-700 dark:text-gray-200 shadow-sm">
                        <div className="flex items-center justify-center">
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-bold tracking-wide border border-slate-700">
                            {day}
                          </div>
                        </div>
                      </td>
                      {timeSlots.map((slot) => {
                        const cell = getCellAtPosition(dayIndex, slot.period);
                        const isOccupied = isCellOccupiedHorizontally(dayIndex, slot.period);
                        
                        if (isOccupied) {
                          return null;
                        }
                        
                        if (cell) {
                          const levelColors = getLevelColors(cell.educationLevel);
                          // Calculate actual column span based on start and end times with proper fractional handling
                          let actualColSpan = 1;
                          if (cell.startTime && cell.endTime) {
                            const [startHour, startMin] = cell.startTime.split(':').map(Number);
                            const [endHour, endMin] = cell.endTime.split(':').map(Number);
                            const startTotalMin = startHour * 60 + startMin;
                            const endTotalMin = endHour * 60 + endMin;
                            const durationMin = endTotalMin - startTotalMin;
                            
                            // Convert duration to column spans based on 30-minute intervals
                            // Each 30-minute slot = 1 column, so 90 minutes = 3 columns
                            actualColSpan = Math.max(1, Math.ceil(durationMin / 30)); // Each slot is 30 minutes
                            
                            // For precise durations:
                            if (durationMin === 90) actualColSpan = 3; // 1.5 hours = 3 slots
                            else if (durationMin === 120) actualColSpan = 4; // 2 hours = 4 slots
                            else if (durationMin === 150) actualColSpan = 5; // 2.5 hours = 5 slots  
                            else if (durationMin === 180) actualColSpan = 6; // 3 hours = 6 slots
                            else if (durationMin === 210) actualColSpan = 7; // 3.5 hours = 7 slots
                            else if (durationMin === 240) actualColSpan = 8; // 4 hours = 8 slots
                            else if (durationMin === 270) actualColSpan = 9; // 4.5 hours = 9 slots
                          } else {
                            // Fallback to duration field
                            actualColSpan = cell.duration;
                          }
                          
                          return (
                            <td
                              key={slot.period}
                              className={`border-r border-gray-200 dark:border-gray-600 p-1 ${levelColors.bg} relative shadow-sm hover:shadow-md transition-all duration-300 group`}
                              colSpan={actualColSpan}
                            >
                              <div className="relative h-full min-h-[60px] rounded-md p-1 bg-gradient-to-br from-white/20 dark:from-gray-800/40 to-transparent backdrop-blur-sm border border-white/30 dark:border-gray-600/30 shadow-inner">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 dark:from-gray-700/20 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="relative space-y-1">
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${levelColors.badge} shadow-sm`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current mr-1"></div>
                                    <span className="text-xs">
                                      {getSimpleLevelFormat(cell.educationLevel, cell.grade, cell.subject, cell.gender)}
                                    </span>
                                  </div>
                                  
                                  {cell.subject && (
                                    <div className="font-bold text-xs text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-gray-800/70 px-1 py-0.5 rounded shadow-sm backdrop-blur-sm">
                                      {cell.subject.nameAr}
                                    </div>
                                  )}
                                  
                                  {cell.teacher && (
                                    <div className="text-xs text-gray-700 dark:text-gray-300 bg-white/40 dark:bg-gray-800/60 px-1 py-0.5 rounded font-medium">
                                      <span className="font-bold">{cell.teacher.name}</span>
                                    </div>
                                  )}
                                  
                                  {(cell.startTime || cell.endTime) && (
                                    <div className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-50/80 dark:bg-blue-900/50 px-1 py-0.5 rounded shadow-sm border border-blue-200/50 dark:border-blue-700/50">
                                      <span className="inline-flex items-center">
                                        <Clock className="w-2 h-2 mr-1" />
                                        <span className="text-xs">
                                          {cell.startTime && cell.endTime ? 
                                            `${cell.startTime} - ${cell.endTime}` : 
                                            cell.startTime ? `من ${cell.startTime}` : 
                                            cell.endTime ? `إلى ${cell.endTime}` : ''
                                          }
                                        </span>
                                      </span>
                                    </div>
                                  )}

                                  {/* Linked Groups Display */}
                                  {getCellLinkedGroups(cell.id).length > 0 && (
                                    <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-900/50 px-1 py-0.5 rounded shadow-sm border border-purple-200/50 dark:border-purple-700/50">
                                      <span className="inline-flex items-center">
                                        <Users className="w-2 h-2 mr-1" />
                                        <span className="text-xs">
                                          {getCellLinkedGroups(cell.id).length} مجموعة
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {isAdmin && (
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/80 hover:bg-purple-100 shadow-lg backdrop-blur-sm border border-white/50 rounded-full"
                                    onClick={() => openGroupLinkModal(cell)}
                                    title="ربط المجموعات"
                                  >
                                    <Link className="w-3 h-3 text-purple-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/80 hover:bg-blue-100 shadow-lg backdrop-blur-sm border border-white/50 rounded-full"
                                    onClick={() => {
                                      setEditingCell(cell);
                                      setCellForm({
                                        educationLevel: cell.educationLevel,
                                        grade: cell.grade || '',
                                        gender: cell.gender || '',
                                        subjectId: cell.subject?.id?.toString() || '',
                                        teacherId: cell.teacher?.id?.toString() || '',
                                        duration: cell.duration,
                                        day: dayIndex.toString(),
                                        period: cell.period.toString(),
                                        startTime: cell.startTime || '',
                                        endTime: cell.endTime || ''
                                      });
                                      setShowCellForm(true);
                                    }}
                                  >
                                    <Edit2 className="w-3 h-3 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white/80 hover:bg-red-100 shadow-lg backdrop-blur-sm border border-white/50 rounded-full"
                                    onClick={() => {
                                      if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
                                        deleteCellMutation.mutate(cell.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          );
                        }
                        
                        return (
                          <td
                            key={slot.period}
                            className="border-r border-gray-200 dark:border-gray-600 p-1 text-center h-16 bg-gradient-to-br from-gray-50/50 dark:from-gray-700/50 to-white dark:to-gray-800 hover:from-gray-100/50 dark:hover:from-gray-600/50 hover:to-gray-50 dark:hover:to-gray-700 transition-all duration-300 group"
                          >
                            <div className="h-full flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 dark:from-gray-600 to-gray-300 dark:to-gray-500 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Form Modal - Admin Only */}
      {isAdmin && (showTableForm || editingTable) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {editingTable ? 'تعديل الجدول' : 'إنشاء جدول جديد'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowTableForm(false);
                  setEditingTable(null);
                  setTableForm({ name: '', description: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleTableSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tableName">اسم الجدول</Label>
                <Input
                  id="tableName"
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                  placeholder="مثال: قاعة 1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="tableDescription">الوصف (اختياري)</Label>
                <Input
                  id="tableDescription"
                  value={tableForm.description}
                  onChange={(e) => setTableForm({ ...tableForm, description: e.target.value })}
                  placeholder="وصف الجدول"
                />
              </div>
              
              <div className="flex justify-end space-x-reverse space-x-2">
                <Button 
                  type="submit" 
                  disabled={createTableMutation.isPending || updateTableMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createTableMutation.isPending || updateTableMutation.isPending 
                    ? 'جاري الحفظ...' 
                    : (editingTable ? 'حفظ التغييرات' : 'إنشاء الجدول')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cell Form Modal - Admin Only */}
      {isAdmin && (showCellForm || editingCell) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                {editingCell ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCellForm(false);
                  setEditingCell(null);
                  setSelectedCell(null);
                  setCellForm({ educationLevel: '', grade: '', gender: '', subjectId: '', teacherId: '', duration: 1, day: '', period: '', startTime: '', endTime: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <form onSubmit={handleCellSubmit} className="space-y-4">
              {/* Day Selection */}
              <div>
                <Label htmlFor="day">اليوم</Label>
                <Select
                  value={cellForm.day}
                  onValueChange={(value) => setCellForm({ ...cellForm, day: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر اليوم" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Time Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">وقت البداية</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={cellForm.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      // Automatically determine period based on start time (30-minute intervals)
                      const [hour, minute] = startTime.split(':').map(Number);
                      const timeSlot = timeSlots.find(slot => {
                        const [slotHour, slotMin] = slot.time.split(':').map(Number);
                        return slotHour === hour && slotMin === minute;
                      });
                      
                      const period = timeSlot ? timeSlot.period : 1;
                      setCellForm({ ...cellForm, startTime, period: period.toString() });
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">وقت النهاية</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={cellForm.endTime}
                    onChange={(e) => {
                      const endTime = e.target.value;
                      // Auto-calculate duration based on start and end times
                      let duration = 1;
                      if (cellForm.startTime && endTime) {
                        const [startHour, startMin] = cellForm.startTime.split(':').map(Number);
                        const [endHour, endMin] = endTime.split(':').map(Number);
                        const startTotalMin = startHour * 60 + startMin;
                        const endTotalMin = endHour * 60 + endMin;
                        const diffMin = endTotalMin - startTotalMin;
                        
                        // Convert to duration options (1=1.5h, 2=2h, 3=3h, 4=4.5h)
                        if (diffMin <= 90) duration = 1;        // 1.5h
                        else if (diffMin <= 120) duration = 2;  // 2h
                        else if (diffMin <= 180) duration = 3;  // 3h
                        else duration = 4;                      // 4.5h
                      }
                      setCellForm({ ...cellForm, endTime, duration });
                    }}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="educationLevel">المستوى التعليمي</Label>
                <Select
                  value={cellForm.educationLevel}
                  onValueChange={(value) => setCellForm({ ...cellForm, educationLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى التعليمي" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستويات</SelectItem>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.level} value={level.level}>
                        {level.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Grade Selection */}
              {cellForm.educationLevel && cellForm.educationLevel !== 'all' && (
                <div>
                  <Label htmlFor="grade">الصف</Label>
                  <Select
                    value={cellForm.grade}
                    onValueChange={(value) => setCellForm({ ...cellForm, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Gender Selection for Groups */}
              <div>
                <Label htmlFor="gender">نوع المجموعة</Label>
                <Select
                  value={cellForm.gender}
                  onValueChange={(value) => setCellForm({ ...cellForm, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكور</SelectItem>
                    <SelectItem value="female">إناث</SelectItem>
                    <SelectItem value="mixed">مختلط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subject">المادة</Label>
                {/* Grade verification info */}
                {cellForm.educationLevel && cellForm.educationLevel !== 'all' && cellForm.grade && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    📚 المواد المتاحة للصف: {cellForm.grade} - {cellForm.educationLevel}
                    {filteredSubjects.length === 0 && (
                      <div className="text-red-600 dark:text-red-400 mt-1">
                        ⚠️ لا توجد مواد متاحة لهذا الصف. تأكد من اختيار المستوى والصف الصحيح.
                      </div>
                    )}
                  </div>
                )}
                <Select
                  value={cellForm.subjectId}
                  onValueChange={(value) => setCellForm({ ...cellForm, subjectId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((module: TeachingModule) => (
                        <SelectItem key={module.id} value={module.id.toString()}>
                          {module.nameAr}
                          {/* Show grade info for verification */}
                          {module.grade && module.grade !== 'جميع المستويات' && (
                            <span className="text-xs text-gray-500 mr-2">({module.grade})</span>
                          )}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-subjects" disabled>
                        لا توجد مواد متاحة للصف المحدد
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="teacher">المعلم</Label>
                <Select
                  value={cellForm.teacherId}
                  onValueChange={(value) => setCellForm({ ...cellForm, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المعلم" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.gender === 'male' ? 'الأستاذ ' : 'الأستاذة '}{teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Duration is automatically calculated based on start and end times */}
              {cellForm.startTime && cellForm.endTime && (
                <div className="text-sm text-gray-600 dark:text-gray-300 text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  مدة الحصة: {
                    (() => {
                      const [startHour, startMin] = cellForm.startTime.split(':').map(Number);
                      const [endHour, endMin] = cellForm.endTime.split(':').map(Number);
                      const startTotalMin = startHour * 60 + startMin;
                      const endTotalMin = endHour * 60 + endMin;
                      const diffMin = endTotalMin - startTotalMin;
                      const hours = Math.floor(diffMin / 60);
                      const minutes = diffMin % 60;
                      return `${hours > 0 ? hours + ' ساعة' : ''}${minutes > 0 ? (hours > 0 ? ' و ' : '') + minutes + ' دقيقة' : ''}`;
                    })()
                  }
                </div>
              )}
              
              <div className="flex justify-end space-x-reverse space-x-2">
                <Button 
                  type="submit" 
                  disabled={createCellMutation.isPending || updateCellMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createCellMutation.isPending || updateCellMutation.isPending 
                    ? 'جاري الحفظ...' 
                    : (editingCell ? 'حفظ التغييرات' : 'إضافة الحصة')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Link Modal - Admin Only */}
      {isAdmin && showGroupLinkModal && linkingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ربط المجموعات بالحصة
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGroupLinkModal(false);
                  setLinkingCell(null);
                  setSelectedGroups([]);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Schedule Cell Info */}
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">معلومات الحصة:</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <div>المادة: {linkingCell.subject?.nameAr}</div>
                  <div>المعلم: {linkingCell.teacher?.name}</div>
                  <div>المستوى: {getSimpleLevelFormat(linkingCell.educationLevel, linkingCell.grade, linkingCell.subject, linkingCell.gender)}</div>
                  {linkingCell.startTime && linkingCell.endTime && (
                    <div>الوقت: {linkingCell.startTime} - {linkingCell.endTime}</div>
                  )}
                </div>
              </div>

              {/* Compatible Groups */}
              <div>
                <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-gray-100">المجموعات المتوافقة:</h4>
                {compatibleGroups.length > 0 ? (
                  <>
                    {/* Show match type explanation if showing fallback groups */}
                    {compatibleGroups.some((group: any) => group.matchType === 'unlinked_fallback') && (
                      <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                        <div className="text-xs text-yellow-800 dark:text-yellow-200">
                          ⚠️ لم يتم العثور على مجموعات مطابقة تماماً. يتم عرض المجموعات غير المربوطة كبديل.
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {compatibleGroups.map((group: any) => (
                        <div
                          key={group.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedGroups.includes(group.id)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
                          }`}
                          onClick={() => handleGroupToggle(group.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm dark:text-gray-200">{group.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                  <span>{group.studentsCount || 0} طالب</span>
                                  {/* Show grade and teacher in one line */}
                                  {(group.grade || group.teacherName) && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs">
                                      {group.grade && group.teacherName ? `${group.grade} - ${group.teacherName}` :
                                       group.grade ? group.grade :
                                       `المعلم: ${group.teacherName}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedGroups.includes(group.id)
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {selectedGroups.includes(group.id) && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    لا توجد مجموعات متوافقة مع هذه الحصة
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-reverse space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  onClick={handleLinkGroups}
                  disabled={linkGroupsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {linkGroupsMutation.isPending ? 'جاري الربط...' : 'ربط المجموعات'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}