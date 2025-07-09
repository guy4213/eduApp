import { Divide } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClassItem {
  time: string;
  title: string;
  instructor: string;
  booked: number;
  capacity: number;
  avatars: string[];
  status: "available" | "booked";
}

interface ScheduleListProps {
  lessons: any[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ lessons }) => {
  const nav = useNavigate();
  return (
    <div className="flex flex-col gap-4 px-4">
      {lessons.map((item, index) => (
        <div
          key={index}
          className="flex p-4 rounded-lg shadow-md justify-between  bg-white w-full"
        >
          <div className="flex flex-col gap-2 px-4">
            <div className="text-lg font-semibold">{item.title}</div>
            {!item.instructor_id ? (
              <div className="text-md font-bold">אין מדריך לקורס הזה</div>
            ) : (
              <div className="text-lg font-semibold">{item.title}</div>
            )}
          </div>
          <button
            onClick={() => {
              nav("/lesson-report");
            }}
            className="bg-green-300 rounded-full p-2 items-center font-bold"
          >
            דיווח שיעור{" "}
          </button>
        </div>
      ))}
    </div>
  );
};
