import React from 'react';
import { TeacherSpecializationForm } from '../components/TeacherSpecializationForm';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function TeacherSpecializations() {
  const { user } = useAuth();

  if (!user || user.role !== 'teacher') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">صفحة المعلمين</h2>
            <p className="text-gray-600 mb-4">هذه الصفحة مخصصة للمعلمين فقط</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                العودة للصفحة الرئيسية
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة التخصصات التعليمية</h1>
        <p className="text-gray-600">اختر المواد التعليمية التي تدرسها مصنفة حسب المستوى التعليمي</p>
      </div>
      
      <TeacherSpecializationForm />
    </div>
  );
}