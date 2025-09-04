import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, BookOpen, GraduationCap, Users, ArrowRight, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function PublicHome() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 left-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="p-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          title={theme === 'light' ? 'تفعيل الوضع الليلي' : 'تفعيل الوضع النهاري'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500" />
          )}
        </Button>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 dark:bg-blue-500 rounded-full mb-6">
            <School className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            نظام إدارة المدارس
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            TaalimFlow - منصة تعليمية متكاملة تربط الطلاب وأولياء الأمور والمعلمين والإدارة في بيئة تعليمية حديثة
          </p>
          <Button 
            size="lg" 
            onClick={() => setLocation("/school-access")}
            className="text-lg px-8 py-3"
          >
            الدخول إلى مدرستك
            <ArrowRight className="mr-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full mb-4 mx-auto">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>إدارة شاملة للمستخدمين</CardTitle>
              <CardDescription>
                نظام متقدم لإدارة الطلاب وأولياء الأمور والمعلمين
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>محتوى تعليمي متميز</CardTitle>
              <CardDescription>
                مقالات تعليمية، إعلانات، ومجموعات تعليمية منظمة
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full mb-4 mx-auto">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>تواصل مباشر</CardTitle>
              <CardDescription>
                نظام رسائل متطور للتواصل بين جميع أطراف العملية التعليمية
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-12 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">كيف يعمل النظام؟</CardTitle>
            <CardDescription>خطوات بسيطة للبدء في استخدام النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="font-semibold mb-2 dark:text-white">أدخل رمز مدرستك</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">استخدم الرمز الذي حصلت عليه من إدارة مدرستك</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="font-semibold mb-2 dark:text-white">أنشئ حسابك</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">سجل كطالب أو ولي أمر أو معلم حسب صفتك</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="font-semibold mb-2 dark:text-white">تأكد من هويتك</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">أكمل عملية التحقق من البريد الإلكتروني والهاتف</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">4</div>
                <h3 className="font-semibold mb-2 dark:text-white">ابدأ التعلم</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">استمتع بجميع ميزات النظام التعليمي</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">مستعد للبدء؟</h2>
              <p className="text-blue-100 dark:text-blue-200 mb-6">
                انضم إلى آلاف الطلاب وأولياء الأمور والمعلمين في رحلة تعليمية مميزة
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => setLocation("/school-access")}
                className="text-blue-600"
              >
                الدخول إلى مدرستك
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}