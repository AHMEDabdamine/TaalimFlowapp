import { useQuery } from '@tanstack/react-query';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Announcement } from '@/types';
import { useLocation } from 'wouter';
import { Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  const { data: allAnnouncements = [], isLoading: loading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    enabled: !!user && !authLoading,
  });

  // Get the latest 3 announcements
  const announcements = allAnnouncements.slice(0, 3);

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';

  const baseQuickActions = [
    { label: 'المدونة', path: `${basePath}/blog`, icon: '📚' },
    { label: 'المجموعات', path: `${basePath}/groups`, icon: '👥' },
    { label: 'التكوينات', path: `${basePath}/formations`, icon: '🎓' },
    { label: 'الدورات', path: `${basePath}/courses`, icon: '📖' },
  ];

  // Add suggestions for non-admin users only
  const quickActions = user?.role !== 'admin' 
    ? [...baseQuickActions, { label: 'الاقتراحات', path: `${basePath}/suggestions`, icon: '💡' }]
    : baseQuickActions;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen lg:bg-gradient-to-br lg:from-white lg:via-gray-50/50 lg:to-gray-100/30 dark:lg:from-gray-900 dark:lg:via-gray-800/50 dark:lg:to-gray-700/30">
      <div className="px-4 py-6 lg:px-8 lg:py-8 space-y-6 lg:space-y-10 max-w-7xl mx-auto">
        {/* Latest Announcements Section */}
        <section className="space-y-6 lg:space-y-8 max-w-none">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="p-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
              <Megaphone className="w-6 h-6 lg:w-7 lg:h-7 text-primary" />
            </div>
            <h2 className="text-xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 bg-gradient-to-l from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text">آخر الإعلانات</h2>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-0 lg:shadow-xl backdrop-blur-sm">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">لا توجد إعلانات حالياً</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base mb-8">سيتم عرض الإعلانات الجديدة هنا عند توفرها</p>
                <Button 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white rounded-xl px-8 py-3 lg:px-10 lg:py-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  onClick={() => navigate(`${basePath}/announcements`)}
                >
                  عرض جميع الإعلانات
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Actions Grid */}
        <section className="space-y-6 lg:space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 rounded-xl">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-gray-200 bg-gradient-to-l from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text">الخدمات السريعة</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {quickActions.map((action, index) => (
              <Button
                key={action.path}
                variant="outline"
                onClick={() => navigate(action.path)}
                className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 lg:p-6 h-24 lg:h-28 flex flex-col items-center justify-center space-y-2 lg:space-y-3 shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden ${
                  index === 0 ? 'hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20' :
                  index === 1 ? 'hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20' :
                  index === 2 ? 'hover:from-purple-50 hover:to-purple-100 dark:hover:from-purple-900/20 dark:hover:to-purple-800/20' :
                  'hover:from-yellow-50 hover:to-yellow-100 dark:hover:from-yellow-900/20 dark:hover:to-yellow-800/20'
                }`}
              >
                <div className="text-3xl lg:text-4xl transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:scale-110 filter">
                  {action.icon}
                </div>
                <p className="text-sm lg:text-base font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100">{action.label}</p>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
