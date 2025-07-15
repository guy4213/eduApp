import React, { useEffect, useRef, useState } from 'react';
import { Camera, FileText, CheckCircle, X, Eye, Calendar, User, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MobileNavigation from '@/components/layout/MobileNavigation';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import FeedbackDialog from '@/components/FeedbackDialog';

const LessonReport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [lessonTitle, setLessonTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<any>(null);
  const [lessonTasks, setLessonTasks] = useState<any[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
 const [selectedReport, setSelectedReport] = useState<any | null>(null);
const [dialogOpen, setDialogOpen] = useState(false);
  const isInstructor = user?.user_metadata.role === 'instructor';
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
      // Fetch all reports for admins/managers
      const fetchAllReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('lesson_reports')
          .select(`
            *,
            profiles ( full_name ),
            lessons (
              id,
              course_id,
              courses (
                name
              ),
              lesson_tasks (
                id,
                title,
                description
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Reports fetch error:', error);
          toast({
            title: 'שגיאה',
            description: 'שגיאה בטעינת הדיווחים',
            variant: 'destructive',
          });
        } else {
          setAllReports(data || []);
        }
        setLoading(false);
      };

      fetchAllReports();
    }
  }, [id, isInstructor, toast]);

  const handleToggleTask = (taskId: string) => {
    setCheckedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  console.log("Reports" , allReports);
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleClick = () => fileInputRef.current?.click();

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, lessonReportId: string) => {
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

  const handleSubmit = async () => {
    if (!lessonTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נדרש להזין כותרת שיעור',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('משתמש לא מחובר');

      const { data: reportData, error: reportError } = await supabase
        .from('lesson_reports')
        .insert({
          lesson_title: lessonTitle,
          participants_count: parseInt(participants) || 0,
          notes,
          feedback,
          marketing_consent: marketingConsent,
          instructor_id: user.id,
          completed_task_ids: checkedTasks,
          lesson_id: id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

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

      // Reset
      setLessonTitle('');
      setParticipants('');
      setNotes('');
      setFeedback('');
      setFiles([]);
      setCheckedTasks([]);
      setMarketingConsent(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
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
      <div className="max-w-4xl mx-auto">
{   isInstructor?     
<h1 className="text-3xl font-bold text-gray-900 mb-2">דיווח שיעור - {lesson?.title}</h1>
:
<h1 className="text-3xl font-bold text-gray-900 mb-2">כלל השיעורים שדווחו </h1>


}

       { isInstructor?   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

              <div>
                <Label htmlFor="participants">מספר משתתפים</Label>
                <Input id="participants" type="number" value={participants} onChange={(e) => setParticipants(e.target.value)} />
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

              <div>
                <Label htmlFor="feedback">משוב כללי</Label>
                <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                <CheckCircle className="h-4 w-4 ml-2" />
                {isSubmitting ? 'שומר...' : 'שמור דיווח'}
              </Button>
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
        <div className="space-y-6">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 ml-2" />
                  כל הדיווחים ({allReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">כותרת השיעור</TableHead>
                        <TableHead className="font-semibold">קורס</TableHead>
                        <TableHead className="font-semibold">מדריך</TableHead>
                        <TableHead className="font-semibold">משתתפים</TableHead>
                        <TableHead className="font-semibold">משימות שבוצעו</TableHead>
                        <TableHead className="font-semibold">תאריך</TableHead>
                        <TableHead className="font-semibold">משוב</TableHead>
                        <TableHead className="font-semibold">צפייה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allReports.map((report) => (
                        <TableRow key={report.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium">
                            <div className="font-semibold text-foreground">
                              {report.lesson_title}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {report.lessons?.courses?.name || 'לא זמין'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="h-4 w-4 ml-1 text-muted-foreground" />
                              <span className="font-medium">{report.profiles?.full_name || 'לא זמין'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 ml-1 text-muted-foreground" />
                              <span className="font-medium">{report.participants_count || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {report.lessons?.lesson_tasks && report.lessons.lesson_tasks.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {report.completed_task_ids?.length || 0} מתוך {report.lessons.lesson_tasks.length}
                                  </Badge>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </div>
                              ) : (
                                <div className="flex items-center text-muted-foreground">
                                  <span className="text-xs">אין משימות</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 ml-1 text-muted-foreground" />
                              <span className="text-sm">
                                {new Date(report.created_at).toLocaleDateString('he-IL')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.feedback ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                יש משוב
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                אין משוב
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
                              <Eye className="h-4 w-4 ml-1" />
                              צפה במשוב
                            </Button>


                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>}
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
