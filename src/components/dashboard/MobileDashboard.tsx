
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, Heart } from 'lucide-react';

const MobileDashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 18)); // June 18, 2025

  const lessons = [
    {
      id: 1,
      title: "אמירון שקמים",
      time: "08:00",
      instructor: "חסין היים בצלאל",
      booked: "11/14 Booked",
      status: "available",
      participants: ["👤", "👤", "👤"]
    },
    {
      id: 2,
      title: "BOXING METCON",
      time: "09:05",
      instructor: "חסין היים בצלאל",
      booked: "4/14 Booked",
      status: "available",
      participants: ["👤", "👤", "👤"]
    },
    {
      id: 3,
      title: "אמירון קלאסי",
      time: "10:10",
      instructor: "דניד סמן",
      booked: "10/14 Booked",
      status: "booked",
      participants: ["👤", "👤", "👤"]
    }
  ];

  const daysInWeek = ['ראש', 'שני', 'שלי', 'רבי', 'חמי', 'שיש', 'שבת'];
  const currentWeek = [8, 9, 10, 11, 12, 13, 14];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 to-green-500 text-white">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Stella Governi</h1>
          <div className="flex space-x-4 space-x-reverse mt-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Classes</span>
            <span className="text-sm opacity-80">My Bookings</span>
          </div>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <Button size="sm" variant="ghost" className="text-white p-2">
            <Calendar className="h-5 w-5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-white p-2">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="px-4 py-2">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="sm" className="text-white p-1">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium">June 2025</span>
          <Button variant="ghost" size="sm" className="text-white p-1">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {daysInWeek.map((day, index) => (
            <div key={day} className="text-center text-xs opacity-80 mb-2">
              {day}
            </div>
          ))}
          {currentWeek.map((date, index) => (
            <div
              key={date}
              className={`text-center py-2 rounded-full text-sm font-medium ${
                date === 11 || date === 13
                  ? 'bg-white text-teal-600'
                  : date === 18
                  ? 'bg-teal-600 text-white'
                  : 'text-white'
              }`}
            >
              {date}
            </div>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      <div className="bg-white text-gray-900 rounded-t-3xl min-h-[60vh] p-4">
        {lessons.map((lesson) => (
          <Card key={lesson.id} className="mb-4 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{lesson.title}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Heart className="h-4 w-4 text-gray-400" />
                      {lesson.status === 'booked' && (
                        <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                          Booked
                        </span>
                      )}
                      <Plus className="h-5 w-5 text-teal-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600 mb-2">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Clock className="h-4 w-4" />
                      <span>{lesson.time}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Users className="h-4 w-4" />
                      <span>{lesson.instructor}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 space-x-reverse text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{lesson.booked}</span>
                    </div>
                    <div className="flex -space-x-2 space-x-reverse">
                      {lesson.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs border-2 border-white"
                        >
                          {participant}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MobileDashboard;
