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
  classes: ClassItem[];
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ classes }) => {
  return (
    <div className="flex flex-col gap-4 px-4">
      {classes.map((item, index) => (
        <div key={index} className="p-4 rounded-lg shadow-md bg-white">
          <div className="text-sm text-gray-400">{item.time}</div>
          <div className="text-lg font-semibold">{item.title}</div>
          <div className="text-sm text-gray-600">{item.instructor}</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {item.booked}/{item.capacity} Booked
            </div>
            <div className="flex items-center gap-1">
              {item.avatars.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="avatar"
                  className="w-6 h-6 rounded-full border-2 border-white -ml-2"
                />
              ))}
              {item.status === "available" ? (
                <button className="ml-2 bg-gray-100 px-2 rounded-full text-sm">+</button>
              ) : (
                <span className="ml-2 text-green-600 text-sm font-semibold">Booked</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
