import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, Smartphone, TestTube, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import PushNotificationClient from '@/lib/pushNotifications';

interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscriptionCount: number;
  lastUsed: string | null;
}

export default function NotificationSettings() {
  const [status, setStatus] = useState<NotificationStatus>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscriptionCount: 0,
    lastUsed: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check notification status on component mount
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const isSupported = PushNotificationClient.isSupported();
      const permission = PushNotificationClient.getPermission();
      const isSubscribed = await PushNotificationClient.isSubscribed();

      // Get server status
      let subscriptionCount = 0;
      let lastUsed = null;
      try {
        const response = await apiRequest('GET', '/api/push/status');
        const serverStatus = response;
        subscriptionCount = serverStatus.subscriptionCount || 0;
        lastUsed = serverStatus.lastUsed;
      } catch (error) {
        console.error('Failed to get server status:', error);
      }

      setStatus({
        isSupported,
        permission,
        isSubscribed,
        subscriptionCount,
        lastUsed
      });
    } catch (error) {
      console.error('Failed to check notification status:', error);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const subscription = await PushNotificationClient.subscribe();
      if (subscription) {
        toast({
          title: "تم تفعيل الإشعارات",
          description: "ستتلقى الآن إشعارات فورية للرسائل والإعلانات الجديدة"
        });
        await checkNotificationStatus();
      } else {
        toast({
          title: "فشل في تفعيل الإشعارات",
          description: "يرجى التأكد من السماح للإشعارات في المتصفح",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast({
        title: "خطأ في تفعيل الإشعارات",
        description: "حدث خطأ أثناء تفعيل الإشعارات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await PushNotificationClient.unsubscribe();
      if (success) {
        toast({
          title: "تم إلغاء تفعيل الإشعارات",
          description: "لن تتلقى المزيد من الإشعارات الفورية"
        });
        await checkNotificationStatus();
      } else {
        toast({
          title: "فشل في إلغاء تفعيل الإشعارات",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast({
        title: "خطأ في إلغاء تفعيل الإشعارات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    try {
      // First try local test notification
      await PushNotificationClient.showTestNotification();
      
      // Then send server test notification
      const response = await apiRequest('POST', '/api/push/test');
      const result = response;
      
      toast({
        title: "تم إرسال الإشعار التجريبي",
        description: result.message || "يجب أن ترى إشعارين - واحد محلي وآخر من الخادم"
      });
    } catch (error: any) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "فشل في إرسال الإشعار التجريبي",
        description: error.message || "حدث خطأ أثناء إرسال الإشعار التجريبي",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatusText = () => {
    switch (status.permission) {
      case 'granted':
        return 'مسموح';
      case 'denied':
        return 'مرفوض';
      default:
        return 'لم يتم الطلب';
    }
  };

  const getPermissionStatusColor = () => {
    switch (status.permission) {
      case 'granted':
        return 'text-green-600';
      case 'denied':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات الإشعارات
        </CardTitle>
        <CardDescription>
          إدارة إشعارات التطبيق وتلقي التحديثات الفورية
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Support Status */}
        <div className="space-y-2">
          <Label className="text-base font-medium">دعم الإشعارات</Label>
          <div className="flex items-center gap-2">
            <Smartphone className={`h-4 w-4 ${status.isSupported ? 'text-green-600' : 'text-red-600'}`} />
            <span className={status.isSupported ? 'text-green-600' : 'text-red-600'}>
              {status.isSupported ? 'مدعوم' : 'غير مدعوم'}
            </span>
          </div>
          {!status.isSupported && (
            <Alert>
              <AlertDescription>
                متصفحك لا يدعم الإشعارات الفورية. يرجى استخدام متصفح حديث مثل Chrome أو Firefox أو Safari.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Permission Status */}
        {status.isSupported && (
          <div className="space-y-2">
            <Label className="text-base font-medium">حالة الصلاحية</Label>
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 ${getPermissionStatusColor()}`} />
              <span className={getPermissionStatusColor()}>
                {getPermissionStatusText()}
              </span>
            </div>
            {status.permission === 'denied' && (
              <Alert>
                <AlertDescription>
                  تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح للموقع.
                </AlertDescription>
                <div className="mt-3">
                  <Button
                    onClick={handleEnableNotifications}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    طلب الصلاحية
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}

        {/* Subscription Status */}
        {status.isSupported && status.permission === 'granted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">الإشعارات الفورية</Label>
                <p className="text-sm text-muted-foreground">
                  تلقي إشعارات فورية للرسائل والإعلانات الجديدة
                </p>
              </div>
              <Switch
                checked={status.isSubscribed}
                onCheckedChange={status.isSubscribed ? handleDisableNotifications : handleEnableNotifications}
                disabled={isLoading}
              />
            </div>

            {status.isSubscribed && (
              <div className="text-sm text-muted-foreground">
                <p>عدد الأجهزة المشتركة: {status.subscriptionCount}</p>
                {status.lastUsed && (
                  <p>آخر استخدام: {new Date(status.lastUsed).toLocaleDateString('ar-SA')}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Test Notification */}
        {status.isSupported && status.permission === 'granted' && status.isSubscribed && (
          <div className="space-y-2">
            <Label className="text-base font-medium">اختبار الإشعارات</Label>
            <Button
              onClick={handleTestNotification}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <TestTube className="h-4 w-4 mr-2" />
              إرسال إشعار تجريبي
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {status.isSupported && status.permission !== 'denied' && (
          <div className="flex gap-2 pt-4 border-t">
            {!status.isSubscribed ? (
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                تفعيل الإشعارات
              </Button>
            ) : (
              <Button
                onClick={handleDisableNotifications}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                <BellOff className="h-4 w-4 mr-2" />
                إلغاء تفعيل الإشعارات
              </Button>
            )}
            <Button
              onClick={checkNotificationStatus}
              variant="outline"
              disabled={isLoading}
            >
              تحديث الحالة
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}