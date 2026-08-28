import React, { useMemo, useState } from 'react';
import { User, Equipment, StockMovement } from '../types';
import { 
  Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, 
  Search, Calendar as CalendarIcon, Clock, MapPin, 
  TrendingUp, Database, FileText, Bell, CheckCircle, ArrowUpDown,
  Box, DollarSign, Activity, TrendingDown, Barcode, Shield, ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import MiniCalendar from './MiniCalendar';

interface HomeTabProps {
  user: User;
  historyLogs: StockMovement[];
  onNavigate: (tab: string) => void;
  equipments: Equipment[];
  showToast: (msg: string) => void;
  workspaceType?: 'magasin' | 'depot';
  siteName?: string;
  onChangeWorkspace?: () => void;
}

const COLORS = ['#C84B31', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function HomeTab({ 
  user, 
  historyLogs, 
  onNavigate, 
  equipments, 
  showToast,
  workspaceType = 'depot',
  siteName,
  onChangeWorkspace
}: HomeTabProps) {
  
  // KPI Calculations
  const totalArticles = equipments.reduce((acc, eq) => acc + (Number(eq.quantite) || 0), 0);
  const valeurTotale = equipments.reduce((acc, eq) => acc + ((Number(eq.quantite) || 0) * (Number(eq.prixUnitaire) || 0)), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const transactionsCeMois = historyLogs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;
  
  const stockCritiqueCount = equipments.filter(eq => (Number(eq.quantite) || 0) <= (Number(eq.qteMin) || 0)).length;

  // Chart Data: Repartition par catégorie
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    equipments.forEach(eq => {
      const cat = eq.categorie || (eq.nom ? eq.nom.split(' ')[0] : 'Autre');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [equipments]);

  // Chart Data: Evolution des transactions
  const transactionEvolution = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const dayLogs = historyLogs.filter(log => new Date(log.date).toDateString() === d.toDateString());
      
      data.push({
        name: dateStr,
        entrees: dayLogs.filter(l => l.type === 'Entrée').length,
        sorties: dayLogs.filter(l => l.type === 'Sortie').length
      });
    }
    return data;
  }, [historyLogs]);

  const formatter = new Intl.NumberFormat('fr-FR');

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-12 w-full max-w-full overflow-hidden">
      
      {/* 1. Header & Mini-Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left: Refined Institutional Welcome Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 rounded-full px-3.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold text-[#C84B31] uppercase tracking-wider">
                  Direction Générale de la Protection Civile
                </span>
              </div>
              
              {/* Workspace Badge */}
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${
                workspaceType === 'magasin'
                  ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                  : 'bg-red-100/90 text-red-900 border-red-300'
              }`}>
                <span>{workspaceType === 'magasin' ? '🏪 Espace Magasin' : '🏢 Espace Dépôt'}</span>
                {siteName && <span className="font-medium lowercase text-[10px]">({siteName})</span>}
              </div>

              {onChangeWorkspace && (
                <button
                  onClick={onChangeWorkspace}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer"
                >
                  Changer d'espace
                </button>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Bonjour, <span className="text-[#C84B31]">{user.fullName.split(' ')[0]}</span>
            </h1>
            <h2 className="text-lg md:text-xl text-slate-700 font-bold mt-1">
              {workspaceType === 'magasin' 
                ? 'Gestion & Distribution — Espace Magasin' 
                : 'Gestion du Patrimoine — Espace Dépôt Central'}
            </h2>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10 flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigate('scanner')} 
              className="bg-[#C84B31] hover:bg-[#B8422A] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#C84B31]/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Barcode className="h-4 w-4" />
              Scanner un article
            </button>
            <button 
              onClick={() => onNavigate('stock')} 
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="h-4 w-4" />
              Consulter le stock
            </button>
            <button 
              onClick={() => onNavigate('transactions-entrees')} 
              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              Nouvelle Entrée
            </button>
            <button 
              onClick={() => onNavigate('transactions-sorties')} 
              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4 text-[#C84B31]" />
              Nouvelle Sortie
            </button>
            <button 
              onClick={() => onNavigate('verification')} 
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              Vérification IA
            </button>
          </div>
          
          {/* Subtle watermark background badge */}
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-[0.03] pointer-events-none">
            <img 
              src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
              alt="Logo Watermark" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right: Modern Discreet Mini-Calendar Widget */}
        <div className="h-full">
          <MiniCalendar />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-emerald-50/50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Total</p>
              <h3 className="text-3xl font-black text-slate-900">{formatter.format(totalArticles)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 inline-flex px-2 py-1 rounded-lg">
            <TrendingUp className="h-3 w-3 mr-1" />
            Articles disponibles
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-blue-50/50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valeur Estimée</p>
              <h3 className="text-3xl font-black text-slate-900">{formatter.format(valeurTotale)}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-slate-500 bg-slate-50 inline-flex px-2 py-1 rounded-lg">
            Dirhams (DH)
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-[#C84B31]/5 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transactions</p>
              <h3 className="text-3xl font-black text-slate-900">{transactionsCeMois}</h3>
            </div>
            <div className="p-3 bg-[#C84B31]/10 text-[#C84B31] rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-[#C84B31] bg-[#C84B31]/10 inline-flex px-2 py-1 rounded-lg">
            Ce mois
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-red-50/50 w-24 h-24 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Critique</p>
              <h3 className="text-3xl font-black text-red-600">{stockCritiqueCount}</h3>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="flex items-center text-xs font-bold text-red-600 bg-red-50 inline-flex px-2 py-1 rounded-lg">
            <TrendingDown className="h-3 w-3 mr-1" />
            À surveiller
          </div>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1 */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Évolution des transactions</h3>
              <p className="text-xs text-slate-500 font-medium">Entrées vs Sorties sur 7 jours</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C84B31" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#C84B31" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0F172A', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="entrees" name="Entrées" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrees)" />
                <Area type="monotone" dataKey="sorties" name="Sorties" stroke="#C84B31" strokeWidth={3} fillOpacity={1} fill="url(#colorSorties)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">Répartition du patrimoine</h3>
              <p className="text-xs text-slate-500 font-medium">Par catégorie principale</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <PieChart className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 font-medium text-sm">Pas assez de données pour le graphique.</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
