import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Shield, ShieldOff, AlertTriangle, User, Ban, UserX } from 'lucide-react';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Ban User Modal Component
const BanUserModal = ({ isOpen, onClose, onBan, userName, userId }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onBan: (reason: string) => void;
  userName: string;
  userId: number;
}) => {
  const [reason, setReason] = useState('');
  
  const handleSubmit = () => {
    if (reason.trim()) {
      onBan(reason);
      setReason('');
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" dir="rtl">
        <h2 className="text-lg font-bold mb-4 text-red-600">حظر المستخدم {userName}</h2>
        
        <div className="space-y-4">
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700">
              تحذير: سيتم منع هذا المستخدم من الوصول إلى التطبيق بالكامل
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">سبب الحظر</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded-md h-20"
              placeholder="اكتب سبب حظر المستخدم..."
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            حظر المستخدم
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function AdminReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-500">غير مسموح لك بالوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    enabled: !!user,
  });

  const { data: bannedUsers, isLoading: bannedUsersLoading } = useQuery({
    queryKey: ['/api/admin/banned-users'],
    enabled: !!user,
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      return await apiRequest('POST', '/api/admin/ban-user', { userId, reason });
    },
    onSuccess: () => {
      toast({
        title: "تم حظر المستخدم",
        description: "تم حظر المستخدم من التطبيق بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حظر المستخدم",
        description: error.message || "حدث خطأ أثناء حظر المستخدم",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('POST', '/api/admin/unban-user', { userId });
    },
    onSuccess: () => {
      toast({
        title: "تم إلغاء حظر المستخدم",
        description: "يمكن للمستخدم الآن الوصول للتطبيق",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/banned-users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء حظر المستخدم",
        description: error.message || "حدث خطأ أثناء إلغاء حظر المستخدم",
        variant: "destructive",
      });
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      return await apiRequest('PATCH', `/api/admin/reports/${reportId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث حالة الإبلاغ",
        description: "تم تحديث حالة الإبلاغ بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
    },
  });

  const handleBanUser = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowBanModal(true);
  };

  const handleSubmitBan = (reason: string) => {
    if (selectedUserId) {
      banUserMutation.mutate({ userId: selectedUserId, reason });
    }
  };

  const handleUnbanUser = (userId: number) => {
    unbanUserMutation.mutate(userId);
  };

  const handleUpdateReportStatus = (reportId: number, status: string) => {
    updateReportStatusMutation.mutate({ reportId, status });
  };

  return (
    <div className="px-4 py-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">إدارة الإبلاغات والحظر</h2>
      
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">الإبلاغات المقدمة</TabsTrigger>
          <TabsTrigger value="banned">المستخدمون المحظورون</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">الإبلاغات المقدمة</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {reports?.length || 0} إبلاغ
            </Badge>
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report: any) => (
                <Card key={report.id} className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        إبلاغ عن {report.reportedUserName}
                      </CardTitle>
                      <Badge 
                        variant={report.status === 'pending' ? 'destructive' : 
                               report.status === 'reviewed' ? 'default' : 'secondary'}
                      >
                        {report.status === 'pending' ? 'قيد المراجعة' : 
                         report.status === 'reviewed' ? 'تمت المراجعة' : 'محلول'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">المُبلِغ:</p>
                          <p className="font-medium">{report.reporterName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">المُبلَغ عنه:</p>
                          <p className="font-medium">{report.reportedUserName}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">السبب:</p>
                        <p className="font-medium">
                          {report.reason === 'spam' ? 'رسائل مزعجة' :
                           report.reason === 'harassment' ? 'تحرش' :
                           report.reason === 'inappropriate' ? 'محتوى غير لائق' : 'أخرى'}
                        </p>
                      </div>
                      
                      {report.description && (
                        <div>
                          <p className="text-sm text-gray-600">التفاصيل:</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{report.description}</p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(report.createdAt), { 
                          addSuffix: true, 
                          locale: ar 
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      {report.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                          >
                            تمت المراجعة
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                          >
                            حل المشكلة
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleBanUser(report.reportedUserId, report.reportedUserName)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        حظر المستخدم
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا توجد إبلاغات</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="banned" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">المستخدمون المحظورون</h3>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {bannedUsers?.length || 0} محظور
            </Badge>
          </div>

          {bannedUsersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bannedUsers && bannedUsers.length > 0 ? (
            <div className="space-y-4">
              {bannedUsers.map((user: any) => (
                <Card key={user.id} className="border-l-4 border-l-red-600">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.name} 
                            className="w-12 h-12 rounded-full object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <Badge variant="outline" className="mt-1">
                            {user.role === 'admin' ? 'مدير' : 
                             user.role === 'teacher' ? 'معلم' : 
                             user.role === 'student' ? 'طالب' : 'مستخدم'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUnbanUser(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <ShieldOff className="w-4 h-4 mr-1" />
                          إلغاء الحظر
                        </Button>
                      </div>
                    </div>
                    
                    {user.banReason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong>سبب الحظر:</strong> {user.banReason}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          محظور منذ: {formatDistanceToNow(new Date(user.bannedAt), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">لا يوجد مستخدمون محظورون</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BanUserModal 
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onBan={handleSubmitBan}
        userName={selectedUserName}
        userId={selectedUserId || 0}
      />
    </div>
  );
}