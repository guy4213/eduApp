import React, { useEffect, useRef, useState } from 'react';
import { Camera, FileText, CheckCircle, X, Eye, Calendar, User, Users, CalendarDays, Filter, Plus, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import FeedbackDialog from '@/components/FeedbackDialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const LessonReport = () => {
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [lessonTitle, setLessonTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [feedback, setFeedback] = useState('');
    const [marketingConsent, setMarketingConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Student attendance state
    const [students, setStudents] = useState([]);
    const [newStudentName, setNewStudentName] = useState('');
    const [attendanceList, setAttendanceList] = useState([]);
    const [courseInstanceId, setCourseInstanceId] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());

    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const scheduleId = queryParams.get('scheduleId');
    const courseInstanceIdFromUrl = queryParams.get('courseInstanceId');

    const [lesson, setLesson] = useState(null);
    const [lessonTasks, setLessonTasks] = useState([]);
    const [checkedTasks, setCheckedTasks] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLessonOk, setIsLessonOk] = useState(false);
    const [maxPar, setMaxPar] = useState(null);
    const { user } = useAuth();
    const [selectedReport, setSelectedReport] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const isInstructor = user?.user_metadata.role === 'instructor';
    const isAdmin = user?.user_metadata.role === 'admin';

    // Date filtering state (admin only)
    const [dateFrom, setDateFrom] = useState(undefined);
    const [dateTo, setDateTo] = useState(undefined);
    const [filteredReports, setFilteredReports] = useState([]);

    async function getMaxParticipantsByScheduleId(scheduleId) {
        console.log('Getting max participants for schedule ID:', scheduleId);
        
        // First, try to get from the new course_instance_schedules table
        let { data, error } = await supabase
            .from('course_instance_schedules')
            .select(`course_instances (
                max_participants,
                id
            )`)
            .eq('id', scheduleId)
            .single();

        // If not found in new table, try the legacy lesson_schedules table
        if (error || !data) {
            console.log('Not found in course_instance_schedules, trying lesson_schedules...');
            const legacyResult = await supabase
                .from('lesson_schedules')
                .select(`course_instances (
                    max_participants,
                    id
                )`)
                .eq('id', scheduleId)
                .single();

            if (legacyResult.error) {
                console.error('Error fetching max participants from both tables:', legacyResult.error);
                throw new Error(`לא ניתן למצוא את לוח הזמנים עם מזהה ${scheduleId}. ייתכן שהלוח זמנים נמחק או שאינו קיים.`);
            }
            
            data = legacyResult.data;
        }

        if (!data || !data.course_instances) {
            throw new Error(`לא נמצאו נתוני קורס עבור לוח הזמנים ${scheduleId}`);
        }

        console.log('Found course instance data:', data);
        return {
            maxParticipants: data.course_instances?.max_participants ?? null,
            courseInstanceId: data.course_instances?.id ?? null
        };
    }

    // Fetch existing students for the course instance
    async function fetchStudentsByCourseInstance(courseInstanceId) {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('course_instance_id', courseInstanceId)
            .order('full_name');

        if (error) {
            console.error('Error fetching students:', error);
            return [];
        }

        return data || [];
    }

    useEffect(() => {
        async function fetchMaxParticipants() {
            try {
                // If courseInstanceId is provided directly from URL, use it
                if (courseInstanceIdFromUrl) {
                    console.log('Using courseInstanceId from URL:', courseInstanceIdFromUrl);
                    setCourseInstanceId(courseInstanceIdFromUrl);
                    
                    // Fetch max participants for this course instance
                    const { data, error } = await supabase
                        .from('course_instances')
                        .select('max_participants')
                        .eq('id', courseInstanceIdFromUrl)
                        .single();

                    if (error) {
                        console.error('Error fetching max participants:', error);
                        throw new Error('שגיאה בטעינת נתוני הקורס');
                    }

                    setMaxPar(data?.max_participants ?? null);
                    return;
                }

                // Fallback to old scheduleId logic for backward compatibility
                if (!scheduleId) {
                    console.error('No scheduleId or courseInstanceId provided');
                    toast({
                        title: 'שגיאה',
                        description: 'לא נמצא מזהה לוח זמנים. אנא חזור לדף הקודם ונסה שוב.',
                        variant: 'destructive',
                    });
                    return;
                }

                const result = await getMaxParticipantsByScheduleId(scheduleId);
                setMaxPar(result.maxParticipants);
                setCourseInstanceId(result.courseInstanceId);
            } catch (err) {
                console.error('Error fetching max participants:', err);
                toast({
                    title: 'שגיאה',
                    description: err.message || 'שגיאה בטעינת נתוני הקורס',
                    variant: 'destructive',
                });
            }
        }

        if (courseInstanceIdFromUrl || scheduleId) {
            fetchMaxParticipants();
        }
    }, [courseInstanceIdFromUrl, scheduleId, toast]);

    // Fetch students when course instance ID is available
    useEffect(() => {
        async function loadStudents() {
            if (!courseInstanceId) return;

            try {
                console.log('Loading students for course instance:', courseInstanceId);
                const existingStudents = await fetchStudentsByCourseInstance(courseInstanceId);
                console.log('Existing students loaded:', existingStudents);
                setStudents(existingStudents);

                // Initialize attendance list with existing students
                const initialAttendanceList = existingStudents.map(student => ({
                    id: student.id,
                    name: student.full_name,
                    isPresent: false,
                    isNew: false
                }));
                console.log('Initial attendance list:', initialAttendanceList);
                setAttendanceList(initialAttendanceList);
            } catch (err) {
                console.error('Error loading students:', err);
            }
        }

        loadStudents();
    }, [courseInstanceId]);

    // Add new student to attendance list (UI only)
    const handleAddStudent = () => {
        if (!newStudentName.trim()) {
            toast({
                title: 'שגיאה',
                description: 'נדרש להזין שם תלמיד',
                variant: 'destructive',
            });
            return;
        }

        // Check for duplicate names
        const trimmedName = newStudentName.trim();
        const isDuplicate = attendanceList.some(student => 
            student.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            toast({
                title: 'שגיאה',
                description: 'תלמיד עם שם זה כבר קיים ברשימה',
                variant: 'destructive',
            });
            return;
        }

        const newStudent = {
            id: `temp_${Date.now()}`,
            name: trimmedName,
            isPresent: false,
            isNew: true
        };

        console.log('Adding new student:', newStudent);
        setAttendanceList(prev => {
            const updated = [...prev, newStudent];
            console.log('Updated attendance list:', updated);
            return updated;
        });
        setNewStudentName('');

        // Show success message
        toast({
            title: 'הצלחה',
            description: 'תלמיד נוסף לרשימה. הוא יישמר במסד הנתונים בעת שליחת הדיווח.',
            variant: 'default',
        });
    };

    // Toggle student presence
    const handleTogglePresence = (studentId) => {
        setAttendanceList(prev =>
            prev.map(student =>
                student.id === studentId
                    ? { ...student, isPresent: !student.isPresent }
                    : student
            )
        );
    };

    // Remove student from attendance list (UI only)
    const handleRemoveStudent = (studentId) => {
        setAttendanceList(prev => prev.filter(student => student.id !== studentId));
    };



    // Save new students to database and get their IDs
    async function saveNewStudents() {
        const newStudents = attendanceList.filter(student => student.isNew);
        console.log('New students to save:', newStudents);
        
        if (!courseInstanceId) {
            throw new Error('Course instance ID is not available. Please wait for the page to finish loading and try again.');
        }
        
        const studentsToInsert = newStudents.map(student => ({
            course_instance_id: courseInstanceId,
            full_name: student.name
        }));

        console.log('Students to insert:', studentsToInsert);
        console.log('Course instance ID:', courseInstanceId);

        if (studentsToInsert.length > 0) {
            const { data, error } = await supabase
                .from('students')
                .insert(studentsToInsert)
                .select();

            console.log('Database response:', { data, error });

            if (error) {
                console.error('Error saving students:', error);
                throw new Error(`שגיאה בשמירת תלמידים חדשים: ${error.message}`);
            }

            // Update attendance list with real IDs
            const updatedAttendanceList = attendanceList.map(student => {
                if (student.isNew) {
                    const savedStudent = data.find(s => s.full_name === student.name);
                    if (savedStudent) {
                        return { ...student, id: savedStudent.id, isNew: false };
                    }
                }
                return student;
            });

            console.log('Updated attendance list:', updatedAttendanceList);
            setAttendanceList(updatedAttendanceList);
            return updatedAttendanceList;
        }

        return attendanceList;
    }

    // שמירת נוכחות בטבלת lesson_attendance
    async function saveStudentAttendance(lessonReportId, attendanceList) {
        const attendanceRecords = attendanceList
            .filter(student => !student.isNew) // רק סטודנטים קיימים (עם ID אמיתי)
            .map(student => ({
                lesson_report_id: lessonReportId,
                student_id: student.id,
                attended: student.isPresent
            }));

        if (attendanceRecords.length > 0) {
            const { error } = await supabase
                .from('lesson_attendance')
                .insert(attendanceRecords);

            if (error) {
                throw new Error(`שגיאה בשמירת נוכחות: ${error.message}`);
            }
        }
    }

    // Toggle row expansion for attendance details
    const toggleRowExpansion = (reportId) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reportId)) {
                newSet.delete(reportId);
            } else {
                newSet.add(reportId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        if (isInstructor && !id) return;

        if (isInstructor) {
            // Fetch lesson data for instructors
            const fetchLessonData = async () => {
                const [lessonRes, tasksRes] = await Promise.all([
                    supabase.from('lessons').select('*').eq('id', id).single(),
                    supabase.from('lesson_tasks').select('*').eq('lesson_id', id),
                ]);

                if (lessonRes.error) {
                    console.error('Lesson fetch error:', lessonRes.error);
                } else {
                    setLesson(lessonRes.data);
                }

                if (tasksRes.error) {
                    console.error('Tasks fetch error:', tasksRes.error);
                } else {
                    setLessonTasks(tasksRes.data || []);
                }
            };

            fetchLessonData();
        } else {
            // Fetch all reports for admins/managers with enhanced data
            const fetchAllReports = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('lesson_reports')
                    .select(`*,
                     reported_lesson_instances( lesson_number ),

                        instructor:instructor_id (
                            id,
                            full_name
                        ),
                        profiles (
                            full_name
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
                            course_id,
                            lesson_tasks (
                                id,
                                title,
                                description,
                                is_mandatory
                            ),
                            courses:course_id (
                                name
                            )
                        )`)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Reports fetch error:', error);
                    toast({
                        title: 'שגיאה',
                        description: 'שגיאה בטעינת הדיווחים',
                        variant: 'destructive',
                    });
                } else {
                    // Process reports to include attendance data from lesson_attendance table
                    const processedReports = await Promise.all(data.map(async (report) => {
                        // Get course instance data from either lesson_schedule_id or course_instance_id
                        let courseInstanceData = null;
                        
                        if (report.course_instance_id) {
                            // New architecture: direct course instance reference
                            const { data: courseInstance } = await supabase
                                .from('course_instances')
                                .select(`id,
                                    students (
                                        id,
                                        full_name
                                    )`)
                                .eq('id', report.course_instance_id)
                                .single();
                            
                            courseInstanceData = { course_instances: courseInstance };
                        } else if (report.lesson_schedule_id) {
                            // Legacy architecture: get from lesson_schedule_id
                            // Try to get from new course_instance_schedules first
                            let { data: scheduleData } = await supabase
                                .from('course_instance_schedules')
                                .select(`course_instances (
                                    id,
                                    students (
                                        id,
                                        full_name
                                    )
                                )`)
                                .eq('id', report.lesson_schedule_id)
                                .single();

                            // If not found, try legacy lesson_schedules
                            if (!scheduleData) {
                                const { data: legacyData } = await supabase
                                    .from('lesson_schedules')
                                    .select(`course_instances (
                                        id,
                                        students (
                                            id,
                                            full_name
                                        )
                                    )`)
                                    .eq('id', report.lesson_schedule_id)
                                    .single();
                                scheduleData = legacyData;
                            }
                            
                            courseInstanceData = scheduleData;
                        }

                        const allStudents = courseInstanceData?.course_instances?.students || [];
                        const attendanceRecords = report.lesson_attendance || [];
                        
                        // יצירת נתוני נוכחות מהטבלה החדשה
                        const attendanceData = allStudents.map(student => {
                            const attendanceRecord = attendanceRecords.find(
                                record => record.student_id === student.id
                            );
                            return {
                                id: student.id,
                                name: student.full_name,
                                attended: attendanceRecord ? attendanceRecord.attended : false
                            };
                        });

                        return {
                            ...report,
                            totalStudents: allStudents.length,
                            attendanceData: attendanceData,
                            // חישוב מספר הנוכחים מתוך טבלת הנוכחות
                            participants_count: attendanceRecords.filter(r => r.attended).length
                        };
                    }));

                    setAllReports(processedReports || []);
                    setFilteredReports(processedReports || []);
                }
                setLoading(false);
            };

            fetchAllReports();
        }
    }, [id, isInstructor, toast]);

    // Date filtering effect (admin only)
    useEffect(() => {
        if (!isAdmin || !allReports.length) return;

        let filtered = [...allReports];

        if (dateFrom) {
            filtered = filtered.filter(report =>
                new Date(report.created_at) >= dateFrom
            );
        }

        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            filtered = filtered.filter(report =>
                new Date(report.created_at) <= endOfDay
            );
        }

        setFilteredReports(filtered);
    }, [dateFrom, dateTo, allReports, isAdmin]);

    const clearDateFilters = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    const handleToggleTask = (taskId) => {
        setCheckedTasks((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files || []);
        setFiles((prev) => [...prev, ...selectedFiles]);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleClick = () => fileInputRef.current?.click();

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const uploadFile = async (file, lessonReportId) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `lesson-reports/${lessonReportId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('lesson-files')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('lesson_files').insert({
            lesson_report_id: lessonReportId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: file.type,
            is_for_marketing: marketingConsent,
        });

        if (dbError) throw dbError;

        return true;
    };

    // const handleSubmit = async () => {
    //     // Count present students
    //     const presentStudents = attendanceList.filter(student => student.isPresent).length;
    //     const participantsCount = presentStudents;

    //     if (participantsCount > maxPar || participantsCount === 0) {
    //         toast({
    //             title: 'שגיאה',
    //             description: `נדרש לבחור לפחות תלמיד אחד ועד ${maxPar} משתתפים`,
    //             variant: 'destructive',
    //         });
    //         return;
    //     }

    //     if (!lessonTitle.trim()) {
    //         toast({
    //             title: 'שגיאה',
    //             description: 'נדרש להזין כותרת שיעור',
    //             variant: 'destructive',
    //         });
    //         return;
    //     }

    //     if (!isLessonOk && !feedback.trim()) {
    //         toast({
    //             title: 'שגיאה',
    //             description: 'בבקשה הזן משוב במידה והשיעור לא התנהל כשורה',
    //             variant: 'destructive',
    //         });
    //         return;
    //     }

    //     setIsSubmitting(true);

    //     try {
    //         const { data: { user }, error: userError } = await supabase.auth.getUser();
    //         if (userError || !user) throw new Error('משתמש לא מחובר');

    //         console.log('Starting form submission...');
    //         console.log('Current attendance list:', attendanceList);

    //         // שמירת סטודנטים חדשים קודם
    //         let updatedAttendanceList;
    //         try {
    //             updatedAttendanceList = await saveNewStudents();
    //             console.log('Students saved successfully:', updatedAttendanceList);
    //         } catch (studentError) {
    //             console.error('Failed to save students:', studentError);
    //             toast({
    //                 title: 'שגיאה',
    //                 description: studentError.message || 'שגיאה בשמירת תלמידים חדשים',
    //                 variant: 'destructive',
    //             });
    //             return;
    //         }

    //         // Handle lesson_schedule_id and course_instance_id for new architecture
    //         let lessonScheduleId = scheduleId;
    //         let courseInstanceIdForReport = null;
            
    //         // If we're using the new architecture (courseInstanceIdFromUrl), use course_instance_id field
    //         if (courseInstanceIdFromUrl && !scheduleId) {
    //             console.log('Using new architecture with course_instance_id:', courseInstanceIdFromUrl);
    //             courseInstanceIdForReport = courseInstanceIdFromUrl;
    //             lessonScheduleId = null; // Don't use lesson_schedule_id for new architecture
    //         } else if (scheduleId) {
    //             console.log('Using legacy architecture with lesson_schedule_id:', scheduleId);
    //             lessonScheduleId = scheduleId;
    //         } else {
    //             throw new Error('לא ניתן ליצור דיווח ללא מזהה לוח זמנים תקין');
    //         }

    //         // יצירת דיווח השיעור (ללא attended_student_ids)
    //         const reportDataToInsert = {
    //             lesson_title: lessonTitle,
    //             participants_count: participantsCount,
    //             notes,
    //             feedback,
    //             marketing_consent: marketingConsent,
    //             instructor_id: user.id,
    //             is_lesson_ok: isLessonOk,
    //             completed_task_ids: checkedTasks,
    //             lesson_id: id,
    //             // הסרנו את attended_student_ids מכאן
    //         };

    //         // Add the appropriate schedule reference based on architecture
    //         if (courseInstanceIdForReport) {
    //             reportDataToInsert.course_instance_id = courseInstanceIdForReport;
    //         } else if (lessonScheduleId) {
    //             reportDataToInsert.lesson_schedule_id = lessonScheduleId;
    //         }

    //         const { data: reportData, error: reportError } = await supabase
    //             .from('lesson_reports')
    //             .insert(reportDataToInsert)
    //             .select()
    //             .single();

    //         if (reportError) throw reportError;

    //         console.log('Lesson report created:', reportData);

    //         // Create a record in reported_lesson_instances to track this specific lesson instance
    //         const reportedInstanceData:any = {
    //             lesson_report_id: reportData.id,
    //             lesson_id: id,
    //             scheduled_date: new Date().toISOString().split('T')[0], // Today's date as default
    //         };

    //         // Add the appropriate schedule reference
    //         if (courseInstanceIdForReport) {
    //             reportedInstanceData.course_instance_id = courseInstanceIdForReport;
                
    //             // Get the lesson's order_index from the database
    //             try {
    //                 const { data: lessonData, error: lessonError } = await supabase
    //                     .from('lessons')
    //                     .select('order_index')
    //                     .eq('id', id)
    //                     .single();

    //                 if (lessonError) {
    //                     console.error('Error fetching lesson order_index:', lessonError);
    //                     reportedInstanceData.lesson_number = 1; // Fallback
    //                 } else {
    //                     reportedInstanceData.lesson_number = lessonData.order_index+1;
    //                     console.log('Using lesson order_index:', lessonData.order_index+1);
    //                 }
    //             } catch (error) {
    //                 console.error('Error getting lesson order_index:', error);
    //                 reportedInstanceData.lesson_number = 1; // Fallback
    //             }
    //         } else if (lessonScheduleId) {
    //             reportedInstanceData.lesson_schedule_id = lessonScheduleId;
    //         }

    //         const { error: trackingError } = await supabase
    //             .from('reported_lesson_instances')
    //             .insert(reportedInstanceData);

    //         if (trackingError) {
    //             console.error('Error creating reported lesson instance record:', trackingError);
    //             // Don't throw error here as the main report was created successfully
    //         } else {
    //             console.log('Reported lesson instance record created');
    //         }

    //         // שמירת נתוני נוכחות בטבלה נפרדת
    //         try {
    //             await saveStudentAttendance(reportData.id, updatedAttendanceList);
    //             console.log('Attendance saved successfully');
    //         } catch (attendanceError) {
    //             console.error('Failed to save attendance:', attendanceError);
    //             toast({
    //                 title: 'אזהרה',
    //                 description: 'הדיווח נשמר אך הייתה שגיאה בשמירת הנוכחות',
    //                 variant: 'destructive',
    //             });
    //         }

    //         if (files.length > 0) {
    //             const uploadResults = await Promise.all(
    //                 files.map((file) => uploadFile(file, reportData.id))
    //             );
    //             const failed = uploadResults.filter((r) => !r).length;
    //             if (failed > 0) {
    //                 toast({
    //                     title: 'אזהרה',
    //                     description: `${failed} קבצים לא הועלו בהצלחה`,
    //                     variant: 'destructive',
    //                 });
    //             }
    //         }

    //         toast({ title: 'הצלחה!', description: 'דיווח השיעור נשמר בהצלחה' });

    //         // Reset form
    //         setLessonTitle('');
    //         setNotes('');
    //         setFeedback('');
    //         setFiles([]);
    //         setCheckedTasks([]);
    //         setMarketingConsent(false);
    //         // Reset attendance but keep existing students
    //         setAttendanceList(prev => prev.map(student => ({ ...student, isPresent: false, isNew: false })));
    //         if (fileInputRef.current) fileInputRef.current.value = '';

    //     } catch (err) {
    //         toast({
    //             title: 'שגיאה',
    //             description: err.message || 'אירעה שגיאה בשמירת הדיווח',
    //             variant: 'destructive',
    //         });
    //     } finally {
    //         setIsSubmitting(false);
    //     }
    // };
const handleSubmit = async () => {
        // Count present students
        const presentStudents = attendanceList.filter(student => student.isPresent).length;
        const participantsCount = presentStudents;

        if (participantsCount > maxPar || participantsCount === 0) {
            toast({
                title: 'שגיאה',
                description: `נדרש לבחור לפחות תלמיד אחד ועד ${maxPar} משתתפים`,
                variant: 'destructive',
            });
            return;
        }

        if (!lessonTitle.trim()) {
            toast({
                title: 'שגיאה',
                description: 'נדרש להזין כותרת שיעור',
                variant: 'destructive',
            });
            return;
        }

        if (!isLessonOk && !feedback.trim()) {
            toast({
                title: 'שגיאה',
                description: 'בבקשה הזן משוב במידה והשיעור לא התנהל כשורה',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error('משתמש לא מחובר');

            console.log('Starting form submission...');
            console.log('Current attendance list:', attendanceList);

            // שמירת סטודנטים חדשים קודם
            let updatedAttendanceList;
            try {
                updatedAttendanceList = await saveNewStudents();
                console.log('Students saved successfully:', updatedAttendanceList);
            } catch (studentError) {
                console.error('Failed to save students:', studentError);
                toast({
                    title: 'שגיאה',
                    description: studentError.message || 'שגיאה בשמירת תלמידים חדשים',
                    variant: 'destructive',
                });
                setIsSubmitting(false); // Stop submission on critical error
                return;
            }

            // Handle lesson_schedule_id and course_instance_id for new architecture
            let lessonScheduleId = scheduleId;
            let courseInstanceIdForReport = null;
            
            if (courseInstanceIdFromUrl && !scheduleId) {
                console.log('Using new architecture with course_instance_id:', courseInstanceIdFromUrl);
                courseInstanceIdForReport = courseInstanceIdFromUrl;
                lessonScheduleId = null; 
            } else if (scheduleId) {
                console.log('Using legacy architecture with lesson_schedule_id:', scheduleId);
                lessonScheduleId = scheduleId;
            } else {
                throw new Error('לא ניתן ליצור דיווח ללא מזהה לוח זמנים תקין');
            }

            // יצירת דיווח השיעור
            const reportDataToInsert = {
                lesson_title: lessonTitle,
                participants_count: participantsCount,
                notes,
                feedback,
                marketing_consent: marketingConsent,
                instructor_id: user.id,
                is_lesson_ok: isLessonOk,
                completed_task_ids: checkedTasks,
                lesson_id: id,
            };

            if (courseInstanceIdForReport) {
                reportDataToInsert.course_instance_id = courseInstanceIdForReport;
            } else if (lessonScheduleId) {
                reportDataToInsert.lesson_schedule_id = lessonScheduleId;
            }

            const { data: reportData, error: reportError } = await supabase
                .from('lesson_reports')
                .insert(reportDataToInsert)
                .select()
                .single();

            if (reportError) throw reportError;

            console.log('Lesson report created:', reportData);

            // Create a record in reported_lesson_instances
            const reportedInstanceData = {
                lesson_report_id: reportData.id,
                lesson_id: id,
                scheduled_date: new Date().toISOString().split('T')[0],
                lesson_number: 1, // Default value
            };
            
            if (courseInstanceIdForReport) {
                reportedInstanceData.course_instance_id = courseInstanceIdForReport;
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lessons')
                    .select('order_index')
                    .eq('id', id)
                    .single();
                if (lessonError) {
                    console.error('Error fetching lesson order_index:', lessonError);
                } else {
                    reportedInstanceData.lesson_number = lessonData.order_index + 1;
                }
            } else if (lessonScheduleId) {
                reportedInstanceData.lesson_schedule_id = lessonScheduleId;
            }

            const { error: trackingError } = await supabase
                .from('reported_lesson_instances')
                .insert(reportedInstanceData);

            if (trackingError) {
                console.error('Error creating reported lesson instance record:', trackingError);
            } else {
                console.log('Reported lesson instance record created');
            }

            // שמירת נתוני נוכחות
            try {
                await saveStudentAttendance(reportData.id, updatedAttendanceList);
                console.log('Attendance saved successfully');
            } catch (attendanceError) {
                console.error('Failed to save attendance:', attendanceError);
                toast({
                    title: 'אזהרה',
                    description: 'הדיווח נשמר אך הייתה שגיאה בשמירת הנוכחות',
                    variant: 'destructive',
                });
            }

            // --- START: NEW EMAIL SENDING LOGIC ---
      
            // If the lesson was not OK, call our secure Edge Function
            if (!isLessonOk && feedback.trim()) {
                console.log('Lesson not OK, invoking Edge Function to notify admins...');
                
                // 1. Get course name (you still need this on the client)
                let courseName = 'לא ידוע';
                if (lesson?.course_id) {
                    const { data: courseData } = await supabase
                        .from('courses')
                        .select('name')
                        .eq('id', lesson.course_id)
                        .single();
                    if (courseData) courseName = courseData.name;
                }

                // 2. Prepare the payload for the function
                const feedbackPayload = {
                    courseName: courseName,
                    lessonTitle: lessonTitle,
                    lessonNumber: reportedInstanceData.lesson_number, // from your existing code
                    participantsCount: participantsCount,
                    notes: notes,
                    feedback: feedback,
                    marketingConsent: marketingConsent,
                    instructorName: user?.user_metadata?.full_name || 'מדריך לא ידוע',
                };
                
                // 3. Invoke the Edge Function
                const { error: functionError } = await supabase.functions.invoke(
                    'notify-admins-on-feedback', 
                    { body: feedbackPayload }
                );
                
                if (functionError) {
                    // This is a non-critical error, so just warn the user
                    console.error('Error invoking notify-admins function:', functionError);
                    toast({
                        title: 'אזהרה',
                        description: 'הדיווח נשמר, אך שליחת ההתראה למנהל נכשלה.',
                        variant: 'destructive',
                    });
                } else {
                    console.log('Admin notification function invoked successfully.');
                }
            }
            // --- END: MODIFIED EMAIL LOGIC ---

           


            if (files.length > 0) {
                const uploadResults = await Promise.all(
                    files.map((file) => uploadFile(file, reportData.id))
                );
                const failed = uploadResults.filter((r) => !r).length;
                if (failed > 0) {
                    toast({
                        title: 'אזהרה',
                        description: `${failed} קבצים לא הועלו בהצלחה`,
                        variant: 'destructive',
                    });
                }
            }

            toast({ title: 'הצלחה!', description: 'דיווח השיעור נשמר בהצלחה' });

            // Reset form
            setLessonTitle('');
            setNotes('');
            setFeedback('');
            setFiles([]);
            setCheckedTasks([]);
            setMarketingConsent(false);
            setAttendanceList(prev => prev.map(student => ({ ...student, isPresent: false, isNew: false })));
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (err) {
            toast({
                title: 'שגיאה',
                description: err.message || 'אירעה שגיאה בשמירת הדיווח',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="md:hidden"><MobileNavigation /></div>
            <div className="max-w-7xl mx-auto ">
                {isInstructor ?
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        דיווח שיעור - {lesson?.title}
                        {!scheduleId && !courseInstanceIdFromUrl && (
                            <Badge variant="destructive" className="mr-2 text-xs">
                                שגיאה: לא נמצא לוח זמנים
                            </Badge>
                        )}
                    </h1>
                    :
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">כלל השיעורים שדווחו </h1>
                }

                {isInstructor ? <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Report Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><FileText className="h-5 w-5 ml-2" />טופס דיווח</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="lesson-title">נושא השיעור *</Label>
                                <Input id="lesson-title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} required />
                            </div>

                            {/* Student Attendance List */}
                            <div>
                                <Label className="flex items-center">
                                    <UserCheck className="h-4 w-4 ml-2" />
                                    רשימת נוכחות תלמידים
                                    {!courseInstanceId && (
                                        <Badge variant="outline" className="mr-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                            טוען...
                                        </Badge>
                                    )}
                                </Label>

                                {/* Add new student */}
                                <div className="flex gap-2 mb-4">
                                    <Input
                                        placeholder="הזן שם תלמיד חדש"
                                        value={newStudentName}
                                        onChange={(e) => setNewStudentName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                                        className="flex-1"
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={handleAddStudent} 
                                        variant="outline"
                                    >
                                        <Plus className="h-4 w-4" />
                                        הוסף
                                    </Button>
                                </div>
                                {!courseInstanceId && (
                                    <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded mb-2">
                                        ⚠️ אזהרה: נתוני קורס עדיין נטענים. תלמידים חדשים יישמרו ברגע שהנתונים יטענו.
                                    </div>
                                )}

                                {/* Attendance list */}
                                <div className="max-h-64 overflow-y-auto border rounded-lg bg-white">
                                    {attendanceList.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            {!courseInstanceId ? 'טוען נתוני קורס...' : 'אין תלמידים ברשימה. הוסף תלמידים חדשים למעלה.'}
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {attendanceList.map((student) => (
                                                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={student.isPresent}
                                                            onChange={() => handleTogglePresence(student.id)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className={`font-medium ${student.isPresent ? 'text-green-700' : 'text-gray-700'}`}>
                                                            {student.name}
                                                        </span>
                                                        {student.isNew && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                חדש
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveStudent(student.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Present students counter */}
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                                    נוכחים: <span className="font-bold text-green-600">{attendanceList.filter(s => s.isPresent).length}</span> מתוך {attendanceList.length} תלמידים
                                    {maxPar && (
                                        <span className="mr-2">
                                            (מקסימום: {maxPar})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <Label>משימות</Label>
                                {lessonTasks.map((task) => (
                                    <div key={task.id} className="flex items-center gap-2 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={checkedTasks.includes(task.id)}
                                            onChange={() => handleToggleTask(task.id)}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm">{task.title}</label>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center ">
                                <input
                                    type="checkbox"
                                    checked={isLessonOk}
                                    onChange={() => setIsLessonOk(!isLessonOk)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm pr-1">האם השיעור התנהל כשורה </label>
                            </div>

                            <div>
                                <Label htmlFor="notes">הערות נוספות</Label>
                                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                            </div>

                            <div>
                                <Label htmlFor="feedback">משוב כללי</Label>
                                <Textarea id="feedback" value={feedback} required={!isLessonOk} onChange={(e) => setFeedback(e.target.value)} rows={3} />
                            </div>

                            <Button 
                                className="w-full" 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                            >
                                <CheckCircle className="h-4 w-4 ml-2" />
                                {isSubmitting ? 'שומר...' : 'שמור דיווח'}
                            </Button>
                            {(!scheduleId && !courseInstanceIdFromUrl) && !courseInstanceId && (
                                <p className="text-sm text-yellow-600 text-center mt-2">
                                    ⚠️ אזהרה: נתוני קורס עדיין נטענים. הדיווח יישמר ברגע שהנתונים יטענו.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* File Upload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Camera className="h-5 w-5 ml-2" />העלאת קבצים</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                                onClick={handleClick}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">גרור קבצים לכאן או לחץ להעלאה</p>
                                <Button variant="outline" type="button">בחר קבצים</Button>
                                <input
                                    type="file"
                                    multiple
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                />
                            </div>

                            {files.length > 0 && (
                                <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                                    <h4 className="text-sm font-semibold text-right">קבצים שנבחרו:</h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        {files.map((file, index) => (
                                            <li key={index} className="flex justify-between items-center">
                                                <span className="truncate">{file.name}</span>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)} type="button">
                                                    <X className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Label className="flex items-center justify-end">
                                <input
                                    type="checkbox"
                                    className="ml-2"
                                    checked={marketingConsent}
                                    onChange={(e) => setMarketingConsent(e.target.checked)}
                                />
                                אישור להשתמש בתמונות לצרכי שיווק
                            </Label>
                        </CardContent>
                    </Card>
                </div>
                    :
                    <div className="space-y-6 ">
                        {/* Date Filter for Admins */}
                        {isAdmin && (
                            <Card className="border-primary/20 shadow-md">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center text-primary">
                                        <Filter className="h-5 w-5 ml-2" />
                                        סינון לפי תאריך יצירה
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="flex-1">
                                            <Label htmlFor="date-from">מתאריך</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarDays className="ml-2 h-4 w-4" />
                                                        {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך התחלה'}
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

                                        <div className="flex-1">
                                            <Label htmlFor="date-to">עד תאריך</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarDays className="ml-2 h-4 w-4" />
                                                        {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: he }) : 'בחר תאריך סיום'}
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

                                        <Button
                                            variant="outline"
                                            onClick={clearDateFilters}
                                            className="px-6"
                                        >
                                            נקה סינון
                                        </Button>
                                    </div>

                                    {(dateFrom || dateTo) && (
                                        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                                            <p className="text-sm text-primary font-medium">
                                                מציג {filteredReports.length} דיווחים מתוך {allReports.length}
                                                {dateFrom && ` מתאריך ${format(dateFrom, 'dd/MM/yyyy', { locale: he })}`}
                                                {dateTo && ` עד תאריך ${format(dateTo, 'dd/MM/yyyy', { locale: he })}`}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">טוען דיווחים...</p>
                            </div>
                        ) : allReports.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">אין דיווחים זמינים</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border/50 shadow-lg">
                                <CardHeader className="border-b border-border/50 bg-muted/10">
                                    <CardTitle className="flex items-center text-primary">
                                        <FileText className="h-5 w-5 ml-2" />
                                        כל הדיווחים ({isAdmin ? filteredReports.length : allReports.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-primary/5 border-b-2 border-primary/20 hover:bg-primary/10">
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right"> שיעור מס'</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">כותרת השיעור</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">קורס</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">מדריך</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">נוכחות</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">רשימת תלמידים</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">משימות שבוצעו</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">תאריך</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">משוב</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">התנהל כשורה</TableHead>
                                                    <TableHead className="font-bold text-primary py-4 px-6 text-right">צפייה</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(isAdmin ? filteredReports : allReports).map((report, index) => (
                                                    <React.Fragment key={report.id}>
                                                        <TableRow
                                                            className={`hover:bg-primary/5 transition-all duration-200 border-b border-border/30
                                                            ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                                                            `}
                                                        >
                                                                                                                        <TableCell className="font-medium py-4 px-6">
                                                                    <div className="font-bold text-foreground text-base">
                                                                        {report.reported_lesson_instances?.[0]?.lesson_number || 'N/A'}
                                                                    </div>
                                                                </TableCell>
                                                                                                                            <TableCell className="font-medium py-4 px-6">
                                                                <div className="font-bold text-foreground text-base">
                                                                    {report.lesson_title}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 ml-4">
                                                                <Badge variant="outline" className="font-medium border-primary/30 text-primary bg-primary/5 hover:bg-primary/10">
                                                                    {report.lessons?.courses?.name || 'לא זמין'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-primary/10 rounded-full">
                                                                        <User className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    <span className="font-medium text-foreground">{report.instructor?.full_name || 'לא זמין'}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-accent/20 rounded-full">
                                                                        <Users className="h-4 w-4 text-accent-foreground" />
                                                                    </div>
                                                                    <span className="font-bold text-lg">
                                                                        {report.participants_count || 0}
                                                                        <span className="text-sm font-normal text-muted-foreground">
                                                                            {' '}מתוך {report.totalStudents || 0}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 px-6">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleRowExpansion(report.id)}
                                                                    className="flex items-center gap-1 hover:bg-primary/10"
                                                                >
                                                                    <Users className="h-4 w-4" />
                                                                    <span>הצג רשימה</span>
                                                                    {expandedRows.has(report.id) ? 
                                                                        <ChevronUp className="h-3 w-3" /> : 
                                                                        <ChevronDown className="h-3 w-3" />
                                                                    }
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="py-4 px-6">
                                                                <div className="space-y-1">
                                                                    {report.lessons?.lesson_tasks && report.lessons.lesson_tasks.length > 0 ? (
                                                                        <div className="flex items-center gap-3">
                                                                            <Badge variant="secondary" className="text-sm font-medium bg-secondary/80 text-secondary-foreground px-3 py-1">
                                                                                {report.completed_task_ids?.length || 0} מתוך {report.lessons.lesson_tasks.length}
                                                                            </Badge>
                                                                            <div className="p-1 bg-emerald-100 rounded-full">
                                                                                <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center text-muted-foreground">
                                                                            <span className="text-sm font-medium">אין משימות</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 px-6">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-muted rounded-full">
                                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-foreground">
                                                                        {new Date(report.created_at).toLocaleDateString('he-IL')}
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 px-6">
                                                                {report.feedback ? (
                                                                    <Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-medium">
                                                                        יש משוב
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-muted-foreground">
                                                                        אין משוב
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className='px-12'>
                                                                {report.is_lesson_ok ? (
                                                                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                                                        כן
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-muted-foreground bg-red-100 hover:bg-red-200">
                                                                        לא
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                                                    onClick={() => {
                                                                        setSelectedReport(report);
                                                                        setDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Eye className="h-3 w-3 " />
                                                                    צפה במשוב
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        {/* Expandable row for attendance details */}
                                                        {expandedRows.has(report.id) && (
                                                            <TableRow>
                                                                <TableCell colSpan={10} className="bg-gray-50 p-4">
                                                                    <div className="grid grid-cols-2 gap-6">
                                                                        <div>
                                                                            <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                                                                                <CheckCircle className="h-4 w-4 ml-1" />
                                                                                נוכחים ({report.attendanceData?.filter(s => s.attended).length || 0})
                                                                            </h4>
                                                                            <div className="space-y-1">
                                                                                {report.attendanceData?.filter(s => s.attended).map(student => (
                                                                                    <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                                                        <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                                                                        {student.name}
                                                                                    </div>
                                                                                )) || <span className="text-gray-500">אין נתונים</span>}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                                                                                <X className="h-4 w-4 ml-1" />
                                                                                נעדרים ({report.attendanceData?.filter(s => !s.attended).length || 0})
                                                                            </h4>
                                                                            <div className="space-y-1">
                                                                                {report.attendanceData?.filter(s => !s.attended).map(student => (
                                                                                    <div key={student.id} className="text-sm text-gray-700 flex items-center">
                                                                                        <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                                                                                        {student.name}
                                                                                    </div>
                                                                                )) || <span className="text-gray-500">אין נתונים</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                }
            </div>
            <FeedbackDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                report={selectedReport}
            />
        </div>
    );
};

export default LessonReport;