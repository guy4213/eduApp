import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateSelectorProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onChange }) => {
  // Get Sunday as start of week (Hebrew week)
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  // Get days array Sun-Sat
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  return (
    <div dir="rtl" className="flex items-center justify-between px-4 py-2">
      <button
        aria-label="שבוע קודם"
        onClick={() => onChange(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}
      >
        <ChevronRight />
      </button>
      <div className="flex gap-2 overflow-auto">
        {days.map((day) => (
          <button
            key={day.toDateString()}
            onClick={() => onChange(new Date(day))}
            className={`flex flex-col items-center px-2 py-1 rounded-lg text-sm ${
              isSameDay(day, selectedDate) ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="font-bold">
              {day.toLocaleDateString("he-IL", { weekday: "short" })}
            </span>
            <span>{day.getDate()}</span>
          </button>
        ))}
      </div>
      <button
        aria-label="שבוע הבא"
        onClick={() => onChange(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}
      >
        <ChevronLeft />
      </button>
    </div>
  );
};
