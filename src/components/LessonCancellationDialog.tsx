import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cancelLesson, rescheduleAfterCancellation } from "@/services/cancellationService";
import { AlertTriangle, Calendar, Clock, BookOpen } from "lucide-react";

interface LessonCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    title: string;
    course_instance_id: string;
    scheduled_start: string;
    scheduled_end: string;
    lesson_number?: number;
    course_instances?: {
      course?: { name: string };
      institution?: { name: string };
      grade_level?: string;
    };
  } | null;
  onCancellationSuccess?: () => void;
}

export const LessonCancellationDialog: React.FC<LessonCancellationDialogProps> = ({
  open,
  onOpenChange,
  lesson,
  onCancellationSuccess,
}) => {
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    if (!lesson) return;

    if (!cancellationReason.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין סיבה לביטול השיעור",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDate = new Date(lesson.scheduled_start).toISOString().split('T')[0];
      
      const result = await cancelLesson({
        courseInstanceId: lesson.course_instance_id,
        lessonId: lesson.id,
        originalDate: scheduledDate,
        cancellationReason: cancellationReason.trim(),
      });

      if (result.success) {
        toast({
          title: "השיעור בוטל בהצלחה",
          description: "השיעורים הבאים יתוזמנו מחדש אוטומטית",
        });

        // Trigger automatic rescheduling
        await rescheduleAfterCancellation(lesson.course_instance_id, scheduledDate);

        // Reset form
        setCancellationReason("");
        onOpenChange(false);
        
        // Notify parent component
        if (onCancellationSuccess) {
          onCancellationSuccess();
        }

        // Trigger a page refresh to show updated schedules
        window.dispatchEvent(new Event('lessonCancelled'));
      } else {
        toast({
          title: "שגיאה בביטול השיעור",
          description: result.message || "אירעה שגיאה לא צפויה",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling lesson:", error);
      toast({
        title: "שגיאה בביטול השיעור",
        description: "אירעה שגיאה לא צפויה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('he-IL'),
      time: date.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  if (!lesson) return null;

  const { date, time } = formatDateTime(lesson.scheduled_start);
  const endTime = new Date(lesson.scheduled_end).toLocaleTimeString('he-IL', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            ביטול שיעור
          </DialogTitle>
          <DialogDescription className="text-right">
            האם אתה בטוח שברצונך לבטל את השיעור? פעולה זו תגרום לתזמון מחדש של כל השיעורים הבאים.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lesson Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="font-semibold">
                {lesson.course_instances?.course?.name} - שיעור מס׳ {lesson.lesson_number || 1}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{time} - {endTime}</span>
              </div>
            </div>

            <div className="text-sm">
              <div><strong>שם השיעור:</strong> {lesson.title}</div>
              {lesson.course_instances?.institution?.name && (
                <div><strong>מוסד:</strong> {lesson.course_instances.institution.name}</div>
              )}
              {lesson.course_instances?.grade_level && (
                <div><strong>כיתה:</strong> {lesson.course_instances.grade_level}</div>
              )}
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason" className="text-right">
              סיבת הביטול *
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="נא לציין את הסיבה לביטול השיעור (טיול, טקס, מחלה וכו')"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[100px] text-right"
              dir="rtl"
            />
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-700">
                <strong>שים לב:</strong> ביטול השיעור יגרום לתזמון מחדש אוטומטי של כל השיעורים הבאים 
                לפי התזמון שהוגדר עבור ההקצאה. השיעורים יידחו למועדים הבאים הפנויים.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !cancellationReason.trim()}
          >
            {isSubmitting ? "מבטל..." : "בטל שיעור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};