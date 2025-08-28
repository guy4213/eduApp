// WeeklyCalendar.tsx - Fixed version
import React from "react";
import { DateSelector } from "./DateSelector";
import { ScheduleList } from "./ScheduleList";

interface WeeklyCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  lessons: any[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  setSelectedDate,
  lessons,
}) => {
  const filteredClasses = (lessons ?? []).filter((c) => {
    if (!c.scheduled_start) return true;

    const classDate = new Date(c.scheduled_start);
    const selected = new Date(selectedDate);

    const classDateStr = classDate.toISOString().split("T")[0];
    const selectedDateStr = selected.toISOString().split("T")[0];

    return classDateStr === selectedDateStr;
  });

  const hasItems = filteredClasses.length > 0;

  return (
    <div
      dir="rtl"
      role="region"
      aria-label="לוח שבועי"
      className="w-full sm:bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-100 sm:overflow-hidden"
    >
      <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      <div
        className="text-center mt-2 mb-3 text-base sm:text-lg font-semibold px-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedDate
          ? selectedDate.toLocaleDateString("he-IL", {
              weekday: "long",
              day: "numeric",
              month: "numeric",
              year: "numeric",
            })
          : "לא נבחר תאריך"}
      </div>

      {hasItems ? (
        <ScheduleList 
          key={`schedule-list-${selectedDate.toISOString().split('T')[0]}-${filteredClasses.length}`}
          lessons={filteredClasses} 
        />
      ) : (
        <div className="px-4 py-10 text-center text-gray-500">
          אין שיעורים ביום זה
        </div>
      )}
    </div>
  );
};