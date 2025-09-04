import { Home, Calendar, MessageCircle, Lightbulb, Mail, Shield, BookOpen, FileText, Book } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';



  const baseNavItems: NavItem[] = [
    { icon: Home, label: 'الرئيسية', path: `${basePath}/home` || '/' },
    { icon: Calendar, label: 'الجدول', path: `${basePath}/schedule` || '/schedule' },
    { icon: MessageCircle, label: 'المعلمين', path: `${basePath}/teachers` || '/teachers' },
    { icon: Mail, label: 'الرسائل', path: `${basePath}/messages` || '/messages' },
  ];

  // Role-based navigation items
  let roleSpecificItems: NavItem[] = [];
  
  if (user?.role === 'admin') {
    roleSpecificItems = [{ icon: Shield, label: 'الإدارة', path: `${basePath}/admin` || '/admin' }];
  } else if (user?.role === 'teacher') {
    roleSpecificItems = [{ icon: BookOpen, label: 'تخصصاتي', path: `${basePath}/teacher-specializations` || '/teacher-specializations' }];
  } else if (user?.role === 'student' || user?.role === 'parent') {
    roleSpecificItems = [{ icon: FileText, label: 'حضور ومدفوعات', path: `${basePath}/student-status` || '/student-status' }];
  }

  // Combine navigation items - Groups removed from mobile navigation
  const navItems = [
    ...baseNavItems,
    ...roleSpecificItems
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 z-40">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item flex flex-col items-center py-3 px-4 relative transition-colors ${
                  isActive ? 'active text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
