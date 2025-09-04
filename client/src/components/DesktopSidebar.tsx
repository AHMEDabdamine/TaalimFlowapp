import { Home, Calendar, MessageCircle, Mail, Shield, BookOpen, FileText, User, Settings, LogOut, Lightbulb, Book, QrCode, Calculator, Bell, CreditCard, Building2, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { NotificationPanel } from './NotificationPanel';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export function DesktopSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch unread notification count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');

  const baseNavItems: NavItem[] = [
    { icon: Home, label: 'الرئيسية', path: `${basePath}/home` || '/' },
    { icon: Building2, label: 'حول المدرسة', path: `${basePath}/school-info` || '/school-info' },
    { icon: Calendar, label: 'الجدول الدراسي', path: `${basePath}/schedule` || '/schedule' },
    { icon: MessageCircle, label: 'المعلمين', path: `${basePath}/teachers` || '/teachers' },
    { icon: Mail, label: 'الرسائل', path: `${basePath}/messages` || '/messages' },
    { icon: Lightbulb, label: 'الاقتراحات', path: `${basePath}/suggestions` || '/suggestions' },
  ];

  // Admin-only navigation items
  const adminOnlyItems: NavItem[] = [
    { icon: Book, label: 'المجموعات', path: `${basePath}/groups` || '/groups' },
  ];

  // Role-based navigation items
  let roleSpecificItems: NavItem[] = [];
  
  if (user?.role === 'admin') {
    roleSpecificItems = [
      { icon: Shield, label: 'لوحة الإدارة', path: `${basePath}/admin` || '/admin' },
      { icon: QrCode, label: 'الماسح المكتبي', path: `${basePath}/desktop-scanner` || '/desktop-scanner' },
      { icon: Calculator, label: 'الأرباح والخسائر', path: `${basePath}/gain-loss-calculator` || '/gain-loss-calculator' },
      { icon: DollarSign, label: 'أجور الأساتذة', path: `${basePath}/teacher-salaries` || '/teacher-salaries' },
      { icon: CreditCard, label: 'اشتراك المدرسة', path: `${basePath}/school-subscription` || '/school-subscription' }
    ];
  } else if (user?.role === 'teacher') {
    roleSpecificItems = [
      { icon: BookOpen, label: 'تخصصاتي', path: `${basePath}/teacher-specializations` || '/teacher-specializations' }
    ];
  } else if (user?.role === 'student' || user?.role === 'parent') {
    roleSpecificItems = [
      { icon: FileText, label: 'حالة الطالب', path: `${basePath}/student-status` || '/student-status' }
    ];
  }

  // Combine navigation items - include admin-only items only for admins
  const navItems = [
    ...baseNavItems, 
    ...(user?.role === 'admin' ? adminOnlyItems : []),
    ...roleSpecificItems
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="w-80 max-w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 fixed right-0 top-0 h-screen flex flex-col shadow-lg z-30 overflow-hidden">
      {/* School Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {selectedSchool?.logoUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border-2 border-gray-200">
              <img 
                src={selectedSchool.logoUrl} 
                alt={`${selectedSchool.name} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {selectedSchool?.name || 'مدرستي'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">TaalimFlow</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-l from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-md relative"
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount.count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {unreadCount.count > 9 ? '9+' : unreadCount.count}
                </span>
              )}
            </div>
            <span className="font-medium">الإشعارات</span>
          </button>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="mb-4">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name || 'المستخدم'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role === 'admin' ? 'مدير' : 
                 user?.role === 'teacher' ? 'معلم' : 
                 user?.role === 'student' ? 'طالب' : 
                 user?.role === 'parent' ? 'ولي أمر' : 'مستخدم'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => navigate(schoolCode ? `/school/${schoolCode}/profile` : '/profile')}
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </aside>
  );
}