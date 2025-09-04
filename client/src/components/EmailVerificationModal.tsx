import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, ArrowRight, ExternalLink, Clock } from 'lucide-react';
import { FirebaseEmailVerification } from '@/lib/firebase-email';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerificationSuccess
}: EmailVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'waiting' | 'success'>('send');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('send');
      setCountdown(0);
    }
  }, [isOpen]);

  // Check verification status periodically when waiting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === 'waiting') {
      interval = setInterval(async () => {
        await FirebaseEmailVerification.reloadUser();
        if (FirebaseEmailVerification.isEmailVerified()) {
          setStep('success');
          clearInterval(interval);
          
          toast({
            title: 'تم التحقق بنجاح',
            description: 'تم التحقق من البريد الإلكتروني بنجاح عبر Firebase'
          });
          
          // Call success callback after a short delay
          setTimeout(() => {
            onVerificationSuccess();
            onClose();
          }, 2000);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, onVerificationSuccess, onClose, toast]);

  const sendVerificationEmail = async () => {
    setIsLoading(true);
    try {
      const result = await FirebaseEmailVerification.sendVerificationEmail();

      if (result.success) {
        setStep('waiting');
        setCountdown(300); // 5 minute countdown
        
        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: 'تم إرسال رسالة التحقق',
          description: 'تم إرسال رسالة التحقق إلى بريدك الإلكتروني عبر Firebase'
        });
      } else {
        // Handle Firebase-specific errors
        let errorMessage = 'حدث خطأ في إرسال رسالة التحقق';
        
        if (result.error === 'no_user_logged_in') {
          errorMessage = 'يجب تسجيل الدخول أولاً';
        } else if (result.error === 'email_already_verified') {
          errorMessage = 'البريد الإلكتروني محقق بالفعل';
        } else if (result.error === 'too_many_requests') {
          errorMessage = 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً';
        } else if (result.error?.startsWith('too_many_requests_wait_')) {
          const waitTime = result.error.split('_').pop();
          errorMessage = `يرجى الانتظار ${waitTime} ثانية قبل إعادة المحاولة`;
        } else if (result.error === 'network_error') {
          errorMessage = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت';
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: 'خطأ في إرسال رسالة التحقق',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step === 'send' && <Mail className="w-12 h-12 text-blue-500" />}
            {step === 'waiting' && <Clock className="w-12 h-12 text-orange-500" />}
            {step === 'success' && <CheckCircle className="w-12 h-12 text-green-500" />}
          </div>
          <CardTitle className="text-xl">
            {step === 'send' && 'تأكيد البريد الإلكتروني'}
            {step === 'waiting' && 'تحقق من بريدك الإلكتروني'}
            {step === 'success' && 'تم التحقق بنجاح'}
          </CardTitle>
          <CardDescription>
            {step === 'send' && `سيتم إرسال رسالة التحقق عبر Firebase إلى: ${email}`}
            {step === 'waiting' && 'اذهب إلى بريدك الإلكتروني واضغط على رابط التحقق'}
            {step === 'success' && 'تم التحقق من البريد الإلكتروني بنجاح عبر Firebase'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'send' && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                سيتم إرسال رسالة تحقق من Firebase تحتوي على رابط للتحقق من بريدك الإلكتروني
              </div>
              <Button 
                onClick={sendVerificationEmail}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جارٍ الإرسال...' : 'إرسال رسالة التحقق'}
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          )}

          {step === 'waiting' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">تحقق من صندوق الوارد</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    تم إرسال رسالة من Firebase إلى بريدك الإلكتروني
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    اضغط على الرابط في الرسالة لتأكيد بريدك الإلكتروني
                  </p>
                </div>
                
                {countdown > 0 && (
                  <div className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    ينتهي الرابط خلال {formatTime(countdown)}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  سيتم التحقق تلقائياً بعد الضغط على الرابط
                </div>
              </div>
              
              <Button 
                variant="outline"
                onClick={sendVerificationEmail}
                disabled={isLoading || countdown > 240} // Disable for first 1 minute
                className="w-full"
              >
                إعادة إرسال الرسالة
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">
                تم التحقق من البريد الإلكتروني بنجاح عبر Firebase!
              </div>
              <div className="text-sm text-gray-600">
                سيتم إغلاق هذه النافذة تلقائياً...
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={isLoading}
            >
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}