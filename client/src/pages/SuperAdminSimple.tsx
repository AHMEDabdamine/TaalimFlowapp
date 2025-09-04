import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Building2, Plus, School, Users, Globe, Palette, Trash2, Eye, Edit, Calendar, MapPin, Key, RefreshCw, BarChart, CreditCard, Pause, Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// Algerian Wilayas (58 provinces)
const ALGERIAN_WILAYAS = [
  "01 - أدرار", "02 - الشلف", "03 - الأغواط", "04 - أم البواقي", "05 - باتنة",
  "06 - بجاية", "07 - بسكرة", "08 - بشار", "09 - البليدة", "10 - البويرة",
  "11 - تمنراست", "12 - تبسة", "13 - تلمسان", "14 - تيارت", "15 - تيزي وزو",
  "16 - الجزائر", "17 - الجلفة", "18 - جيجل", "19 - سطيف", "20 - سعيدة",
  "21 - سكيكدة", "22 - سيدي بلعباس", "23 - عنابة", "24 - قالمة", "25 - قسنطينة",
  "26 - المدية", "27 - مستغانم", "28 - المسيلة", "29 - معسكر", "30 - ورقلة",
  "31 - وهران", "32 - البيض", "33 - إليزي", "34 - برج بوعريريج", "35 - بومرداس",
  "36 - الطارف", "37 - تندوف", "38 - تيسمسيلت", "39 - الوادي", "40 - خنشلة",
  "41 - سوق أهراس", "42 - تيبازة", "43 - ميلة", "44 - عين الدفلى", "45 - النعامة",
  "46 - عين تيموشنت", "47 - غرداية", "48 - غليزان", "49 - تيميمون", "50 - برج باجي مختار",
  "51 - أولاد جلال", "52 - بني عباس", "53 - عين صالح", "54 - عين قزام", "55 - تقرت",
  "56 - جانت", "57 - المغير", "58 - المنيعة"
];

export default function SuperAdminSimple() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingKeys, setEditingKeys] = useState({ adminKey: '', teacherKey: '' });
  const [subscriptionData, setSubscriptionData] = useState({
    subscriptionExpiry: '',
    subscriptionStatus: 'active',
    subscriptionNotes: ''
  });
  const queryClient = useQueryClient();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    superAdminKey: ""
  });
  const [schoolData, setSchoolData] = useState({
    name: "",
    code: "",
    domain: "",
    location: "",
    adminKey: "",
    teacherKey: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF"
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Generate random keys for admin and teacher access
  const generateRandomKey = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const generateKeys = () => {
    setSchoolData({
      ...schoolData,
      adminKey: generateRandomKey().toUpperCase(),
      teacherKey: generateRandomKey().toUpperCase()
    });
  };
  
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
    superAdminKey: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch schools
  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ["/api/super-admin/schools"],
    enabled: user?.role === "super_admin"
  });

  // Create school mutation
  const createSchoolMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/schools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
      setSchoolData({
        name: "",
        code: "",
        domain: "",
        location: "",
        adminKey: "",
        teacherKey: "",
        primaryColor: "#3B82F6",
        secondaryColor: "#1E40AF"
      });
      setLogoFile(null);
      setLogoPreview(null);
      setShowCreateSchool(false);
      setError("");
    },
    onError: (error: any) => {
      setError(error.message || "فشل في إنشاء المدرسة");
    }
  });

  // Delete school mutation
  const deleteSchoolMutation = useMutation({
    mutationFn: (schoolId: number) => apiRequest("DELETE", `/api/super-admin/schools/${schoolId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/schools"] });
    },
    onError: (error: any) => {
      setError(error.message || "فشل في حذف المدرسة");
    }
  });

  // Fetch school statistics
  const { data: schoolStats } = useQuery({
    queryKey: ['/api/super-admin/schools', selectedSchool?.id, 'stats'],
    queryFn: () => fetch(`/api/super-admin/schools/${selectedSchool?.id}/stats`).then(res => res.json()),
    enabled: !!selectedSchool && showStatsModal
  });

  // Update school keys mutation
  const updateKeysMutation = useMutation({
    mutationFn: ({ schoolId, adminKey, teacherKey }: { schoolId: number, adminKey: string, teacherKey: string }) => {
      return apiRequest('PATCH', `/api/super-admin/schools/${schoolId}/keys`, { adminKey, teacherKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/schools'] });
      setShowKeysModal(false);
      setSelectedSchool(null);
      setEditingKeys({ adminKey: '', teacherKey: '' });
    },
    onError: (error: any) => {
      setError(error.message || "فشل في تحديث مفاتيح الوصول");
    }
  });

  // Update school subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ schoolId, subscriptionData }: { 
      schoolId: number, 
      subscriptionData: { 
        subscriptionExpiry?: string; 
        subscriptionStatus?: string; 
        subscriptionNotes?: string; 
      } 
    }) => {
      const payload = {
        subscriptionExpiry: subscriptionData.subscriptionExpiry ? new Date(subscriptionData.subscriptionExpiry) : null,
        subscriptionStatus: subscriptionData.subscriptionStatus,
        subscriptionNotes: subscriptionData.subscriptionNotes,
        subscriptionLastUpdated: new Date(),
        subscriptionUpdatedBy: user?.id
      };
      return apiRequest('PATCH', `/api/super-admin/schools/${schoolId}/subscription`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/schools'] });
      setShowSubscriptionModal(false);
      setSelectedSchool(null);
      setSubscriptionData({
        subscriptionExpiry: '',
        subscriptionStatus: 'active',
        subscriptionNotes: ''
      });
    },
    onError: (error: any) => {
      setError(error.message || "فشل في تحديث بيانات الاشتراك");
    }
  });

  // Toggle school access mutation
  const toggleAccessMutation = useMutation({
    mutationFn: ({ schoolId, isAccessEnabled }: { schoolId: number, isAccessEnabled: boolean }) => {
      return apiRequest('PATCH', `/api/super-admin/schools/${schoolId}/access`, { isAccessEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/schools'] });
    },
    onError: (error: any) => {
      setError(error.message || "فشل في تغيير حالة الوصول للمدرسة");
    }
  });

  const handleToggleSchoolAccess = (schoolId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    toggleAccessMutation.mutate({ schoolId, isAccessEnabled: newStatus });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل تسجيل الدخول");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل إنشاء الحساب");
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError("يجب اختيار ملف صورة صالح");
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Auto-generate keys if not provided
      let finalSchoolData = { ...schoolData };
      if (!finalSchoolData.adminKey) {
        finalSchoolData.adminKey = generateRandomKey().toUpperCase();
      }
      if (!finalSchoolData.teacherKey) {
        finalSchoolData.teacherKey = generateRandomKey().toUpperCase();
      }
      
      let logoUrl = "";
      
      // Upload logo if provided
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('type', 'school-logo');
        
        const uploadResponse = await fetch('/api/upload-content', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('فشل في رفع شعار المدرسة');
        }
        
        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url || uploadResult.imageUrl;
      }
      
      // Create school with logo URL
      const schoolDataWithLogo = {
        ...finalSchoolData,
        logoUrl
      };
      
      createSchoolMutation.mutate(schoolDataWithLogo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في إنشاء المدرسة");
    }
  };

  const handleDeleteSchool = (schoolId: number, schoolName: string) => {
    if (confirm(`هل أنت متأكد من حذف مدرسة "${schoolName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteSchoolMutation.mutate(schoolId);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }
    
    if (resetData.newPassword.length < 6) {
      setError("كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/super-admin-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "فشل في تحديث كلمة المرور");
      }

      alert("تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول");
      setShowPasswordReset(false);
      setResetData({
        email: "",
        newPassword: "",
        confirmPassword: "",
        superAdminKey: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "super_admin") {
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
                {showLogin ? "تسجيل الدخول" : "إنشاء حساب مسؤول عام"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Help */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-200 font-semibold mb-2">معلومات الحساب الموجود</h4>
                <div className="text-blue-100 text-sm space-y-2">
                  <p>• البريد الإلكتروني: <code className="bg-blue-900/30 px-1 rounded">mou3atheacc@gmail.com</code></p>
                  <p>• كلمة المرور: <code className="bg-blue-900/30 px-1 rounded">SUPER_ADMIN_2024_MASTER_KEY</code></p>
                  <p>• الحساب جاهز ومسجل كمسؤول عام</p>
                  <p>• يمكنك تسجيل الدخول مباشرة بالبيانات أعلاه</p>
                </div>
              </div>

              {showLogin && !showPasswordReset ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPasswordReset(true)}
                      className="text-purple-300 hover:text-white text-sm"
                    >
                      نسيت كلمة المرور؟
                    </Button>
                  </div>
                </form>
              ) : showPasswordReset ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white">البريد الإلكتروني</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetData.email}
                      onChange={(e) => setResetData({...resetData, email: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-white">كلمة المرور الجديدة</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-white">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData({...resetData, confirmPassword: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-key" className="text-white">مفتاح المسؤول العام</Label>
                    <Input
                      id="reset-key"
                      type="password"
                      value={resetData.superAdminKey}
                      onChange={(e) => setResetData({...resetData, superAdminKey: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      placeholder="SUPER_ADMIN_2024_MASTER_KEY"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowPasswordReset(false)}
                      className="text-purple-300 hover:text-white text-sm"
                    >
                      العودة إلى تسجيل الدخول
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">الاسم</Label>
                      <Input
                        id="name"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="bg-white/10 border-purple-500/30 text-white"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">الهاتف</Label>
                      <Input
                        id="phone"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                        className="bg-white/10 border-purple-500/30 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-white">البريد الإلكتروني</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-white">كلمة المرور</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-white">مفتاح المسؤول العام</Label>
                    <Input
                      id="key"
                      type="password"
                      value={registerData.superAdminKey}
                      onChange={(e) => setRegisterData({...registerData, superAdminKey: e.target.value})}
                      className="bg-white/10 border-purple-500/30 text-white"
                      placeholder="SUPER_ADMIN_2024_MASTER_KEY"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب مسؤول عام"}
                  </Button>
                </form>
              )}

              {!showPasswordReset && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-purple-300 hover:text-white"
                  >
                    {showLogin ? "إنشاء حساب مسؤول عام جديد" : "العودة إلى تسجيل الدخول"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">لوحة المسؤول العام</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">إدارة جميع المدارس والمؤسسات التعليمية</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="text-sm text-gray-600 dark:text-gray-300">مرحباً، {user.name}</span>
              <Button variant="outline" onClick={() => logout()}>تسجيل الخروج</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="mb-8">
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Shield className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">نظام إدارة المدارس جاهز!</h3>
                  <p className="text-green-700 dark:text-green-200">
                    تم تنفيذ نظام إدارة متعدد المدارس بالكامل مع فصل البيانات الكامل بين المدارس
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <School className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold dark:text-white">{schools.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المدارس</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold dark:text-white">{schools.filter((s: any) => s.active).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">المدارس النشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Globe className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold dark:text-white">{schools.filter((s: any) => s.domain).length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">نطاقات مخصصة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold dark:text-white">{new Date().toLocaleDateString('en-US')}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">تاريخ اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schools List */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>قائمة المدارس المسجلة</CardTitle>
                <CardDescription>جميع المدارس والمؤسسات التعليمية مرتبة حسب تاريخ انتهاء الاشتراك</CardDescription>
              </div>
              <Button onClick={() => setShowCreateSchool(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مدرسة جديدة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schoolsLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">جاري تحميل المدارس...</p>
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-8">
                <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد مدارس مسجلة بعد</p>
                <Button onClick={() => setShowCreateSchool(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  أضف أول مدرسة
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {schools
                  .sort((a: any, b: any) => {
                    // Schools with no subscription expiry go to the end
                    if (!a.subscriptionExpiry && !b.subscriptionExpiry) return 0;
                    if (!a.subscriptionExpiry) return 1;
                    if (!b.subscriptionExpiry) return -1;
                    
                    // Sort by subscription expiry date (earliest first)
                    return new Date(a.subscriptionExpiry).getTime() - new Date(b.subscriptionExpiry).getTime();
                  })
                  .map((school: any) => {
                    // Calculate days remaining
                    const getDaysRemaining = (expiryDate: string) => {
                      if (!expiryDate) return null;
                      const today = new Date();
                      const expiry = new Date(expiryDate);
                      const diffTime = expiry.getTime() - today.getTime();
                      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    };
                    
                    const daysRemaining = getDaysRemaining(school.subscriptionExpiry);
                    
                    return (
                      <div key={school.id} className={`border rounded-lg p-3 ${
                        school.isAccessEnabled === false 
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 opacity-75' 
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            {school.logoUrl ? (
                              <img 
                                src={school.logoUrl} 
                                alt={`شعار ${school.name}`}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: school.primaryColor }}
                              >
                                {school.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse flex-wrap">
                                <h3 className="text-sm font-medium dark:text-white">{school.name}</h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">({school.code})</span>
                                <Badge variant="outline" className="text-xs px-1 py-0">
                                  {school.userCount || 0}
                                </Badge>
                                
                                {/* Access status badge */}
                                {school.isAccessEnabled === false && (
                                  <Badge 
                                    variant="destructive"
                                    className="text-xs px-2 py-0 bg-red-600 text-white"
                                  >
                                    معطل
                                  </Badge>
                                )}
                                
                                {/* Days remaining badge */}
                                {daysRemaining !== null && (
                                  <Badge 
                                    variant={daysRemaining <= 7 ? "destructive" : daysRemaining <= 30 ? "default" : "secondary"}
                                    className={`text-xs px-2 py-0 ${
                                      daysRemaining <= 0 ? 'bg-red-600 text-white' :
                                      daysRemaining <= 7 ? 'bg-red-500 text-white' :
                                      daysRemaining <= 30 ? 'bg-yellow-500 text-white' :
                                      'bg-green-500 text-white'
                                    }`}
                                  >
                                    {daysRemaining <= 0 ? 'منتهي' : 
                                     daysRemaining === 1 ? 'يوم واحد' :
                                     daysRemaining <= 10 ? `${daysRemaining} أيام` :
                                     `${daysRemaining} يوم`}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                                {school.location && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{school.location}</span>
                                )}
                                {school.subscriptionExpiry && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    • انتهاء: {new Date(school.subscriptionExpiry).toLocaleDateString('ar-DZ', { 
                                      calendar: 'gregory',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedSchool(school);
                                setShowStatsModal(true);
                              }}
                              title="إحصائيات"
                            >
                              <BarChart className="h-3 w-3" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedSchool(school);
                                setEditingKeys({ adminKey: school.adminKey, teacherKey: school.teacherKey });
                                setShowKeysModal(true);
                              }}
                              title="مفاتيح"
                            >
                              <Key className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => {
                                setSelectedSchool(school);
                                setSubscriptionData({
                                  subscriptionExpiry: school.subscriptionExpiry ? new Date(school.subscriptionExpiry).toISOString().split('T')[0] : '',
                                  subscriptionStatus: school.subscriptionStatus || 'active',
                                  subscriptionNotes: school.subscriptionNotes || ''
                                });
                                setShowSubscriptionModal(true);
                              }}
                              title="إدارة الاشتراك"
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 w-7 p-0 ${school.isAccessEnabled === false ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                              onClick={() => handleToggleSchoolAccess(school.id, school.isAccessEnabled)}
                              title={school.isAccessEnabled === false ? "تفعيل الوصول" : "إيقاف الوصول"}
                            >
                              {school.isAccessEnabled === false ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => window.open(`/school/${school.code}`, '_blank')}
                              title="عرض"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              disabled={deleteSchoolMutation.isPending}
                              title="حذف"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create School Form */}
        {showCreateSchool && (
          <Card>
            <CardHeader>
              <CardTitle>إضافة مدرسة جديدة</CardTitle>
              <CardDescription>قم بإنشاء مدرسة أو مؤسسة تعليمية جديدة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-red-500/50 bg-red-500/10 dark:bg-red-500/20">
                  <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">اسم المدرسة</Label>
                    <Input
                      id="school-name"
                      value={schoolData.name}
                      onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                      placeholder="مدرسة النور الابتدائية"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="school-code">كود المدرسة</Label>
                    <Input
                      id="school-code"
                      value={schoolData.code}
                      onChange={(e) => setSchoolData({...schoolData, code: e.target.value})}
                      placeholder="nour-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school-domain">النطاق (اختياري)</Label>
                    <Input
                      id="school-domain"
                      value={schoolData.domain}
                      onChange={(e) => setSchoolData({...schoolData, domain: e.target.value})}
                      placeholder="nour-school.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="school-location">الولاية</Label>
                    <Select
                      value={schoolData.location}
                      onValueChange={(value) => setSchoolData({...schoolData, location: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الولاية" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {ALGERIAN_WILAYAS.map((wilaya) => (
                          <SelectItem key={wilaya} value={wilaya}>
                            {wilaya}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Logo Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="school-logo">شعار المدرسة (اختياري)</Label>
                  <Input
                    id="school-logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    يقبل ملفات الصور (JPG, PNG, SVG) - الحد الأقصى 2 ميجابايت
                  </p>
                  
                  {logoPreview && (
                    <div className="mt-3">
                      <Label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">معاينة الشعار:</Label>
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <img 
                          src={logoPreview} 
                          alt="معاينة شعار المدرسة" 
                          className="h-20 w-20 object-contain mx-auto rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Access Keys Section */}
                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Key className="h-5 w-5 text-yellow-600" />
                      <Label className="text-yellow-800 dark:text-yellow-200 font-semibold">مفاتيح الوصول</Label>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={generateKeys}
                      className="text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
                    >
                      <RefreshCw className="h-4 w-4 ml-2" />
                      توليد مفاتيح جديدة
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-key" className="text-sm font-medium">مفتاح المدير</Label>
                      <div className="relative">
                        <Input
                          id="admin-key"
                          value={schoolData.adminKey}
                          onChange={(e) => setSchoolData({...schoolData, adminKey: e.target.value})}
                          placeholder="مفتاح خاص بالمديرين"
                          className="pr-10"
                          required
                        />
                        <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-yellow-700">يستخدمه المديرون للتسجيل في المدرسة</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="teacher-key" className="text-sm font-medium">مفتاح المعلم</Label>
                      <div className="relative">
                        <Input
                          id="teacher-key"
                          value={schoolData.teacherKey}
                          onChange={(e) => setSchoolData({...schoolData, teacherKey: e.target.value})}
                          placeholder="مفتاح خاص بالمعلمين"
                          className="pr-10"
                          required
                        />
                        <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-yellow-700">يستخدمه المعلمون للتسجيل في المدرسة</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-100 rounded-md">
                    <p className="text-xs text-yellow-800">
                      <strong>ملاحظة:</strong> احتفظ بهذه المفاتيح آمنة وشاركها فقط مع المديرين والمعلمين المعتمدين.
                      بينما يمكن للطلاب وأولياء الأمور التسجيل مباشرة باستخدام كود المدرسة.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">اللون الأساسي</Label>
                    <Input
                      id="primary-color"
                      type="color"
                      value={schoolData.primaryColor}
                      onChange={(e) => setSchoolData({...schoolData, primaryColor: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">اللون الثانوي</Label>
                    <Input
                      id="secondary-color"
                      type="color"
                      value={schoolData.secondaryColor}
                      onChange={(e) => setSchoolData({...schoolData, secondaryColor: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                  <Button type="button" variant="outline" onClick={() => setShowCreateSchool(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createSchoolMutation.isPending}>
                    {createSchoolMutation.isPending ? "جاري الإنشاء..." : "إنشاء المدرسة"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Access Keys Modal */}
        {selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Key className="h-5 w-5" />
                    <span>مفاتيح الوصول - {selectedSchool.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSchool(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                </CardTitle>
                <CardDescription>
                  مفاتيح الوصول الخاصة بالمديرين والمعلمين لهذه المدرسة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <Label className="font-semibold text-blue-800">مفتاح المدير</Label>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {selectedSchool.adminKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(selectedSchool.adminKey)}
                          className="text-blue-600 border-blue-300"
                        >
                          نسخ
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        يستخدمه المديرون عند إنشاء حساب جديد
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <Label className="font-semibold text-green-800">مفتاح المعلم</Label>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {selectedSchool.teacherKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(selectedSchool.teacherKey)}
                          className="text-green-600 border-green-300"
                        >
                          نسخ
                        </Button>
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        يستخدمه المعلمون عند إنشاء حساب جديد
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3 rtl:space-x-reverse">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-yellow-600 text-sm font-bold">!</span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-yellow-800">إرشادات الاستخدام:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• شارك مفتاح المدير مع المديرين المعتمدين فقط</li>
                        <li>• شارك مفتاح المعلم مع المعلمين المعتمدين فقط</li>
                        <li>• الطلاب وأولياء الأمور لا يحتاجون لمفاتيح - يسجلون مباشرة</li>
                        <li>• يمكن إنشاء مفاتيح جديدة في أي وقت من نموذج تعديل المدرسة</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => setSelectedSchool(null)}
                    className="px-8"
                  >
                    إغلاق
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* School Access Instructions */}
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle>كيفية الوصول إلى المدارس</CardTitle>
            <CardDescription>طرق الوصول إلى كل مدرسة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">الوصول عبر الكود</h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                  يمكن للمستخدمين الوصول إلى مدرستهم عبر الرابط التالي:
                </p>
                <code className="bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded text-sm dark:text-blue-200">
                  /school/[school-code]
                </code>
              </div>
              
              {schools.filter((s: any) => s.domain).length > 0 && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">النطاقات المخصصة</h4>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-2">
                    المدارس التي لديها نطاقات مخصصة:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {schools.filter((s: any) => s.domain).map((school: any) => (
                      <li key={school.id} className="text-green-700 dark:text-green-300">
                        <strong className="dark:text-green-200">{school.name}</strong>: <span className="dark:text-green-300">{school.domain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features List */}
        <div className="mt-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle>ميزات النظام متعدد المدارس</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ فصل البيانات الكامل</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">كل مدرسة لها بيانات منفصلة تماماً</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ تخصيص العلامة التجارية</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ألوان وشعارات مخصصة لكل مدرسة</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ إدارة مركزية</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">إدارة جميع المدارس من لوحة واحدة</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✓ وصول آمن</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">وصول مخفي ومحمي بمفتاح سري</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* School Statistics Modal */}
        {showStatsModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 rtl:space-x-reverse">
                    <BarChart className="h-6 w-6 text-blue-600" />
                    <span>إحصائيات مدرسة {selectedSchool.name}</span>
                  </CardTitle>
                  <CardDescription>
                    نظرة شاملة على المستخدمين والمحتوى في المدرسة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {schoolStats ? (
                    <>
                      {/* User Statistics */}
                      <div>
                        <h3 className="text-sm font-medium mb-3 text-gray-700">المستخدمين</h3>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.totalUsers}</div>
                            <div className="text-xs text-gray-600">المجموع</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.admins}</div>
                            <div className="text-xs text-gray-600">مديرين</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.teachers}</div>
                            <div className="text-xs text-gray-600">معلمين</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.students}</div>
                            <div className="text-xs text-gray-600">طلاب</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.parents}</div>
                            <div className="text-xs text-gray-600">أولياء أمور</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.children}</div>
                            <div className="text-xs text-gray-600">أطفال</div>
                          </div>
                        </div>
                      </div>

                      {/* Content Statistics */}
                      <div>
                        <h3 className="text-sm font-medium mb-3 text-gray-700">المحتوى</h3>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.announcements}</div>
                            <div className="text-xs text-gray-600">إعلانات</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.blogPosts}</div>
                            <div className="text-xs text-gray-600">مقالات</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.groups}</div>
                            <div className="text-xs text-gray-600">مجموعات</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded border">
                            <div className="text-lg font-bold text-gray-800">{schoolStats.formations}</div>
                            <div className="text-xs text-gray-600">تكوينات</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">جاري تحميل الإحصائيات...</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                    <Button variant="outline" onClick={() => {
                      setShowStatsModal(false);
                      setSelectedSchool(null);
                    }}>
                      إغلاق
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Access Keys Management Modal */}
        {showKeysModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Key className="h-6 w-6 text-green-600" />
                    <span>إدارة مفاتيح الوصول - {selectedSchool.name}</span>
                  </CardTitle>
                  <CardDescription>
                    تحديث مفاتيح الوصول للمديرين والمعلمين
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10">
                      <AlertDescription className="text-red-700">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateKeysMutation.mutate({
                      schoolId: selectedSchool.id,
                      adminKey: editingKeys.adminKey,
                      teacherKey: editingKeys.teacherKey
                    });
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-key">مفتاح المدير</Label>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Input
                          id="admin-key"
                          type="text"
                          value={editingKeys.adminKey}
                          onChange={(e) => setEditingKeys({...editingKeys, adminKey: e.target.value})}
                          placeholder="مفتاح المدير"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingKeys({
                            ...editingKeys,
                            adminKey: Math.random().toString(36).substring(2, 15).toUpperCase()
                          })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher-key">مفتاح المعلم</Label>
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <Input
                          id="teacher-key"
                          type="text"
                          value={editingKeys.teacherKey}
                          onChange={(e) => setEditingKeys({...editingKeys, teacherKey: e.target.value})}
                          placeholder="مفتاح المعلم"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingKeys({
                            ...editingKeys,
                            teacherKey: Math.random().toString(36).substring(2, 15).toUpperCase()
                          })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-yellow-600 text-sm font-bold">!</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-yellow-800">تحذير هام:</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            تغيير المفاتيح سيؤدي إلى إبطال المفاتيح القديمة. تأكد من إبلاغ المديرين والمعلمين بالمفاتيح الجديدة.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowKeysModal(false);
                          setSelectedSchool(null);
                          setEditingKeys({ adminKey: '', teacherKey: '' });
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateKeysMutation.isPending}
                      >
                        {updateKeysMutation.isPending ? 'جاري التحديث...' : 'تحديث المفاتيح'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Subscription Management Modal */}
        {showSubscriptionModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3 rtl:space-x-reverse">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <span>إدارة اشتراك - {selectedSchool.name}</span>
                  </CardTitle>
                  <CardDescription>
                    تحديث تفاصيل اشتراك المدرسة وتاريخ انتهاء الصلاحية
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert className="border-red-500/50 bg-red-500/10 dark:bg-red-500/20">
                      <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    updateSubscriptionMutation.mutate({
                      schoolId: selectedSchool.id,
                      subscriptionData
                    });
                  }} className="space-y-4">
                    
                    <div className="space-y-2">
                      <Label htmlFor="subscription-expiry">تاريخ انتهاء الاشتراك</Label>
                      <Input
                        id="subscription-expiry"
                        type="date"
                        value={subscriptionData.subscriptionExpiry}
                        onChange={(e) => setSubscriptionData({
                          ...subscriptionData, 
                          subscriptionExpiry: e.target.value
                        })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        اترك فارغًا إذا كان الاشتراك مفتوحًا بدون تاريخ انتهاء
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscription-status">حالة الاشتراك</Label>
                      <Select
                        value={subscriptionData.subscriptionStatus}
                        onValueChange={(value) => setSubscriptionData({
                          ...subscriptionData, 
                          subscriptionStatus: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حالة الاشتراك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">نشط</SelectItem>
                          <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                          <SelectItem value="suspended">معلق</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subscription-notes">ملاحظات إدارية</Label>
                      <Input
                        id="subscription-notes"
                        type="text"
                        value={subscriptionData.subscriptionNotes}
                        onChange={(e) => setSubscriptionData({
                          ...subscriptionData, 
                          subscriptionNotes: e.target.value
                        })}
                        placeholder="ملاحظات حول الاشتراك (اختياري)"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ملاحظات خاصة بالإدارة العليا حول اشتراك هذه المدرسة
                      </p>
                    </div>

                    {/* Current subscription info */}
                    {selectedSchool.subscriptionExpiry && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">معلومات الاشتراك الحالي:</h4>
                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <p><strong>تاريخ الانتهاء:</strong> {new Date(selectedSchool.subscriptionExpiry).toLocaleDateString('ar-DZ', { 
                            calendar: 'gregory',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}</p>
                          <p><strong>الحالة:</strong> {selectedSchool.subscriptionStatus === 'active' ? 'نشط' : 
                                                      selectedSchool.subscriptionStatus === 'expired' ? 'منتهي الصلاحية' : 
                                                      selectedSchool.subscriptionStatus === 'suspended' ? 'معلق' : 
                                                      selectedSchool.subscriptionStatus}</p>
                          {selectedSchool.subscriptionNotes && (
                            <p><strong>الملاحظات:</strong> {selectedSchool.subscriptionNotes}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-yellow-600 text-sm font-bold">!</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">ملاحظة هامة:</h4>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            ستظهر تحديثات الاشتراك فورًا لإدارة المدرسة. سيتم إرسال تنبيهات تلقائية عند اقتراب انتهاء الاشتراك (7 أيام).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSubscriptionModal(false);
                          setSelectedSchool(null);
                          setSubscriptionData({
                            subscriptionExpiry: '',
                            subscriptionStatus: 'active',
                            subscriptionNotes: ''
                          });
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        {updateSubscriptionMutation.isPending ? 'جاري التحديث...' : 'تحديث الاشتراك'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}