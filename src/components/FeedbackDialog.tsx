import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  description?: string;
  is_mandatory:boolean;
}

interface Report {
  lesson_title: string;
  feedback?: string;
  notes?: string;
  lessons?: {
    lesson_tasks: Task[];
  };
  completed_task_ids?: string[];
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ open, onOpenChange, report }) => {
  if (!report) return null;
console.log("report",report);
  const allTasks = report.lessons?.lesson_tasks || [];
  const completedTaskIds = report.completed_task_ids || [];
  console.log("allTasks  ",allTasks)

  const completedTasks = allTasks.filter(task => completedTaskIds.includes(task.id));
const uncompletedTasks = allTasks.filter(task => !completedTaskIds.includes(task.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            משוב לשיעור: {report.lesson_title}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-right text-black font-semibold text-[1.05rem]">
            {report.feedback || report.notes || 'אין משוב זמין'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 text-right space-y-2">
          <h4 className="font-semibold">משימות שבוצעו ({completedTasks.length} מתוך {allTasks.length}):</h4>

          {completedTasks.length > 0 ? (
            <ul className="list-disc pr-4 text-sm leading-6">
              {completedTasks.map(task => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  {task.description ? ` – ${task.description.slice(0, 100)}...` : ''}
                {task.is_mandatory&&  <b className=' mr-6 p-1 border-2 border-green-400 rounded-full bg-green-400'>{'   משימת חובה - '} <span className='text-blue-800'>בוצעה</span></b>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">לא בוצעו משימות.</p>
          )}
        </div>
        <div className="mt-6 text-right space-y-2">
          <h4 className="font-semibold text-red-600">
            משימות שלא בוצעו ({uncompletedTasks.length}):
          </h4>

          {uncompletedTasks.length > 0 ? (
            <ul className="list-disc pr-4 text-sm leading-6 text-red-600">
              {uncompletedTasks.map(task => (
                <li key={task.id}>
                  <strong>{task.title}</strong>
                  {task.description ? ` – ${task.description.slice(0, 100)}...` : ''}
                {task.is_mandatory&&  <b className=' mr-6 p-1 border-2 border-red-400 rounded-full bg-red-400 text-white'>{'   משימת חובה - '} <span className='text-black'> לא בוצעה  </span> </b>}

                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">כל המשימות בוצעו.</p>
          )}
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => window.print()}>
            🖨️ הדפס
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
