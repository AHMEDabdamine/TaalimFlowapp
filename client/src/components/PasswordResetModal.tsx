import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FirebasePasswordReset } from '@/lib/firebase-password-reset';
import { Mail, Lock, CheckCircle } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordResetModal({ isOpen, onClose }: PasswordResetModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await FirebasePasswordReset.sendPasswordResetEmail(email);
      
      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'تم إرسال رسالة إعادة تعيين كلمة المرور',
          description: 'تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
        });
      } else {
        // Handle specific errors
        let errorMessage = 'حدث خطأ في إرسال رسالة إعادة تعيين كلمة المرور';
        
        if (result.error === 'user_not_found') {
          errorMessage = 'البريد الإلكتروني غير مسجل في النظام';
        } else if (result.error === 'invalid_email') {
          errorMessage = 'البريد الإلكتروني غير صحيح';
        } else if (result.error === 'too_many_requests') {
          errorMessage = 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً';
        } else if (result.error?.startsWith('too_many_requests_wait_')) {
          const waitTime = result.error.split('_').pop();
          errorMessage = `يرجى الانتظار ${waitTime} ثانية قبل إعادة المحاولة`;
        } else if (result.error === 'network_error') {
          errorMessage = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت';
        }
        
        toast({
          title: "خطأ",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-4">
            {emailSent ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <Lock className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {emailSent ? 'تم إرسال الرسالة!' : 'إعادة تعيين كلمة المرور'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {emailSent 
              ? 'تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. تحقق من البريد الوارد واتبع التعليمات.'
              : 'أدخل بريدك الإلكتروني وسنرسل لك رسالة لإعادة تعيين كلمة المرور'
            }
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="pl-10"
                  disabled={isLoading}
                  dir="ltr"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رسالة الاستعادة'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">تم الإرسال بنجاح</span>
              </div>
              <p className="text-green-700 text-sm mt-2">
                تحقق من بريدك الإلكتروني ({email}) واتبع الرابط لإعادة تعيين كلمة المرور
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleClose}
                className="flex-1"
              >
                موافق
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEmailSent(false)}
              >
                إرسال مرة أخرى
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}