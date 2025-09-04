import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertSuperAdminSchema, type InsertSuperAdmin } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

export default function SuperAdminLogin() {
  const [step, setStep] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(insertSuperAdminSchema.omit({ name: true, phone: true, superAdminKey: true })),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertSuperAdmin>({
    resolver: zodResolver(insertSuperAdminSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      superAdminKey: "",
    },
  });

  const handleLogin = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل تسجيل الدخول");
      }

      // Set authentication context
      await login(result.user);
      
      // Redirect to super admin dashboard
      window.location.href = "/super-admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: InsertSuperAdmin) => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل إنشاء الحساب");
      }

      // Set authentication context
      await login(result.user);
      
      // Redirect to super admin dashboard
      window.location.href = "/super-admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Shield className="mx-auto h-12 w-12 text-purple-400 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">لوحة المسؤول العام</h1>
          <p className="text-purple-200">إدارة جميع المدارس والمؤسسات التعليمية</p>
        </div>

        <Card className="bg-black/20 backdrop-blur-sm border-purple-500/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">
              {step === "login" ? "تسجيل الدخول" : "إنشاء حساب مسؤول عام"}
            </CardTitle>
            <CardDescription className="text-purple-200">
              {step === "login" 
                ? "ادخل بياناتك للوصول إلى لوحة التحكم الرئيسية"
                : "إنشاء حساب مسؤول عام جديد للنظام"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {step === "login" ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    {...loginForm.register("email")}
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200"
                    placeholder="admin@example.com"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-red-400 text-sm">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...loginForm.register("password")}
                      className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200 pr-10"
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-purple-400" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-400 text-sm">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    "تسجيل الدخول"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-white">الاسم الكامل</Label>
                    <Input
                      id="reg-name"
                      {...registerForm.register("name")}
                      className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200"
                      placeholder="الاسم الكامل"
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-phone" className="text-white">رقم الهاتف</Label>
                    <Input
                      id="reg-phone"
                      {...registerForm.register("phone")}
                      className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200"
                      placeholder="0555123456"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="text-red-400 text-sm">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-white">البريد الإلكتروني</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    {...registerForm.register("email")}
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200"
                    placeholder="admin@example.com"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-red-400 text-sm">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-white">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      {...registerForm.register("password")}
                      className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200 pr-10"
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-purple-400" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-400 text-sm">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-key" className="text-white">مفتاح المسؤول العام</Label>
                  <Input
                    id="reg-key"
                    type="password"
                    {...registerForm.register("superAdminKey")}
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-200"
                    placeholder="مفتاح الأمان السري"
                  />
                  {registerForm.formState.errors.superAdminKey && (
                    <p className="text-red-400 text-sm">{registerForm.formState.errors.superAdminKey.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    "إنشاء حساب مسؤول عام"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(step === "login" ? "register" : "login")}
                className="text-purple-300 hover:text-white hover:bg-purple-500/20"
              >
                {step === "login" ? "إنشاء حساب مسؤول عام جديد" : "العودة إلى تسجيل الدخول"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-purple-300 text-sm">
            للوصول إلى هذه الصفحة: /system/super-admin-access
          </p>
        </div>
      </div>
    </div>
  );
}