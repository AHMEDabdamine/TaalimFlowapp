import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, FileText, MessageSquare, Lightbulb, Settings } from 'lucide-react';
import { RoleProtection } from '@/components/RoleProtection';
import { Link } from 'wouter';

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'تم الحفظ بنجاح!' });
  };

  return (
    <RoleProtection allowedRoles={['admin']}>
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800">لوحة الإدارة</h2>
        </div>

        {/* Admin Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link href="admin/users">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">إدارة المستخدمين</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">عرض وإدارة جميع المستخدمين المسجلين</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="admin/student-management">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">تسجيل الطلاب المسبق</h3>
                <p className="text-sm text-gray-600">تسجيل الطلاب مسبقاً وإدارة ربط الحسابات</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="admin/content">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">إدارة المحتوى</h3>
                <p className="text-sm text-gray-600">إدارة الإعلانات والمقالات</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="admin/verification">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">التحقق من المستخدمين</h3>
                <p className="text-sm text-gray-600">التحقق من وثائق الطلاب والمعلمين</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="admin/suggestions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Lightbulb className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">إدارة الاقتراحات</h3>
                <p className="text-sm text-gray-600">عرض وإدارة اقتراحات المستخدمين</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="admin/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">إدارة البلاغات</h3>
                <p className="text-sm text-gray-600">عرض وإدارة بلاغات المستخدمين</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      
      <Tabs defaultValue="announcements" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="announcements">الإعلانات</TabsTrigger>
          <TabsTrigger value="blog">المدونة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                إضافة إعلان جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">العنوان</Label>
                  <Input id="title" placeholder="اكتب عنوان الإعلان" />
                </div>
                <div>
                  <Label htmlFor="content">المحتوى</Label>
                  <Textarea id="content" placeholder="اكتب محتوى الإعلان" rows={4} />
                </div>
                <div>
                  <Label htmlFor="image">رابط الصورة</Label>
                  <Input id="image" placeholder="https://example.com/image.jpg" />
                </div>
                <Button type="submit" className="w-full">
                  نشر الإعلان
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                إضافة مقال جديد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="blogTitle">العنوان</Label>
                  <Input id="blogTitle" placeholder="اكتب عنوان المقال" />
                </div>
                <div>
                  <Label htmlFor="blogContent">المحتوى</Label>
                  <Textarea id="blogContent" placeholder="اكتب محتوى المقال" rows={6} />
                </div>
                <div>
                  <Label htmlFor="blogImage">رابط الصورة</Label>
                  <Input id="blogImage" placeholder="https://example.com/image.jpg" />
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <Switch id="published" />
                  <Label htmlFor="published">نشر مباشرة</Label>
                </div>
                <Button type="submit" className="w-full">
                  حفظ المقال
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">156</p>
            <p className="text-sm text-gray-600">المستخدمين</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">23</p>
            <p className="text-sm text-gray-600">الرسائل</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Lightbulb className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">8</p>
            <p className="text-sm text-gray-600">الاقتراحات</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">45</p>
            <p className="text-sm text-gray-600">المقالات</p>
          </CardContent>
        </Card>
      </div>
      </div>
    </RoleProtection>
  );
}
