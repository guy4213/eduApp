import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, DollarSign, TrendingUp, Download, FileText, Users, BookOpen, CheckCircle, X, Filter, CalendarDays, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';

interface MonthlyReport {
  month: string;
  monthKey: string;
  date: Date;
  totalLessons: number;
  totalHours: number;
  totalEarnings: number;
  completedLessons: number;
  cancelledLessons: number;
  completionRate: number;
  instructorData?: InstructorReport[];
  institutionData?: InstitutionReport[];
}

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
  institution_name: string;
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

interface InstitutionReport {
  id: string;
  name: string;
  total_lessons: number;
  total_revenue: number;
  total_students: number;
  courses: CourseDetail[];
}

interface CourseDetail {
  id: string;
  course_name: string;
  instructor_name: string;
  lesson_count: number;
  student_count: number;
  price_per_lesson: number;
  lesson_details: LessonReportDetail[];
}

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'instructors' | 'institutions'>('instructors');
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [institutionsList, setInstitutionsList] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Generate months list (current month + 12 months forward)
  const monthsList = useMemo(() => {
    const months = [];
    for (let i = 0; i <= 12; i++) {
      const monthDate = addMonths(new Date(), i);
      months.push({
        key: i === 0 ? 'current' : `month-${i}`,
        label: i === 0 ? 'החודש הנוכחי' : format(monthDate, 'MMMM yyyy', { locale: he }),
        date: monthDate,
        startDate: startOfMonth(monthDate),
        endDate: endOfMonth(monthDate)
      });
    }
    return months;
  }, []);

  // Get filtered data for selected month
  const filteredMonthData = useMemo(() => {
    const selectedMonthData = monthlyReports.find(report => 
      selectedMonth === 'current' ? report.monthKey === 'current' : report.monthKey === selectedMonth
    );
    
    if (!selectedMonthData) {
      return {
        totalEarnings: 0,
        totalLessons: 0,
        completionRate: 0,
        totalStudents: 0,
        detailData: []
      };
    }

    if (reportType === 'instructors') {
      // Filter instructors based on selection
      const filteredInstructors = selectedInstructor === 'all' 
        ? selectedMonthData.instructorData || []
        : (selectedMonthData.instructorData || []).filter(instructor => instructor.id === selectedInstructor);

      const totalEarnings = filteredInstructors.reduce((sum, instructor) => sum + instructor.total_salary, 0);
      const totalLessons = filteredInstructors.reduce((sum, instructor) => sum + instructor.total_reports, 0);
      const completedLessons = filteredInstructors.reduce((sum, instructor) => 
        sum + instructor.reports.filter(report => report.is_lesson_ok).length, 0);
      const totalStudents = filteredInstructors.reduce((sum, instructor) => 
        sum + instructor.reports.reduce((reportSum, report) => reportSum + report.total_students, 0), 0);

      return {
        totalEarnings,
        totalLessons,
        completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        totalStudents,
        detailData: filteredInstructors
      };
    } else {
      // Filter institutions based on selection
      const filteredInstitutions = selectedInstitution === 'all' 
        ? selectedMonthData.institutionData || []
        : (selectedMonthData.institutionData || []).filter(institution => institution.id === selectedInstitution);

      const totalEarnings = filteredInstitutions.reduce((sum, institution) => sum + institution.total_revenue, 0);
      const totalLessons = filteredInstitutions.reduce((sum, institution) => sum + institution.total_lessons, 0);
      const totalStudents = filteredInstitutions.reduce((sum, institution) => sum + institution.total_students, 0);
      
      // Calculate completion rate from lesson details
      const allLessonDetails = filteredInstitutions.flatMap(inst => 
        inst.courses.flatMap(course => course.lesson_details)
      );
      const completedLessons = allLessonDetails.filter(lesson => lesson.is_lesson_ok).length;

      return {
        totalEarnings,
        totalLessons,
        completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        totalStudents,
        detailData: filteredInstitutions
      };
    }
  }, [monthlyReports, selectedMonth, reportType, selectedInstructor, selectedInstitution]);

  // Toggle row expansion
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchLists = async () => {
      const [instructorsRes, institutionsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'instructor')
          .order('full_name'),
        supabase
          .from('educational_institutions')
          .select('id, name')
          .order('name')
      ]);
      
      setInstructorsList(instructorsRes.data || []);
      setInstitutionsList(institutionsRes.data || []);
    };

    fetchLists();
  }, []);

  // Fetch reports data for all months (only once on load, no dependency on filters)
  useEffect(() => {
    const fetchAllMonthlyReports = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const reports: MonthlyReport[] = [];

        for (const month of monthsList) {
          const monthData = await fetchMonthData(month.startDate, month.endDate, month.key);
          reports.push({
            month: month.label,
            monthKey: month.key,
            date: month.date,
            ...monthData
          });
        }

        setMonthlyReports(reports);
      } catch (error) {
        console.error('Error fetching monthly reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMonthlyReports();
  }, [user, monthsList]); // Removed filter dependencies

  const fetchMonthData = async (startDate: Date, endDate: Date, monthKey: string) => {
    try {
      // Fetch ALL data without filtering - we'll filter in the frontend
      const instructorData = await fetchInstructorDataForMonth(startDate, endDate);
      const institutionData = await fetchInstitutionDataForMonth(startDate, endDate);

      const totalLessons = instructorData.reduce((sum, instructor) => sum + instructor.total_reports, 0);
      const totalEarnings = instructorData.reduce((sum, instructor) => sum + instructor.total_salary, 0);
      const completedLessons = instructorData.reduce((sum, instructor) => 
        sum + instructor.reports.filter(report => report.is_lesson_ok).length, 0);

      return {
        totalLessons,
        totalHours: totalLessons * 1.5, // Assuming 1.5 hours per lesson
        totalEarnings,
        completedLessons,
        cancelledLessons: totalLessons - completedLessons,
        completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        instructorData,
        institutionData
      };
    } catch (error) {
      console.error('Error fetching month data:', error);
      return {
        totalLessons: 0,
        totalHours: 0,
        totalEarnings: 0,
        completedLessons: 0,
        cancelledLessons: 0,
        completionRate: 0,
        instructorData: [],
        institutionData: []
      };
    }
  };

  const fetchInstructorDataForMonth = async (startDate: Date, endDate: Date) => {
    try {
      // Get ALL lesson reports without instructor filtering
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
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: reports, error } = await query;
      if (error) throw error;

      // Process reports and get institution info
      const instructorMap = new Map<string, InstructorReport>();

      for (const report of reports || []) {
        const instructorId = report.instructor_id;
        const instructor = report.instructor;
        
        if (!instructor || !instructorId) continue;

        // Get institution info and course instance data
        let institutionName = 'לא זמין';
        let totalStudents = 0;
        let hourlyRate = instructor.hourly_rate || 0;

        if (report.course_instance_id) {
          const { data: courseInstanceData } = await supabase
            .from('course_instances')
            .select(`
              price_for_instructor,
              students (id),
              educational_institutions (
                name
              )
            `)
            .eq('id', report.course_instance_id)
            .single();
          
          if (courseInstanceData) {
            totalStudents = courseInstanceData.students?.length || 0;
            hourlyRate = courseInstanceData.price_for_instructor || instructor.hourly_rate || 0;
            institutionName = courseInstanceData.educational_institutions?.name || 'לא זמין';
          }
        } else if (report.lesson_schedule_id) {
          const { data: scheduleData } = await supabase
            .from('lesson_schedules')
            .select(`
              course_instances (
                price_for_instructor,
                students (id),
                educational_institutions (
                  name
                )
              )
            `)
            .eq('id', report.lesson_schedule_id)
            .single();
          
          if (scheduleData?.course_instances) {
            totalStudents = scheduleData.course_instances.students?.length || 0;
            hourlyRate = scheduleData.course_instances.price_for_instructor || instructor.hourly_rate || 0;
            institutionName = scheduleData.course_instances.educational_institutions?.name || 'לא זמין';
          }
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
          institution_name: institutionName,
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
        instructorReport.total_hours += 1;
        instructorReport.total_salary += hourlyRate;
      }

      return Array.from(instructorMap.values());
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      return [];
    }
  };

  const fetchInstitutionDataForMonth = async (startDate: Date, endDate: Date) => {
    try {
      // Get ALL course instances without institution filtering
      let query = supabase
        .from('course_instances')
        .select(`
          id,
          price_for_customer,
          price_for_instructor,
          educational_institutions!inner (
            id,
            name
          ),
          courses (
            id,
            name
          ),
          instructor:instructor_id (
            id,
            full_name
          ),
          students (
            id,
            full_name
          ),
          lesson_reports!inner (
            id,
            lesson_title,
            participants_count,
            is_lesson_ok,
            created_at,
            lesson_attendance (
              student_id,
              attended,
              students (
                id,
                full_name
              )
            ),
            reported_lesson_instances (
              lesson_number
            )
          )
        `)
        .gte('lesson_reports.created_at', startDate.toISOString())
        .lte('lesson_reports.created_at', endDate.toISOString());

      const { data: courseInstances, error } = await query;
      if (error) throw error;

      // Process institution data
      const institutionMap = new Map<string, InstitutionReport>();

      for (const instance of courseInstances || []) {
        if (!instance.educational_institutions) continue;

        const institutionId = instance.educational_institutions.id;
        const institutionName = instance.educational_institutions.name;

        if (!institutionMap.has(institutionId)) {
          institutionMap.set(institutionId, {
            id: institutionId,
            name: institutionName,
            total_lessons: 0,
            total_revenue: 0,
            total_students: 0,
            courses: []
          });
        }

        const institutionReport = institutionMap.get(institutionId)!;

        // Process lessons with attendance
        const lessonsWithAttendance = (instance.lesson_reports || []).map(report => {
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

          return {
            id: report.id,
            lesson_title: report.lesson_title,
            course_name: instance.courses?.name || 'לא זמין',
            institution_name: institutionName,
            lesson_number: report.reported_lesson_instances?.[0]?.lesson_number || 1,
            participants_count: report.participants_count || 0,
            total_students: instance.students?.length || 0,
            is_lesson_ok: report.is_lesson_ok || false,
            hourly_rate: instance.price_for_customer || 0,
            created_at: report.created_at,
            attendanceData
          };
        });

        if (lessonsWithAttendance.length > 0) {
          const courseDetail: CourseDetail = {
            id: instance.id,
            course_name: instance.courses?.name || 'לא זמין',
            instructor_name: instance.instructor?.full_name || 'לא זמין',
            lesson_count: lessonsWithAttendance.length,
            student_count: instance.students?.length || 0,
            price_per_lesson: instance.price_for_customer || 0,
            lesson_details: lessonsWithAttendance
          };

          institutionReport.courses.push(courseDetail);
          institutionReport.total_lessons += lessonsWithAttendance.length;
          institutionReport.total_revenue += (instance.price_for_customer || 0) * lessonsWithAttendance.length;
          
          // Add unique students
          const uniqueStudents = new Set();
          (instance.students || []).forEach(student => uniqueStudents.add(student.id));
          institutionReport.total_students = Math.max(institutionReport.total_students, uniqueStudents.size);
        }
      }

      return Array.from(institutionMap.values());
    } catch (error) {
      console.error('Error fetching institution data:', error);
      return [];
    }
  };

  const clearFilters = () => {
    setSelectedInstructor('all');
    setSelectedInstitution('all');
    setSelectedMonth('current');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:hidden">
        <MobileNavigation />
      </div>
      
      {/* Header */}
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">סיכום חודשי</h2>
          <p className="text-gray-600">צפייה בדוחות ביצועים וחישוב שכר חודשי</p>
        </div>

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

        {/* Current Month Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">₪{filteredMonthData.totalEarnings.toLocaleString()}</p>
                  <p className="text-gray-600 font-medium">
                    {reportType === 'instructors' ? 'משכורות ' : 'הכנסות '}
                  </p>
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
                  <p className="text-2xl font-bold text-blue-600">{filteredMonthData.totalLessons}</p>
                  <p className="text-gray-600 font-medium">שיעורים החודש</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{filteredMonthData.completionRate.toFixed(1)}%</p>
                  <p className="text-gray-600 font-medium">אחוז השלמה</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{filteredMonthData.totalStudents}</p>
                  <p className="text-gray-600 font-medium">
                    {reportType === 'instructors' ? 'תלמידים פעילים' : 'סה"כ תלמידים'}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                <Label>חודש</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsList.map((month) => (
                      <SelectItem key={month.key} value={month.key}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {reportType === 'instructors' ? (
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
                          {instructor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>מוסד חינוכי</Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המוסדות</SelectItem>
                      {institutionsList.map(institution => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  נקה סינונים
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Reports Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>דוח חודשי מפורט</CardTitle>
            <CardDescription>סיכום פעילות ורווחים לכל החודשים - לחץ על חודש לצפייה מפורטת</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="py-3 px-4 font-medium text-gray-900">חודש</th>
                    <th className="py-3 px-4 font-medium text-gray-900">שיעורים</th>
                    <th className="py-3 px-4 font-medium text-gray-900">שעות</th>
                    <th className="py-3 px-4 font-medium text-gray-900">הושלמו</th>
                    <th className="py-3 px-4 font-medium text-gray-900">לא הושלמו</th>
                    <th className="py-3 px-4 font-medium text-gray-900">הכנסות</th>
                    <th className="py-3 px-4 font-medium text-gray-900">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyReports.map((report, index) => {
                    const monthEarnings = reportType === 'instructors' 
                      ? report.totalEarnings
                      : report.institutionData?.reduce((sum, inst) => sum + inst.total_revenue, 0) || 0;
                    
                    return (
                                              <tr 
                        key={index} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedMonth === report.monthKey ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedMonth(report.monthKey)}
                      >
                        <td className="py-3 px-4 font-medium">{report.month}</td>
                        <td className="py-3 px-4">{report.totalLessons}</td>
                        <td className="py-3 px-4">{report.totalHours.toFixed(1)}</td>
                        <td className="py-3 px-4">
                          <span className="text-green-600 font-medium">{report.completedLessons}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-red-600 font-medium">{report.cancelledLessons}</span>
                        </td>
                        <td className="py-3 px-4 font-bold">₪{monthEarnings.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {report.totalLessons > 0 ? (
                            <Badge variant={report.completionRate > 80 ? "default" : "secondary"}>
                              {report.completionRate.toFixed(0)}% הושלם
                            </Badge>
                          ) : (
                            <Badge variant="outline">אין פעילות</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Selected Month Detailed Data */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט נתונים - {monthsList.find(m => m.key === selectedMonth)?.label}</CardTitle>
            <CardDescription>
              נתונים מפורטים על {reportType === 'instructors' ? 'מדריכים' : 'מוסדות'} בחודש שנבחר
              {(selectedInstructor !== 'all' || selectedInstitution !== 'all') && ' (מסונן)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'instructors' ? (
              <div className="space-y-6">
                {filteredMonthData.detailData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">אין נתוני מדריכים</h3>
                      <p className="text-gray-600">לא נמצאו נתונים עבור החודש והמדריך שנבחרו</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredMonthData.detailData.map((instructor) => (
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
                                <th className="text-right py-3 px-4 font-medium">מוסד</th>
                                <th className="text-right py-3 px-4 font-medium">נוכחות</th>
                                <th className="text-right py-3 px-4 font-medium">שכר לשיעור</th>
                                <th className="text-right py-3 px-4 font-medium">התנהל כשורה</th>
                                <th className="text-right py-3 px-4 font-medium">תאריך</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {instructor.reports.map((report) => (
                                <React.Fragment key={report.id}>
                                  <tr className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-blue-600">
                                      שיעור {report.lesson_number}
                                    </td>
                                    <td className="py-3 px-4 font-medium">{report.lesson_title}</td>
                                    <td className="py-3 px-4">
                                      <Badge variant="outline">{report.course_name}</Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                      <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                        {report.institution_name}
                                      </Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-gray-500" />
                                          <span className="font-medium">
                                            {report.participants_count} מתוך {report.total_students}
                                          </span>
                                        </div>
                                        {report.attendanceData.length > 0 && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleRowExpansion(report.id)}
                                            className="flex items-center gap-1"
                                          >
                                            <span className="text-xs">רשימת נוכחות</span>
                                            {expandedRows.has(report.id) ? 
                                              <ChevronUp className="h-3 w-3" /> : 
                                              <ChevronDown className="h-3 w-3" />
                                            }
                                          </Button>
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
                                  {/* Expandable attendance row */}
                                  {expandedRows.has(report.id) && (
                                    <tr>
                                      <td colSpan={8} className="bg-gray-50 p-4">
                                        <div className="grid grid-cols-2 gap-6">
                                          <div>
                                            <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                                              <CheckCircle className="h-4 w-4 ml-1" />
                                              נוכחים ({report.attendanceData.filter(s => s.attended).length})
                                            </h4>
                                            <div className="space-y-1">
                                              {report.attendanceData.filter(s => s.attended).map(student => (
                                                <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                  <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                                  {student.name}
                                                </div>
                                              ))}
                                              {report.attendanceData.filter(s => s.attended).length === 0 && (
                                                <span className="text-gray-500 text-sm">אין תלמידים נוכחים</span>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                                              <X className="h-4 w-4 ml-1" />
                                              נעדרים ({report.attendanceData.filter(s => !s.attended).length})
                                            </h4>
                                            <div className="space-y-1">
                                              {report.attendanceData.filter(s => !s.attended).map(student => (
                                                <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                  <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                                                  {student.name}
                                                </div>
                                              ))}
                                              {report.attendanceData.filter(s => !s.attended).length === 0 && (
                                                <span className="text-gray-500 text-sm">כל התלמידים נוכחים</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredMonthData.detailData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">אין נתוני מוסדות</h3>
                      <p className="text-gray-600">לא נמצאו נתונים עבור החודש והמוסד שנבחרו</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredMonthData.detailData.map((institution) => (
                    <Card key={institution.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center">
                              <Building2 className="h-5 w-5 ml-2" />
                              {institution.name}
                            </CardTitle>
                            <CardDescription>
                              סה"כ שיעורים: {institution.total_lessons} | 
                              סה"כ תלמידים: {institution.total_students} | 
                              סה"כ הכנסות: ₪{institution.total_revenue.toLocaleString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-lg font-bold">
                            ₪{institution.total_revenue.toLocaleString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        {institution.courses.map((course) => (
                          <div key={course.id} className="border-b border-gray-200 last:border-b-0">
                            <div className="bg-gray-100 px-4 py-3 flex justify-between items-center cursor-pointer"
                                 onClick={() => toggleRowExpansion(course.id)}>
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                                  <p className="text-sm text-gray-600">
                                    מדריך: {course.instructor_name} | 
                                    {course.lesson_count} שיעורים | 
                                    {course.student_count} תלמידים
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  ₪{(course.price_per_lesson * course.lesson_count).toLocaleString()}
                                </Badge>
                                {expandedRows.has(course.id) ? 
                                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                }
                              </div>
                            </div>
                            
                            {expandedRows.has(course.id) && (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-right py-3 px-4 font-medium">שיעור מס'</th>
                                      <th className="text-right py-3 px-4 font-medium">נושא השיעור</th>
                                      <th className="text-right py-3 px-4 font-medium">נוכחות</th>
                                      <th className="text-right py-3 px-4 font-medium">מחיר ללקוח</th>
                                      <th className="text-right py-3 px-4 font-medium">התנהל כשורה</th>
                                      <th className="text-right py-3 px-4 font-medium">תאריך</th>
                                      <th className="text-right py-3 px-4 font-medium">פרטי נוכחות</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {course.lesson_details.map((lesson) => (
                                      <React.Fragment key={lesson.id}>
                                        <tr className="hover:bg-gray-50">
                                          <td className="py-3 px-4 font-medium text-blue-600">
                                            שיעור {lesson.lesson_number}
                                          </td>
                                          <td className="py-3 px-4 font-medium">{lesson.lesson_title}</td>
                                          <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                              <Users className="h-4 w-4 text-gray-500" />
                                              <span className="font-medium">
                                                {lesson.participants_count} מתוך {lesson.total_students}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-4 font-bold text-green-600">
                                            ₪{lesson.hourly_rate.toLocaleString()}
                                          </td>
                                          <td className="py-3 px-4">
                                            {lesson.is_lesson_ok ? (
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
                                            {new Date(lesson.created_at).toLocaleDateString('he-IL')}
                                          </td>
                                          <td className="py-3 px-4">
                                            {lesson.attendanceData.length > 0 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleRowExpansion(lesson.id)}
                                                className="flex items-center gap-1"
                                              >
                                                <span className="text-xs">הצג נוכחות</span>
                                                {expandedRows.has(lesson.id) ? 
                                                  <ChevronUp className="h-3 w-3" /> : 
                                                  <ChevronDown className="h-3 w-3" />
                                                }
                                              </Button>
                                            )}
                                          </td>
                                        </tr>
                                        {/* Attendance details */}
                                        {expandedRows.has(lesson.id) && (
                                          <tr>
                                            <td colSpan={7} className="bg-gray-50 p-4">
                                              <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                  <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                                                    <CheckCircle className="h-4 w-4 ml-1" />
                                                    נוכחים ({lesson.attendanceData.filter(s => s.attended).length})
                                                  </h4>
                                                  <div className="space-y-1">
                                                    {lesson.attendanceData.filter(s => s.attended).map(student => (
                                                      <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                        <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                                        {student.name}
                                                      </div>
                                                    ))}
                                                    {lesson.attendanceData.filter(s => s.attended).length === 0 && (
                                                      <span className="text-gray-500 text-sm">אין תלמידים נוכחים</span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                                                    <X className="h-4 w-4 ml-1" />
                                                    נעדרים ({lesson.attendanceData.filter(s => !s.attended).length})
                                                  </h4>
                                                  <div className="space-y-1">
                                                    {lesson.attendanceData.filter(s => !s.attended).map(student => (
                                                      <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                        <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                                                        {student.name}
                                                      </div>
                                                    ))}
                                                    {lesson.attendanceData.filter(s => !s.attended).length === 0 && (
                                                      <span className="text-gray-500 text-sm">כל התלמידים נוכחים</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;