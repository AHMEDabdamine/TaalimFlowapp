import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Lightbulb, Settings, BarChart3, CheckCircle } from 'lucide-react';

export default function AdminPanelTest() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Get school context for school-specific routes
  const schoolCode = sessionStorage.getItem('schoolCode');
  const basePath = schoolCode ? `/school/${schoolCode}` : '';

  const adminSections = [
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة جميع المستخدمين المسجلين',
      icon: <Users className="w-6 h-6" />,
      path: `${basePath}/admin/users`,
      color: 'bg-blue-500'
    },
    {
      title: 'إدارة المحتوى',
      description: 'إنشاء وتحرير المقالات والمجموعات والتكوينات',
      icon: <FileText className="w-6 h-6" />,
      path: `${basePath}/admin/content`,
      color: 'bg-green-500'
    },
    {
      title: 'الاقتراحات',
      description: 'مراجعة الاقتراحات المقدمة من المستخدمين',
      icon: <Lightbulb className="w-6 h-6" />,
      path: `${basePath}/admin/suggestions`,
      color: 'bg-yellow-500'
    },
    {
      title: 'التحقق من المستخدمين',
      description: 'التحقق من هوية المستخدمين والطلاب والأطفال',
      icon: <CheckCircle className="w-6 h-6" />,
      path: `${basePath}/admin/verification`,
      color: 'bg-purple-500'
    },
    {
      title: 'إدارة الإبلاغات',
      description: 'مراجعة الإبلاغات وإدارة المستخدمين المحظورين',
      icon: <BarChart3 className="w-6 h-6" />,
      path: `${basePath}/admin/reports`,
      color: 'bg-red-500'
    }
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">لوحة التحكم الإدارية</h1>
        <p className="text-gray-600">مرحباً {user.name}، يمكنك إدارة النظام من هنا</p>
      </div>

      <div className="grid gap-4">
        {adminSections.map((section) => (
          <Card key={section.path} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${section.color} text-white`}>
                  {section.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={() => navigate(section.path)}
                className="w-full"
              >
                الدخول إلى {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-gray-800">معلومات المستخدم الحالي:</h3>
        <div className="text-sm text-gray-600">
          <p>الاسم: {user.name}</p>
          <p>البريد الإلكتروني: {user.email}</p>
          <p>الدور: {user.role}</p>
        </div>
      </div>
    </div>
  );
}