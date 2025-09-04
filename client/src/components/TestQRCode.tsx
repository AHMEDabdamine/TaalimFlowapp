import { useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { QrCode, Download, User } from 'lucide-react';

export default function TestQRCode() {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState('1');
  const [studentType, setStudentType] = useState<'student' | 'child'>('student');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTestQRCode = async () => {
    if (!user?.schoolId || !studentId) return;

    setIsGenerating(true);
    try {
      let qrData: string;
      
      // Generate QR data based on actual student QR codes from database
      const realStudentCodes = {
        '1': 'nebOtu6Y',
        '5': 'iATAisVv', 
        '6': 'pj0RuX7H'
      };
      
      const uniqueCode = realStudentCodes[studentId as keyof typeof realStudentCodes];
      
      if (uniqueCode) {
        // Use real format for existing students
        qrData = `${studentType}:${studentId}:${user.schoolId}:${uniqueCode}`;
      } else {
        // Use test format for other IDs
        qrData = `${studentType}:${studentId}:${user.schoolId}:verified`;
      }
      
      console.log('Generated QR data:', qrData);
      
      // Generate QR code image
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `student-${studentType}-${studentId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          مولد رمز QR للاختبار
        </CardTitle>
        <CardDescription>
          قم بإنشاء رمز QR لطالب وهمي لاختبار الماسح المكتبي
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="student-id">ID الطالب</Label>
          <Input
            id="student-id"
            type="number"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="أدخل ID الطالب"
          />
        </div>
        
        <div>
          <Label htmlFor="student-type">نوع الطالب</Label>
          <Select value={studentType} onValueChange={(value: 'student' | 'child') => setStudentType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">طالب مباشر</SelectItem>
              <SelectItem value="child">طفل</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={generateTestQRCode}
          disabled={isGenerating || !studentId}
          className="w-full"
        >
          <QrCode className="h-4 w-4 ml-2" />
          {isGenerating ? 'جاري الإنشاء...' : 'إنشاء رمز QR'}
        </Button>

        {qrCodeDataUrl && (
          <div className="text-center space-y-4">
            <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg inline-block">
              <img 
                src={qrCodeDataUrl} 
                alt="Student QR Code" 
                className="mx-auto"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <div>النوع: {studentType === 'student' ? 'طالب مباشر' : 'طفل'}</div>
              <div>ID: {studentId}</div>
              <div>المدرسة: {user?.schoolId}</div>
              <div>الحالة: محقق</div>
            </div>
            
            <Button 
              onClick={downloadQRCode}
              variant="outline"
              className="w-full"
            >
              <Download className="h-4 w-4 ml-2" />
              تحميل الرمز
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <strong>ملاحظة:</strong> هذا الرمز للاختبار فقط. يجب أن يكون الطالب موجود في قاعدة البيانات حتى يعمل الماسح بشكل صحيح.
        </div>
      </CardContent>
    </Card>
  );
}