import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Plus, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CourseCreateDialog from '@/components/CourseCreateDialog';
import MobileNavigation from '@/components/layout/MobileNavigation';

interface Course {
  id: string;
  name: string;
  grade_level: string;
  max_participants: number;
  price_per_lesson: number;
  institution_name: string;
  curriculum_name: string;
  lesson_count: number; // currently 0, update with actual data if needed
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchCourses = async () => {
    if (!user) return;

    try {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          grade_level,
          max_participants,
          price_per_lesson,
          educational_institutions(name),
          curricula(name),
          instructor_id
        `);

      if (error) throw error;

      const formattedCourses = coursesData?.map((course: any) => ({
        id: course.id,
        name: course.name,
        grade_level: course.grade_level || 'לא צוין',
        max_participants: course.max_participants || 0,
        price_per_lesson: course.price_per_lesson || 0,
        institution_name: course.educational_institutions?.name || 'לא צוין',
        curriculum_name: course.curricula?.name || 'לא צוין',
        lesson_count: 0, // Set to 0 for now, update later if you fetch lessons count
      })) || [];

      console.log("formattedCourses: ", formattedCourses);
      setCourses(formattedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleCourseCreated = () => {
    fetchCourses();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="md:hidden">
        <MobileNavigation />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול קורסים</h1>
            <p className="text-gray-600 text-lg">ניהול וצפייה בכל הקורסים שאתה מעביר</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>קורס חדש</span>
          </Button>
        </div>

        {courses.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent>
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">אין קורסים עדיין</h3>
              <p className="text-gray-600 mb-6 text-lg">התחל ליצור את הקורס הראשון שלך</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                צור קורס חדש
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:scale-105">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2 text-white">{course.name}</CardTitle>
                      <CardDescription className="text-blue-100 text-base">{course.institution_name}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">תוכנית לימודים:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{course.curriculum_name}</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">כיתה:</span>
                    <span className="text-sm font-semibold text-gray-900">{course.grade_level}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">משתתפים מקסימום:</span>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900">{course.max_participants}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">מחיר לשיעור:</span>
                    <span className="text-sm font-semibold text-green-600">₪{course.price_per_lesson}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">שיעורים:</span>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900">{course.lesson_count}</span>
                    </div>
                  </div>

                  <div className="pt-6 space-y-3">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" size="sm">
                      צפה בפרטים
                    </Button>
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      מערכת השעות
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CourseCreateDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCourseCreated={handleCourseCreated}
        />
      </main>
    </div>   
  );
};

export default Courses;
