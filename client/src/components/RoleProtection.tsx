import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertCircle } from 'lucide-react';

interface RoleProtectionProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackMessage?: string;
}

export function RoleProtection({ 
  children, 
  allowedRoles, 
  fallbackMessage = "ليس لديك صلاحيات للوصول لهذه الصفحة" 
}: RoleProtectionProps) {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">مطلوب تسجيل الدخول</h2>
          <p className="text-gray-600">يرجى تسجيل الدخول للوصول لهذه الصفحة</p>
        </div>
      </div>
    );
  }
  
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600">{fallbackMessage}</p>
          <p className="text-sm text-gray-500 mt-2">
            صلاحيتك الحالية: {user.role === 'admin' ? 'مدير' : user.role === 'teacher' ? 'معلم' : 'مستخدم'}
          </p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}