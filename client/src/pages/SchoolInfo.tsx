import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Phone, Mail, Globe, Camera, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import imageCompression from 'browser-image-compression';

interface SchoolInfo {
  id: number;
  name: string;
  wilaya: string;
  fullAddress: string;
  adminPhone: string;
  schoolEmail: string;
  website: string;
  logoUrl: string;
}

export default function SchoolInfo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    wilaya: '',
    fullAddress: '',
    adminPhone: '',
    schoolEmail: '',
    website: '',
    logoUrl: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch current school information - available to all authenticated users
  const { data: schoolInfo, isLoading } = useQuery<SchoolInfo>({
    queryKey: ['/api/school/info'],
    enabled: !!user, // Allow all authenticated users to view
  });

  // Update form data when school info loads
  useEffect(() => {
    if (schoolInfo) {
      setFormData({
        name: schoolInfo.name || '',
        wilaya: schoolInfo.wilaya || '',
        fullAddress: schoolInfo.fullAddress || '',
        adminPhone: schoolInfo.adminPhone || '',
        schoolEmail: schoolInfo.schoolEmail || '',
        website: schoolInfo.website || '',
        logoUrl: schoolInfo.logoUrl || ''
      });
      if (schoolInfo.logoUrl) {
        setLogoPreview(schoolInfo.logoUrl);
      }
    }
  }, [schoolInfo]);

  // Handle logo file selection with compression
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress the image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 0.5, // 500KB max
          maxWidthOrHeight: 800, // Max dimension 800px
          useWebWorker: true,
          initialQuality: 0.8
        });
        
        setLogoFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression error:', error);
        // Fallback to original file if compression fails
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Update school information mutation
  const updateSchoolMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', '/api/school/info', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update school information');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تحديث معلومات المدرسة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/school/info'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في تحديث معلومات المدرسة', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ 
        title: 'يرجى إدخال اسم المدرسة',
        variant: 'destructive' 
      });
      return;
    }

    let logoUrl = formData.logoUrl;

    // Upload logo if a new file is selected
    if (logoFile) {
      setIsUploading(true);
      try {
        const formDataToUpload = new FormData();
        formDataToUpload.append('logo', logoFile);
        
        const uploadResponse = await fetch('/api/upload/school-logo', {
          method: 'POST',
          body: formDataToUpload
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          logoUrl = uploadResult.logoUrl;
        }
      } catch (error) {
        console.error('Logo upload error:', error);
        toast({ 
          title: 'خطأ في رفع شعار المدرسة', 
          variant: 'destructive' 
        });
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    updateSchoolMutation.mutate({
      ...formData,
      logoUrl
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">جاري تحميل معلومات المدرسة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(user.role === 'admin' ? '/admin' : '/home')}
              variant="outline"
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {user.role === 'admin' ? 'العودة للإدارة' : 'العودة للرئيسية'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                حول المدرسة
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user.role === 'admin' ? 'تحديث معلومات وبيانات المدرسة' : 'معلومات وبيانات المدرسة'}
              </p>
            </div>
          </div>
        </div>

        {/* School Information Form */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-l from-primary/10 to-primary/5 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-xl flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              معلومات المدرسة
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {user.role === 'admin' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Admin: School Logo with Upload */}
                <div className="text-center">
                  <Label className="text-base font-medium block mb-4">شعار المدرسة</Label>
                  <div className="mb-4">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="School Logo" 
                        className="w-32 h-32 object-contain mx-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-64 mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">اختر صورة لشعار المدرسة (PNG, JPG)</p>
                </div>

                {/* Admin: Basic Information - Editable */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-base font-medium">اسم المدرسة</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل اسم المدرسة"
                      className="mt-2"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="wilaya" className="text-base font-medium">الولاية</Label>
                    <Input
                      id="wilaya"
                      value={formData.wilaya}
                      onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                      placeholder="أدخل اسم الولاية"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="fullAddress" className="text-base font-medium">العنوان الكامل</Label>
                  <Input
                    id="fullAddress"
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    placeholder="أدخل العنوان الكامل للمدرسة"
                    className="mt-2"
                  />
                </div>

                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="adminPhone" className="text-base font-medium">هاتف الإدارة</Label>
                    <Input
                      id="adminPhone"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      placeholder="رقم هاتف إدارة المدرسة"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolEmail" className="text-base font-medium">البريد الإلكتروني</Label>
                    <Input
                      id="schoolEmail"
                      type="email"
                      value={formData.schoolEmail}
                      onChange={(e) => setFormData({ ...formData, schoolEmail: e.target.value })}
                      placeholder="البريد الإلكتروني للمدرسة"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <Label htmlFor="website" className="text-base font-medium">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-2"
                  />
                </div>

                {/* Submit Button - Only for admins */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    disabled={updateSchoolMutation.isPending || isUploading}
                    className="bg-primary hover:bg-primary/90 text-white min-w-32"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                        جاري رفع الشعار...
                      </>
                    ) : updateSchoolMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التغييرات
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Non-admin: Read-only View */
              <div className="space-y-6">
                {/* Read-only Logo Display */}
                <div className="text-center">
                  <Label className="text-base font-medium block mb-4">شعار المدرسة</Label>
                  <div className="mb-4">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="School Logo" 
                        className="w-32 h-32 object-contain mx-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Read-only Basic Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium">اسم المدرسة</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100">{formData.name || 'غير محدد'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-medium">الولاية</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100">{formData.wilaya || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                {/* Read-only Address */}
                <div>
                  <Label className="text-base font-medium">العنوان الكامل</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">{formData.fullAddress || 'غير محدد'}</span>
                  </div>
                </div>

                {/* Read-only Contact Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium">هاتف الإدارة</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100">{formData.adminPhone || 'غير محدد'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base font-medium">البريد الإلكتروني</Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-gray-100">{formData.schoolEmail || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                {/* Read-only Website */}
                <div>
                  <Label className="text-base font-medium">الموقع الإلكتروني</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-900 dark:text-gray-100">{formData.website || 'غير محدد'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                معلومات الموقع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">الولاية:</span>
                <span className="font-medium">{formData.wilaya || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">العنوان:</span>
                <span className="font-medium text-left">{formData.fullAddress || 'غير محدد'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                معلومات الاتصال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">الهاتف:</span>
                <span className="font-medium">{formData.adminPhone || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">البريد:</span>
                <span className="font-medium text-left">{formData.schoolEmail || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">الموقع:</span>
                <span className="font-medium text-left">{formData.website || 'غير محدد'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}