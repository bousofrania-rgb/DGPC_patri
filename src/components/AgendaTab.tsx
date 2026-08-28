import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Search, Trash2, Edit2, CheckCircle, Circle, X } from 'lucide-react';
import { StockMovement, PlannedEvent } from '../types';

interface AgendaTabProps {
  historyLogs: StockMovement[];
}

export default function AgendaTab({ historyLogs }: AgendaTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlannedEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'Tâche' | 'Mouvement' | 'Demande' | 'Contrôle' | 'Autre'>('Tâche');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'À faire' | 'En cours' | 'Terminé'>('À faire');

  useEffect(() => {
    const saved = localStorage.getItem('dgpc_planned_events');
    if (saved) {
      try {
        setEvents(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveEvents = (newEvents: PlannedEvent[]) => {
    setEvents(newEvents);
    localStorage.setItem('dgpc_planned_events', JSON.stringify(newEvents));
  };

  const handleOpenModal = (evt?: PlannedEvent) => {
    if (evt) {
      setEditingEvent(evt);
      setTitle(evt.title);
      setDate(evt.date);
      setType(evt.type);
      setDescription(evt.description || '');
      setStatus(evt.status);
    } else {
      setEditingEvent(null);
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setType('Tâche');
      setDescription('');
      setStatus('À faire');
    }
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    if (editingEvent) {
      saveEvents(events.map(ev => ev.id === editingEvent.id ? {
        ...ev, title, date, type, description, status
      } : ev));
    } else {
      saveEvents([...events, {
        id: Date.now().toString(),
        title, date, type, description, status
      }]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    saveEvents(events.filter(ev => ev.id !== id));
  };

  const toggleEventStatus = (evt: PlannedEvent) => {
    const nextStatus = evt.status === 'À faire' ? 'En cours' : evt.status === 'En cours' ? 'Terminé' : 'À faire';
    saveEvents(events.map(e => e.id === evt.id ? { ...e, status: nextStatus } : e));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const getPlannedEventsForDay = (day: number) => {
    const targetDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
    return events.filter(e => e.date === targetDateStr);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Agenda & Planification</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Planifiez vos tâches, contrôles et mouvements</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer">
              <Plus className="h-4 w-4" /> Nouvelle opération
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3 border-2 border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b-2 border-slate-200">
              <h2 className="text-xl font-black text-slate-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="p-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 text-sm transition-colors cursor-pointer">
                  Aujourd'hui
                </button>
                <button onClick={nextMonth} className="p-2 border-2 border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b-2 border-slate-200 bg-slate-50">
              {dayNames.map(day => (
                <div key={day} className="py-3 text-center text-xs font-black uppercase tracking-wider text-slate-500 border-r-2 border-slate-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] p-2 border-r-2 border-b-2 border-slate-100 bg-slate-50/50"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() && 
                  currentDate.getFullYear() === new Date().getFullYear();
                
                const dayEvents = getPlannedEventsForDay(day);

                return (
                  <div key={day} className={`min-h-[120px] p-2 border-r-2 border-b-2 border-slate-100 transition-colors hover:bg-slate-50 ${isToday ? 'bg-indigo-50/30' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                        {day}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(evt => (
                        <div 
                          key={evt.id} 
                          onClick={() => handleOpenModal(evt)}
                          className={`px-2 py-1 rounded text-[10px] font-bold truncate cursor-pointer hover:opacity-80 transition-opacity ${
                            evt.status === 'Terminé' ? 'bg-slate-200 text-slate-500 line-through' :
                            evt.type === 'Contrôle' ? 'bg-purple-100 text-purple-800' : 
                            evt.type === 'Mouvement' ? 'bg-blue-100 text-blue-800' :
                            evt.type === 'Demande' ? 'bg-orange-100 text-orange-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] font-bold text-slate-500 text-center mt-1">
                          + {dayEvents.length - 3} autres
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar ListView */}
          <div className="lg:col-span-1 bg-slate-50 rounded-2xl border-2 border-slate-200 p-4">
            <h3 className="text-sm font-black text-slate-900 uppercase mb-4">Opérations à venir</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {events
                .filter(e => e.status !== 'Terminé' && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 10)
                .map(evt => (
                <div key={evt.id} className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => toggleEventStatus(evt)} className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
                        {evt.status === 'Terminé' ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                      </button>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        evt.type === 'Contrôle' ? 'bg-purple-100 text-purple-700' : 
                        evt.type === 'Mouvement' ? 'bg-blue-100 text-blue-700' :
                        evt.type === 'Demande' ? 'bg-orange-100 text-orange-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {evt.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleOpenModal(evt)} className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDeleteEvent(evt.id)} className="text-slate-400 hover:text-red-600 p-1 cursor-pointer">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{evt.title}</h4>
                  <div className="flex items-center text-[10px] font-bold text-slate-500 mt-1">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {new Date(evt.date).toLocaleDateString('fr-FR')}
                  </div>
                  {evt.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{evt.description}</p>
                  )}
                </div>
              ))}
              {events.filter(e => e.status !== 'Terminé' && new Date(e.date) >= new Date()).length === 0 && (
                <div className="text-center py-6 text-sm text-slate-500 font-medium">
                  Aucune opération planifiée.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Planification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">{editingEvent ? 'Modifier l\'opération' : 'Nouvelle opération'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 cursor-pointer rounded-xl hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">Titre</label>
                  <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" placeholder="Ex: Inventaire annuel" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">Date</label>
                    <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">Type</label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white">
                      <option>Tâche</option>
                      <option>Mouvement</option>
                      <option>Demande</option>
                      <option>Contrôle</option>
                      <option>Autre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option>À faire</option>
                    <option>En cours</option>
                    <option>Terminé</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 uppercase">Description (Optionnelle)</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" placeholder="Détails de l'opération..."></textarea>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 text-sm font-bold transition-colors cursor-pointer">Annuler</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-md transition-all cursor-pointer">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
