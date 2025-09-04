import { useState } from 'react';
import { User, Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import imageCompression from 'browser-image-compression';

interface ProfilePictureProps {
  currentPicture?: string;
  userName: string;
  onUpdate: (pictureUrl: string) => void;
}

export function ProfilePicture({ currentPicture, userName, onUpdate }: ProfilePictureProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Compress the image before upload
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3, // 300KB max for profile pictures
        maxWidthOrHeight: 400, // Max dimension 400px for profile pics
        useWebWorker: true,
        initialQuality: 0.8
      });

      const formData = new FormData();
      formData.append('profilePicture', compressedFile);

      const response = await fetch('/api/profile/picture/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.fileUrl);
        setShowUploadForm(false);
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث صورتك الشخصية بنجاح",
        });
      } else {
        throw new Error('Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload/compression error:', error);
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة الشخصية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profile/picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePictureUrl: imageUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(imageUrl);
        setShowUploadForm(false);
        setImageUrl('');
        toast({
          title: "تم التحديث بنجاح",
          description: "تم تحديث صورتك الشخصية بنجاح",
        });
      } else {
        throw new Error('Failed to update profile picture');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الصورة الشخصية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate user initials for fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Picture Display */}
          <div className="relative">
            {currentPicture ? (
              <img
                src={currentPicture}
                alt={userName}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => {
                  console.error('Profile picture failed to load:', currentPicture);
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200"><span class="text-white text-2xl font-bold">${getUserInitials(userName)}</span></div>`;
                  }
                }}
                onLoad={() => console.log('Profile picture loaded successfully:', currentPicture)}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200">
                <span className="text-white text-2xl font-bold">
                  {getUserInitials(userName)}
                </span>
              </div>
            )}
            
            {/* Edit Button */}
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-white shadow-md hover:bg-gray-50"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {/* User Name */}
          <h3 className="text-lg font-semibold text-center">{userName}</h3>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="w-full space-y-4 border-t pt-4">
              {/* Upload Method Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadMethod === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMethod('file')}
                  className="flex-1"
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  رفع ملف
                </Button>
                <Button
                  type="button"
                  variant={uploadMethod === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMethod('url')}
                  className="flex-1"
                  disabled={loading}
                >
                  🔗 رابط
                </Button>
              </div>

              {uploadMethod === 'file' ? (
                /* File Upload */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-upload">اختر صورة من جهازك</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-600">
                      اختر ملف صورة (JPG, PNG, GIF, WEBP) - الحد الأقصى 5MB
                    </p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUploadForm(false);
                      setImageUrl('');
                    }}
                    disabled={loading}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    إلغاء
                  </Button>
                </div>
              ) : (
                /* URL Upload */
                <form onSubmit={handleUrlUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-url">رابط الصورة</Label>
                    <Input
                      id="image-url"
                      type="url"
                      placeholder="https://example.com/your-image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-600">
                      أدخل رابط الصورة من الإنترنت (يجب أن ينتهي بـ .jpg أو .png)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading || !imageUrl.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {loading ? 'جاري التحديث...' : 'تحديث الصورة'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false);
                        setImageUrl('');
                      }}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}