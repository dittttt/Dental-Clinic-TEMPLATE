import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Check, Loader2, Sparkles, Home, Mail, Cake, ChevronDown, Calendar as CalendarIcon, Clock, Phone, Globe, Search } from 'lucide-react';
import { FadeIn } from './ui/FadeIn';
import { Link } from './SimpleRouter';
import { BookingCalendar } from './booking/BookingCalendar';
import { ServiceSelector } from './booking/ServiceSelector';
import { useBookings } from '../context/BookingContext';

// Extended country list with names for search
const COUNTRY_CODES = [
  { code: 'PH', name: 'Philippines', prefix: '+63', placeholder: '912 345 6789', maxLength: 10, blocks: [3, 3, 4] },
  { code: 'US', name: 'United States', prefix: '+1', placeholder: '(555) 123-4567', maxLength: 10, format: 'us' },
  { code: 'CA', name: 'Canada', prefix: '+1', placeholder: '(555) 123-4567', maxLength: 10, format: 'us' },
  { code: 'MX', name: 'Mexico', prefix: '+52', placeholder: '55 1234 5678', maxLength: 10, blocks: [2, 4, 4] },
  { code: 'UK', name: 'United Kingdom', prefix: '+44', placeholder: '7700 900077', maxLength: 10, blocks: [4, 6] },
  { code: 'DE', name: 'Germany', prefix: '+49', placeholder: '151 1234 5678', maxLength: 11, blocks: [3, 4, 4] },
  { code: 'FR', name: 'France', prefix: '+33', placeholder: '6 12 34 56 78', maxLength: 9, blocks: [1, 2, 2, 2, 2] },
  { code: 'IE', name: 'Ireland', prefix: '+353', placeholder: '87 123 4567', maxLength: 9, blocks: [2, 3, 4] },
  { code: 'AU', name: 'Australia', prefix: '+61', placeholder: '400 123 456', maxLength: 9, blocks: [3, 3, 3] },
  { code: 'NZ', name: 'New Zealand', prefix: '+64', placeholder: '21 123 4567', maxLength: 9, blocks: [2, 3, 4] },
  { code: 'SG', name: 'Singapore', prefix: '+65', placeholder: '8123 4567', maxLength: 8, blocks: [4, 4] },
  { code: 'JP', name: 'Japan', prefix: '+81', placeholder: '90 1234 5678', maxLength: 10, blocks: [2, 4, 4] },
  { code: 'KR', name: 'South Korea', prefix: '+82', placeholder: '10 1234 5678', maxLength: 10, blocks: [2, 4, 4] },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', placeholder: '5123 4567', maxLength: 8, blocks: [4, 4] },
  { code: 'CN', name: 'China', prefix: '+86', placeholder: '138 1234 5678', maxLength: 11, blocks: [3, 4, 4] },
  { code: 'AE', name: 'UAE', prefix: '+971', placeholder: '50 123 4567', maxLength: 9, blocks: [2, 3, 4] },
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966', placeholder: '50 123 4567', maxLength: 9, blocks: [2, 3, 4] },
  { code: 'QA', name: 'Qatar', prefix: '+974', placeholder: '3312 3456', maxLength: 8, blocks: [4, 4] },
];

const getFlagUrl = (countryCode: string) => {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};

// Common input styles for consistency
const inputBaseStyles = "w-full px-5 py-4 rounded-xl bg-slate-50 border transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 hover:bg-white focus:bg-white";
const inputNormalStyles = "border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";
const inputErrorStyles = "border-red-300 ring-2 ring-red-100 focus:border-red-500";

export const BookingPage: React.FC = () => {
  const { addBooking, getBookedSlots } = useBookings();
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    date: '',
    time: '',
    type: 'Consultation',
    notes: ''
  });

  const [countryIdx, setCountryIdx] = useState(0); // Default to PH
  const [searchTerm, setSearchTerm] = useState('');
  const currentCountry = COUNTRY_CODES[countryIdx];

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Popover States
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDobOpen, setIsDobOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  const calendarWrapperRef = useRef<HTMLDivElement>(null);
  const dobWrapperRef = useRef<HTMLDivElement>(null);
  const countryWrapperRef = useRef<HTMLDivElement>(null);

  // Filter countries
  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prefix.includes(searchTerm)
  );

  // Computed unavailable slots based on selected date
  const blockedTimes = formState.date ? getBookedSlots(formState.date) : [];

  // Default date for DOB picker (18 years ago)
  const defaultDobDate = new Date();
  defaultDobDate.setFullYear(defaultDobDate.getFullYear() - 18);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarWrapperRef.current && !calendarWrapperRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (dobWrapperRef.current && !dobWrapperRef.current.contains(event.target as Node)) {
        setIsDobOpen(false);
      }
      if (countryWrapperRef.current && !countryWrapperRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const digits = rawInput.replace(/\D/g, '');
    
    // Allow deleting back even if formatted
    if (rawInput.length < formState.phone.length) {
       // Heuristic: if last char was space/symbol and user hit backspace, just let them delete
    }

    if (digits.length > currentCountry.maxLength) return;

    let formatted = digits;
    
    // US/Canada Formatting
    if (currentCountry.format === 'us') {
        if (digits.length > 6) {
            formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length > 3) {
             formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        } else if (digits.length > 0) {
            formatted = `(${digits}`;
        }
    } 
    // Block-based formatting for other countries
    else if (currentCountry.blocks) {
        let parts = [];
        let index = 0;
        for (let blockSize of currentCountry.blocks) {
            if (index < digits.length) {
                parts.push(digits.slice(index, index + blockSize));
                index += blockSize;
            }
        }
        formatted = parts.join(' ');
    }

    setFormState(prev => ({ ...prev, phone: formatted }));

    // Validation logic on type
    if (digits.length > 0 && digits.length < currentCountry.maxLength) {
      setErrors(prev => ({ ...prev, phone: `Invalid number` }));
    } else {
      setErrors(prev => { const n = {...prev}; delete n.phone; return n; });
    }
  };

  const validateEmail = (value: string) => {
    if (!value) return ""; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormState(prev => ({ ...prev, email: val }));
    const errorMsg = validateEmail(val);
    setErrors(prev => {
       const newErrors = { ...prev };
       if (errorMsg && val.length > 0) newErrors.email = errorMsg;
       else delete newErrors.email;
       return newErrors;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.name.trim()) newErrors.name = "Name is required";
    const phoneDigits = formState.phone.replace(/\D/g, '');
    if (phoneDigits.length < currentCountry.maxLength) newErrors.phone = "Please enter a valid mobile number";
    const emailError = validateEmail(formState.email);
    if (emailError) newErrors.email = emailError;
    if (!formState.birthday) newErrors.birthday = "Complete date of birth is required";
    if (!formState.date) newErrors.date = "Please select a date from the calendar";
    if (!formState.time) newErrors.time = "Please select a time slot";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
       window.scrollTo({ top: 100, behavior: 'smooth' });
       return;
    }
    setIsSubmitting(true);
    
    try {
        await addBooking({
        name: formState.name,
        phone: `${currentCountry.prefix} ${formState.phone}`,
        email: formState.email,
        service: formState.type,
        date: formState.date,
        time: formState.time,
        notes: formState.notes
        });

        setIsSuccess(true);
    } catch (error) {
        console.error("Booking failed", error);
        alert("Something went wrong. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormState({
      name: '', phone: '', email: '', birthday: '',
      date: '', time: '', type: 'Consultation', notes: ''
    });
    setIsSuccess(false);
  };

  const handleDateTimeSelect = (date: string, time: string) => {
    setFormState(prev => ({ ...prev, date, time }));
    if (errors.date) setErrors(prev => { const n = {...prev}; delete n.date; return n; });
    if (time && errors.time) setErrors(prev => { const n = {...prev}; delete n.time; return n; });
    
    if (date && time) setIsCalendarOpen(false);
  };

  const handleBirthdaySelect = (date: string) => {
    setFormState(prev => ({ ...prev, birthday: date }));
    if (errors.birthday) setErrors(prev => { const n = {...prev}; delete n.birthday; return n; });
    setIsDobOpen(false);
  };

  if (isSuccess) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-lg">
          <FadeIn>
            <div className="bg-white rounded-[2rem] shadow-2xl p-10 text-center border border-teal-100 relative overflow-hidden">
               <div className="absolute inset-0 bg-yellow-50/50 -z-10"></div>
               <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600 animate-pulse">
                 <Clock size={40} strokeWidth={3} />
               </div>
               <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Request Sent</h2>
               <p className="text-slate-600 mb-6 leading-relaxed">
                 Thank you, <strong>{formState.name}</strong>. <br/>
                 Your request for a <strong>{formState.type}</strong> on <strong>{formState.date}</strong> at <strong>{formState.time}</strong> has been received.
               </p>
               <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2 text-left">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <p>This slot is being held for you. We will review and confirm your appointment shortly.</p>
               </div>
               <div className="space-y-3">
                 <Link to="/" className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                   <Home size={18} /> Back to Home
                 </Link>
                 <button onClick={resetForm} className="block w-full bg-white text-slate-600 font-bold py-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all">
                   Book Another Appointment
                 </button>
               </div>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-teal-600 text-sm font-bold uppercase tracking-wider mb-4 border border-teal-100">
               <Sparkles size={16} /> Online Booking
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">Secure Your Smile</h1>
            <p className="text-slate-600 text-lg">Select a service and date below. We'll send a confirmation to your email.</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-100 relative z-10 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 w-full rounded-t-[2.5rem]" />
            
            <div className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* 1. Service Selection */}
                <div className="space-y-4">
                   <div className="flex items-center gap-3 mb-2">
                     <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                     <label className="text-lg font-bold text-slate-800">Select Service</label>
                   </div>
                   <ServiceSelector 
                      selected={formState.type} 
                      onSelect={(val) => setFormState({...formState, type: val})} 
                   />
                </div>

                {/* 2. Date & Time Selection (Dropdown Style) */}
                <div className="space-y-4" ref={calendarWrapperRef}>
                  <div className="flex items-center gap-3 mb-2">
                     <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                     <label className="text-lg font-bold text-slate-800">Choose Date & Time</label>
                   </div>
                  
                  <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setIsCalendarOpen(!isCalendarOpen); setIsDobOpen(false); setIsCountryOpen(false); }}
                        className={`${inputBaseStyles} flex items-center justify-between text-left
                            ${(errors.date || errors.time) ? inputErrorStyles : inputNormalStyles}
                            ${isCalendarOpen ? 'border-teal-500 ring-4 ring-teal-500/10 bg-white' : ''}
                        `}
                      >
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                                {formState.date ? 'Appointment Date' : 'Select Date'}
                            </span>
                            {formState.date ? (
                                <span className="font-medium text-lg text-slate-900">
                                    {new Date(formState.date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                    {formState.time && <span className="text-teal-600"> @ {formState.time}</span>}
                                </span>
                            ) : (
                                <span className="font-medium text-base text-slate-400">
                                    Tap to view calendar
                                </span>
                            )}
                        </div>
                        <CalendarIcon size={24} className={`transition-colors ${isCalendarOpen || formState.date ? 'text-teal-600' : 'text-slate-400'}`} /> 
                      </button>

                      {isCalendarOpen && (
                        <div className="absolute top-[calc(100%+12px)] left-0 z-30 animate-in fade-in slide-in-from-top-4 duration-200 w-full">
                            <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                                <BookingCalendar 
                                    selectedDate={formState.date}
                                    selectedTime={formState.time}
                                    onDateTimeSelect={handleDateTimeSelect}
                                    error={errors.date || errors.time}
                                    enableTime={true}
                                    blockedTimes={blockedTimes}
                                />
                            </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* 3. Personal Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                     <label className="text-lg font-bold text-slate-800">Your Details</label>
                   </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 h-4 flex items-center">Full Name</label>
                      <input 
                        type="text" 
                        className={`${inputBaseStyles} ${errors.name ? inputErrorStyles : inputNormalStyles}`}
                        placeholder="Juan dela Cruz"
                        value={formState.name}
                        onChange={(e) => {
                          setFormState({...formState, name: e.target.value});
                          if(e.target.value) setErrors(prev => { const n = {...prev}; delete n.name; return n; });
                        }}
                      />
                      {errors.name && <p className="text-red-500 text-xs ml-1">{errors.name}</p>}
                    </div>
                    
                    <div className="space-y-2 min-w-0">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 h-4 flex items-center">Mobile Number</label>
                      
                      {/* Unified Country & Input Box */}
                      <div 
                        className={`relative w-full rounded-xl border bg-slate-50 transition-all duration-200 flex items-center z-20
                            ${isCountryOpen || formState.phone.length > 0 ? 'bg-white' : 'hover:bg-white focus-within:bg-white'}
                            ${errors.phone 
                                ? 'border-red-300 ring-2 ring-red-100' 
                                : 'border-slate-200 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10'
                            }
                        `}
                        ref={countryWrapperRef}
                      >
                         {/* Country Trigger */}
                        <button
                          type="button"
                          onClick={() => { setIsCountryOpen(!isCountryOpen); setSearchTerm(''); }}
                          className="pl-4 pr-2 py-4 flex items-center gap-2 outline-none shrink-0"
                        >
                           <img 
                              src={getFlagUrl(currentCountry.code)} 
                              alt={currentCountry.code} 
                              className="w-6 h-auto rounded-[2px] shadow-sm"
                           />
                           <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isCountryOpen ? 'rotate-180 text-teal-500' : ''}`} />
                        </button>
                        
                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>

                        {/* Input Area with Prefix */}
                        <div className="flex-1 flex items-center min-w-0 pr-4">
                            <span className="text-slate-500 font-medium pl-2 select-none shrink-0">{currentCountry.prefix}</span>
                            <input 
                              type="tel"
                              value={formState.phone}
                              onChange={handlePhoneChange}
                              className="w-full bg-transparent border-none outline-none py-4 px-2 font-medium text-slate-900 placeholder:text-slate-400"
                              placeholder={currentCountry.placeholder}
                            />
                        </div>

                         {/* Dropdown Menu - Positioned Absolutely relative to container */}
                         {isCountryOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[280px] max-h-[300px] overflow-hidden bg-white rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 z-50 flex flex-col">
                               {/* Search Sticky Header */}
                               <div className="sticky top-0 bg-white z-10 border-b border-slate-100">
                                  <div className="relative flex items-center px-4 py-3">
                                    <Search className="text-slate-400 mr-3 flex-shrink-0" size={18} />
                                    <input 
                                      type="text" 
                                      placeholder="Search for country" 
                                      className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                    />
                                  </div>
                               </div>
                               
                               <div className="overflow-y-auto flex-1 py-1">
                                 {filteredCountries.length > 0 ? filteredCountries.map((c) => (
                                     <button
                                       key={c.code}
                                       type="button"
                                       onClick={() => {
                                           setCountryIdx(COUNTRY_CODES.findIndex(item => item.code === c.code));
                                           setFormState(prev => ({ ...prev, phone: '' }));
                                           setIsCountryOpen(false);
                                       }}
                                       className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-3
                                          ${c.code === currentCountry.code ? 'bg-slate-50 text-teal-600 font-bold' : 'text-slate-600'}
                                       `}
                                     >
                                        <img src={getFlagUrl(c.code)} alt={c.code} className="w-5 h-auto rounded-[2px] shadow-sm flex-shrink-0" />
                                        <span className="flex-1 truncate">{c.name}</span>
                                        <span className="text-slate-400 text-xs">({c.prefix})</span>
                                        {c.code === currentCountry.code && <Check size={14} className="ml-auto text-teal-600" />}
                                     </button>
                                 )) : (
                                   <div className="px-4 py-3 text-sm text-slate-400 text-center">No results found</div>
                                 )}
                               </div>
                            </div>
                         )}
                      </div>
                      
                      {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 h-4 flex items-center">Email Address (Optional)</label>
                      <input 
                        type="email" 
                        className={`${inputBaseStyles} ${errors.email ? inputErrorStyles : inputNormalStyles}`}
                        placeholder="juan@example.com"
                        value={formState.email}
                        onChange={handleEmailChange}
                      />
                      {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email}</p>}
                    </div>

                    {/* Date of Birth Field */}
                    <div className="space-y-2" ref={dobWrapperRef}>
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1 h-4">
                          Date of Birth <Cake size={12} className="text-teal-500"/>
                       </label>
                       
                       <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setIsDobOpen(!isDobOpen); setIsCalendarOpen(false); setIsCountryOpen(false); }}
                            className={`${inputBaseStyles} flex items-center justify-between text-left
                                ${errors.birthday ? inputErrorStyles : inputNormalStyles}
                                ${isDobOpen ? 'border-teal-500 ring-4 ring-teal-500/10 bg-white' : ''}
                            `}
                          >
                            <span className={`font-medium ${formState.birthday ? 'text-slate-900' : 'text-slate-400'}`}>
                              {formState.birthday 
                                ? new Date(formState.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                : "MM / DD / YYYY"
                              }
                            </span>
                            <ChevronDown 
                              size={16} 
                              className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${isDobOpen ? 'rotate-180 text-teal-500' : ''}`} 
                            />
                          </button>

                          {isDobOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 z-30 animate-in fade-in slide-in-from-top-4 duration-200 w-full">
                                <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                                    <BookingCalendar 
                                        selectedDate={formState.birthday}
                                        onDateTimeSelect={(d) => handleBirthdaySelect(d)}
                                        enableTime={false}
                                        initialDate={defaultDobDate}
                                    />
                                </div>
                            </div>
                          )}
                       </div>
                       
                       {errors.birthday && <p className="text-red-500 text-xs ml-1">{errors.birthday}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Notes (Optional)</label>
                     <textarea 
                        className={`${inputBaseStyles} ${inputNormalStyles} min-h-[120px] resize-none`}
                        placeholder="Any specific concerns, pain points, or previous history?"
                        value={formState.notes}
                        onChange={(e) => setFormState({...formState, notes: e.target.value})}
                     ></textarea>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 disabled:bg-teal-400 text-white font-bold text-lg py-5 rounded-xl hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-500/20 transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group">
                    {isSubmitting ? <><Loader2 size={24} className="animate-spin" /><span>Processing...</span></> : <><span>Request Booking</span><div className="bg-white/20 rounded-full p-1 group-hover:bg-white/30 transition-colors"><Check size={16} strokeWidth={3} /></div></>}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4">By booking, you agree to our clinic policies. Payment is done at the clinic.</p>
                </div>
              </form>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
};