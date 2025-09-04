import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Plus, FileText, Users, BookOpen, X, ArrowLeft, Trash2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import imageCompression from 'browser-image-compression';

interface CreateFormData {
  title: string;
  content: string;
  description: string;
  subject: string;
  category: string;
  duration: string;
  price: string;
  maxMembers: string;
  name: string;
  bio: string;
  email: string;
  phone: string;
  imageUrl: string;
  specializations?: string[];
  educationLevels?: string[];
  experience?: string;
  qualifications?: string;
}

export default function AdminContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Debug user authentication state
  console.log('AdminContent: Component loaded');
  console.log('AdminContent: Current user:', user);
  console.log('AdminContent: User role:', user?.role);
  
  const [activeTab, setActiveTab] = useState<'announcement' | 'blog' | 'group' | 'formation'>('announcement');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>({
    title: '',
    content: '',
    description: '',
    subject: '',
    category: '',
    duration: '',
    price: '',
    maxMembers: '',
    name: '',
    bio: '',
    email: '',
    phone: '',
    imageUrl: '',
    specializations: [],
    educationLevels: [],
    experience: '',
    qualifications: ''
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Announcement creation mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating announcement with data:', data);
      const response = await apiRequest('POST', '/api/announcements', data);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Announcement creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create announcement');
      }
      return await response.json();
    },
    onSuccess: () => {
      console.log('Announcement created successfully');
      toast({ title: 'تم إنشاء الإعلان بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error: any) => {
      console.error('Announcement creation error:', error);
      toast({ 
        title: 'خطأ في إنشاء الإعلان', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  // Blog creation mutation
  const createBlogMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/blog-posts', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المقال بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المقال', variant: 'destructive' });
    }
  });

  // Group creation mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/groups', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المجموعة بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء المجموعة', variant: 'destructive' });
    }
  });

  // Formation creation mutation
  const createFormationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/formations', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء التكوين بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/formations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في إنشاء التكوين', variant: 'destructive' });
    }
  });

  // Teacher creation mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('=== Teacher Creation Debug ===');
      console.log('Data being sent to server:', JSON.stringify(data, null, 2));
      console.log('Data types:', Object.entries(data).map(([key, value]) => ({ [key]: typeof value })));
      
      const response = await apiRequest('POST', '/api/teachers', data);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('=== Teacher Creation Failed ===');
        console.error('Error data:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.message || errorData.error || 'Failed to create teacher');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إنشاء المعلم بنجاح' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: (error: any) => {
      console.error('Teacher creation error:', error);
      toast({ 
        title: 'خطأ في إنشاء المعلم', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  // Delete mutations
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/announcements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف الإعلان بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف الإعلان', variant: 'destructive' });
    }
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/blog-posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المقال بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المقال', variant: 'destructive' });
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/groups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المجموعة بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المجموعة', variant: 'destructive' });
    }
  });

  const deleteFormationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/formations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف التكوين بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/formations'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف التكوين', variant: 'destructive' });
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/teachers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم حذف المعلم بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: () => {
      toast({ title: 'خطأ في حذف المعلم', variant: 'destructive' });
    }
  });

  // Fetch existing content
  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ['/api/announcements'],
    enabled: activeTab === 'announcement'
  });

  const { data: blogPosts = [] } = useQuery<any[]>({
    queryKey: ['/api/blog-posts'],
    enabled: activeTab === 'blog'
  });

  const { data: groups = [] } = useQuery<any[]>({
    queryKey: ['/api/groups'],
    enabled: activeTab === 'group'
  });

  const { data: formations = [] } = useQuery<any[]>({
    queryKey: ['/api/formations'],
    enabled: activeTab === 'formation'
  });

  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['/api/teachers'],
    enabled: activeTab === 'teacher'
  });

  const { data: teachingModules = [] } = useQuery<any[]>({
    queryKey: ['/api/teaching-modules'],
    enabled: activeTab === 'teacher'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      subject: '',
      category: '',
      duration: '',
      price: '',
      maxMembers: '',
      name: '',
      bio: '',
      email: '',
      phone: '',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(false);
  };

  // Image upload handler with compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress the image
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1, // 1MB max for content images
          maxWidthOrHeight: 1200, // Max dimension 1200px
          useWebWorker: true,
          initialQuality: 0.8
        });
        
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression error:', error);
        // Fallback to original file if compression fails
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Upload image to server
  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return '';
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('contentImage', imageFile);
      formData.append('type', activeTab); // blog, group, formation
      
      const response = await fetch('/api/upload-content', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'خطأ في رفع الصورة', variant: 'destructive' });
      return '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Current user:', user);
    console.log('Form data:', formData);
    console.log('Active tab:', activeTab);
    
    // Upload image first if provided
    let imageUrl = '';
    if (imageFile) {
      console.log('Uploading image:', imageFile.name);
      imageUrl = await uploadImage();
      if (!imageUrl && imageFile) {
        console.log('Image upload failed, stopping submission');
        return;
      }
      console.log('Image uploaded successfully:', imageUrl);
    }
    
    if (activeTab === 'announcement') {
      console.log('Creating announcement with:', {
        title: formData.title,
        content: formData.content,
        imageUrl: imageUrl || null
      });
      createAnnouncementMutation.mutate({
        title: formData.title,
        content: formData.content,
        imageUrl: imageUrl || null
      });
    } else if (activeTab === 'blog') {
      createBlogMutation.mutate({
        title: formData.title,
        content: formData.content,
        published: true,
        imageUrl: imageUrl || null
      });
    } else if (activeTab === 'group') {
      createGroupMutation.mutate({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        imageUrl: imageUrl || null
      });
    } else if (activeTab === 'formation') {
      createFormationMutation.mutate({
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        price: formData.price,
        category: formData.category,
        imageUrl: imageUrl || null
      });
    } else if (activeTab === 'teacher') {
      // Validate required fields
      if (!formData.subject?.trim()) {
        toast({ 
          title: 'خطأ في البيانات', 
          description: 'يجب إدخال المادة التخصص',
          variant: 'destructive' 
        });
        return;
      }
      
      createTeacherMutation.mutate({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        bio: formData.bio,
        available: true,
        imageUrl: imageUrl || null
      });
    }
  };

  const tabs = [
    { id: 'announcement', label: 'الإعلانات', icon: Megaphone },
    { id: 'blog', label: 'المقالات', icon: FileText },
    { id: 'formation', label: 'التكوينات', icon: BookOpen }
  ];

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
            className="text-gray-600 hover:text-gray-800 p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-gray-800">إدارة المحتوى</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة جديد
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 space-x-reverse px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {activeTab === 'announcement' && 'إنشاء إعلان جديد'}
              {activeTab === 'blog' && 'إنشاء مقال جديد'}
              {activeTab === 'group' && 'إنشاء مجموعة جديدة'}
              {activeTab === 'formation' && 'إنشاء تكوين جديد'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Announcement Fields */}
              {activeTab === 'announcement' && (
                <>
                  <div>
                    <Label htmlFor="title">عنوان الإعلان</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="اكتب عنوان الإعلان"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">محتوى الإعلان</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="اكتب محتوى الإعلان"
                      rows={8}
                      required
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image">صورة الإعلان (اختياري)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Blog Fields */}
              {activeTab === 'blog' && (
                <>
                  <div>
                    <Label htmlFor="title">عنوان المقال</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="اكتب عنوان المقال"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">محتوى المقال</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="اكتب محتوى المقال"
                      rows={8}
                      required
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image">صورة المقال (اختياري)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Group Fields */}
              {activeTab === 'group' && (
                <>
                  <div>
                    <Label htmlFor="name">اسم المجموعة</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="اكتب اسم المجموعة"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">وصف المجموعة</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصف المجموعة"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="فئة المجموعة"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxMembers">أقصى عدد أعضاء</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                      placeholder="أقصى عدد أعضاء (اختياري)"
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image">صورة المجموعة (اختياري)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Formation Fields */}
              {activeTab === 'formation' && (
                <>
                  <div>
                    <Label htmlFor="title">عنوان التكوين</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="اكتب عنوان التكوين"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">وصف التكوين</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصف التكوين"
                      rows={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">مدة التكوين</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="مثال: 3 أشهر"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">السعر</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="مثال: 15000 دج"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">الفئة</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="فئة التكوين"
                      required
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image">صورة التكوين (اختياري)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Teacher Fields */}
              {activeTab === 'teacher' && (
                <>
                  <div>
                    <Label htmlFor="name">اسم المعلم</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="اكتب اسم المعلم"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="البريد الإلكتروني للمعلم"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="رقم هاتف المعلم"
                    />
                  </div>

                  {/* Subject Field */}
                  <div>
                    <Label htmlFor="subject">المادة التخصص</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة التي يدرسها المعلم" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachingModules.map((module: any) => (
                          <SelectItem key={module.id} value={module.nameAr}>
                            {module.nameAr} ({module.educationLevel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">نبذة عن المعلم</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="اكتب نبذة عن المعلم"
                      rows={3}
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div>
                    <Label htmlFor="image">صورة المعلم (اختياري)</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg bg-gray-100" />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex space-x-2 space-x-reverse pt-4">
                <Button
                  type="submit"
                  disabled={
                    createAnnouncementMutation.isPending ||
                    createBlogMutation.isPending ||
                    createGroupMutation.isPending ||
                    createFormationMutation.isPending ||
                    createTeacherMutation.isPending ||
                    isUploading
                  }
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isUploading
                    ? 'جاري رفع الصورة...'
                    : (createAnnouncementMutation.isPending || createBlogMutation.isPending || createGroupMutation.isPending || 
                       createFormationMutation.isPending || createTeacherMutation.isPending)
                      ? 'جاري الإنشاء...'
                      : 'إنشاء'
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-gray-600"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'announcement' && `الإعلانات الموجودة (${announcements.length})`}
            {activeTab === 'blog' && `المقالات الموجودة (${blogPosts.length})`}
            {activeTab === 'group' && `المجموعات الموجودة (${groups.length})`}
            {activeTab === 'formation' && `التكوينات الموجودة (${formations.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Announcements List */}
            {activeTab === 'announcement' && (
              <>
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد إعلانات</p>
                ) : (
                  announcements.map((announcement: any) => (
                    <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 flex items-center gap-3">
                        {announcement.imageUrl && (
                          <img 
                            src={announcement.imageUrl} 
                            alt={announcement.title} 
                            className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{announcement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(announcement.createdAt).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                        disabled={deleteAnnouncementMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Blog Posts List */}
            {activeTab === 'blog' && (
              <>
                {blogPosts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد مقالات</p>
                ) : (
                  blogPosts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 flex items-center gap-3">
                        {post.imageUrl && (
                          <img 
                            src={post.imageUrl} 
                            alt={post.title} 
                            className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{post.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(post.createdAt).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteBlogMutation.mutate(post.id)}
                        disabled={deleteBlogMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Groups List */}
            {activeTab === 'group' && (
              <>
                {groups.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد مجموعات</p>
                ) : (
                  groups.map((group: any) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 flex items-center gap-3">
                        {group.imageUrl && (
                          <img 
                            src={group.imageUrl} 
                            alt={group.name} 
                            className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{group.name}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-500 truncate">الفئة: {group.category}</span>
                            {group.maxMembers && (
                              <span className="text-xs text-gray-500 truncate">أقصى عدد: {group.maxMembers}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteGroupMutation.mutate(group.id)}
                        disabled={deleteGroupMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Formations List */}
            {activeTab === 'formation' && (
              <>
                {formations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">لا توجد تكوينات</p>
                ) : (
                  formations.map((formation: any) => (
                    <div key={formation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {formation.imageUrl && (
                          <img 
                            src={formation.imageUrl} 
                            alt={formation.title} 
                            className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{formation.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{formation.description}</p>
                          <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 mt-1">
                            <span className="text-xs text-gray-500 truncate">المدة: {formation.duration}</span>
                            <span className="text-xs text-gray-500 truncate">السعر: {formation.price}</span>
                            <span className="text-xs text-gray-500 truncate">الفئة: {formation.category}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => deleteFormationMutation.mutate(formation.id)}
                        disabled={deleteFormationMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 self-end sm:self-center flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </>
            )}

          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-purple-800 mb-2">تعليمات:</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• إنشاء إعلانات جديدة مع إمكانية إضافة الصور</li>
            <li>• يمكنك إنشاء مقالات جديدة في المدونة مع إمكانية إضافة الصور</li>
            <li>• إضافة مجموعات تعليمية للطلاب مع الصور التوضيحية</li>
            <li>• إنشاء تكوينات مهنية مع الصور الوصفية</li>
            <li>• إضافة معلمين جدد مع صورهم الشخصية</li>
            <li>• حذف أي محتوى غير مرغوب فيه باستخدام زر الحذف</li>
            <li>• رفع الصور اختياري - يمكن إنشاء المحتوى بدون صور</li>
            <li>• جميع المحتوى سيظهر للمستخدمين فور إنشائه</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}