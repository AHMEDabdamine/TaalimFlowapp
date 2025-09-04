import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Suggestion {
  id: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  userName?: string;
}

export default function Suggestions() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch suggestions for admin users
  const { data: suggestions = [], isLoading } = useQuery<Suggestion[]>({
    queryKey: ['/api/suggestions'],
    enabled: user?.role === 'admin'
  });

  const categories = [
    { value: "app", label: "تحسين التطبيق" },
    { value: "content", label: "المحتوى التعليمي" },
    { value: "services", label: "الخدمات" },
    { value: "other", label: "أخرى" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'app': return 'تحسين التطبيق';
      case 'content': return 'المحتوى التعليمي';
      case 'services': return 'الخدمات';
      case 'other': return 'أخرى';
      default: return category;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/suggestions", {
        userId: user.id,
        title,
        content,
        category,
        status: "pending",
      });

      if (response.ok) {
        toast({ title: "تم إرسال الاقتراح بنجاح!" });
        setTitle("");
        setContent("");
        setCategory("");
      } else {
        throw new Error("Failed to submit suggestion");
      }
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      toast({
        title: "خطأ في إرسال الاقتراح",
        description: "يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show admin view for admin users
  if (user?.role === 'admin') {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">الاقتراحات المقدمة</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">لا توجد اقتراحات</h3>
              <p className="text-gray-500 dark:text-gray-400">لم يتم تقديم أي اقتراحات حتى الآن</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        {suggestion.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(suggestion.category)}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(suggestion.status)}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(suggestion.status)}
                            {suggestion.status === 'pending' && 'قيد المراجعة'}
                            {suggestion.status === 'approved' && 'تم القبول'}
                            {suggestion.status === 'rejected' && 'تم الرفض'}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {suggestion.content}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      تاريخ التقديم: {new Date(suggestion.createdAt).toLocaleDateString('en-US')}
                    </span>
                    <span>المستخدم: {suggestion.userName || 'غير محدد'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show suggestion form for regular users
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        صندوق الاقتراحات
      </h2>

      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-lg dark:text-white">شاركنا اقتراحاتك</CardTitle>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            نحن نقدر آراءك ونسعى لتحسين خدماتنا
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="اكتب عنوان الاقتراح"
                required
              />
            </div>

            <div>
              <Label htmlFor="content">التفاصيل</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="اكتب تفاصيل اقتراحك هنا..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">الفئة</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة الاقتراح" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary"
              disabled={loading}
            >
              {loading ? "جاري الإرسال..." : "إرسال الاقتراح"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
