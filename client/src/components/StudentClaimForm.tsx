import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, CheckCircle, Camera } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { QRScanner } from './QRScanner';
import { shouldAllowRequest } from '@/utils/requestThrottle';

interface StudentClaimFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface StudentInfo {
  available: boolean;
  studentName?: string;
  educationLevel?: string;
  grade?: string;
}

export function StudentClaimForm({ onSuccess, onCancel }: StudentClaimFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'check' | 'claim'>('check');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const lastProcessedQRRef = useRef<string>('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  const [checkData, setCheckData] = useState({
    studentId: ''
  });
  
  const [claimData, setClaimData] = useState({
    studentId: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    gender: '',
    linkAs: '' // 'student' or 'parent'
  });

  // Check student ID mutation with throttling
  const checkMutation = useMutation({
    mutationFn: async (data: { studentId: string }) => {
      const throttleKey = `check-student-${data.studentId}`;
      
      // Throttle requests to prevent excessive API calls
      if (!shouldAllowRequest(throttleKey, 2000)) {
        throw new Error('طلب سريع جداً، يرجى الانتظار قليلاً');
      }
      
      console.log('Checking student ID:', data.studentId);
      const response = await fetch('/api/auth/check-student-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: parseInt(data.studentId) })
      });
      if (!response.ok) throw new Error('Failed to check student ID');
      return response.json();
    },
    onSuccess: (data) => {
      setStudentInfo(data);
      if (data.available) {
        setClaimData(prev => ({ 
          ...prev, 
          studentId: checkData.studentId,
          name: data.studentName || ''
        }));
        setStep('claim');
        toast({
          title: '✅ رقم الطالب صحيح',
          description: `تم العثور على الطالب: ${data.studentName}`
        });
      } else {
        toast({
          title: '❌ رقم غير صحيح',
          description: 'رقم الطالب غير موجود أو مربوط بحساب آخر',
          variant: 'destructive'
        });
      }
    },
    onError: () => {
      toast({
        title: '❌ خطأ',
        description: 'حدث خطأ في التحقق من رقم الطالب',
        variant: 'destructive'
      });
    }
  });

  // Claim account mutation
  const claimMutation = useMutation({
    mutationFn: async (data: typeof claimData) => {
      const response = await fetch('/api/auth/claim-student-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: parseInt(data.studentId),
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          gender: data.gender,
          linkAs: data.linkAs
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to claim account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: '🎉 تم ربط الحساب بنجاح',
        description: `مرحباً ${data.user.name}! تم ربط حسابك بنجاح`
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في ربط الحساب',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleQRScan = useCallback((qrData: string) => {
    // Prevent duplicate processing of the same QR code
    if (isProcessingQR || qrData === lastProcessedQRRef.current) {
      console.log('QR scan ignored - already processing or duplicate:', qrData);
      return;
    }
    
    console.log('Processing QR scan:', qrData);
    lastProcessedQRRef.current = qrData;
    setIsProcessingQR(true);
    setShowQRScanner(false);
    
    try {
      // Parse QR data - expecting format: "student:id:schoolId:code" or JSON
      let studentId: string;
      
      if (qrData.includes(':')) {
        // Simple format: "student:5:1:abc123"
        const parts = qrData.split(':');
        if (parts.length >= 2 && (parts[0] === 'student' || parts[0] === 'child')) {
          studentId = parts[1];
        } else {
          throw new Error('صيغة الرمز غير صحيحة');
        }
      } else {
        // JSON format
        const data = JSON.parse(qrData);
        studentId = data.id?.toString();
      }
      
      if (!studentId) {
        throw new Error('لم يتم العثور على رقم الطالب في الرمز');
      }
      
      // Update the input and trigger check
      setCheckData({ studentId });
      checkMutation.mutate({ studentId });
      
      toast({
        title: '✅ تم مسح الرمز بنجاح',
        description: 'جاري التحقق من بيانات الطالب...'
      });
    } catch (error) {
      toast({
        title: '❌ خطأ في مسح الرمز',
        description: 'تأكد من أن الرمز صحيح ومن نفس المدرسة',
        variant: 'destructive'
      });
    } finally {
      // Reset the processing flag after a delay
      setTimeout(() => {
        setIsProcessingQR(false);
        // Clear the last processed QR after a longer delay to allow re-scanning if needed
        setTimeout(() => {
          lastProcessedQRRef.current = '';
        }, 5000);
      }, 2000);
    }
  }, [isProcessingQR, checkMutation]);

  const handleCheckSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!checkData.studentId) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى إدخال رقم الطالب',
        variant: 'destructive'
      });
      return;
    }
    
    // Debounce manual submissions to prevent rapid clicking
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('Manual check submission for student ID:', checkData.studentId);
      checkMutation.mutate(checkData);
    }, 300);
  }, [checkData, checkMutation, toast]);

  const handleClaimSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!claimData.email || !claimData.password || !claimData.name || !claimData.phone || !claimData.gender || !claimData.linkAs) {
      toast({
        title: '⚠️ بيانات ناقصة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    
    // Prevent double submission
    if (claimMutation.isPending) {
      return;
    }
    
    console.log('Submitting claim account request');
    claimMutation.mutate(claimData);
  }, [claimData, claimMutation, toast]);

  if (step === 'check') {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              ربط حساب طالب موجود
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheckSubmit} className="space-y-4">
              <div>
                <Label htmlFor="studentId">رقم الطالب *</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentId"
                    type="number"
                    value={checkData.studentId}
                    onChange={(e) => setCheckData({ studentId: e.target.value })}
                    placeholder="أدخل رقم الطالب أو امسح الرمز"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowQRScanner(true)}
                    className="px-3"
                    title="مسح رمز QR"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  احصل على رقم الطالب من إدارة المدرسة أو امسح رمز QR الخاص بك
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={checkMutation.isPending}
                >
                  {checkMutation.isPending ? 'جاري التحقق...' : 'التحقق من الرقم'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                >
                  إلغاء
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">كيفية الحصول على رقم الطالب:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. اتصل بإدارة المدرسة</li>
                <li>2. أخبرهم أنك تريد ربط حسابك في التطبيق</li>
                <li>3. سيعطونك رقماً خاصاً بك أو رمز QR</li>
                <li>4. استخدم الرقم أو امسح الرمز هنا</li>
              </ol>
            </div>
          </CardContent>
        </Card>
        
        <QRScanner
          isOpen={showQRScanner}
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            إنشاء حساب الطالب
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentInfo && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-green-800 font-semibold">{studentInfo.studentName}</p>
              <p className="text-green-700 text-sm">
                {studentInfo.educationLevel} - {studentInfo.grade}
              </p>
            </div>
          )}

          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div>
              <Label htmlFor="linkAs">نوع الحساب *</Label>
              <Select value={claimData.linkAs} onValueChange={(value) => setClaimData({ ...claimData, linkAs: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الحساب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">طالب - حساب للطالب نفسه</SelectItem>
                  <SelectItem value="parent">ولي أمر - حساب لولي أمر الطالب</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {claimData.linkAs === 'student' ? 
                  'ستحصل على حساب خاص بالطالب مع إمكانية الوصول لجميع المعلومات' :
                  claimData.linkAs === 'parent' ?
                  'ستحصل على حساب ولي أمر مع إمكانية متابعة الطالب' :
                  'حدد نوع الحساب المناسب لك'
                }
              </p>
            </div>

            <div>
              <Label htmlFor="name">الاسم الكامل *</Label>
              <Input
                id="name"
                value={claimData.name}
                onChange={(e) => setClaimData({ ...claimData, name: e.target.value })}
                placeholder="أدخل اسمك الكامل"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={claimData.email}
                onChange={(e) => setClaimData({ ...claimData, email: e.target.value })}
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={claimData.password}
                onChange={(e) => setClaimData({ ...claimData, password: e.target.value })}
                placeholder="أدخل كلمة مرور قوية"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">رقم الهاتف *</Label>
              <Input
                id="phone"
                type="tel"
                value={claimData.phone}
                onChange={(e) => setClaimData({ ...claimData, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                required
              />
            </div>

            <div>
              <Label htmlFor="gender">الجنس *</Label>
              <Select value={claimData.gender} onValueChange={(value) => setClaimData({ ...claimData, gender: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ذكر">ذكر</SelectItem>
                  <SelectItem value="أنثى">أنثى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={claimMutation.isPending}
              >
                {claimMutation.isPending ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('check')}
              >
                رجوع
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <QRScanner
        isOpen={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
    </>
  );
}