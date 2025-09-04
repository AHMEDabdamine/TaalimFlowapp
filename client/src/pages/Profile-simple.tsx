import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save, Plus, Trash2, Baby } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Child {
  id: number;
  name: string;
  educationLevel: string;
  grade: string;
  parentId: number;
  createdAt: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    educationLevel: '',
    grade: ''
  });
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const educationLevels = {
    'الابتدائي': [
      '5 سنوات',
      'السنة الأولى ابتدائي',
      'السنة الثانية ابتدائي',
      'السنة الثالثة ابتدائي',
      'السنة الرابعة ابتدائي',
      'السنة الخامسة ابتدائي'
    ],
    'المتوسط': [
      'السنة الأولى متوسط',
      'السنة الثانية متوسط',
      'السنة الثالثة متوسط',
      'السنة الرابعة متوسط'
    ],
    'الثانوي': [
      'السنة الأولى ثانوي',
      'السنة الثانية ثانوي',
      'السنة الثالثة ثانوي'
    ]
  };

  // Fetch children data
  const { data: children = [], isLoading: childrenLoading } = useQuery<Child[]>({
    queryKey: ['/api/children'],
    enabled: !!user,
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: async (childData: typeof newChild) => {
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      setNewChild({ name: '', educationLevel: '', grade: '' });
      setShowAddChild(false);
      toast({ title: 'تم إضافة الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في إضافة الطفل', 
        variant: 'destructive' 
      });
    }
  });

  // Delete child mutation
  const deleteChildMutation = useMutation({
    mutationFn: async (childId: number) => {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete child');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({ title: 'تم حذف الطفل بنجاح' });
    },
    onError: () => {
      toast({ 
        title: 'خطأ في حذف الطفل', 
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'تم تحديث الملف الشخصي بنجاح' });
    } catch (error) {
      toast({ title: 'حدث خطأ أثناء تحديث البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChild.name || !newChild.educationLevel || !newChild.grade) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }

    if (children.length >= 5) {
      toast({ title: 'لا يمكن إضافة أكثر من 5 أطفال', variant: 'destructive' });
      return;
    }

    addChildMutation.mutate(newChild);
  };

  const handleDeleteChild = (childId: number) => {
    if (window.confirm('هل أنت متأكد من حذف بيانات هذا الطفل؟')) {
      deleteChildMutation.mutate(childId);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">غير مسجل الدخول</h2>
          <p className="text-gray-600">يرجى تسجيل الدخول للوصول إلى الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">الملف الشخصي</h1>
          <p className="text-gray-600">إدارة معلومات حسابك الشخصي</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'profile'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              الملف الشخصي
            </button>
            <button
              onClick={() => setActiveTab('children')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'children'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Baby className="w-4 h-4 inline mr-2" />
              الأطفال ({children.length})
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user?.name}</h3>
                <p className="text-gray-600">{user?.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user?.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.role === 'admin' ? 'مدير' : user?.role === 'teacher' ? 'معلم' : 'ولي أمر'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="أدخل رقم هاتفك"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'جاري التحديث...' : 'حفظ التغييرات'}
                <Save className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <button 
                onClick={logout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Baby className="w-5 h-5" />
                  إدارة الأطفال
                </h3>
                <p className="text-sm text-gray-600">عرض وإدارة بيانات الأطفال المسجلين</p>
              </div>
              <button
                onClick={() => setShowAddChild(true)}
                disabled={children.length >= 5}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة طفل
              </button>
            </div>

            {childrenLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">جاري تحميل البيانات...</p>
              </div>
            ) : children.length === 0 ? (
              <div className="text-center py-8">
                <Baby className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">لا يوجد أطفال مسجلين</h3>
                <p className="text-sm text-gray-500 mb-4">يمكنك إضافة بيانات الأطفال من هنا</p>
                <button
                  onClick={() => setShowAddChild(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  إضافة الطفل الأول
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Baby className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{child.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                            {child.educationLevel}
                          </span>
                          <span>{child.grade}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      disabled={deleteChildMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500">
              عدد الأطفال المسجلين: {children.length} / 5
            </div>
          </div>
        )}

        {/* Add Child Modal */}
        {showAddChild && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">إضافة طفل جديد</h2>
                <button
                  onClick={() => setShowAddChild(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAddChild} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الطفل</label>
                  <input
                    type="text"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    placeholder="أدخل اسم الطفل"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة التعليمية</label>
                  <select
                    value={newChild.educationLevel}
                    onChange={(e) => setNewChild({ ...newChild, educationLevel: e.target.value, grade: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">اختر المرحلة التعليمية</option>
                    <option value="الابتدائي">الابتدائي</option>
                    <option value="المتوسط">المتوسط</option>
                    <option value="الثانوي">الثانوي</option>
                  </select>
                </div>
                
                {newChild.educationLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية</label>
                    <select
                      value={newChild.grade}
                      onChange={(e) => setNewChild({ ...newChild, grade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">اختر السنة الدراسية</option>
                      {educationLevels[newChild.educationLevel as keyof typeof educationLevels]?.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddChild(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                    disabled={addChildMutation.isPending}
                  >
                    {addChildMutation.isPending ? 'جاري الإضافة...' : 'إضافة الطفل'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}