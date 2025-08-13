import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, DollarSign, TrendingUp, Download, FileText, Users, BookOpen, CheckCircle, X, Filter, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface InstructorReport {
  id: string;
  full_name: string;
  hourly_rate: number | null;
  total_reports: number;
  total_hours: number;
  total_salary: number;
  reports: LessonReportDetail[];
}

interface LessonReportDetail {
  id: string;
  lesson_title: string;
  course_name: string;
  lesson_number: number;
  participants_count: number;
  total_students: number;
  is_lesson_ok: boolean;
  hourly_rate: number;
  created_at: string;
  attendanceData: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  name: string;
  attended: boolean;
}

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'instructors' | 'institutions'>('instructors');
  const [instructorReports, setInstructorReports] = useState<InstructorReport[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [instructorsList, setInstructorsList] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchInstructorsList = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'instructor')
        .order('full_name');
      
      setInstructorsList(data || []);
    };

    fetchInstructorsList();
  }, []);

  useEffect(() => {
    const fetchInstructorReports = async () => {
      if (!user || reportType !== 'instructors') return;

      setLoading(true);
      try {
        // Get all lesson reports with detailed information
        let query = supabase
          .from('lesson_reports')
          .select(`
            id,
            lesson_title,
            participants_count,
            is_lesson_ok,
            created_at,
            instructor_id,
            course_instance_id,
            lesson_schedule_id,
            instructor:instructor_id (
              id,
              full_name,
              hourly_rate
            ),
            reported_lesson_instances (
              lesson_number
            ),
            lesson_attendance (
              student_id,
              attended,
              students (
                id,
                full_name
              )
            ),
            lessons:lesson_id (
              id,
              order_index,
              courses:course_id (
                name
              )
            )
          `)
          .order('created_at', { ascending: false });

        // Apply date filters
        if (dateFrom) {
          query = query.gte('created_at', dateFrom.toISOString());
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endOfDay.toISOString());
        }

        // Apply instructor filter
        if (selectedInstructor !== 'all') {
          query = query.eq('instructor_id', selectedInstructor);
        }

        const { data: reports, error } = await query;

        if (error) {
          console.error('Error fetching reports:', error);
          return;
        }

        // Process reports for each instructor
        const instructorMap = new Map<string, InstructorReport>();

        for (const report of reports || []) {
          const instructorId = report.instructor_id;
          const instructor = report.instructor;
          
          if (!instructor || !instructorId) continue;

          // Validate instructor matches course instance
          let isValidInstructor = true;
          if (report.course_instance_id) {
            const { data: courseInstance } = await supabase
              .from('course_instances')
              .select('instructor_id')
              .eq('id', report.course_instance_id)
              .single();
            
            isValidInstructor = courseInstance?.instructor_id === instructorId;
          } else if (report.lesson_schedule_id) {
            // Check through lesson_schedules -> course_instances
            const { data: lessonSchedule } = await supabase
              .from('lesson_schedules')
              .select(`
                course_instances (
                  instructor_id
                )
              `)
              .eq('id', report.lesson_schedule_id)
              .single();
            
            isValidInstructor = lessonSchedule?.course_instances?.instructor_id === instructorId;
          }

          if (!isValidInstructor) continue;

          // Get course instance data for total students count
          let totalStudents = 0;
          let hourlyRate = instructor.hourly_rate || 0;

          if (report.course_instance_id) {
            const { data: courseInstanceData } = await supabase
              .from('course_instances')
              .select(`
                price_for_instructor,
                students (id)
              `)
              .eq('id', report.course_instance_id)
              .single();
            
            totalStudents = courseInstanceData?.students?.length || 0;
            hourlyRate = courseInstanceData?.price_for_instructor || instructor.hourly_rate || 0;
          } else if (report.lesson_schedule_id) {
            // Get from lesson_schedules -> course_instances
            const { data: scheduleData } = await supabase
              .from('lesson_schedules')
              .select(`
                course_instances (
                  price_for_instructor,
                  students (id)
                )
              `)
              .eq('id', report.lesson_schedule_id)
              .single();
            
            totalStudents = scheduleData?.course_instances?.students?.length || 0;
            hourlyRate = scheduleData?.course_instances?.price_for_instructor || instructor.hourly_rate || 0;
          }

          // Process attendance data
          const attendanceData: AttendanceRecord[] = [];
          if (report.lesson_attendance) {
            for (const attendance of report.lesson_attendance) {
              if (attendance.students) {
                attendanceData.push({
                  id: attendance.students.id,
                  name: attendance.students.full_name,
                  attended: attendance.attended
                });
              }
            }
          }

          const lessonDetail: LessonReportDetail = {
            id: report.id,
            lesson_title: report.lesson_title,
            course_name: report.lessons?.courses?.name || 'לא זמין',
            lesson_number: report.reported_lesson_instances?.[0]?.lesson_number || (report.lessons?.order_index ? report.lessons.order_index + 1 : 1),
            participants_count: report.participants_count || 0,
            total_students: totalStudents,
            is_lesson_ok: report.is_lesson_ok || false,
            hourly_rate: hourlyRate,
            created_at: report.created_at,
            attendanceData
          };

          if (!instructorMap.has(instructorId)) {
            instructorMap.set(instructorId, {
              id: instructorId,
              full_name: instructor.full_name,
              hourly_rate: instructor.hourly_rate,
              total_reports: 0,
              total_hours: 0,
              total_salary: 0,
              reports: []
            });
          }

          const instructorReport = instructorMap.get(instructorId)!;
          instructorReport.reports.push(lessonDetail);
          instructorReport.total_reports += 1;
          instructorReport.total_hours += 1; // Each lesson = 1 hour (can be adjusted)
          instructorReport.total_salary += hourlyRate;
        }

        setInstructorReports(Array.from(instructorMap.values()));
      } catch (error) {
        console.error('Error fetching instructor reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorReports();
  }, [user, reportType, dateFrom, dateTo, selectedInstructor]);

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedInstructor('all');
  };

  const totalSalaryAllInstructors = instructorReports.reduce((sum, instructor) => sum + instructor.total_salary, 0);
  const totalHoursAllInstructors = instructorReports.reduce((sum, instructor) => sum + instructor.total_hours, 0);
  const totalReportsAllInstructors = instructorReports.reduce((sum, instructor) => sum + instructor.total_reports, 0);

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
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">דוחות ושכר</h1>
            </div>
            <Button className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>ייצוא דוח</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Type Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>בחר סוג דוח</CardTitle>
            <CardDescription>בחר בין דוח מדריכים או דוח מוסדות חינוך</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={reportType} onValueChange={(value: 'instructors' | 'institutions') => setReportType(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instructors">דוח מדריכים</SelectItem>
                <SelectItem value="institutions">דוח מוסדות חינוך</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {reportType === 'instructors' ? (
          <>
            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 ml-2" />
                  סינונים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>מתאריך</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right">
                          <CalendarDays className="ml-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          locale={he}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>עד תאריך</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-right">
                          <CalendarDays className="ml-2 h-4 w-4" />
                          {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          locale={he}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>מדריך</Label>
                    <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל המדריכים</SelectItem>
                        {instructorsList.map(instructor => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      נקה סינונים
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">₪{totalSalaryAllInstructors.toLocaleString()}</p>
                      <p className="text-gray-600 font-medium">סה"כ שכר</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{totalReportsAllInstructors}</p>
                      <p className="text-gray-600 font-medium">סה"כ דיווחים</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{totalHoursAllInstructors}</p>
                      <p className="text-gray-600 font-medium">סה"כ שעות</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{instructorReports.length}</p>
                      <p className="text-gray-600 font-medium">מדריכים פעילים</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Instructor Reports */}
            <div className="space-y-6">
              {instructorReports.map((instructor) => (
                <Card key={instructor.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{instructor.full_name}</CardTitle>
                        <CardDescription>
                          סה"כ דיווחים: {instructor.total_reports} | 
                          סה"כ שעות: {instructor.total_hours} | 
                          סה"כ שכר: ₪{instructor.total_salary.toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        ₪{instructor.total_salary.toLocaleString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-right py-3 px-4 font-medium">שיעור מס'</th>
                            <th className="text-right py-3 px-4 font-medium">נושא השיעור</th>
                            <th className="text-right py-3 px-4 font-medium">קורס</th>
                            <th className="text-right py-3 px-4 font-medium">נוכחות</th>
                            <th className="text-right py-3 px-4 font-medium">שכר לשיעור</th>
                            <th className="text-right py-3 px-4 font-medium">התנהל כשורה</th>
                            <th className="text-right py-3 px-4 font-medium">תאריך</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {instructor.reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium text-blue-600">
                                שיעור {report.lesson_number}
                              </td>
                              <td className="py-3 px-4 font-medium">{report.lesson_title}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{report.course_name}</Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {report.participants_count} מתוך {report.total_students}
                                  </span>
                                  {report.attendanceData.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                      ({report.attendanceData.filter(a => a.attended).map(a => a.name).join(', ')})
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold text-green-600">
                                ₪{report.hourly_rate.toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                {report.is_lesson_ok ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 ml-1" />
                                    כן
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <X className="h-3 w-3 ml-1" />
                                    לא
                                  </Badge>
                                )}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {new Date(report.created_at).toLocaleDateString('he-IL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {instructorReports.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">אין דוחות זמינים</h3>
                    <p className="text-gray-600">לא נמצאו דוחות בפילטרים שנבחרו</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          // Educational Institutions section (placeholder for now)
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">דוח מוסדות חינוך</h3>
              <p className="text-gray-600">תכונה זו תפותח בקרוב</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Reports;