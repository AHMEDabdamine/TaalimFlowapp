import { useState, useRef, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, RotateCcw } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [scanCompleted, setScanCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    setIsScanning(false);
    setScanCompleted(false);
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        console.log('Scanner cleanup error:', err);
      }
    }
    // Also stop all video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const initializeScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('متصفحك لا يدعم استخدام الكاميرا');
        setIsScanning(false);
        return;
      }

      // Initialize code reader
      codeReaderRef.current = new BrowserQRCodeReader();

      // Get video devices
      try {
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
        console.log('Available cameras:', videoInputDevices);
        setDevices(videoInputDevices);

        if (videoInputDevices.length === 0) {
          setError('لم يتم العثور على كاميرا في جهازك');
          setIsScanning(false);
          return;
        }

        // Try to use the first available camera
        const deviceId = videoInputDevices[0].deviceId;
        setSelectedDeviceId(deviceId);
        await startCamera(deviceId);

      } catch (deviceErr) {
        console.error('Error listing devices:', deviceErr);
        setError('خطأ في العثور على الكاميرات المتاحة');
        setIsScanning(false);
      }

    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('خطأ في تهيئة الماسح الضوئي');
      setIsScanning(false);
    }
  };

  const startCamera = async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) {
      setError('خطأ في تهيئة الكاميرا');
      setIsScanning(false);
      return;
    }

    try {
      console.log('Starting camera with device:', deviceId);
      
      // Use the ZXing library's built-in method to start video
      const controls = await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result && !scanCompleted) {
            console.log('QR code detected:', result.getText());
            setScanCompleted(true);
            // Stop the scanner immediately to prevent further scanning
            if (controlsRef.current) {
              try {
                controlsRef.current.stop();
              } catch (err) {
                console.log('Scanner stop error:', err);
              }
            }
            onScan(result.getText());
            // Close after a short delay
            setTimeout(() => {
              onClose();
            }, 100);
          }
          
          if (error && !(error instanceof Error && error.name === 'NotFoundException')) {
            console.error('Decode error:', error);
          }
        }
      );
      
      // Store the controls for cleanup
      controlsRef.current = controls;

      console.log('Camera started successfully');

    } catch (err: any) {
      console.error('Error starting camera:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('يرجى السماح بالوصول للكاميرا');
      } else if (err.name === 'NotFoundError') {
        setError('لم يتم العثور على الكاميرا المحددة');
      } else if (err.name === 'NotReadableError') {
        setError('الكاميرا مستخدمة من تطبيق آخر');
      } else {
        setError('خطأ في تشغيل الكاميرا: ' + (err.message || 'خطأ غير معروف'));
      }
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;
    
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;
    
    setSelectedDeviceId(nextDeviceId);
    cleanup();
    await startCamera(nextDeviceId);
  };

  const retry = () => {
    cleanup();
    initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">مسح رمز QR للطالب</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error ? (
            <div className="text-center space-y-4">
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
              <Button onClick={retry} className="w-full">
                <RotateCcw className="w-4 h-4 mr-2" />
                إعادة المحاولة
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                  </div>
                </div>

                {/* Status indicator */}
                {isScanning && (
                  <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    جاري المسح...
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  وجه الكاميرا نحو رمز QR الخاص بالطالب
                </p>
                
                {devices.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={switchCamera}
                    disabled={!isScanning}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    تبديل الكاميرا ({devices.length} متاح)
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}