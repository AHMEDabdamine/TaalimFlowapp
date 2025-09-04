import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Book, GraduationCap, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeachingModule {
  id: number;
  name: string;
  nameAr: string;
  educationLevel: string;
  grade: string;
  description: string;
}

interface TeacherSpecialization {
  id: number;
  teacherId: number;
  moduleId: number;
  createdAt: string;
}

interface TeacherSpecializationFormProps {
  onSpecializationAdded?: () => void;
}

export function TeacherSpecializationForm({ onSpecializationAdded }: TeacherSpecializationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [modules, setModules] = useState<TeachingModule[]>([]);
  const [filteredModules, setFilteredModules] = useState<TeachingModule[]>([]);
  const [specializations, setSpecializations] = useState<TeacherSpecialization[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const educationLevels = [
    { value: 'الابتدائي', label: 'الابتدائي' },
    { value: 'المتوسط', label: 'المتوسط' },
    { value: 'الثانوي', label: 'الثانوي' }
  ];

  useEffect(() => {
    fetchModules();
    fetchSpecializations();
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      const filtered = modules.filter(module => module.educationLevel === selectedLevel);
      
      // Remove duplicates by keeping only one module per nameAr (prefer global subjects)
      const uniqueModules = filtered.reduce((acc: TeachingModule[], current) => {
        const existingModule = acc.find(m => m.nameAr === current.nameAr);
        if (!existingModule) {
          acc.push(current);
        }
        return acc;
      }, []);

      setFilteredModules(uniqueModules);
    } else {
      setFilteredModules([]);
    }
  }, [selectedLevel, modules]);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/teaching-modules');
      if (response.ok) {
        const data = await response.json();

        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchSpecializations = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/teacher-specializations/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSpecializations(data);
      }
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedModule) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المادة التعليمية",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/teacher-specializations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: user.id,
          moduleId: selectedModule,
        }),
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: "تم إضافة التخصص بنجاح",
        });
        
        // Reset form
        setSelectedLevel('');
        setSelectedModule(null);
        
        // Refresh specializations
        fetchSpecializations();
        
        // Call callback if provided
        if (onSpecializationAdded) {
          onSpecializationAdded();
        }
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.error || "حدث خطأ أثناء إضافة التخصص",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpecialization = async (specializationId: number) => {
    try {
      const response = await fetch(`/api/teacher-specializations/${specializationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "تم بنجاح",
          description: "تم حذف التخصص بنجاح",
        });
        fetchSpecializations();
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.error || "حدث خطأ أثناء حذف التخصص",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال",
        variant: "destructive",
      });
    }
  };

  const getModuleById = (moduleId: number) => {
    return modules.find(module => module.id === moduleId);
  };

  const isModuleAlreadySelected = (moduleId: number) => {
    return specializations.some(spec => spec.moduleId === moduleId);
  };

  const getEducationLevelLabel = (level: string) => {
    // Since we're now using Arabic values directly, just return the level as is
    return level;
  };

  if (!user || user.role !== 'teacher') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">هذه الصفحة مخصصة للمعلمين فقط</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Current Specializations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            تخصصاتي الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {specializations.length === 0 ? (
            <div className="text-center py-8">
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد تخصصات مضافة بعد</p>
              <p className="text-gray-500 text-sm mt-2">ابدأ بإضافة المواد التي تدرسها</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specializations.map((spec) => {
                const module = getModuleById(spec.moduleId);
                return (
                  <div key={spec.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{module?.nameAr}</h3>
                        <p className="text-sm text-gray-600">{getEducationLevelLabel(module?.educationLevel || '')}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSpecialization(spec.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-700">{module?.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Specialization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-blue-600" />
            إضافة تخصص جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level" className="text-sm font-medium">
                  المستوى التعليمي
                </Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المستوى التعليمي" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="module" className="text-sm font-medium">
                  المادة التعليمية
                </Label>
                <Select 
                  value={selectedModule?.toString() || ''} 
                  onValueChange={(value) => setSelectedModule(parseInt(value))}
                  disabled={!selectedLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المادة التعليمية" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredModules.map((module) => (
                      <SelectItem 
                        key={module.id} 
                        value={module.id.toString()}
                        disabled={isModuleAlreadySelected(module.id)}
                      >
                        {module.nameAr}
                        {isModuleAlreadySelected(module.id) && ' (مضاف مسبقاً)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedLevel && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>المستوى المحدد:</strong> {getEducationLevelLabel(selectedLevel)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {filteredModules.length} مادة متاحة في هذا المستوى
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !selectedModule}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة التخصص'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}