import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, MapPin, Shield, CheckCircle2 } from 'lucide-react';

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeDate, setActiveDate] = useState(new Date());
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

  // Calculate days in month and start day
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const startingDay = (firstDayOfMonth + 6) % 7; // Convert so Monday is 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setActiveDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setActiveDate(new Date(year, month + 1, 1));
  };

  const isToday = (d: number) => {
    const today = new Date();
    return (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full relative overflow-hidden">
      {/* Top Header: Clock & Location */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-red-50 text-[#C84B31] rounded-lg">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-800 tracking-tight font-mono">
              {timeString || '--:--:--'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Heure Rabat (GMT+1)</div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
          <MapPin className="h-3 w-3 text-[#C84B31]" />
          <span className="text-[10px] font-extrabold text-slate-700">Rabat - RSK</span>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-xs font-black text-slate-900 uppercase tracking-wider">
          {monthNames[month]} <span className="text-[#C84B31] font-extrabold">{year}</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={prevMonth}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Mois précédent"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Mois suivant"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="w-full">
        {/* Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {daysOfWeek.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Days Numbers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells before start day */}
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-6 w-full" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const today = isToday(dayNum);

            return (
              <div
                key={`day-${dayNum}`}
                className={`h-6 w-full rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all ${
                  today
                    ? 'bg-[#C84B31] text-white font-black shadow-sm shadow-[#C84B31]/30 scale-105'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Service Status Indicator */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-600 font-bold text-[10px]">Service Patrimoine DGPC</span>
        </div>
        <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
          En Ligne
        </span>
      </div>
    </div>
  );
}
