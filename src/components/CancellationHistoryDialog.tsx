import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCancellationHistory, CancellationHistoryItem } from "@/services/cancellationService";
import { Calendar, Clock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface CancellationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseInstanceId: string | null;
  courseName?: string;
}

export const CancellationHistoryDialog: React.FC<CancellationHistoryDialogProps> = ({
  open,
  onOpenChange,
  courseInstanceId,
  courseName,
}) => {
  const [cancellations, setCancellations] = useState<CancellationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && courseInstanceId) {
      fetchCancellationHistory();
    }
  }, [open, courseInstanceId]);

  const fetchCancellationHistory = async () => {
    if (!courseInstanceId) return;

    setLoading(true);
    try {
      const history = await getCancellationHistory(courseInstanceId);
      setCancellations(history);
    } catch (error) {
      console.error("Error fetching cancellation history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: he });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), "dd/MM/yyyy HH:mm", { locale: he });
    } catch (error) {
      return dateTimeString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            היסטוריית ביטולי שיעורים
          </DialogTitle>
          <DialogDescription className="text-right">
            {courseName && (
              <span>עבור קורס: <strong>{courseName}</strong></span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">טוען נתונים...</p>
            </div>
          ) : cancellations.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">לא נמצאו ביטולי שיעורים עבור קורס זה</p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שיעור</TableHead>
                    <TableHead className="text-right">תאריך מקורי</TableHead>
                    <TableHead className="text-right">סיבת הביטול</TableHead>
                    <TableHead className="text-right">מבטל</TableHead>
                    <TableHead className="text-right">תאריך ביטול</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cancellations.map((cancellation) => (
                    <TableRow key={cancellation.cancellation_id}>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">
                            {cancellation.lesson_title}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(cancellation.original_date)}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 truncate" title={cancellation.cancellation_reason || ""}>
                            {cancellation.cancellation_reason || "לא צוין"}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {cancellation.cancelled_by_name || "לא ידוע"}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <span className="text-sm text-gray-600">
                          {formatDateTime(cancellation.cancelled_at)}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        {cancellation.is_rescheduled ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            תוזמן מחדש
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            ממתין לתזמון
                          </Badge>
                        )}
                        {cancellation.rescheduled_to_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            תוזמן ל: {formatDate(cancellation.rescheduled_to_date)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};