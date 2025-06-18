
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, MapPin, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_per_lesson: number;
  institution_name: string;
  curriculum_name: string;
  lesson_count: number;
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        const { data: coursesData } = await supabase
          .from('courses')
          .select(`
            id,
            name,
            grade_level,
            max_participants,
            price_per_lesson,
            educational_institutions(name),
            curricula(name),
            lessons(count)
          `)
          .eq('instructor_id', user.id);

        const formattedCourses = coursesData?.map(course => ({
          id: course.id,
          name: course.name,
          grade_level: course.grade_level || 'לא צוין',
          max_participants: course.max_participants || 0,
          price_per_lesson: course.price_per_lesson || 0,
          institution_name: course.educational_institutions?.name || 'לא צוין',
          curriculum_name: course.curricula?.name || 'לא צוין',
          lesson_count: course.lessons?.length || 0
        })) || [];

        setCourses(formattedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">ניהול קורסים</h1>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>קורס חדש</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">הקורסים שלי</h2>
          <p className="text-gray-600">ניהול וצפייה בכל הקורסים שאתה מעביר</p>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין קורסים עדיין</h3>
              <p className="text-gray-600 mb-4">התחל ליצור את הקורס הראשון שלך</p>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                צור קורס חדש
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-1">{course.name}</CardTitle>
                      <CardDescription>{course.institution_name}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">תוכנית לימודים:</span>
                    <Badge variant="secondary">{course.curriculum_name}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">כיתה:</span>
                    <span className="text-sm font-medium">{course.grade_level}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">משתתפים מקסימום:</span>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 ml-1" />
                      <span className="text-sm font-medium">{course.max_participants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">מחיר לשיעור:</span>
                    <span className="text-sm font-medium">₪{course.price_per_lesson}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">שיעורים:</span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 ml-1" />
                      <span className="text-sm font-medium">{course.lesson_count}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button className="w-full" size="sm">
                      צפה בפרטים
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Calendar className="h-4 w-4 ml-2" />
                      מערכת השעות
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Courses;
