'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { getPusherClient, EVENTS, getCoupleChannel } from '@/lib/pusher';
import { createDateEvent, updateDateEvent, deleteDateEvent } from '@/actions/dates';
import type { User, Couple, DateEvent } from '@/db/schema';

interface DateEventWithCreator extends DateEvent {
  createdBy: { id: string; name: string };
}

interface CoupleWithPartner extends Couple {
  partner: Pick<User, 'id' | 'name' | 'avatarUrl' | 'lastSeen'>;
}

interface DatesClientProps {
  initialEvents: DateEventWithCreator[];
  currentUser: User;
  couple: CoupleWithPartner;
}

export function DatesClient({ initialEvents, currentUser, couple }: DatesClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<DateEventWithCreator[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<DateEventWithCreator | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pusher subscription for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(getCoupleChannel(couple.id));

    channel.bind(EVENTS.DATE_NEW, (data: { event: DateEventWithCreator }) => {
      setEvents((prev) => {
        if (prev.some((e) => e.id === data.event.id)) return prev;
        return [...prev, data.event];
      });
    });

    channel.bind(EVENTS.DATE_UPDATE, (data: { event: DateEventWithCreator }) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === data.event.id ? data.event : e))
      );
      if (selectedEvent?.id === data.event.id) {
        setSelectedEvent(data.event);
      }
    });

    channel.bind(EVENTS.DATE_DELETE, (data: { eventId: string }) => {
      setEvents((prev) => prev.filter((e) => e.id !== data.eventId));
      if (selectedEvent?.id === data.eventId) {
        setSelectedEvent(null);
        setShowEventModal(false);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getCoupleChannel(couple.id));
    };
  }, [couple.id, selectedEvent?.id]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter((e) => e.date === dateStr);
  };

  const handleDateClick = (date: Date) => {
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length === 1) {
      // Open existing event
      setSelectedEvent(dateEvents[0]);
      setShowEventModal(true);
      setIsEditing(false);
    } else if (dateEvents.length > 1) {
      // Show list view for multiple events
      setSelectedDate(date);
      setSelectedEvent(null);
      setShowEventModal(true);
      setIsEditing(false);
    } else {
      // Create new event
      setSelectedDate(date);
      setSelectedEvent(null);
      setFormTitle('');
      setFormDescription('');
      setFormDate(format(date, 'yyyy-MM-dd'));
      setFormTime('');
      setFormLocation('');
      setShowEventModal(true);
      setIsEditing(true);
    }
  };

  const handleCreateNew = () => {
    if (selectedDate) {
      setSelectedEvent(null);
      setFormTitle('');
      setFormDescription('');
      setFormDate(format(selectedDate, 'yyyy-MM-dd'));
      setFormTime('');
      setFormLocation('');
      setIsEditing(true);
    }
  };

  const handleEditEvent = (event: DateEventWithCreator) => {
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormDate(event.date);
    setFormTime(event.time || '');
    setFormLocation(event.location || '');
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    setIsSubmitting(true);
    try {
      if (selectedEvent) {
        const updatedEvent = await updateDateEvent(selectedEvent.id, {
          title: formTitle,
          description: formDescription,
          date: formDate,
          time: formTime,
          location: formLocation,
        });
        // Update local state immediately
        setEvents((prev) =>
          prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
        );
      } else {
        const newEvent = await createDateEvent({
          title: formTitle,
          description: formDescription,
          date: formDate,
          time: formTime,
          location: formLocation,
        });
        // Add to local state immediately
        setEvents((prev) => [...prev, newEvent]);
      }
      setShowEventModal(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save event:', error);
      alert(error instanceof Error ? error.message : 'Opslaan mislukt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!confirm('Weet je zeker dat je deze date wilt verwijderen?')) return;

    setIsSubmitting(true);
    try {
      await deleteDateEvent(selectedEvent.id);
      // Remove from local state immediately
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
      setShowEventModal(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert(error instanceof Error ? error.message : 'Verwijderen mislukt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const dateEvents = getEventsForDate(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, currentMonth);
      const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
      const isTodayDate = isToday(currentDay);

      days.push(
        <button
          key={day.toISOString()}
          onClick={() => handleDateClick(currentDay)}
          className={`
            relative aspect-square p-1 flex flex-col items-center justify-center rounded-lg transition-all
            ${isCurrentMonth ? 'text-gray-800' : 'text-gray-300'}
            ${isSelected ? 'bg-primary-100 ring-2 ring-primary-500' : 'hover:bg-gray-100'}
            ${isTodayDate ? 'font-bold' : ''}
          `}
        >
          <span
            className={`
              w-8 h-8 flex items-center justify-center rounded-full
              ${isTodayDate ? 'bg-primary-500 text-white' : ''}
            `}
          >
            {format(currentDay, 'd')}
          </span>
          {dateEvents.length > 0 && (
            <div className="flex gap-0.5 mt-0.5">
              {dateEvents.slice(0, 3).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary-500"
                />
              ))}
            </div>
          )}
        </button>
      );

      day = addDays(day, 1);
    }

    return days;
  };

  const renderEventsList = () => {
    if (!selectedDate) return null;
    const dateEvents = getEventsForDate(selectedDate);

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800">
          {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
        </h3>
        {dateEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">Geen dates gepland</p>
        ) : (
          dateEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                setIsEditing(false);
              }}
              className="w-full text-left p-3 bg-white/50 hover:bg-white/80 rounded-xl transition-colors"
            >
              <p className="font-medium text-gray-800">{event.title}</p>
              {event.time && (
                <p className="text-sm text-gray-500">{event.time}</p>
              )}
            </button>
          ))
        )}
        <button
          onClick={handleCreateNew}
          className="w-full py-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          + Nieuwe date toevoegen
        </button>
      </div>
    );
  };

  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{selectedEvent.title}</h3>
          <p className="text-sm text-gray-500">
            Toegevoegd door {selectedEvent.createdBy.name}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{format(new Date(selectedEvent.date), 'd MMMM yyyy', { locale: nl })}</span>
          </div>

          {selectedEvent.time && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{selectedEvent.time}</span>
            </div>
          )}

          {selectedEvent.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{selectedEvent.location}</span>
            </div>
          )}
        </div>

        {selectedEvent.description && (
          <p className="text-gray-600 whitespace-pre-wrap">{selectedEvent.description}</p>
        )}

        <div className="flex gap-2 pt-4">
          <button
            onClick={() => handleEditEvent(selectedEvent)}
            className="flex-1 btn-primary"
          >
            Bewerken
          </button>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Verwijderen
          </button>
        </div>
      </div>
    );
  };

  const renderEventForm = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {selectedEvent ? 'Date bewerken' : 'Nieuwe date'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titel *
          </label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Bijv. Diner bij..."
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Datum *
          </label>
          <input
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tijd
          </label>
          <input
            type="time"
            value={formTime}
            onChange={(e) => setFormTime(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Locatie
          </label>
          <input
            type="text"
            value={formLocation}
            onChange={(e) => setFormLocation(e.target.value)}
            placeholder="Bijv. Restaurant XYZ"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beschrijving
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Extra details..."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !formTitle.trim()}
            className="flex-1 btn-primary"
          >
            {isSubmitting ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedEvent) {
                setIsEditing(false);
              } else {
                setShowEventModal(false);
              }
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Annuleren
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <header className="glass border-b border-white/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Dateplanner</h1>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentMonth, 'MMMM yyyy', { locale: nl })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderCalendarDays()}
          </div>
        </motion.div>

        {/* Upcoming events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-4 mt-4"
        >
          <h2 className="font-semibold text-gray-800 mb-3">Aankomende dates</h2>
          {events
            .filter((e) => new Date(e.date) >= new Date(format(new Date(), 'yyyy-MM-dd')))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map((event) => (
              <button
                key={event.id}
                onClick={() => {
                  setSelectedEvent(event);
                  setSelectedDate(new Date(event.date));
                  setShowEventModal(true);
                  setIsEditing(false);
                }}
                className="w-full text-left p-3 hover:bg-white/50 rounded-xl transition-colors flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex flex-col items-center justify-center text-primary-700">
                  <span className="text-xs font-medium">
                    {format(new Date(event.date), 'MMM', { locale: nl })}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {format(new Date(event.date), 'd')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {event.time && `${event.time} • `}
                    {event.location || 'Geen locatie'}
                  </p>
                </div>
              </button>
            ))}
          {events.filter((e) => new Date(e.date) >= new Date(format(new Date(), 'yyyy-MM-dd'))).length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">
              Nog geen dates gepland
            </p>
          )}
        </motion.div>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEventModal(false);
                setIsEditing(false);
              }
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md glass rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
            >
              {isEditing ? (
                renderEventForm()
              ) : selectedEvent ? (
                renderEventDetail()
              ) : (
                renderEventsList()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
