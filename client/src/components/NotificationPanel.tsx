import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

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

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
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
    case 'suggestion': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    case 'message': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'blog': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
    case 'announcement': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
    case 'group_update': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
    case 'formation_update': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  }
};

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: isOpen && !!user
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

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read first
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    const schoolCode = sessionStorage.getItem('schoolCode');
    const basePath = schoolCode ? `/school/${schoolCode}` : '';
    
    switch (notification.type) {
      case 'blog':
        navigate(`${basePath}/blog`);
        break;
      case 'announcement':
        navigate(`${basePath}/announcements`);
        break;
      case 'group_update':
        navigate(`${basePath}/groups`);
        break;
      case 'formation_update':
        navigate(`${basePath}/formations`);
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
        // For unknown types, stay in notifications
        break;
    }
    
    // Close the panel
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-[9999] lg:flex lg:justify-center lg:items-center">
      <div className="bg-white dark:bg-gray-900 w-full h-full lg:w-full lg:max-w-md lg:h-[80vh] lg:max-h-[600px] lg:rounded-xl shadow-2xl border dark:border-gray-700 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-row items-center justify-between border-b dark:border-gray-700 bg-purple-50 dark:bg-gray-800 p-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-300">
              <Bell className="w-5 h-5 inline-block mr-2" />
              الإشعارات
            </h2>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.read) && (
                <Button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                جاري تحميل الإشعارات...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="space-y-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 lg:p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 lg:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 lg:gap-2 mb-3">
                          <span className="text-2xl lg:text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-sm lg:text-xs px-3 lg:px-2 py-1 ${getNotificationColor(notification.type)}`}
                          >
                            {notification.type === 'suggestion' && 'اقتراح'}
                            {notification.type === 'message' && 'رسالة'}
                            {notification.type === 'blog' && 'مقال'}
                            {notification.type === 'announcement' && 'إعلان'}
                            {notification.type === 'group_update' && 'مجموعة'}
                            {notification.type === 'formation_update' && 'تدريب'}
                          </Badge>
                          {!notification.read && (
                            <div className="w-3 h-3 lg:w-2 lg:h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 lg:mb-2 text-xl lg:text-base leading-7 lg:leading-6">
                          {notification.title}
                        </h4>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-lg lg:text-sm leading-6 lg:leading-5">
                          {notification.message}
                        </p>
                        
                        <p className="text-gray-400 dark:text-gray-500 text-base lg:text-xs">
                          {new Date(notification.createdAt).toLocaleDateString('ar-SA', {
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
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex-shrink-0"
                        >
                          <Check className="w-5 h-5 lg:w-4 lg:h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}