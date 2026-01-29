import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, ChevronDown } from 'lucide-react';

interface BookingCalendarProps {
  selectedDate: string;
  selectedTime?: string;
  onDateTimeSelect: (date: string, time: string) => void;
  error?: string;
  enableTime?: boolean;
  blockedTimes?: string[]; 
  initialDate?: Date; // New prop for setting default calendar view
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM"
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ 
  selectedDate, 
  selectedTime = '', 
  onDateTimeSelect, 
  error,
  enableTime = true,
  blockedTimes = [],
  initialDate
}) => {
  // Use initialDate if provided, otherwise default to today
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    const today = new Date();
    // Allow going back only if not restricted by "enableTime" logic (future bookings only)
    if (enableTime) {
         if (currentMonth.getMonth() > today.getMonth() || currentMonth.getFullYear() > today.getFullYear()) {
             setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
         }
    } else {
         setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${d}`;
    
    onDateTimeSelect(dateStr, '');
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (enableTime) {
        if (date < today) return true;
        if (date.getDay() === 0) return true; // Sunday closed
    }
    if (!enableTime) {
        if (date > today) return true;
    }
    return false;
  };

  const isTimeSlotPast = (timeStr: string) => {
    if (!selectedDate) return false;
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayDay = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

    if (selectedDate > todayStr) return false;
    if (selectedDate < todayStr) return true;

    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);
    const gracePeriod = 10 * 60 * 1000;
    
    if (now.getTime() > (slotDate.getTime() + gracePeriod)) {
        return true;
    }
    return false;
  };

  // --- RENDER FUNCTIONS ---

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth); 
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9 md:h-10 md:w-10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isDisabled = isDateDisabled(d);
      
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayVal = String(date.getDate()).padStart(2, '0');
      const currentDateStr = `${year}-${month}-${dayVal}`;
      
      const isSelected = selectedDate === currentDateStr;

      days.push(
        <button
          key={d}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateClick(d)}
          className={`h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
            ${isSelected ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : ''}
            ${!isSelected && !isDisabled ? 'hover:bg-slate-100 text-slate-700' : ''}
            ${isDisabled ? 'text-slate-300 cursor-not-allowed' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const renderYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      // Adjust year range based on enableTime (future) or not (past/DOB)
      const yStart = enableTime ? currentYear : 1920;
      const yEnd = enableTime ? currentYear + 5 : currentYear;
      
      // If we provided an initialDate (like for DOB), center or include that range comfortably if needed,
      // but keeping simple logic for now: 1920 to current for DOB
      
      if (!enableTime) {
          for (let y = yEnd; y >= yStart; y--) years.push(y);
      } else {
          for (let y = yStart; y <= yEnd; y++) years.push(y);
      }

      return (
          <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-1">
               {years.map(y => (
                   <button
                    key={y}
                    type="button"
                    onClick={() => {
                        const newDate = new Date(currentMonth);
                        newDate.setFullYear(y);
                        setCurrentMonth(newDate);
                        setView('months'); // Navigate to months after year
                    }}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${currentMonth.getFullYear() === y ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-teal-500 hover:text-teal-600'}`}
                   >
                       {y}
                   </button>
               ))}
          </div>
      );
  };

  const renderMonths = () => {
      return (
        <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((m, idx) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => {
                        const newDate = new Date(currentMonth);
                        newDate.setMonth(idx);
                        setCurrentMonth(newDate);
                        setView('days'); // Navigate to days after month
                    }}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${currentMonth.getMonth() === idx ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-teal-500 hover:text-teal-600'}`}
                >
                    {m.slice(0, 3)}
                </button>
            ))}
        </div>
      );
  };

  // Header Text Logic
  const getHeaderText = () => {
      if (view === 'years') return 'Select Year';
      if (view === 'months') return `${currentMonth.getFullYear()}`;
      return `${MONTH_NAMES[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  };

  const handleHeaderClick = () => {
      if (view === 'days') setView('years');
      else if (view === 'months') setView('years'); // Go back up
      else setView('days'); // Cancel/Close
  };

  return (
    <div className={`bg-white p-6 ${error ? 'border-2 border-red-100' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
            type="button"
            onClick={handleHeaderClick}
            className="font-bold text-slate-900 text-lg flex items-center gap-1 hover:bg-slate-50 px-2 py-1 -ml-2 rounded-lg transition-colors"
        >
          {getHeaderText()}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${view !== 'days' ? 'rotate-180' : ''}`} />
        </button>

        {view === 'days' && (
            <div className="flex gap-1">
            <button type="button" onClick={handlePrevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-600 transition-colors">
                <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={handleNextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-full text-slate-600 transition-colors">
                <ChevronRight size={18} />
            </button>
            </div>
        )}
      </div>

      {view === 'days' && (
          <>
            <div className="grid grid-cols-7 mb-2 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-xs font-bold text-slate-400 pb-2">
                    {day}
                </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center w-full">
                {renderCalendarDays()}
            </div>
          </>
      )}

      {view === 'years' && renderYears()}
      {view === 'months' && renderMonths()}

      {/* Time Slots */}
      {enableTime && selectedDate && view === 'days' && (
        <div className="animate-in slide-in-from-top-2 fade-in pt-4 mt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
             <Clock size={16} className="text-teal-600" />
             <span className="text-sm font-bold text-slate-800">Available Slots</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map(time => {
              const isBlocked = blockedTimes.includes(time);
              const isPast = isTimeSlotPast(time);
              const isDisabled = isBlocked || isPast;

              return (
                <button
                  key={time}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => onDateTimeSelect(selectedDate, time)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 relative overflow-hidden
                    ${selectedTime === time 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                      : isDisabled
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                    }
                  `}
                >
                  {isBlocked && !isPast && <div className="absolute inset-0 bg-slate-200/50 flex items-center justify-center"><div className="w-[120%] h-[1px] bg-slate-400 rotate-12"></div></div>}
                  {time.replace(' ', '')}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-3 flex items-center gap-1"><Clock size={12}/> {error}</p>}
    </div>
  );
};