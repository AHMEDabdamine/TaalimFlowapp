import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Mail, Phone, Eye, Send, CheckSquare, Square, Baby, MessageSquare, Calendar, FileText, Plus, Filter, X, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'user' | 'student';
  createdAt: string;
  children?: Child[];
  student?: Student;
}

interface Child {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
  parentId: number;
  createdAt: string;
}

interface Student {
  id: number;
  userId: number;
  educationLevel: string;
  grade: string;
  createdAt: string;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  teacherId: number;
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade?: string;
  description?: string;
}

interface TeacherUser {
  id: number;
  name: string;
  email: string;
  role: string;
  specializations?: TeacherSpecialization[];
}

interface TeacherSpecialization {
  id: number;
  teacherId: number;
  moduleId: number;
  module: TeachingModule;
}

interface FilterState {
  educationLevel: string;
  subject: string;
  assignedTeacher: string;
  role: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserMessages, setViewingUserMessages] = useState<Message[]>([]);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    educationLevel: '',
    subject: '',
    assignedTeacher: '',
    role: ''
  });
  const [bulkMessageData, setBulkMessageData] = useState({
    subject: '',
    content: ''
  });
  
  // Ban user state
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUserData, setBanUserData] = useState<{userId: number, userName: string} | null>(null);
  const [showBulkBanModal, setShowBulkBanModal] = useState(false);

  // Fetch users with search and filters
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users', searchQuery, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.educationLevel) params.append('educationLevel', filters.educationLevel);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.assignedTeacher) params.append('assignedTeacher', filters.assignedTeacher);
      if (filters.role) params.append('role', filters.role);
      
      const url = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch teaching modules for filter dropdown
  const { data: teachingModules = [] } = useQuery<TeachingModule[]>({
    queryKey: ['/api/teaching-modules'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teaching-modules');
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch teachers for filter dropdown
  const { data: teacherUsers = [] } = useQuery<TeacherUser[]>({
    queryKey: ['/api/teachers-with-specializations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teachers-with-specializations');
      return await response.json();
    },
    enabled: !!user && user.role === 'admin',
  });

  // Fetch specific user details
  const fetchUserDetails = async (userId: number) => {
    try {
      const userResponse = await apiRequest('GET', `/api/users/${userId}`);
      const messagesResponse = await apiRequest('GET', `/api/users/${userId}/messages`);
      const userDetails = await userResponse.json();
      const userMessages = await messagesResponse.json();
      setViewingUser(userDetails);
      setViewingUserMessages(userMessages);
    } catch (error) {
      toast({ title: 'خطأ في جلب تفاصيل المستخدم', variant: 'destructive' });
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      educationLevel: '',
      subject: '',
      assignedTeacher: '',
      role: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  // Bulk message mutation
  const bulkMessageMutation = useMutation({
    mutationFn: async (data: { receiverIds: number[], subject: string, content: string }) => {
      const response = await apiRequest('POST', '/api/messages/bulk', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({ title: `تم إرسال ${data.count} رسالة بنجاح` });
      setBulkMessageData({ subject: '', content: '' });
      setShowBulkMessage(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إرسال الرسائل', variant: 'destructive' });
    }
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return await apiRequest('POST', '/api/admin/ban-user', { userId, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم حظر المستخدم",
        description: "تم حظر المستخدم من التطبيق بنجاح",
      });
      setShowBanModal(false);
      setBanUserData(null);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حظر المستخدم",
        description: error.message || "حدث خطأ أثناء حظر المستخدم",
        variant: "destructive",
      });
    },
  });

  // Bulk ban mutation
  const bulkBanMutation = useMutation({
    mutationFn: async ({ userIds, reason }: { userIds: number[]; reason: string }) => {
      const results = await Promise.allSettled(
        userIds.map(userId => apiRequest('POST', '/api/admin/ban-user', { userId, reason }))
      );
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      return { successful, failed, total: userIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: "تم حظر المستخدمين",
        description: `تم حظر ${data.successful} من أصل ${data.total} مستخدم بنجاح`,
      });
      setShowBulkBanModal(false);
      setSelectedUsers([]);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حظر المستخدمين",
        description: error.message || "حدث خطأ أثناء حظر المستخدمين",
        variant: "destructive",
      });
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Handle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Handle bulk message send
  const handleBulkMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      toast({ title: 'يرجى اختيار المستخدمين أولاً', variant: 'destructive' });
      return;
    }
    
    if (!bulkMessageData.subject || !bulkMessageData.content) {
      toast({ title: 'العنوان والمحتوى مطلوبان', variant: 'destructive' });
      return;
    }

    bulkMessageMutation.mutate({
      receiverIds: selectedUsers,
      subject: bulkMessageData.subject,
      content: bulkMessageData.content
    });
  };

  // Handle ban user
  const handleBanUser = (userId: number, userName: string) => {
    setBanUserData({ userId, userName });
    setShowBanModal(true);
  };

  const handleBanConfirm = (reason: string) => {
    if (banUserData) {
      banUserMutation.mutate({ userId: banUserData.userId, reason });
    }
  };

  // Handle bulk ban
  const handleBulkBan = () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "لا يوجد مستخدمون محددون",
        description: "يرجى اختيار مستخدمين للحظر",
        variant: "destructive",
      });
      return;
    }
    
    // Filter out admin users from selection
    const nonAdminUsers = users.filter(user => 
      selectedUsers.includes(user.id) && user.role !== 'admin'
    );
    
    if (nonAdminUsers.length === 0) {
      toast({
        title: "لا يمكن حظر المديرين",
        description: "تم اختيار مديرين فقط، لا يمكن حظرهم",
        variant: "destructive",
      });
      return;
    }
    
    setShowBulkBanModal(true);
  };

  const handleBulkBanConfirm = (reason: string) => {
    const nonAdminUsers = users.filter(user => 
      selectedUsers.includes(user.id) && user.role !== 'admin'
    );
    
    if (nonAdminUsers.length > 0) {
      bulkBanMutation.mutate({ 
        userIds: nonAdminUsers.map(user => user.id), 
        reason 
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">غير مسموح</h2>
          <p className="text-gray-600 dark:text-gray-400">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                <Users className="w-5 h-5" />
                إدارة المستخدمين
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">عرض وإدارة جميع المستخدمين المسجلين</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  // Extract school code from current path and navigate to student management
                  const schoolCode = location.split('/')[2]; // /school/CODE/admin/users -> CODE
                  navigate(`/school/${schoolCode}/admin/student-management`);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                تسجيل الطلاب المسبق
              </Button>
            </div>
          </div>
          
          {/* Action Buttons Row */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                  تم تحديد {selectedUsers.length} مستخدم:
                </span>
                <button
                  onClick={() => setShowBulkMessage(true)}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  إرسال رسالة جماعية
                </button>
                <button
                  onClick={handleBulkBan}
                  className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 flex items-center gap-1"
                >
                  <Ban className="w-4 h-4" />
                  حظر جماعي ({selectedUsers.filter(id => users.find(u => u.id === id)?.role !== 'admin').length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
          {/* Search Bar */}
          <div className="p-4 border-b dark:border-gray-700">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الإيميل أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm hover:bg-blue-700 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                بحث
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm ${
                  showFilters || hasActiveFilters 
                    ? 'bg-gray-100 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                } hover:bg-gray-100 dark:hover:bg-gray-600`}
              >
                <Filter className="w-4 h-4" />
                فلترة
                {hasActiveFilters && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <div className="space-y-4">
                {/* First Row: Role and Education Level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الدور
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">جميع الأدوار</option>
                      <option value="admin">مدير</option>
                      <option value="teacher">معلم</option>
                      <option value="student">طالب</option>
                      <option value="user">ولي أمر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المستوى التعليمي
                    </label>
                    <select
                      value={filters.educationLevel}
                      onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">جميع المستويات</option>
                      <option value="الابتدائي">الابتدائي</option>
                      <option value="المتوسط">المتوسط</option>
                      <option value="الثانوي">الثانوي</option>
                    </select>
                  </div>
                </div>

                {/* Second Row: Subject and Teacher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المادة
                    </label>
                    <select
                      value={filters.subject}
                      onChange={(e) => handleFilterChange('subject', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">جميع المواد</option>
                      {teachingModules.map((module) => (
                        <option key={module.id} value={module.id.toString()}>
                          {module.nameAr} ({module.educationLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المعلم المسؤول
                    </label>
                    <select
                      value={filters.assignedTeacher}
                      onChange={(e) => handleFilterChange('assignedTeacher', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">جميع المعلمين</option>
                      {teacherUsers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                      مسح الفلاتر
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">المستخدمون ({users.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {selectedUsers.length === users.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  تحديد الكل
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">لا يوجد مستخدمون</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم العثور على مستخدمين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      اختيار
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      تاريخ التسجيل
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserSelection(user.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                        >
                          {selectedUsers.includes(user.id) ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                          user.role === 'teacher' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                          user.role === 'student' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {user.role === 'admin' ? 'مدير' : 
                           user.role === 'teacher' ? 'معلم' :
                           user.role === 'student' ? 'طالب' : 'ولي أمر'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            عرض
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleBanUser(user.id, user.name)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 text-xs"
                            >
                              <Ban className="w-3 h-3" />
                              حظر
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-gray-100">تفاصيل المستخدم</h2>
                <button
                  onClick={() => setViewingUser(null)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">المعلومات الشخصية</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-gray-300">الاسم:</span>
                      <span className="dark:text-gray-200">{viewingUser.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium dark:text-gray-300">الإيميل:</span>
                      <span className="dark:text-gray-200">{viewingUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span className="font-medium dark:text-gray-300">الهاتف:</span>
                      <span className="dark:text-gray-200">{viewingUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-gray-300">الدور:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        viewingUser.role === 'admin' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        viewingUser.role === 'teacher' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        viewingUser.role === 'student' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {viewingUser.role === 'admin' ? 'مدير' : 
                         viewingUser.role === 'teacher' ? 'معلم' :
                         viewingUser.role === 'student' ? 'طالب' : 'ولي أمر'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium dark:text-gray-300">تاريخ التسجيل:</span>
                      <span className="dark:text-gray-200">{formatDate(viewingUser.createdAt)}</span>
                    </div>
                  </div>
                  
                  {/* Student Education Info */}
                  {viewingUser.role === 'student' && viewingUser.student && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6z"/>
                        </svg>
                        المعلومات الدراسية
                      </h4>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">المستوى التعليمي:</span>
                          <span>{viewingUser.student.educationLevel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <span className="font-medium">السنة الدراسية:</span>
                          <span>{viewingUser.student.grade}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Children Info */}
                  {viewingUser.children && viewingUser.children.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-1">
                        <Baby className="w-4 h-4" />
                        الأطفال ({viewingUser.children.length})
                      </h4>
                      <div className="space-y-2">
                        {viewingUser.children.map((child) => (
                          <div key={child.id} className="bg-gray-50 p-2 rounded">
                            <div className="font-medium">{child.name}</div>
                            <div className="text-sm text-gray-600">
                              {child.educationLevel} - {child.grade}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Messages */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-1">
                    <MessageSquare className="w-5 h-5" />
                    الرسائل ({viewingUserMessages.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewingUserMessages.length === 0 ? (
                      <p className="text-gray-500 text-sm">لا توجد رسائل</p>
                    ) : (
                      viewingUserMessages.map((message) => (
                        <div key={message.id} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-sm">{message.subject}</div>
                          <div className="text-xs text-gray-600 mt-1">{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Message Modal */}
        {showBulkMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold dark:text-white">إرسال رسالة جماعية</h2>
                <button
                  onClick={() => setShowBulkMessage(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  سيتم إرسال الرسالة إلى {selectedUsers.length} مستخدم
                </p>
              </div>
              
              <form onSubmit={handleBulkMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={bulkMessageData.subject}
                    onChange={(e) => setBulkMessageData({...bulkMessageData, subject: e.target.value})}
                    placeholder="عنوان الرسالة"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    المحتوى
                  </label>
                  <textarea
                    value={bulkMessageData.content}
                    onChange={(e) => setBulkMessageData({...bulkMessageData, content: e.target.value})}
                    placeholder="محتوى الرسالة"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkMessage(false)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={bulkMessageMutation.isPending}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    {bulkMessageMutation.isPending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ban User Modal */}
        {showBanModal && banUserData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
              <h2 className="text-lg font-bold mb-4 text-red-600">حظر المستخدم {banUserData.userName}</h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700">
                    تحذير: سيتم منع هذا المستخدم من الوصول إلى التطبيق بالكامل
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">سبب الحظر</label>
                  <textarea 
                    id="banReason"
                    className="w-full p-2 border rounded-md h-20"
                    placeholder="اكتب سبب حظر المستخدم..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBanModal(false);
                    setBanUserData(null);
                  }}
                >
                  إلغاء
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    const reasonInput = document.getElementById('banReason') as HTMLTextAreaElement;
                    const reason = reasonInput?.value?.trim();
                    if (reason) {
                      handleBanConfirm(reason);
                    } else {
                      toast({
                        title: "سبب الحظر مطلوب",
                        description: "يرجى إدخال سبب الحظر",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={banUserMutation.isPending}
                >
                  {banUserMutation.isPending ? 'جاري الحظر...' : 'حظر المستخدم'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Ban Modal */}
        {showBulkBanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
              <h2 className="text-lg font-bold mb-4 text-red-600">
                حظر جماعي للمستخدمين ({selectedUsers.filter(id => users.find(u => u.id === id)?.role !== 'admin').length})
              </h2>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-700">
                    تحذير: سيتم منع جميع المستخدمين المحددين من الوصول إلى التطبيق بالكامل
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">المستخدمون المحددون:</p>
                  <ul className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                    {users
                      .filter(user => selectedUsers.includes(user.id) && user.role !== 'admin')
                      .map(user => (
                        <li key={user.id} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {user.name} ({user.email})
                        </li>
                      ))}
                  </ul>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">سبب الحظر الجماعي</label>
                  <textarea 
                    id="bulkBanReason"
                    className="w-full p-2 border rounded-md h-20"
                    placeholder="اكتب سبب حظر جميع المستخدمين..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkBanModal(false)}
                >
                  إلغاء
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    const reasonInput = document.getElementById('bulkBanReason') as HTMLTextAreaElement;
                    const reason = reasonInput?.value?.trim();
                    if (reason) {
                      handleBulkBanConfirm(reason);
                    } else {
                      toast({
                        title: "سبب الحظر مطلوب",
                        description: "يرجى إدخال سبب الحظر الجماعي",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={bulkBanMutation.isPending}
                >
                  {bulkBanMutation.isPending ? 'جاري الحظر...' : 'حظر جميع المستخدمين'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}