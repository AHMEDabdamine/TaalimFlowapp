import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Phone, MessageCircle, CheckCircle } from 'lucide-react';
import { FirebasePhoneVerification } from '@/lib/firebase-phone';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerificationSuccess: () => void;
}

export function PhoneVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerificationSuccess
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Initialize Firebase reCAPTCHA when modal opens
  useEffect(() => {
    if (isOpen) {
      // Add reCAPTCHA container to DOM
      const container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);

      // Initialize Firebase reCAPTCHA
      FirebasePhoneVerification.initializeRecaptcha('recaptcha-container');

      return () => {
        // Cleanup when modal closes
        const recaptchaContainer = document.getElementById('recaptcha-container');
        if (recaptchaContainer) {
          document.body.removeChild(recaptchaContainer);
        }
        FirebasePhoneVerification.cleanup();
      };
    }
  }, [isOpen]);

  // Fallback SMS service for development when Firebase billing is not enabled
  const sendViaSMSService = async () => {
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('verify');
        setCountdown(60);
        
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
          title: 'تم إرسال رمز التحقق',
          description: data.message || 'تم إرسال رمز التحقق عبر الخدمة البديلة'
        });

        if (data.developmentCode) {
          toast({
            title: 'رمز التطوير',
            description: `رمز التحقق: ${data.developmentCode}`,
            variant: 'default'
          });
        }
      } else {
        throw new Error(data.error || 'حدث خطأ في الخدمة البديلة');
      }
    } catch (error) {
      throw error;
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    try {
      // Format phone number for Firebase
      const formattedPhone = FirebasePhoneVerification.formatPhoneNumber(phoneNumber);
      
      // Validate phone number
      if (!FirebasePhoneVerification.isValidPhoneNumber(formattedPhone)) {
        throw new Error('رقم الهاتف غير صالح');
      }

      // Send verification code via Firebase
      const result = await FirebasePhoneVerification.sendVerificationCode(formattedPhone);

      if (result.success) {
        setStep('verify');
        setCountdown(60); // 1 minute countdown
        
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
          title: 'تم إرسال رمز التحقق',
          description: 'تم إرسال رمز التحقق إلى هاتفك عبر Firebase'
        });
      } else {
        // Handle Firebase-specific errors
        let errorMessage = 'حدث خطأ في إرسال الرمز';
        
        if (result.error === 'invalid_phone_number') {
          errorMessage = 'رقم الهاتف غير صالح';
        } else if (result.error === 'too_many_requests') {
          errorMessage = 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً';
        } else if (result.error === 'captcha_failed') {
          errorMessage = 'فشل التحقق من الأمان. يرجى المحاولة مرة أخرى';
        } else if (result.error === 'billing_not_enabled') {
          errorMessage = 'خدمة الرسائل النصية غير مفعلة. سيتم استخدام الطريقة البديلة.';
          // Fallback to SMS service for development
          console.log('Firebase billing not enabled, falling back to SMS service');
          await sendViaSMSService();
          return;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      toast({
        title: 'خطأ في إرسال الرمز',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback verification for SMS service
  const verifyViaSMSService = async () => {
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: verificationCode.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('success');
        toast({
          title: 'تم التحقق بنجاح',
          description: data.message || 'تم التحقق من رقم هاتفك بنجاح'
        });
        
        setTimeout(() => {
          onVerificationSuccess();
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'حدث خطأ في التحقق');
      }
    } catch (error) {
      throw error;
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: 'رمز التحقق مطلوب',
        description: 'يرجى إدخال رمز التحقق',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Try Firebase verification first
      const result = await FirebasePhoneVerification.verifyCode(verificationCode.trim());

      if (result.success) {
        // Update phone verification status in our database
        const response = await fetch('/api/auth/update-phone-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            phone: phoneNumber,
            verified: true
          })
        });

        if (response.ok) {
          setStep('success');
          toast({
            title: 'تم التحقق بنجاح',
            description: 'تم التحقق من رقم هاتفك بنجاح'
          });
          
          // Call success callback after a brief delay
          setTimeout(() => {
            onVerificationSuccess();
            onClose();
          }, 2000);
        } else {
          throw new Error('فشل في تحديث حالة التحقق');
        }
      } else {
        // If Firebase fails, try SMS service as fallback
        console.log('Firebase verification failed, trying SMS service fallback');
        await verifyViaSMSService();
      }
    } catch (error) {
      // If Firebase throws error, try SMS service fallback
      try {
        console.log('Firebase verification error, trying SMS service fallback');
        await verifyViaSMSService();
      } catch (fallbackError) {
        toast({
          title: 'خطأ في التحقق',
          description: fallbackError instanceof Error ? fallbackError.message : 'حدث خطأ غير متوقع',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setStep('send');
    setVerificationCode('');
    setCountdown(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            تحقق من رقم الهاتف
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 'send' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">تحقق من رقم هاتفك</h3>
                <p className="text-sm text-gray-600">
                  سنرسل رمز التحقق إلى الرقم: <span className="font-mono">{phoneNumber}</span>
                </p>
              </div>
              
              <Button
                onClick={sendVerificationCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">أدخل رمز التحقق</h3>
                <p className="text-sm text-gray-600">
                  تم إرسال رمز التحقق إلى <span className="font-mono">{phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">رمز التحقق</Label>
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  className="text-center text-lg font-mono"
                  maxLength={6}
                  dir="ltr"
                />
              </div>

              <Button
                onClick={verifyCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'جاري التحقق...' : 'تحقق'}
              </Button>

              <div className="text-center space-y-2">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    إعادة الإرسال خلال {countdown} ثانية
                  </p>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    className="text-sm"
                  >
                    إعادة إرسال الرمز
                  </Button>
                )}
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg text-green-700">تم التحقق بنجاح!</h3>
              <p className="text-sm text-gray-600">
                تم تأكيد رقم هاتفك بنجاح
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}