import React, { useEffect } from "react";
import { DateSelector } from "./DateSelector";
import { ScheduleList } from "./ScheduleList";

interface ClassItem {
  time: string;
  title: string;
  instructor: string;
  booked: number;
  capacity: number;
  avatars: string[];
  status: "available" | "booked";
  date?: string; // optional ISO date string for filtering
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  lessons: any[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, setSelectedDate, lessons }) => {
  // Sync internal state removed; use the controlled selectedDate prop from parent
console.log("LESSONS ",lessons)
  // Filter lessons by selectedDate day (if date info available)
const filteredClasses = (lessons??[]).filter((c) => {
  console.log("DATE", c.scheduled_start);
  if (!c.scheduled_start) return true;

  const classDate = new Date(c.scheduled_start);
  const selected = new Date(selectedDate);

  // Normalize both dates to YYYY-MM-DD strings
  const classDateStr = classDate.toISOString().split("T")[0];
  const selectedDateStr = selected.toISOString().split("T")[0];

  return classDateStr === selectedDateStr;
});
console.log("filteredClasses: ", filteredClasses)
  return (
    <div className="bg-white rounded-md shadow p-4" dir="rtl" role="region" aria-label="לוח שבועי">
      {/* Pass setSelectedDate directly to DateSelector */}
      <DateSelector selectedDate={selectedDate} onChange={setSelectedDate} />

      <div
        className="text-center mt-2 mb-4 text-lg font-semibold"
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

      <ScheduleList lessons={filteredClasses} />
    </div>
  );
};
