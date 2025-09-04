import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, RefreshCw, Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QRCodeDisplayProps {
  studentId: number;
  type: 'student' | 'child';
  studentName: string;
  isAdmin?: boolean;
}

export default function QRCodeDisplay({ studentId, type, studentName, isAdmin = false }: QRCodeDisplayProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);

  // Fetch QR code data
  const { data: qrData, isLoading } = useQuery({
    queryKey: ['/api/qrcode', type, studentId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/qrcode/${type}/${studentId}`);
      return await response.json();
    },
    enabled: showQR,
  });

  // Regenerate QR code mutation (admin only)
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/qrcode/${type}/${studentId}/regenerate`);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: 'تم إعادة توليد الرمز بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['/api/qrcode', type, studentId] });
    },
    onError: (error: any) => {
      console.error('Error regenerating QR code:', error);
      toast({ title: 'فشل في إعادة توليد الرمز', variant: 'destructive' });
    }
  });

  const handleDownload = () => {
    if (!qrData?.qrCodeData) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = qrData.qrCodeData;
    link.download = `QR_${studentName}_${studentId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: 'تم تحميل الرمز بنجاح' });
  };

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span>رمز الاستجابة السريعة</span>
            <Badge variant="outline" className="text-xs">
              {type === 'student' ? 'طالب' : 'طفل'}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleQR}
            className="flex items-center space-x-1 space-x-reverse"
          >
            {showQR ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showQR ? 'إخفاء' : 'عرض'}</span>
          </Button>
        </CardTitle>
      </CardHeader>
      
      {showQR && (
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              رمز فريد خاص بـ <span className="font-medium">{studentName}</span>
            </p>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : qrData?.qrCode ? (
              <div className="space-y-4">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <img 
                      src={qrData.qrCode} 
                      alt={`QR Code for ${studentName}`}
                      className="w-48 h-48"
                      onError={(e) => {
                        console.error('QR Code image failed to load');
                        console.log('Image src length:', qrData.qrCode?.length);
                      }}
                      onLoad={() => console.log('QR Code loaded successfully')}
                    />
                  </div>
                </div>
                
                {/* QR Code Info */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <p>يحتوي هذا الرمز على معلومات الطالب وبيانات التحقق</p>
                  <p>يمكن استخدامه لتسجيل الحضور السريع</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center space-x-1 space-x-reverse"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل</span>
                  </Button>
                  
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateMutation.mutate()}
                      disabled={regenerateMutation.isPending}
                      className="flex items-center space-x-1 space-x-reverse"
                    >
                      <RefreshCw className={`w-4 h-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
                      <span>إعادة توليد</span>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">لم يتم إنشاء رمز لهذا الطالب بعد</p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => regenerateMutation.mutate()}
                    disabled={regenerateMutation.isPending}
                  >
                    إنشاء رمز جديد
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}