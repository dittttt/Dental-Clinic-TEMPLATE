import React, { useState, useRef, useEffect } from 'react';
import { Phone, Calendar, Clock, FileText, User, Search, History, LogOut, AlertCircle, CheckCircle, Hourglass, ChevronDown, Check, Globe } from 'lucide-react';
import { FadeIn } from './ui/FadeIn';
import { useBookings } from '../context/BookingContext';
import { Link } from './SimpleRouter';

// Duplicated for simplicity in this context, ideally move to shared constants file
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
  { code: 'AE', name: 'UAE', prefix: '+971', placeholder: '50 123 4567', maxLength: 9, blocks: [2, 3, 4] }, // UAE
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966', placeholder: '50 123 4567', maxLength: 9, blocks: [2, 3, 4] },
  { code: 'QA', name: 'Qatar', prefix: '+974', placeholder: '3312 3456', maxLength: 8, blocks: [4, 4] },
];

const getFlagUrl = (countryCode: string) => {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
};

export const PatientPortal: React.FC = () => {
  const { getPatientBookings } = useBookings();
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [countryIdx, setCountryIdx] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dropdown state
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryWrapperRef = useRef<HTMLDivElement>(null);

  const currentCountry = COUNTRY_CODES[countryIdx];
  
  // Filter countries
  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prefix.includes(searchTerm)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

    setPhone(formatted);
    setError("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < currentCountry.maxLength - 1) { 
      setError('Please enter a valid mobile number');
      return;
    }
    setIsLoggedIn(true);
    setError('');
  };

  const myBookings = isLoggedIn ? getPatientBookings(phone) : [];
  
  const today = new Date().toISOString().split('T')[0];

  const upcoming = myBookings
    .filter(b => b.date >= today && b.status !== 'cancelled' && b.status !== 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const history = myBookings
    .filter(b => b.date < today || b.status === 'cancelled' || b.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedBookings = activeTab === 'upcoming' ? upcoming : history;

  if (!isLoggedIn) {
    return (
      <div className="pt-32 pb-20 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="container mx-auto px-4 max-w-md">
          <FadeIn>
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 relative">
              {/* Background Decoration - Isolated in overflow-hidden container to prevent clipping of content */}
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              </div>
              
              <div className="relative p-8 z-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600 shadow-sm transform rotate-3">
                    <User size={32} />
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-slate-900">Patient Portal</h1>
                  <p className="text-slate-500 text-sm mt-2">Enter your registered mobile number to view your history and upcoming appointments.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Mobile Number</label>
                    
                    {/* Unified Container Box */}
                    <div 
                        className={`relative w-full rounded-xl border bg-slate-50 transition-all duration-200 flex items-center
                            ${isCountryOpen || phone.length > 0 ? 'bg-white' : 'hover:bg-white focus-within:bg-white'}
                            ${error 
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
                              value={phone}
                              onChange={handlePhoneChange}
                              className="w-full bg-transparent border-none outline-none py-4 px-2 font-medium text-slate-900 placeholder:text-slate-400"
                              placeholder={currentCountry.placeholder}
                           />
                        </div>

                        {/* Dropdown Menu - Positioned Absolutely relative to container */}
                        {isCountryOpen && (
                            <div className="absolute top-[calc(100%+8px)] left-0 w-full max-h-[300px] overflow-hidden bg-white rounded-xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-2 z-50 flex flex-col">
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
                                           setPhone('');
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

                    {error && <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1"><AlertCircle size={12}/> {error}</p>}
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                  >
                    <Search size={18} /> Access Records
                  </button>
                </form>
                
                <div className="mt-6 text-center text-xs text-slate-400 relative z-10">
                   Not yet registered? <Link to="/booking" className="text-teal-600 font-bold hover:underline">Book an appointment</Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 max-w-4xl">
        <FadeIn>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">My Appointments</h1>
                <p className="text-slate-600">Viewing records for <span className="font-bold text-teal-600">{currentCountry.prefix} {phone}</span></p>
            </div>
            <button 
                onClick={() => { setIsLoggedIn(false); setPhone(''); }} 
                className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
            >
                <LogOut size={16} /> Log Out
            </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {/* Main Content - Flex layout to stretch height */}
            <div className="lg:col-span-2 flex flex-col">
                
                {/* Tabs */}
                <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm mb-6 shrink-0">
                    <button 
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'upcoming' ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Calendar size={16} /> Upcoming <span className="bg-white/50 px-1.5 rounded-md text-xs">{upcoming.length}</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-slate-100 text-slate-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <History size={16} /> History
                    </button>
                </div>

                {displayedBookings.length > 0 ? (
                    <div className="space-y-4 flex-1">
                        {displayedBookings.map(apt => (
                        <div key={apt.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Status Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                                ${apt.status === 'confirmed' ? 'bg-teal-500' 
                                : apt.status === 'cancelled' ? 'bg-red-300' 
                                : apt.status === 'pending' ? 'bg-yellow-400'
                                : 'bg-indigo-300'}`} // Completed
                            />
                            
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-3">
                                <div className="flex items-start gap-4">
                                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-slate-700 border border-slate-100 flex-shrink-0">
                                        <span className="text-xs font-bold uppercase tracking-wider">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-2xl font-serif font-bold leading-none">{new Date(apt.date).getDate()}</span>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(apt.date).getFullYear()}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{apt.service}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                                            <Clock size={14} className="text-teal-500" /> {apt.time}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-2">ID: #{apt.id.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                    {apt.status === 'confirmed' && (
                                        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle size={12} /> Confirmed
                                        </span>
                                    )}
                                    {apt.status === 'pending' && (
                                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                            <Hourglass size={12} /> Pending
                                        </span>
                                    )}
                                    {apt.status === 'cancelled' && (
                                        <span className="bg-red-50 text-red-500 text-xs font-bold px-3 py-1 rounded-full">
                                            Cancelled
                                        </span>
                                    )}
                                    {apt.status === 'completed' && (
                                        <span className="bg-indigo-100 text-indigo-500 text-xs font-bold px-3 py-1 rounded-full">
                                            Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                            {apt.notes && (
                                <div className="mt-4 pl-3 pt-3 border-t border-slate-50 text-sm text-slate-500 italic flex gap-2">
                                    <FileText size={16} className="flex-shrink-0 mt-0.5 text-slate-400" />
                                    "{apt.notes}"
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 border-dashed flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                           <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No appointments found</h3>
                        <p className="text-slate-500 text-sm mb-6">You don't have any {activeTab} bookings linked to this number.</p>
                        {activeTab === 'upcoming' && (
                            <Link to="/booking" className="inline-flex items-center gap-2 bg-teal-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors">
                                Book New Appointment
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 flex flex-col">
                <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden h-full flex flex-col">
                    <div className="relative z-10 flex-1">
                        <h3 className="font-serif font-bold text-2xl mb-2">Need Assistance?</h3>
                        <p className="text-slate-300 text-sm mb-8 leading-relaxed">
                            Need to reschedule or cancel? Give us a call directly and we'll help you sort it out.
                        </p>
                        <a href="tel:09332366403" className="block w-full bg-white text-slate-900 text-center py-4 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-lg">
                            <span className="flex items-center justify-center gap-2"><Phone size={18}/> Call Clinic</span>
                        </a>
                        <p className="text-center text-xs text-slate-500 mt-4">Available Mon-Sat, 9AM-5PM</p>
                    </div>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                </div>
            </div>
            </div>
        </FadeIn>
      </div>
    </div>
  );
};