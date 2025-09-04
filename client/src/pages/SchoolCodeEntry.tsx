import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { School, Key, ArrowRight, ArrowLeft, Moon, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

export default function SchoolCodeEntry() {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [schoolCode, setSchoolCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode.trim()) {
      setError("يرجى إدخال رمز المدرسة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/school/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode: schoolCode.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "رمز المدرسة غير صحيح");
      }

      // Navigate to school selection with the verified code
      setLocation(`/school/${schoolCode.trim()}`);
    } catch (err: any) {
      setError(err.message || "فشل في التحقق من رمز المدرسة");
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full mb-4">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الوصول إلى مدرستك
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            أدخل رمز المدرسة الذي حصلت عليه من إدارة مدرستك
          </p>
        </div>

        {/* School Code Entry Form */}
        <div className="max-w-md mx-auto">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full mb-4 mx-auto">
                <Key className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>أدخل رمز المدرسة</CardTitle>
              <CardDescription>
                استخدم الرمز الذي حصلت عليه من مدرستك للوصول إلى النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-500/50 bg-red-500/10 dark:border-red-400/50 dark:bg-red-400/10">
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="school-code" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    رمز المدرسة
                  </label>
                  <Input
                    id="school-code"
                    type="text"
                    placeholder="مثال: TST1"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                    className="text-center text-lg font-mono tracking-wider"
                    maxLength={50}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    الرمز مكون من أحرف وأرقام باللغة الإنجليزية
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loading || !schoolCode.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      الدخول إلى المدرسة
                      <ArrowRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="text-gray-600 dark:text-gray-300"
                  >
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">تحتاج مساعدة؟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-1">كيف أحصل على رمز المدرسة؟</p>
                <p>تواصل مع إدارة مدرستك للحصول على رمز الوصول الخاص بها</p>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <p className="font-medium mb-1">الرمز لا يعمل؟</p>
                <p>تأكد من كتابة الرمز بشكل صحيح، أو تواصل مع إدارة المدرسة للتأكد من صحة الرمز</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}