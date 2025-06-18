
import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Calendar = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">יומן אישי</h1>
          <p className="text-gray-600">צפייה במערכת השעות והשיעורים הקרובים</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 ml-2" />
                  יומן שבועי
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">יומן יהיה זמין בקרוב</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Lessons Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>שיעורים קרובים</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-r-4 border-blue-500 pr-4 py-2">
                  <h3 className="font-semibold">בינה מלאכותית - כיתה ח'</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 ml-1" />
                      <span>14:00-15:30</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 ml-1" />
                      <span>בית ספר הרצל</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 ml-1" />
                      <span>15 תלמידים</span>
                    </div>
                  </div>
                </div>

                <div className="border-r-4 border-green-500 pr-4 py-2">
                  <h3 className="font-semibold">פיתוח אפליקציות</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 ml-1" />
                      <span>16:00-17:30</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 ml-1" />
                      <span>תיכון אלון</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 ml-1" />
                      <span>12 תלמידים</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
