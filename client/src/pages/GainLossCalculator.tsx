import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, RotateCcw, Calculator, TrendingUp, TrendingDown, Filter, User, Receipt, BookOpen, FileText, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FinancialEntry {
  id: number;
  type: 'gain' | 'loss';
  amount: string;
  remarks: string;
  year: number;
  month: number;
  createdAt: string;
}

export default function GainLossCalculator() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [entryType, setEntryType] = useState<'gain' | 'loss'>('gain');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');

  // Check if user is admin
  if (!loading && (!user || user.role !== 'admin')) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg mb-2">صلاحيات المدير مطلوبة</div>
            <div className="text-gray-600">تحتاج إلى صلاحيات المدير لاستخدام حاسبة الأرباح والخسائر</div>
            <div className="text-sm text-gray-500 mt-4">
              الحالة: {loading ? 'جاري التحميل...' : !user ? 'غير مسجل دخول' : `الدور: ${user.role}`}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">جاري التحميل...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current date for entries
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Fetch financial entries
  const { data: entries = [], isLoading, error } = useQuery<FinancialEntry[]>({
    queryKey: ['/api', 'gain-loss-entries'],
    enabled: !!user && !loading && user.role === 'admin',
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Log any query errors
  if (error) {
    console.error('Query error:', error);
  }

  // Check if user needs to log in again
  React.useEffect(() => {
    if (error && error.message.includes('401')) {
      toast({
        title: "انتهت جلسة العمل",
        description: "يرجى تسجيل الدخول مرة أخرى",
        variant: "destructive",
      });
    }
  }, [error]);

  // Filter entries based on time filter
  const filteredEntries = React.useMemo(() => {
    if (timeFilter === 'all') return entries as FinancialEntry[];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    return (entries as FinancialEntry[]).filter((entry: FinancialEntry) => {
      const entryDate = new Date(entry.createdAt);
      
      switch (timeFilter) {
        case 'today':
          return entryDate >= todayStart;
        case 'week':
          return entryDate >= weekStart;
        case 'month':
          return entryDate >= monthStart;
        case 'year':
          return entryDate >= yearStart;
        default:
          return true;
      }
    });
  }, [entries, timeFilter]);


  // Calculate current balance from all entries (not just filtered)
  const currentBalance = (entries as FinancialEntry[]).reduce((total: number, entry: FinancialEntry) => {
    const entryAmount = parseFloat(entry.amount);
    return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
  }, 0);

  // Calculate filtered balance for transactions
  const filteredBalance = filteredEntries.reduce((total: number, entry: FinancialEntry) => {
    const entryAmount = parseFloat(entry.amount);
    return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
  }, 0);

  // Calculate balances for all time periods
  const calculateBalanceForPeriod = (period: 'today' | 'week' | 'month' | 'year' | 'all') => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(todayStart.getDate() - 30);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    const filteredByPeriod = (entries as FinancialEntry[]).filter((entry: FinancialEntry) => {
      const entryDate = new Date(entry.createdAt);
      
      switch (period) {
        case 'today':
          return entryDate >= todayStart;
        case 'week':
          return entryDate >= weekStart;
        case 'month':
          return entryDate >= monthStart;
        case 'year':
          return entryDate >= yearStart;
        case 'all':
        default:
          return true;
      }
    });
    
    return filteredByPeriod.reduce((total: number, entry: FinancialEntry) => {
      const entryAmount = parseFloat(entry.amount);
      return entry.type === 'gain' ? total + entryAmount : total - entryAmount;
    }, 0);
  };

  const todayBalance = calculateBalanceForPeriod('today');
  const weekBalance = calculateBalanceForPeriod('week');
  const monthBalance = calculateBalanceForPeriod('month');
  const yearBalance = calculateBalanceForPeriod('year');
  const allTimeBalance = calculateBalanceForPeriod('all');

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      console.log('Creating entry with data:', entryData);
      console.log('User session:', user);
      try {
        const response = await apiRequest('POST', '/api/gain-loss-entries', entryData);
        const result = await response.json();
        console.log('Success response:', result);
        return result;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
      setAmount('');
      setRemarks('');
      toast({
        title: "تم الحفظ",
        description: `تم إضافة ${entryType === 'gain' ? 'الربح' : 'الخسارة'} بنجاح`,
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "خطأ",
        description: `حدث خطأ أثناء حفظ البيانات: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Reset balance mutation
  const resetBalanceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/gain-loss-entries/reset');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api', 'gain-loss-entries'] });
      toast({
        title: "تم إعادة التعيين",
        description: "تم إعادة تعيين الرصيد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إعادة تعيين الرصيد",
        variant: "destructive",
      });
    },
  });

  // Helper function to get filter label
  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      case 'year': return 'هذا العام';
      default: return 'جميع الأوقات';
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!remarks.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى إدخال ملاحظات",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      type: entryType,
      amount: amount.trim(), // Send as string for decimal field
      remarks: remarks.trim(),
      year: currentYear,
      month: currentMonth,
    });
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      resetBalanceMutation.mutate();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;
  }

  if (!user) {
    return <div className="text-center text-red-600">يرجى تسجيل الدخول</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center justify-center gap-3">
          <Calculator className="w-8 h-8 text-primary" />
          حاسبة الأرباح والخسائر
        </h1>
        <p className="text-gray-600 dark:text-gray-400">أداة بسيطة لتتبع الأرباح والخسائر المالية</p>
      </div>

      {/* Balance Display Grid - All Time Periods */}
      <Card className="border-2 border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-primary mb-2">
              الرصيد حسب الفترة الزمنية
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              النتيجة الصافية = إجمالي الدخل - إجمالي المصروفات
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Today */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">اليوم</div>
                <div className={`text-xl font-bold ${todayBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {todayBalance.toLocaleString('ar-DZ')} دج
                </div>
              </div>
            </div>
            
            {/* Last 7 Days */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">آخر 7 أيام</div>
                <div className={`text-xl font-bold ${weekBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {weekBalance.toLocaleString('ar-DZ')} دج
                </div>
              </div>
            </div>
            
            {/* Last 30 Days */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">آخر 30 يوم</div>
                <div className={`text-xl font-bold ${monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthBalance.toLocaleString('ar-DZ')} دج
                </div>
              </div>
            </div>
            
            {/* This Year */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">هذا العام</div>
                <div className={`text-xl font-bold ${yearBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearBalance.toLocaleString('ar-DZ')} دج
                </div>
              </div>
            </div>
            
            {/* All Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">جميع الأوقات</div>
                <div className={`text-xl font-bold ${allTimeBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {allTimeBalance.toLocaleString('ar-DZ')} دج
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              إضافة عملية جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Entry Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={entryType === 'gain' ? 'default' : 'outline'}
                  onClick={() => setEntryType('gain')}
                  className="h-12 flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  ربح (+)
                </Button>
                <Button
                  type="button"
                  variant={entryType === 'loss' ? 'default' : 'outline'}
                  onClick={() => setEntryType('loss')}
                  className="h-12 flex items-center gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  خسارة (-)
                </Button>
              </div>

              {/* Amount Input */}
              <div>
                <Label htmlFor="amount">المبلغ (بالدينار الجزائري)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-lg"
                />
              </div>

              {/* Remarks Input */}
              <div>
                <Label htmlFor="remarks">الملاحظات</Label>
                <Textarea
                  id="remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="اكتب ملاحظات حول هذه العملية..."
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg"
                disabled={createEntryMutation.isPending}
              >
                {createEntryMutation.isPending ? 'جاري الحفظ...' : `إضافة ${entryType === 'gain' ? 'ربح' : 'خسارة'}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg font-semibold">العمليات الأخيرة</CardTitle>
            
            {/* Time Filter Section */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">فلترة حسب الفترة:</span>
              <Select value={timeFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month' | 'year') => setTimeFilter(value)}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأوقات</SelectItem>
                  <SelectItem value="today">اليوم</SelectItem>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                  <SelectItem value="year">هذا العام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">جاري التحميل...</div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 dark:text-red-400 mb-2">خطأ في تحميل البيانات</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {error.message.includes('401') ? 'يرجى تسجيل الدخول مرة أخرى' : 'تحقق من الاتصال'}
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {timeFilter === 'all' ? 'لا توجد عمليات' : `لا توجد عمليات في ${getFilterLabel()}`}
              </div>
            ) : (
              <>
                {/* Show filtered balance if different from total */}
                {timeFilter !== 'all' && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">الرصيد لفترة: {getFilterLabel()}</div>
                        <div className={`text-xl font-bold ${filteredBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {filteredBalance >= 0 ? '+' : ''}{filteredBalance.toLocaleString('ar-DZ')} دج
                        </div>
                      </div>
                      <div className="text-blue-500 dark:text-blue-400">
                        <Calculator className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEntries.slice(0, 15).map((entry: FinancialEntry) => (
                  <div
                    key={entry.id}
                    className={`p-2 rounded border shadow-sm hover:shadow transition-shadow ${
                      entry.type === 'gain' 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700' 
                        : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'
                    }`}
                  >
                    {/* Header with amount and date */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full ${
                          entry.type === 'gain' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {entry.type === 'gain' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                        </div>
                        <div>
                          <span className={`text-sm sm:text-base font-bold ${
                            entry.type === 'gain' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                          }`}>
                            {entry.type === 'gain' ? '+' : '-'}{parseFloat(entry.amount).toLocaleString('ar-DZ')} دج
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.type === 'gain' ? 'ربح' : (entry.remarks.includes('إيصال دفع رقم:') ? 'خسارة - استرجاع أموال' : 'خسارة')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                        <div className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString('ar-DZ')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleTimeString('ar-DZ', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-200 dark:border-gray-600">
                      {(() => {
                        // Parse payment receipt format: "إيصال دفع رقم: REC-XXX - الطالب: NAME - DETAILS"
                        const receiptMatch = entry.remarks.match(/إيصال دفع رقم: ([^-]+) - الطالب: ([^-]+) - (.+)/);
                        
                        if (receiptMatch) {
                          const [, receiptId, studentName, paymentDetails] = receiptMatch;
                          
                          // Parse payment details and create all tags
                          const subjects = paymentDetails.trim().split(' - ');
                          const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                                             'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                          
                          // Extract month/year information
                          const monthYearTags = [];
                          subjects.forEach(subject => {
                            const subjectText = subject.trim();
                            // Look for month/year patterns like "أغسطس 2025" or "أغسطس/2025"
                            const monthYearMatch = subjectText.match(/(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\/?\s*(\d{4})/);
                            if (monthYearMatch) {
                              const [, monthName, year] = monthYearMatch;
                              const monthYearDisplay = `${monthName} / ${year}`;
                              if (!monthYearTags.some(tag => tag.value === monthYearDisplay)) {
                                monthYearTags.push({
                                  label: 'الشهر',
                                  value: monthYearDisplay,
                                  color: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800',
                                  textColor: 'text-amber-700 dark:text-amber-300',
                                  icon: Calendar
                                });
                              }
                            }
                          });

                          const allTags = [
                            { label: 'الطالب', value: studentName.trim(), color: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', icon: User },
                            { label: 'رقم الإيصال', value: receiptId.trim(), color: 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', icon: Receipt },
                            ...monthYearTags,
                            ...subjects.map(subject => {
                              const subjectText = subject.trim();
                              
                              // Handle the new format "المجموعة : group name"
                              if (subjectText.startsWith('المجموعة :') || subjectText.startsWith('المجموعة:')) {
                                const groupName = subjectText.replace(/^المجموعة\s*:\s*/, '').trim();
                                if (groupName && groupName.length > 2) {
                                  return { label: '', value: groupName, color: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300', icon: BookOpen };
                                }
                                return null;
                              }
                              
                              // Extract only group name - look for patterns like "مجموعة X" or "group X"
                              let displayText = subjectText;
                              
                              // Extract group name if it contains "مجموعة"
                              const groupMatch = subjectText.match(/مجموعة\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+(?:مع|في|من|إلى|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|202\d)|$)/);
                              if (groupMatch) {
                                displayText = `مجموعة ${groupMatch[1]}`;
                              } else {
                                // If no "مجموعة" pattern, try to extract just the core group name
                                // Remove teacher names (مع X), subjects, and dates
                                displayText = subjectText
                                  .replace(/\s*مع\s+[^\s]+/g, '') // Remove "مع أحمد"
                                  .replace(/\s*(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\/?\s*\d*\s*/g, '') // Remove months and years
                                  .replace(/\s*(?:اللغة الإنجليزية|اللغة الفرنسية|اللغة العربية|الرياضيات|العلوم|الفيزياء|الكيمياء|التاريخ|الجغرافيا)\s*/g, '') // Remove common subjects
                                  .trim();
                              }
                              
                              // Skip empty text after cleaning
                              if (!displayText || displayText.length < 2) return null;
                              
                              return { label: '', value: displayText, color: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300', icon: BookOpen };
                            }).filter(Boolean)
                          ];
                          
                          return (
                            <div className="flex flex-wrap gap-1">
                              {allTags.map((tag, index) => {
                                const IconComponent = tag.icon;
                                return (
                                  <div key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${tag.color} ${tag.textColor}`}>
                                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                                    {tag.label && <span className="whitespace-nowrap">{tag.label}: </span>}
                                    <span className="whitespace-nowrap">{tag.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        
                        // Fallback for other entry types - also try to parse and format
                        // Handle the case where the text might be formatted differently
                        const parts = entry.remarks.split(' - ');
                        if (parts.length >= 3) {
                          // Try to extract parts manually
                          const receiptPart = parts[0]; // "إيصال دفع رقم: REC-XXX"
                          const studentPart = parts[1]; // "الطالب: NAME"
                          const paymentPart = parts.slice(2).join(' - '); // Everything else
                          
                          const receiptId = receiptPart.replace('إيصال دفع رقم: ', '').trim();
                          const studentName = studentPart.replace('الطالب: ', '').trim();
                          
                          // Parse payment details and create all tags
                          const subjects = paymentPart.trim().split(' - ');
                          const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                                             'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                          
                          // Extract month/year information
                          const monthYearTags = [];
                          subjects.forEach(subject => {
                            const subjectText = subject.trim();
                            // Look for month/year patterns like "أغسطس 2025" or "أغسطس/2025"
                            const monthYearMatch = subjectText.match(/(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\/?\s*(\d{4})/);
                            if (monthYearMatch) {
                              const [, monthName, year] = monthYearMatch;
                              const monthYearDisplay = `${monthName} / ${year}`;
                              if (!monthYearTags.some(tag => tag.value === monthYearDisplay)) {
                                monthYearTags.push({
                                  label: 'الشهر',
                                  value: monthYearDisplay,
                                  color: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800',
                                  textColor: 'text-amber-700 dark:text-amber-300',
                                  icon: Calendar
                                });
                              }
                            }
                          });
                          
                          const allTags = [
                            { label: 'الطالب', value: studentName, color: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', icon: User },
                            { label: 'رقم الإيصال', value: receiptId, color: 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', icon: Receipt },
                            ...monthYearTags,
                            ...subjects.map(subject => {
                              const subjectText = subject.trim();
                              
                              // Handle the new format "المجموعة : group name"
                              if (subjectText.startsWith('المجموعة :') || subjectText.startsWith('المجموعة:')) {
                                const groupName = subjectText.replace(/^المجموعة\s*:\s*/, '').trim();
                                if (groupName && groupName.length > 2) {
                                  return { label: '', value: groupName, color: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300', icon: BookOpen };
                                }
                                return null;
                              }
                              
                              // Extract only group name - look for patterns like "مجموعة X" or "group X"
                              let displayText = subjectText;
                              
                              // Extract group name if it contains "مجموعة"
                              const groupMatch = subjectText.match(/مجموعة\s+([^\s]+(?:\s+[^\s]+)*?)(?:\s+(?:مع|في|من|إلى|يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر|202\d)|$)/);
                              if (groupMatch) {
                                displayText = `مجموعة ${groupMatch[1]}`;
                              } else {
                                // If no "مجموعة" pattern, try to extract just the core group name
                                // Remove teacher names (مع X), subjects, and dates
                                displayText = subjectText
                                  .replace(/\s*مع\s+[^\s]+/g, '') // Remove "مع أحمد"
                                  .replace(/\s*(?:يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*\/?\s*\d*\s*/g, '') // Remove months and years
                                  .replace(/\s*(?:اللغة الإنجليزية|اللغة الفرنسية|اللغة العربية|الرياضيات|العلوم|الفيزياء|الكيمياء|التاريخ|الجغرافيا)\s*/g, '') // Remove common subjects
                                  .trim();
                              }
                              
                              // Skip empty text after cleaning
                              if (!displayText || displayText.length < 2) return null;
                              
                              return { label: '', value: displayText, color: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-700 dark:text-emerald-300', icon: BookOpen };
                            }).filter(Boolean)
                          ];
                          
                          return (
                            <div className="flex flex-wrap gap-1">
                              {allTags.map((tag, index) => {
                                const IconComponent = tag.icon;
                                return (
                                  <div key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${tag.color} ${tag.textColor}`}>
                                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                                    {tag.label && <span className="whitespace-nowrap">{tag.label}: </span>}
                                    <span className="whitespace-nowrap">{tag.value}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        
                        // Final fallback for completely different format
                        return (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="whitespace-nowrap">{entry.remarks}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}