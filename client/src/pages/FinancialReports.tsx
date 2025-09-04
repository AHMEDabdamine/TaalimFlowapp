import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, BookOpen, Calculator, Plus, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalStudents: number;
  totalGroups: number;
  averageRevenuePerStudent: number;
  monthlyBreakdown: {
    month: number;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  groupPerformance: {
    groupId: number;
    groupName: string;
    subjectName: string;
    totalStudents: number;
    totalRevenue: number;
    averagePerStudent: number;
  }[];
}

export default function FinancialReports() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  // States for gains and losses inputs
  const [gainAmount, setGainAmount] = useState('');
  const [gainRemarks, setGainRemarks] = useState('');
  const [lossAmount, setLossAmount] = useState('');
  const [lossRemarks, setLossRemarks] = useState('');
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  const months = [
    { value: 'all', label: 'جميع الأشهر' },
    { value: '1', label: 'يناير' },
    { value: '2', label: 'فبراير' },
    { value: '3', label: 'مارس' },
    { value: '4', label: 'أبريل' },
    { value: '5', label: 'مايو' },
    { value: '6', label: 'يونيو' },
    { value: '7', label: 'يوليو' },
    { value: '8', label: 'أغسطس' },
    { value: '9', label: 'سبتمبر' },
    { value: '10', label: 'أكتوبر' },
    { value: '11', label: 'نوفمبر' },
    { value: '12', label: 'ديسمبر' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  const fetchFinancialData = async () => {
    // Prevent API calls if user is not properly authenticated as admin
    if (loading || user?.role !== 'admin') {
      console.log('Skipping financial data fetch - user not authenticated as admin');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/financial-reports', {
        year: parseInt(selectedYear),
        month: selectedMonth === 'all' ? null : parseInt(selectedMonth)
      });

      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تحميل البيانات المالية",
          description: error.error || "تعذر تحميل التقرير المالي",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      // Only show toast if we're still authenticated - avoid showing errors during logout/auth transitions
      if (!loading && user?.role === 'admin') {
        toast({
          title: "خطأ في الاتصال",
          description: "تعذر الاتصال بالخادم. يرجى التأكد من تسجيل الدخول والمحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitGainEntry = async () => {
    if (!gainAmount || parseFloat(gainAmount) <= 0) {
      toast({
        title: "خطأ في المبلغ",
        description: "يرجى إدخال مبلغ صحيح للأرباح",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingEntry(true);
      const response = await apiRequest('POST', '/api/financial-entries', {
        type: 'gain',
        amount: parseFloat(gainAmount),
        remarks: gainRemarks,
        year: parseInt(selectedYear),
        month: selectedMonth === 'all' ? new Date().getMonth() + 1 : parseInt(selectedMonth)
      });

      if (response.ok) {
        toast({
          title: "تم إضافة الربح",
          description: "تم تسجيل الربح بنجاح",
          variant: "default"
        });
        setGainAmount('');
        setGainRemarks('');
        fetchFinancialData(); // Refresh the data
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تسجيل الربح",
          description: error.error || "تعذر تسجيل الربح",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting gain entry:', error);
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. يرجى التأكد من تسجيل الدخول والمحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleSubmitLossEntry = async () => {
    if (!lossAmount || parseFloat(lossAmount) <= 0) {
      toast({
        title: "خطأ في المبلغ",
        description: "يرجى إدخال مبلغ صحيح للخسائر",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingEntry(true);
      const response = await apiRequest('POST', '/api/financial-entries', {
        type: 'loss',
        amount: parseFloat(lossAmount),
        remarks: lossRemarks,
        year: parseInt(selectedYear),
        month: selectedMonth === 'all' ? new Date().getMonth() + 1 : parseInt(selectedMonth)
      });

      if (response.ok) {
        toast({
          title: "تم إضافة الخسارة",
          description: "تم تسجيل الخسارة بنجاح",
          variant: "default"
        });
        setLossAmount('');
        setLossRemarks('');
        fetchFinancialData(); // Refresh the data
      } else {
        const error = await response.json();
        toast({
          title: "خطأ في تسجيل الخسارة",
          description: error.error || "تعذر تسجيل الخسارة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting loss entry:', error);
      toast({
        title: "خطأ في الاتصال", 
        description: "تعذر الاتصال بالخادم. يرجى التأكد من تسجيل الدخول والمحاولة مرة أخرى",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  useEffect(() => {
    // Only fetch data if authentication is complete and user is an admin
    if (!loading && user?.role === 'admin') {
      fetchFinancialData();
    }
  }, [selectedYear, selectedMonth, user, loading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (monthNumber: number) => {
    const month = months.find(m => m.value === monthNumber.toString());
    return month ? month.label : monthNumber.toString();
  };

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">جاري التحميل...</h2>
            <p className="text-gray-600">يرجى الانتظار</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if user is not admin
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح لك</h2>
            <p className="text-gray-600">هذه الصفحة متاحة للمديرين فقط</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير المالية</h1>
          <p className="text-gray-600 mt-2">تحليل الأرباح والخسائر والأداء المالي</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="year">السنة:</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="month">الشهر:</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={fetchFinancialData} disabled={isLoading}>
            <Calculator className="w-4 h-4 mr-2" />
            {isLoading ? 'جاري التحميل...' : 'تحديث التقرير'}
          </Button>
        </div>
      </div>

      {/* Manual Gains and Losses Entry Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gains Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              إضافة أرباح إضافية
            </CardTitle>
            <CardDescription>
              تسجيل الأرباح الإضافية والدخل الخارج عن نطاق الدراسة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gain-amount">المبلغ (دج)</Label>
              <Input
                id="gain-amount"
                type="number"
                placeholder="أدخل مبلغ الربح"
                value={gainAmount}
                onChange={(e) => setGainAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="gain-remarks">ملاحظات الربح</Label>
              <Textarea
                id="gain-remarks"
                placeholder="اكتب تفاصيل مصدر الربح..."
                value={gainRemarks}
                onChange={(e) => setGainRemarks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitGainEntry}
              disabled={isSubmittingEntry || !gainAmount}
              className="w-full"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isSubmittingEntry ? 'جاري التسجيل...' : 'تسجيل الربح'}
            </Button>
          </CardContent>
        </Card>

        {/* Losses Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-red-600" />
              إضافة خسائر ومصاريف
            </CardTitle>
            <CardDescription>
              تسجيل الخسائر والمصاريف الإضافية خارج نطاق التشغيل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="loss-amount">المبلغ (دج)</Label>
              <Input
                id="loss-amount"
                type="number"
                placeholder="أدخل مبلغ الخسارة"
                value={lossAmount}
                onChange={(e) => setLossAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="loss-remarks">ملاحظات الخسارة</Label>
              <Textarea
                id="loss-remarks"
                placeholder="اكتب تفاصيل سبب الخسارة..."
                value={lossRemarks}
                onChange={(e) => setLossRemarks(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={handleSubmitLossEntry}
              disabled={isSubmittingEntry || !lossAmount}
              className="w-full"
              variant="destructive"
            >
              <Minus className="w-4 h-4 mr-2" />
              {isSubmittingEntry ? 'جاري التسجيل...' : 'تسجيل الخسارة'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      {financialData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  متوسط لكل طالب: {formatCurrency(financialData.averageRevenuePerStudent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(financialData.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">
                  نسبة من الإيرادات: {((financialData.totalExpenses / financialData.totalRevenue) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                <TrendingUp className={`h-4 w-4 ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financialData.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  هامش الربح: {((financialData.netProfit / financialData.totalRevenue) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إحصائيات عامة</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">الطلاب:</span>
                    <span className="font-medium">{financialData.totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">المجموعات:</span>
                    <span className="font-medium">{financialData.totalGroups}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          {financialData.monthlyBreakdown && financialData.monthlyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>التحليل الشهري</CardTitle>
                <CardDescription>تفصيل الإيرادات والمصروفات والأرباح لكل شهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.monthlyBreakdown.map((monthData) => (
                    <div key={monthData.month} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold">{getMonthName(monthData.month)}</h3>
                        <Badge variant={monthData.profit >= 0 ? "default" : "destructive"}>
                          {monthData.profit >= 0 ? "ربح" : "خسارة"}: {formatCurrency(Math.abs(monthData.profit))}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">الإيرادات:</span>
                          <div className="font-medium text-green-600">{formatCurrency(monthData.revenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">المصروفات:</span>
                          <div className="font-medium text-red-600">{formatCurrency(monthData.expenses)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">الهامش:</span>
                          <div className="font-medium">
                            {monthData.revenue > 0 ? ((monthData.profit / monthData.revenue) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group Performance */}
          {financialData.groupPerformance && financialData.groupPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>أداء المجموعات</CardTitle>
                <CardDescription>تحليل الإيرادات لكل مجموعة دراسية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialData.groupPerformance.map((group) => (
                    <div key={group.groupId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">{group.groupName}</h3>
                          <p className="text-sm text-gray-600">{group.subjectName}</p>
                        </div>
                        <Badge variant="outline">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {group.totalStudents} طالب
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">إجمالي الإيرادات:</span>
                          <div className="font-medium text-green-600">{formatCurrency(group.totalRevenue)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">متوسط لكل طالب:</span>
                          <div className="font-medium">{formatCurrency(group.averagePerStudent)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">نسبة من الإيرادات:</span>
                          <div className="font-medium">
                            {financialData.totalRevenue > 0 ? ((group.totalRevenue / financialData.totalRevenue) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Data State */}
      {!financialData && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد بيانات مالية</h3>
            <p className="text-gray-600">اختر فترة زمنية وانقر على "تحديث التقرير" لعرض البيانات المالية</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل التقرير المالي...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}