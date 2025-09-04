import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, School, Users, Settings, Trash2, Edit, Eye, Building2, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSchoolSchema, type InsertSchool, type School as SchoolType } from "@shared/schema";

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/schools"],
    enabled: user?.role === "super_admin",
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: async (data: InsertSchool) => {
      const response = await fetch("/api/super-admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create school");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
      setShowCreateDialog(false);
      form.reset();
    },
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: async (schoolId: number) => {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete school");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
    },
  });

  const form = useForm<InsertSchool>({
    resolver: zodResolver(insertSchoolSchema),
    defaultValues: {
      name: "",
      code: "",
      domain: "",
      logoUrl: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      settings: {},
    },
  });

  const onSubmit = (data: InsertSchool) => {
    createSchoolMutation.mutate(data);
  };

  if (user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">غير مصرح بالوصول</CardTitle>
            <CardDescription>هذه الصفحة مخصصة للمسؤولين العامين فقط</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/"} className="w-full">
              العودة إلى الصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة المسؤول العام</h1>
                <p className="text-sm text-gray-500">إدارة جميع المدارس والمؤسسات التعليمية</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-sm text-gray-600">مرحباً، {user.name}</span>
              <Button variant="outline" onClick={() => logout()}>تسجيل الخروج</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <School className="h-8 w-8 text-blue-600 ml-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                <p className="text-sm text-gray-500">إجمالي المدارس</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-green-600 ml-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.reduce((total, school) => total + (school.totalUsers || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">إجمالي المستخدمين</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Settings className="h-8 w-8 text-purple-600 ml-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {schools.filter(school => school.active).length}
                </p>
                <p className="text-sm text-gray-500">المدارس النشطة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Management */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">إدارة المدارس</h2>
          <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <AlertDialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مدرسة جديدة
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>إضافة مدرسة جديدة</AlertDialogTitle>
                <AlertDialogDescription>
                  قم بإنشاء مدرسة أو مؤسسة تعليمية جديدة في النظام
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم المدرسة</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="مدرسة النور الابتدائية"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">كود المدرسة</Label>
                    <Input
                      id="code"
                      {...form.register("code")}
                      placeholder="nour-primary"
                    />
                    {form.formState.errors.code && (
                      <p className="text-red-500 text-sm">{form.formState.errors.code.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">النطاق (اختياري)</Label>
                  <Input
                    id="domain"
                    {...form.register("domain")}
                    placeholder="nour-school.com"
                  />
                  {form.formState.errors.domain && (
                    <p className="text-red-500 text-sm">{form.formState.errors.domain.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUrl">رابط الشعار (اختياري)</Label>
                  <Input
                    id="logoUrl"
                    {...form.register("logoUrl")}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">اللون الأساسي</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      {...form.register("primaryColor")}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      {...form.register("secondaryColor")}
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowCreateDialog(false)}>
                    إلغاء
                  </AlertDialogCancel>
                  <AlertDialogAction type="submit" disabled={createSchoolMutation.isPending}>
                    {createSchoolMutation.isPending ? "جاري الإنشاء..." : "إنشاء المدرسة"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Schools Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">جاري تحميل المدارس...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map((school: SchoolType) => (
              <Card key={school.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {school.logoUrl ? (
                        <img src={school.logoUrl} alt={school.name} className="w-10 h-10 rounded-lg" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: school.primaryColor }}
                        >
                          <School className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{school.name}</CardTitle>
                        <CardDescription>{school.code}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={school.active ? "default" : "secondary"}>
                      {school.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {school.domain && (
                      <p className="text-sm text-gray-600">النطاق: {school.domain}</p>
                    )}
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className="text-sm text-gray-600">الألوان:</span>
                      <div className="flex space-x-1 rtl:space-x-reverse">
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: school.primaryColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: school.secondaryColor }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/school/${school.code}`} target="_blank">
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </a>
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteSchoolMutation.mutate(school.id)}
                      disabled={deleteSchoolMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {schools.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <School className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مدارس</h3>
              <p className="text-gray-500 mb-4">ابدأ بإضافة أول مدرسة في النظام</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مدرسة جديدة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}