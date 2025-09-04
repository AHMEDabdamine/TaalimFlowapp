import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Formation } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, Users, Phone, Mail, Calendar } from 'lucide-react';

export default function Formations() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedFormationForView, setSelectedFormationForView] = useState<Formation | null>(null);
  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  const { data: formations = [], isLoading: loading } = useQuery<Formation[]>({
    queryKey: ['/api/formations'],
    enabled: !!user && !authLoading,
  });

  // Query for formation registrations (load for all users to check registration status)
  const { data: formationRegistrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/formation-registrations'],
    enabled: !!user && !authLoading,
  });

  const joinFormationMutation = useMutation({
    mutationFn: async (data: { formationId: number; userId: number; fullName: string; phone: string; email: string }) => {
      console.log('Sending registration data:', data);
      const response = await apiRequest('POST', '/api/formation-registrations', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في التسجيل');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم تسجيلك في التكوين بنجاح' });
      setShowJoinForm(false);
      setSelectedFormation(null);
      setRegistrationData({ fullName: '', phone: '', email: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/formation-registrations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في التسجيل في التكوين', 
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive' 
      });
    }
  });

  const handleJoinFormation = () => {
    if (selectedFormation && user?.id && user?.name && user?.phone && user?.email) {
      console.log('Using user data for registration:', {
        formationId: selectedFormation.id,
        userId: user.id,
        fullName: user.name,
        phone: user.phone,
        email: user.email
      });
      
      joinFormationMutation.mutate({
        formationId: selectedFormation.id,
        userId: user.id,
        fullName: user.name,
        phone: user.phone,
        email: user.email
      });
    } else {
      toast({ 
        title: 'بيانات ناقصة', 
        description: 'يجب أن تكون بيانات المستخدم مكتملة للتسجيل',
        variant: 'destructive' 
      });
    }
  };

  // Helper function to get registrations for a specific formation
  const getRegistrationsForFormation = (formationId: number) => {
    return (formationRegistrations as any[])?.filter((reg: any) => reg.formationId === formationId) || [];
  };

  // Helper function to check if current user is already registered for a formation
  const isUserRegistered = (formationId: number) => {
    if (!formationRegistrations || !user?.id) return false;
    console.log('Checking registration for:', { formationId, userId: user.id });
    console.log('Available registrations:', formationRegistrations);
    
    const isRegistered = (formationRegistrations as any[])?.some((reg: any) => {
      console.log('Comparing:', { regFormationId: reg.formationId, regUserId: reg.userId, targetFormationId: formationId, targetUserId: user.id });
      return Number(reg.formationId) === Number(formationId) && Number(reg.userId) === Number(user.id);
    });
    
    console.log('Registration result:', isRegistered);
    return isRegistered || false;
  };

  const handleViewRegistrations = (formation: Formation) => {
    setSelectedFormationForView(formation);
    setShowRegistrationsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">التكوينات المهنية</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {formations.length > 0 ? (
          formations.map((formation) => (
            <Card key={formation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{formation.title}</CardTitle>
                <p className="text-sm text-gray-600">{formation.category}</p>
              </CardHeader>
              <CardContent>
                {formation.imageUrl && (
                  <div className="mb-4">
                    <img 
                      src={formation.imageUrl} 
                      alt={formation.title} 
                      className="w-full h-48 object-cover rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                )}
                <p className="text-gray-700 mb-4">{formation.description}</p>
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">المدة</p>
                    <p className="font-medium">{formation.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">السعر</p>
                    <p className="font-medium text-primary">{formation.price}</p>
                  </div>
                </div>
                
                {user?.role === 'admin' ? (
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-primary to-secondary"
                      onClick={() => {
                        setSelectedFormation(formation);
                        setShowJoinForm(true);
                      }}
                    >
                      سجل الآن
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleViewRegistrations(formation)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      عرض التسجيلات
                    </Button>
                  </div>
                ) : (
                  <Button 
                    className={`w-full ${isUserRegistered(formation.id) 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary to-secondary'
                    }`}
                    disabled={isUserRegistered(formation.id)}
                    onClick={() => {
                      if (!isUserRegistered(formation.id)) {
                        setSelectedFormation(formation);
                        setShowJoinForm(true);
                      }
                    }}
                  >
                    {isUserRegistered(formation.id) ? 'مُسجل بالفعل' : 'سجل الآن'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">لا توجد تكوينات حالياً</p>
          </div>
        )}
      </div>

      {/* Join Formation Modal */}
      {showJoinForm && selectedFormation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold dark:text-white">التسجيل في {selectedFormation.title}</h2>
                <p className="text-xs text-gray-500 mt-1">Debug - User ID: {user?.id} | Formation ID: {selectedFormation.id}</p>
              </div>
              <button
                onClick={() => {
                  setShowJoinForm(false);
                  setRegistrationData({ fullName: '', phone: '', email: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>الوصف:</strong> {selectedFormation.description}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <strong>المدة:</strong> {selectedFormation.duration}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>السعر:</strong> {selectedFormation.price}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                  سيتم التسجيل باستخدام بيانات حسابك:
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>الاسم:</strong> {user?.name}<br/>
                  <strong>الهاتف:</strong> {user?.phone}<br/>
                  <strong>البريد:</strong> {user?.email}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    setShowJoinForm(false);
                    setRegistrationData({ fullName: '', phone: '', email: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleJoinFormation}
                  disabled={joinFormationMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {joinFormationMutation.isPending ? 'جاري التسجيل...' : 'سجل الآن'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formation Registrations Modal (Admin Only) */}
      {showRegistrationsModal && selectedFormationForView && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                تسجيلات التكوين: {selectedFormationForView.title}
              </h2>
              <button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedFormationForView(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>الفئة:</strong> {selectedFormationForView.category} | 
                <strong> المدة:</strong> {selectedFormationForView.duration} | 
                <strong> السعر:</strong> {selectedFormationForView.price}
              </p>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {(() => {
                    const formationRegs = getRegistrationsForFormation(selectedFormationForView.id);
                    return formationRegs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="font-medium">عدد التسجيلات: {formationRegs.length}</span>
                        </div>
                        
                        <div className="grid gap-4">
                          {formationRegs.map((registration: any) => (
                            <Card key={registration.id} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.fullName}</p>
                                    <p className="text-sm text-gray-500">الاسم الكامل</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <p className="font-medium">{registration.userName || 'غير محدد'}</p>
                                    <p className="text-sm text-gray-500">اسم المستخدم</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.phone}</p>
                                    <p className="text-sm text-gray-500">رقم الهاتف</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <div>
                                    <p className="font-medium">{registration.email}</p>
                                    <p className="text-sm text-gray-500">البريد الإلكتروني</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <p className="text-sm text-gray-500">
                                  تاريخ التسجيل: {new Date(registration.createdAt).toLocaleDateString('en-GB')}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد تسجيلات لهذا التكوين حتى الآن</p>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                onClick={() => {
                  setShowRegistrationsModal(false);
                  setSelectedFormationForView(null);
                }}
                variant="outline"
              >
                إغلاق
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
