import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedId?: number;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'suggestion': return '📥';
    case 'message': return '💬';
    case 'blog': return '📚';
    case 'announcement': return '📅';
    case 'group_update': return '👥';
    case 'formation_update': return '🎓';
    default: return '🔔';
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'suggestion': return 'bg-blue-100 text-blue-800';
    case 'message': return 'bg-green-100 text-green-800';
    case 'blog': return 'bg-purple-100 text-purple-800';
    case 'announcement': return 'bg-orange-100 text-orange-800';
    case 'group_update': return 'bg-indigo-100 text-indigo-800';
    case 'formation_update': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const schoolCode = sessionStorage.getItem('schoolCode');

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('POST', `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/notifications/mark-all-read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Create base path with school code
    const basePath = schoolCode ? `/school/${schoolCode}` : '';

    // Navigate based on notification type
    switch (notification.type) {
      case 'blog':
        navigate(`${basePath}/blog`);
        break;
      case 'announcement':
        navigate(`${basePath}/home`); // Announcements are shown on home page
        break;
      case 'group_update':
        navigate(`${basePath}/groups`);
        break;
      case 'formation_update':
        navigate(`${basePath}/groups`); // Formations are part of groups page
        break;
      case 'message':
        navigate(`${basePath}/messages`);
        break;
      case 'suggestion':
        if (user?.role === 'admin') {
          navigate(`${basePath}/admin/suggestions`);
        } else {
          navigate(`${basePath}/suggestions`);
        }
        break;
      default:
        navigate(`${basePath}/home`); // Default to home page
        break;
    }
  };

  const handleGoBack = () => {
    navigate(schoolCode ? `/school/${schoolCode}/home` : '/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">الإشعارات</h1>
              </div>
            </div>
            
            {notifications.some((n) => !n.read) && (
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                variant="outline"
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                تحديد الكل كمقروء
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">جاري تحميل الإشعارات...</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">لا توجد إشعارات</h3>
            <p className="text-gray-500 dark:text-gray-400">ستظهر إشعاراتك هنا عند وصولها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-2 py-1 ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type === 'suggestion' && 'اقتراح'}
                          {notification.type === 'message' && 'رسالة'}
                          {notification.type === 'blog' && 'مقال'}
                          {notification.type === 'announcement' && 'إعلان'}
                          {notification.type === 'group_update' && 'تحديث مجموعة'}
                          {notification.type === 'formation_update' && 'تحديث تدريب'}
                        </Badge>
                        {!notification.read && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-base leading-6">
                        {notification.title}
                      </h3>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm leading-5">
                        {notification.message}
                      </p>
                      
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {!notification.read && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsReadMutation.mutate(notification.id);
                        }}
                        disabled={markAsReadMutation.isPending}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}