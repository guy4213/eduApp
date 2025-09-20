import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssignmentDetail {
  id: string;
  educational_institutions: { name: string } | null;
  profiles: { full_name: string } | null;
}

interface DeleteCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  assignments: AssignmentDetail[];
  onConfirmDelete: () => void;
}

const DeleteCourseDialog: React.FC<DeleteCourseDialogProps> = ({
  open,
  onOpenChange,
  courseName,
  assignments,
  onConfirmDelete,
}) => {
  const hasAssignments = assignments.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasAssignments ? (
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            ) : (
              <Trash2 className="h-6 w-6 text-red-500" />
            )}
            {hasAssignments
              ? "לא ניתן למחוק תוכנית לימוד משויכת"
              : `מחיקת תוכנית לימוד: ${courseName}`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasAssignments ? (
              <>
                <p className="mb-4">
                  לא ניתן למחוק את תוכנית הלימוד "{courseName}" מכיוון שהיא משויכת להקצאות הבאות:
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md border bg-gray-50 p-3">
                  <ul className="list-disc pl-5 space-y-2">
                    {assignments.map((assignment) => (
                      <li key={assignment.id}>
                        <span className="font-semibold">
                          {assignment.educational_institutions?.name || "מוסד לא ידוע"}
                        </span>
                        <span>
                          {" "}
                          (מדריך: {assignment.profiles?.full_name || "לא שויך"})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4">
                  כדי למחוק את תוכנית הלימוד, עליך לבטל תחילה את כל ההקצאות המשויכות אליה.
                </p>
              </>
            ) : (
              "האם אתה בטוח שברצונך למחוק תוכנית לימוד זו? לא ניתן לשחזר פעולה זו."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          {!hasAssignments && (
            <Button
              variant="destructive"
              onClick={onConfirmDelete}
            >
              אישור ומחיקה
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCourseDialog;