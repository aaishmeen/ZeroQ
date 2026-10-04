import React, { useEffect, useState } from 'react';
import type { EventItem, Registration, Payment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getMyRegistrationsApi } from '../../api/registrations';
import { getMyPaymentsApi } from '../../api/payments';
import { getEventsApi } from '../../api/events';
import { EventCard } from './EventCard';
import { EventDetailModal } from './EventDetailModal';
import { Search, Filter, SlidersHorizontal, Grid, List, Calendar, RefreshCw, AlertCircle, RotateCcw } from 'lucide-react';

interface EventDiscoverySectionProps {
  onRegisterEvent: (event: EventItem) => void;
  onContinuePayment?: (regId: number, event: EventItem) => void;
  onApplyVolunteer?: (event: EventItem) => void;
}

export const EventDiscoverySection: React.FC<EventDiscoverySectionProps> = ({
  onRegisterEvent,
  onContinuePayment,
  onApplyVolunteer,
}) => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [selectedEventDetails, setSelectedEventDetails] = useState<EventItem | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<'upcoming' | 'price-low' | 'price-high'>('upcoming');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categoriesList = [
    'Tech & Innovation',
    'Arts & Culture',
    'Networking',
    'Workshops',
    'Competitions',
    'Others',
  ];

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEventsApi();
      setEvents(data);

      if (isAuthenticated) {
        const [regs, pays] = await Promise.all([
          getMyRegistrationsApi().catch(() => []),
          getMyPaymentsApi().catch(() => []),
        ]);
        setRegistrations(regs);
        setPayments(pays);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Could not connect to event service. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMaxPrice(5000);
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategories.length > 0 || maxPrice < 5000;

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPrice = ev.price <= maxPrice;

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(cat => {
      const text = (ev.title + " " + ev.description).toLowerCase();
      if (cat === 'Tech & Innovation') return /\b(tech|technical|hackathon|ai|code|coding|bot|data|startup|cloud|aws|azure)\b/.test(text);
      if (cat === 'Arts & Culture') return /\b(art|arts|culture|cultural|dance|music|canvas|exhibition)\b/.test(text);
      if (cat === 'Workshops') return /\b(workshop|bootcamp|masterclass)\b/.test(text);
      if (cat === 'Competitions') return /\b(competition|competitions|battle|tournament|challenge|hackathon|sprint)\b/.test(text);
      if (cat === 'Networking') return /\b(network|networking|summit|meetup)\b/.test(text);
      return true;
    });

    return matchesSearch && matchesPrice && matchesCategory;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <section id="events-section" className="py-8 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Control & Filter Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          
          {/* Top Row: Search Input + Sort Dropdown + View Mode */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-[#1D4ED8] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event title, venue, keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#1D4ED8] focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-[#0F172A] shadow-xs">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
                >
                  <option value="upcoming">Upcoming Date</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-1 shadow-xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#1D4ED8] text-white' : 'text-slate-400 hover:text-[#0F172A]'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#1D4ED8] text-white' : 'text-slate-400 hover:text-[#0F172A]'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Category Chips & Max Price Slider Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-[#1D4ED8]" />
                Category:
              </span>
              <button
                onClick={() => setSelectedCategories([])}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategories.length === 0
                    ? 'bg-[#1D4ED8] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {categoriesList.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1D4ED8] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Max Price Filter Slider & Reset Button */}
            <div className="flex items-center gap-4 bg-slate-50 p-2 px-4 rounded-full border border-slate-200 shrink-0 self-start xl:self-auto">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Max Price:</span>
                <span className="font-bold text-[#1D4ED8] min-w-[50px]">₹{maxPrice.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-28 sm:w-36 accent-[#1D4ED8] cursor-pointer"
              />
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-[11px] font-bold text-[#1D4ED8] hover:underline cursor-pointer border-l border-slate-200 pl-3 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Events Content Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong className="text-[#0F172A] font-bold">{sortedEvents.length}</strong> events</span>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3 animate-pulse">
                  <div className="h-44 bg-slate-100 rounded-2xl" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="text-sm font-bold text-red-700">Backend Connection Error</h3>
              <p className="text-xs text-red-600 max-w-md mx-auto">{error}</p>
              <button
                onClick={loadEvents}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}

          {!isLoading && !error && sortedEvents.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
              <div className="w-10 h-10 bg-blue-50 text-[#1D4ED8] rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A]">No Events Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No approved events match your current filter criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-blue-50 text-[#1D4ED8] font-bold text-xs rounded-full border border-blue-200 cursor-pointer hover:bg-blue-100"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!isLoading && !error && sortedEvents.length > 0 && (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {sortedEvents.map((ev) => {
                const reg = registrations.find(r => r.event_id === ev.id);
                const hasPayment = reg ? payments.some(p => p.registration_id === reg.id) : false;

                return (
                  <EventCard 
                    key={ev.id} 
                    event={ev} 
                    onViewDetails={(event) => setSelectedEventDetails(event)}
                    onApplyVolunteer={onApplyVolunteer}
                    registration={reg}
                    hasPayment={hasPayment}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <EventDetailModal
        isOpen={!!selectedEventDetails}
        event={selectedEventDetails}
        registration={selectedEventDetails ? registrations.find(r => r.event_id === selectedEventDetails.id) : undefined}
        hasPayment={selectedEventDetails ? payments.some(p => p.registration_id === registrations.find(r => r.event_id === selectedEventDetails.id)?.id) : false}
        onClose={() => setSelectedEventDetails(null)}
        onRegister={onRegisterEvent}
        onContinuePayment={onContinuePayment}
        onApplyVolunteer={onApplyVolunteer}
      />
    </section>
  );
};
