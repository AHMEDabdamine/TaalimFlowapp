import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { School, Globe, Users, BookOpen, Calendar, ArrowRight, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface SchoolSelectionProps {
  schoolCode: string;
}

export default function SchoolSelection({ schoolCode }: SchoolSelectionProps) {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Use TanStack Query instead of manual state management to prevent excessive requests
  const {
    data: school,
    isLoading,
    error: fetchError,
    refetch
  } = useQuery({
    queryKey: ['/api/school/select', schoolCode],
    queryFn: async () => {
      if (!schoolCode) {
        throw new Error('School code is required');
      }
      
      console.log('Fetching school data for code:', schoolCode);
      const response = await fetch("/api/school/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل في جلب بيانات المدرسة");
      }

      return result.school;
    },
    enabled: !!schoolCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1, // Only retry once to prevent excessive requests
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: false, // Prevent refetch on reconnect
  });

  const handleAccessSchool = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Clear any existing school context first
      localStorage.removeItem('selectedSchool');
      sessionStorage.removeItem('currentSchoolId');
      sessionStorage.removeItem('schoolCode');
      
      // Set new school context
      localStorage.setItem('selectedSchool', JSON.stringify(school));
      sessionStorage.setItem('currentSchoolId', school.id.toString());
      sessionStorage.setItem('schoolCode', school.code);
      
      // Navigate to school home page - this will trigger login if needed
      setLocation(`/school/${school.code}/home`);
    } catch (err) {
      setError("حدث خطأ في الوصول إلى المدرسة");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <School className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">جاري تحميل بيانات المدرسة...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <School className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">المدرسة غير موجودة</CardTitle>
            <CardDescription>
              لم يتم العثور على مدرسة بالكود: <strong>{schoolCode}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {fetchError?.message || "تأكد من صحة رابط المدرسة أو تواصل مع الإدارة"}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/")}
              >
                العودة إلى الصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${school.primaryColor}20, ${school.secondaryColor}20)`
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          {school.logoUrl ? (
            <div className="w-20 h-20 rounded-full mx-auto mb-6 overflow-hidden shadow-lg border-4 border-white">
              <img 
                src={school.logoUrl} 
                alt={`${school.name} Logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: school.primaryColor }}
            >
              <School className="h-10 w-10 text-white" />
            </div>
          )}
          <CardTitle className="text-3xl mb-3" style={{ color: school.primaryColor }}>
            {school.name}
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 mb-6">
            مرحباً بك في منصة المدرسة الإلكترونية
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Access Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleAccessSchool}
              disabled={loading}
              className="w-full py-3 text-lg"
              style={{ 
                backgroundColor: school.primaryColor,
                borderColor: school.primaryColor 
              }}
            >
              {loading ? "جاري الدخول..." : "دخول إلى المدرسة"}
              <ArrowRight className="h-5 w-5 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}