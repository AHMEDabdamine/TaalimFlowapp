import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Users, Calendar, Phone, Mail, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';

interface FormationRegistration {
  id: number;
  formationId: number;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
  formationTitle: string;
  formationCategory: string;
  formationPrice: string;
  formationDuration: string;
}

export default function AdminFormationRegistrations() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: registrations = [], isLoading } = useQuery<FormationRegistration[]>({
    queryKey: ['/api/formation-registrations'],
    enabled: !!user && user.role === 'admin',
  });

  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group registrations by formation
  const registrationsByFormation = registrations.reduce((acc, registration) => {
    const formationTitle = registration.formationTitle || `تكوين ${registration.formationId}`;
    if (!acc[formationTitle]) {
      acc[formationTitle] = {
        formation: {
          title: registration.formationTitle,
          category: registration.formationCategory,
          price: registration.formationPrice,
          duration: registration.formationDuration,
        },
        registrations: []
      };
    }
    acc[formationTitle].registrations.push(registration);
    return acc;
  }, {} as Record<string, { formation: any; registrations: FormationRegistration[] }>);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/admin/content')}
            variant="outline"
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            إدارة المحتوى
          </Button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            تسجيلات التكوينات المهنية
          </h2>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-4 h-4 mr-1" />
          {registrations.length} تسجيل
        </Badge>
      </div>

      {Object.keys(registrationsByFormation).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(registrationsByFormation).map(([formationTitle, { formation, registrations }]) => (
            <Card key={formationTitle} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{formation.title}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formation.category} • {formation.duration} • {formation.price}
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {registrations.length} مسجل
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {registrations.map((registration, index) => (
                    <div
                      key={registration.id}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 ${
                        index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                      } last:border-b-0`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {registration.fullName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(registration.createdAt).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {registration.phone}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {registration.email}
                          </span>
                        </div>
                        
                        <div className="flex justify-end">
                          <Badge variant="outline" className="text-xs">
                            #{registration.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              لا توجد تسجيلات حالياً
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              سيتم عرض تسجيلات التكوينات المهنية هنا عندما يسجل المستخدمون
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}