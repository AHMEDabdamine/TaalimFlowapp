import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarDays, AlertTriangle, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface SubscriptionStatus {
  id: number;
  name: string;
  subscriptionExpiry: string | null;
  subscriptionStatus: string;
  subscriptionNotes: string | null;
  subscriptionLastUpdated: string | null;
  daysRemaining: number | null;
  isExpiring: boolean;
  isExpired: boolean;
}

export default function SchoolSubscription() {
  const { user } = useAuth();
  const selectedSchool = JSON.parse(localStorage.getItem('selectedSchool') || 'null');

  // Fetch subscription status for the current school
  const { data: subscriptionStatus, isLoading, error } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/school/subscription'],
    enabled: user?.role === 'admin',
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              غير مصرح لك بالوصول إلى هذه الصفحة. هذه الصفحة متاحة لمديري المدارس فقط.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 mb-6"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subscriptionStatus) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              حدث خطأ في تحميل بيانات الاشتراك. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (subscriptionStatus.isExpired) {
      return <Badge variant="destructive" className="text-sm">منتهي الصلاحية</Badge>;
    }
    if (subscriptionStatus.isExpiring) {
      return <Badge variant="default" className="bg-orange-500 text-white text-sm">ينتهي قريباً</Badge>;
    }
    if (subscriptionStatus.subscriptionStatus === 'active') {
      return <Badge variant="default" className="bg-green-500 text-white text-sm">نشط</Badge>;
    }
    if (subscriptionStatus.subscriptionStatus === 'suspended') {
      return <Badge variant="secondary" className="text-sm">معلق</Badge>;
    }
    return <Badge variant="outline" className="text-sm">{subscriptionStatus.subscriptionStatus}</Badge>;
  };

  const getStatusIcon = () => {
    if (subscriptionStatus.isExpired) {
      return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
    if (subscriptionStatus.isExpiring) {
      return <Clock className="h-6 w-6 text-orange-500" />;
    }
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ar });
    } catch {
      return 'تاريخ غير صحيح';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            اشتراك المدرسة
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            معلومات اشتراك مدرسة {subscriptionStatus.name}
          </p>
        </div>

        {/* Status Alert */}
        {subscriptionStatus.isExpired && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>تنبيه:</strong> انتهت صلاحية اشتراك المدرسة. يرجى التواصل مع الإدارة العليا لتجديد الاشتراك.
            </AlertDescription>
          </Alert>
        )}

        {subscriptionStatus.isExpiring && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>تنبيه:</strong> سينتهي اشتراك المدرسة خلال {subscriptionStatus.daysRemaining} يوم/أيام. 
              يرجى التواصل مع الإدارة العليا قريباً لتجديد الاشتراك.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscription Details Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-l from-primary/10 to-primary/5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                تفاصيل الاشتراك
              </CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Status Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">حالة الاشتراك</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {subscriptionStatus.subscriptionStatus === 'active' ? 'نشط' : 
                       subscriptionStatus.subscriptionStatus === 'expired' ? 'منتهي الصلاحية' :
                       subscriptionStatus.subscriptionStatus === 'suspended' ? 'معلق' :
                       subscriptionStatus.subscriptionStatus}
                    </p>
                  </div>
                </div>

                {subscriptionStatus.daysRemaining !== null && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">الأيام المتبقية</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      subscriptionStatus.isExpired ? 'text-red-600' :
                      subscriptionStatus.isExpiring ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {subscriptionStatus.daysRemaining > 0 ? 
                        `${subscriptionStatus.daysRemaining} يوم` : 
                        'انتهت الصلاحية'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">تاريخ انتهاء الاشتراك</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatDate(subscriptionStatus.subscriptionExpiry)}
                  </p>
                </div>

                {subscriptionStatus.subscriptionLastUpdated && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">آخر تحديث</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(subscriptionStatus.subscriptionLastUpdated)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {subscriptionStatus.subscriptionNotes && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">ملاحظات إدارية</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    {subscriptionStatus.subscriptionNotes}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">هل تحتاج مساعدة؟</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              للاستفسارات حول الاشتراك أو تجديده، يرجى التواصل مع الإدارة العليا للمنصة.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>معلومة:</strong> يمكن للإدارة العليا فقط تعديل تفاصيل الاشتراك من خلال لوحة التحكم الرئيسية.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}