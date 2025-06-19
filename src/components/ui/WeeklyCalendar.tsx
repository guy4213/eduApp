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
  classes: ClassItem[];
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, setSelectedDate, classes }) => {
  // Sync internal state removed; use the controlled selectedDate prop from parent

  // Filter classes by selectedDate day (if date info available)
  const filteredClasses = classes.filter((c) => {
    if (!c.date) return true; // show all if no date info
    const classDate = new Date(c.date);
    // Compare only date parts ignoring time:
    return (
      classDate.getDate() === selectedDate.getDate() &&
      classDate.getMonth() === selectedDate.getMonth() &&
      classDate.getFullYear() === selectedDate.getFullYear()
    );
  });

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

      <ScheduleList classes={filteredClasses} />
    </div>
  );
};
