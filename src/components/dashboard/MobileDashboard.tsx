import React, { useState } from 'react';
import {
  CalendarIcon,
  Users,
  BookOpen,
  BarChart3,
  Award,
  Plus,
  Clock,
  MapPin,
  Star,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { WeeklyCalendar } from '../ui/WeeklyCalendar';
import { ClassItem } from './Dashboard';


const mockClasses: ClassItem[] = [
  {
    time: "08:00",
    title: "איגרוף שקים",
    instructor: "יוסף חיים בצלאל",
    booked: 11,
    capacity: 14,
    avatars: ["/avatar1.png", "/avatar2.png", "/avatar3.png"],
    status: "available", // ✅ string literal, matches the union
    date: "2025-06-18T08:00:00Z", // example date
  },
  {
    time: "09:05",
    title: "BOXING METCON",
    instructor: "יוסף חיים בצלאל",
    booked: 4,
    capacity: 14,
    avatars: ["/avatar1.png", "/avatar4.png"],
    status: "available",
    date: "2025-06-18T08:00:00Z", // example date

  },
  {
    time: "10:10",
    title: "איגרוף קלאסי",
    instructor: "דביר סלע",
    booked: 10,
    capacity: 14,
    avatars: ["/avatar5.png", "/avatar6.png", "/avatar7.png"],
    status: "booked", // ✅ this is the only other valid value
    date: "2025-06-18T08:00:00Z", // example date

  },
];


const MobileDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen mb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900">
      <main className="p-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">דשבורד מנהל פדגוגי</h2>
          <p className="text-sm text-gray-600">צפייה בפעילות השבועית</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm">בחר תאריך:</span>
          </div>
          <WeeklyCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            lessons={mockClasses}
          />
        </div>

        <Card className="shadow-md border-0 bg-white/80">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2" /> יומן יומי - 18.6.2025
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-semibold">בית ספר אשלים</p>
              <p className="text-xs text-gray-600">09:00-10:30 | 12 תלמידים</p>
              <p className="text-xs text-gray-500">תל אביב יפו</p>
            </div>
            <div className="text-sm">
              <p className="font-semibold">גימע רמות</p>
              <p className="text-xs text-gray-600">11:00-12:30 | 12 תלמידים</p>
              <p className="text-xs text-gray-500">תל אביב יפו</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0 bg-white/80">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-lg">ביצועי מדריכים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'דבר כהן', score: 96, rating: '4.8' },
              { name: 'שרה לוי', score: 92, rating: '4.5' },
              { name: 'מיכל אברהם', score: 88, rating: '4.3' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{item.name}</span>
                  <span className="text-gray-600 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 ml-1" /> {item.rating}/5
                  </span>
                </div>
                <Progress value={item.score} className="h-2 bg-gray-200 mt-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-l from-yellow-100 to-amber-100 border-yellow-300 shadow-md  p-12 mb-12">
          <CardContent className="text-center">
            <div className="flex justify-center items-center gap-2 mb-2">
              <Award className="h-6 w-6 text-yellow-600" />
              <span className="text-xl font-bold text-yellow-800">₪4,350</span>
            </div>
            <p className="text-yellow-700 font-semibold text-sm">סיכום חודשי</p>
            <p className="text-xs text-yellow-600 mt-1">🏆 דירוג וביצועים</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MobileDashboard;
