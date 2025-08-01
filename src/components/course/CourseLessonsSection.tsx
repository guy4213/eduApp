import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Clock, CheckCircle2, Circle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import LessonEditDialog from './LessonEditDialog';
import TaskEditDialog from './TaskEditDialog';

export interface Task {
  id: string;
  title: string;
  description: string;
  estimated_duration: number;
  is_mandatory: boolean;
  order_index: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lesson_date?: string;
  tasks: Task[];
}

interface CourseLessonsSectionProps {
  lessons: Lesson[];
  onLessonsChange: (lessons: Lesson[]) => void;
  courseStartDate?: string;
  courseEndDate?: string;
}

const CourseLessonsSection = ({ lessons, onLessonsChange, courseStartDate, courseEndDate }: CourseLessonsSectionProps) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [index, setIndex] = useState<any>(0);
  const [newLesson, setNewLesson] = useState({ title: '', description: '', lesson_date: '' });
  const { toast } = useToast();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    estimated_duration: 30,
    is_mandatory: false
  });

  // Edit dialog states
  const [editLessonDialog, setEditLessonDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState(false);
  const [currentEditLesson, setCurrentEditLesson] = useState<Lesson | null>(null);
  const [currentEditTask, setCurrentEditTask] = useState<Task | null>(null);

  const isDateInRange = (date: string) => {
    if (!courseStartDate || !courseEndDate) return true;
    const lessonDate = new Date(date);
    const startDate = new Date(courseStartDate);
    const endDate = new Date(courseEndDate);
    return lessonDate >= startDate && lessonDate <= endDate;
  };

  const addLesson = () => {
    if (!newLesson.title.trim()) return;
    
    if (newLesson.lesson_date && !isDateInRange(newLesson.lesson_date)) {
      toast({
        title: "שגיאה",
        description: "תאריך השיעור חייב להיות בטווח התאריכים של הקורס",
        variant: "destructive",
      });
      return;
    }

    const lesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: newLesson.title,
      description: newLesson.description,
      order_index: lessons.length,
      // lesson_date: newLesson.lesson_date,
      tasks: []
    };

    onLessonsChange([...lessons, lesson]);
    setNewLesson({ title: '', description: '', lesson_date: '' });
    setSelectedLessonId(lesson.id);
  };

  const removeLesson = (lessonId: string) => {
    onLessonsChange(lessons.filter(lesson => lesson.id !== lessonId));
    if (selectedLessonId === lessonId) {
      setSelectedLessonId(null);
    }
  };

  const addTaskToLesson = (lessonId: string) => {
    if (!newTask.title.trim()) return;

    const updatedLessons = lessons.map(lesson => {
      if (lesson.id === lessonId) {
        const task: Task = {
          id: `task-${Date.now()}`,
          title: newTask.title,
          description: newTask.description,
          estimated_duration: newTask.estimated_duration,
          is_mandatory: newTask.is_mandatory,
          order_index: lesson.tasks.length
        };
        return { ...lesson, tasks: [...lesson.tasks, task] };
      }
      return lesson;
    });

    onLessonsChange(updatedLessons);
    setNewTask({ title: '', description: '', estimated_duration: 30, is_mandatory: false });
  };

  const removeTaskFromLesson = (lessonId: string, taskId: string) => {
    const updatedLessons = lessons.map(lesson => {
      if (lesson.id === lessonId) {
        return { ...lesson, tasks: lesson.tasks.filter(task => task.id !== taskId) };
      }
      return lesson;
    });
    onLessonsChange(updatedLessons);
  };

  // Edit functions
  const handleEditLesson = (lesson: Lesson) => {
    setCurrentEditLesson(lesson);
    setEditLessonDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setCurrentEditTask(task);
    setEditTaskDialog(true);
  };

  const handleSaveLesson = (updatedLesson: Lesson) => {
    const updatedLessons = lessons.map(lesson => 
      lesson.id === updatedLesson.id ? updatedLesson : lesson
    );
    onLessonsChange(updatedLessons);
  };

  const handleSaveTask = (updatedTask: Task) => {
    const updatedLessons = lessons.map(lesson => ({
      ...lesson,
      tasks: lesson.tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    }));
    onLessonsChange(updatedLessons);
  };

  const selectedLesson = lessons.find(lesson => lesson.id === selectedLessonId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">שיעורי הקורס</h3>
        
        {/* Add New Lesson */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">הוסף שיעור חדש</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="lesson-title">כותרת השיעור</Label>
              <Input
                id="lesson-title"
                value={newLesson.title}
                onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                placeholder="הכנס כותרת שיעור..."
              />
            </div>
            <div>
              <Label htmlFor="lesson-description">תיאור השיעור</Label>
              <Textarea
                id="lesson-description"
                value={newLesson.description}
                onChange={(e) => setNewLesson(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור השיעור (רשות)..."
                rows={2}
              />
            </div>
          
            <Button onClick={addLesson} disabled={!newLesson.title.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              הוסף שיעור
            </Button>
          </CardContent>
        </Card>

        {/* Lessons List */}
        {lessons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {lessons.map((lesson, index) => (
              <Card 
                key={lesson.id} 
                className={`cursor-pointer transition-colors ${
                  selectedLessonId === lesson.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => {setSelectedLessonId(lesson.id); setIndex(index);}}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">שיעור {index + 1}: {lesson.title}</CardTitle>
                      {lesson.description && (
                        <p className="text-xs text-gray-600 mt-1">{lesson.description}</p>
                      )}
                      {lesson.lesson_date && (
                        <p className="text-xs text-blue-600 mt-1">📅 {format(new Date(lesson.lesson_date), "dd/MM/yyyy")}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLesson(lesson);
                        }}
                        title="ערוך שיעור"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLesson(lesson.id);
                        }}
                        title="מחק שיעור"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="secondary" className="text-xs">
                    {lesson.tasks.length} משימות
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Selected Lesson Tasks */}
        {selectedLesson && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
              משימות עבור:   שיעור מספר {index+1} - {selectedLesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Task */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">הוסף משימה חדשה</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-title">שם המשימה</Label>
                    <Input
                      id="task-title"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="הכנס שם משימה..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-duration">זמן מוערך (דקות)</Label>
                    <Input
                      id="task-duration"
                      type="number"
                      value={newTask.estimated_duration}
                      onChange={(e) => setNewTask(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 30 }))}
                      min="1"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="task-description">תיאור המשימה</Label>
                  <Textarea
                    id="task-description"
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="תיאור המשימה (רשות)..."
                    rows={2}
                  />
                </div>
                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    id="task-mandatory"
                    checked={newTask.is_mandatory}
                    onChange={(e) => setNewTask(prev => ({ ...prev, is_mandatory: e.target.checked }))}
                    className="ml-2"
                  />
                  <Label htmlFor="task-mandatory">משימה חובה</Label>
                </div>
                <Button 
                  onClick={() => addTaskToLesson(selectedLesson.id)} 
                  disabled={!newTask.title.trim()}
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  הוסף משימה
                </Button>
              </div>

              {/* Tasks Table */}
              {selectedLesson.tasks.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-right font-semibold">שם המשימה</TableHead>
                        <TableHead className="text-right font-semibold">תיאור</TableHead>
                        <TableHead className="text-right font-semibold">זמן מוערך</TableHead>
                        <TableHead className="text-right font-semibold">סוג</TableHead>
                        <TableHead className="text-right font-semibold">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedLesson.tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              {task.is_mandatory ? (
                                <CheckCircle2 className="h-4 w-4 text-red-500 mr-2" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400 mr-2" />
                              )}
                              {task.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 max-w-xs truncate">
                            {task.description || 'ללא תיאור'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimated_duration} דק׳
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={task.is_mandatory ? "destructive" : "secondary"}
                              className={task.is_mandatory ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}
                            >
                              {task.is_mandatory ? 'חובה' : 'רשות'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTask(task)}
                                title="ערוך משימה"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTaskFromLesson(selectedLesson.id, task.id)}
                                title="מחק משימה"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>אין משימות עבור השיעור הזה</p>
                  <p className="text-sm">הוסף משימות באמצעות הטופס למעלה</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {lessons.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
            <Plus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>אין שיעורים עדיין</p>
            <p className="text-sm">התחל ליצור את השיעור הראשון</p>
          </div>
        )}
      </div>

      {/* Edit Dialogs */}
      <LessonEditDialog
        open={editLessonDialog}
        onOpenChange={setEditLessonDialog}
        lesson={currentEditLesson}
        onSave={handleSaveLesson}
      />
      
      <TaskEditDialog
        open={editTaskDialog}
        onOpenChange={setEditTaskDialog}
        task={currentEditTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default CourseLessonsSection;