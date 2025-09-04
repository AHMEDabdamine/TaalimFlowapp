import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { School, Globe, Users, BookOpen, Search, ArrowRight, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function SchoolDirectory() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all active schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["/api/schools/directory"],
    queryFn: async () => {
      const response = await fetch("/api/schools/directory");
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "فشل في جلب قائمة المدارس");
      }
      
      return result.schools;
    },
  });

  // Filter schools based on search
  const filteredSchools = schools.filter((school: any) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSchoolAccess = (schoolCode: string) => {
    setLocation(`/school/${schoolCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">دليل المدارس</h1>
          <p className="text-gray-600 text-lg">اختر مدرستك للوصول إلى النظام التعليمي</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="ابحث عن اسم المدرسة أو الكود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">جاري تحميل المدارس...</p>
          </div>
        )}

        {/* Schools Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchools.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <School className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد مدارس متاحة"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? "جرب تغيير مصطلحات البحث" : "سيتم إضافة المدارس قريباً"}
                </p>
              </div>
            ) : (
              filteredSchools.map((school: any) => (
                <Card key={school.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        {school.logoUrl ? (
                          <img 
                            src={school.logoUrl}
                            alt={`شعار ${school.name}`}
                            className="w-12 h-12 rounded-full object-cover border-2"
                            style={{ borderColor: school.primaryColor }}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                            style={{ backgroundColor: school.primaryColor }}
                          >
                            {school.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{school.name}</CardTitle>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {school.code}
                            </Badge>
                            <Badge variant={school.active ? "default" : "secondary"} className="text-xs">
                              {school.active ? "نشط" : "غير نشط"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3 mb-4">
                      {school.domain && (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
                          <Globe className="h-4 w-4" />
                          <span>{school.domain}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{school.userCount || 0} مستخدم مسجل</span>
                      </div>
                      
                      {school.location && (
                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{school.location}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span>نظام تعليمي متكامل</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: school.primaryColor }}
                        title="اللون الأساسي"
                      />
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: school.secondaryColor }}
                        title="اللون الثانوي"
                      />
                    </div>

                    <Button 
                      onClick={() => handleSchoolAccess(school.code)}
                      className="w-full group-hover:shadow-md transition-shadow"
                      style={{ 
                        backgroundColor: school.primaryColor,
                        borderColor: school.primaryColor
                      }}
                    >
                      دخول إلى المدرسة
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">كيفية الوصول إلى مدرستك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-blue-800">
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</div>
                <div>
                  <p className="font-semibold">اختر مدرستك من القائمة أعلاه</p>
                  <p className="text-sm text-blue-700">أو استخدم خاصية البحث للعثور على مدرستك بسرعة</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</div>
                <div>
                  <p className="font-semibold">قم بتسجيل الدخول أو إنشاء حساب جديد</p>
                  <p className="text-sm text-blue-700">اختر نوع المستخدم المناسب: طالب، ولي أمر، معلم، أو مدير</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</div>
                <div>
                  <p className="font-semibold">استمتع بالنظام التعليمي المتكامل</p>
                  <p className="text-sm text-blue-700">الإعلانات، المدونة، التواصل مع المعلمين، والمزيد</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>نظام إدارة المدارس المتعدد - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </div>
  );
}