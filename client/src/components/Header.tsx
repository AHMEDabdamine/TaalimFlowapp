
import { Bell, Menu, LogOut, User, Settings, Sun, Moon, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';


export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [isShowingSettings, setIsShowingSettings] = useState(false);
  const [previousLocation, setPreviousLocation] = useState('/');


  // Get school context from storage
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');
  const schoolCode = sessionStorage.getItem('schoolCode');

  // Track location changes to store previous location
  useEffect(() => {
    if (!location.includes('/profile') && !location.includes('/notifications')) {
      setPreviousLocation(location);
      setIsShowingSettings(false);
    }
    if (location.includes('/profile') || location.includes('/notifications')) {
      setIsShowingSettings(true);
    }
  }, [location]);

  const handleMobileMenuClick = () => {
    if (isShowingSettings) {
      // Navigate back to previous page
      navigate(previousLocation);
    } else {
      // Navigate to settings/profile
      navigate(schoolCode ? `/school/${schoolCode}/profile` : '/profile');
    }
  };

  // Fetch unread notification count
  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  return (
    <header className="bg-gradient-to-r from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 shadow-sm backdrop-blur-sm bg-white/95 dark:bg-gray-900/95">
      <div className="lg:max-w-none lg:px-8 max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <button 
          onClick={handleMobileMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {isShowingSettings ? (
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          ) : (
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        
        {/* Desktop: Page title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 bg-gradient-to-l from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text">
            {location.includes('/home') ? 'الرئيسية' :
             location.includes('/schedule') ? 'الجدول الدراسي' :
             location.includes('/teachers') ? 'المعلمين' :
             location.includes('/messages') ? 'الرسائل' :
             location.includes('/groups') ? 'المجموعات' :
             location.includes('/formations') ? 'التكوينات' :
             location.includes('/courses') ? 'الدورات' :
             location.includes('/suggestions') ? 'الاقتراحات' :
             location.includes('/admin') ? 'لوحة الإدارة' :
             'مدرستي'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-3">
          {selectedSchool?.logoUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border-2 border-gray-200">
              <img 
                src={selectedSchool.logoUrl} 
                alt={`${selectedSchool.name} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {selectedSchool?.name || 'مدرستي'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">TaalimFlow</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-reverse space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
          </button>
          
          <button 
            onClick={() => navigate(schoolCode ? `/school/${schoolCode}/notifications` : '/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            {unreadCount.count > 0 && (
              <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </span>
            )}
          </button>
          
          {user && (
            <>
              <button 
                onClick={() => navigate(schoolCode ? `/school/${schoolCode}/profile` : '/profile')}
                className="hidden lg:flex p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-contain border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => logout()}
                className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
      </div>
      

    </header>
  );
}
