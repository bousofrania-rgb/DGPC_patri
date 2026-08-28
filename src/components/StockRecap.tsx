import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Layers, 
  Search, 
  Filter, 
  Printer, 
  Briefcase 
} from 'lucide-react';
import { Equipment, StockMovement } from '../types';

interface StockRecapProps {
  equipments: Equipment[];
  movements: StockMovement[];
}

type PeriodType = 'journalier' | 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'personnalise';

export default function StockRecap({ equipments, movements }: StockRecapProps) {
  const [period, setPeriod] = useState<PeriodType>('mensuel');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  // Tab states for previewing/expanding
  const [showAllItems, setShowAllItems] = useState(false);
  const [selectedSpecificEquipmentId, setSelectedSpecificEquipmentId] = useState<string>('');

  // Parse DD/MM/YYYY into a proper Date object
  const parseFrenchDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Determine date boundaries based on selected period
  const dateRange = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'journalier':
        break;
      case 'mensuel':
        start.setDate(start.getDate() - 30);
        break;
      case 'trimestriel':
        start.setDate(start.getDate() - 90);
        break;
      case 'semestriel':
        start.setDate(start.getDate() - 180);
        break;
      case 'annuel':
        start.setDate(start.getDate() - 365);
        break;
      case 'personnalise':
        if (customStartDate) {
          const customStart = new Date(customStartDate);
          if (!isNaN(customStart.getTime())) {
            start.setTime(customStart.getTime());
          }
        }
        if (customEndDate) {
          const customEnd = new Date(customEndDate);
          if (!isNaN(customEnd.getTime())) {
            end.setTime(customEnd.getTime());
            end.setHours(23, 59, 59, 999);
          }
        }
        break;
    }

    return { start, end };
  }, [period, customStartDate, customEndDate]);

  // Extract unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set(equipments.map(e => e.categorie).filter(Boolean));
    return ['Tous', ...Array.from(set)];
  }, [equipments]);

  // Compute stats and aggregated data per equipment
  const recapData = useMemo(() => {
    const { start, end } = dateRange;

    return equipments.map(equip => {
      // Get all movements for this item within the selected period range
      const movementsInPeriod = movements.filter(m => {
        if (m.equipmentId !== equip.id) return false;
        const mDate = parseFrenchDate(m.date);
        return mDate >= start && mDate <= end;
      });

      // Simple rollback approach:
      // Start with current equipment quantite
      let finalStock = equip.quantite;
      
      // Filter out all movements from now back to the start of period to calculate initialStock
      const movementsSinceStartOfTime = movements.filter(m => m.equipmentId === equip.id);
      let initialStockComputed = equip.quantite;
      
      movementsSinceStartOfTime.forEach(m => {
        const mDate = parseFrenchDate(m.date);
        if (mDate >= start) {
          if (m.type === 'Entrée') {
            initialStockComputed -= m.quantite;
          } else if (m.type === 'Sortie') {
            initialStockComputed += m.quantite;
          }
        }
      });

      const entrees = movementsInPeriod
        .filter(m => m.type === 'Entrée')
        .reduce((sum, m) => sum + m.quantite, 0);

      const sorties = movementsInPeriod
        .filter(m => m.type === 'Sortie')
        .reduce((sum, m) => sum + m.quantite, 0);

      const computedFinalStock = initialStockComputed + entrees - sorties;

      return {
        ...equip,
        initialStock: Math.max(0, initialStockComputed),
        entrees,
        sorties,
        finalStock: Math.max(0, computedFinalStock)
      };
    });
  }, [equipments, movements, dateRange]);

  // Filter the table based on user searches & categories
  const filteredRecap = useMemo(() => {
    return recapData.filter(item => {
      const matchSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Tous' || item.categorie === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [recapData, searchTerm, selectedCategory]);

  // Slice list for preview display on-screen (Aperçu 5 lignes)
  const displayedRecap = useMemo(() => {
    return showAllItems ? filteredRecap : filteredRecap.slice(0, 5);
  }, [filteredRecap, showAllItems]);

  // Selected specific item for diagram
  const selectedSpecificItem = useMemo(() => {
    return recapData.find(item => item.id === selectedSpecificEquipmentId) || recapData[0];
  }, [recapData, selectedSpecificEquipmentId]);

  // Aggregate Category movements for Global Chart
  const categoryAggregates = useMemo(() => {
    const agg: Record<string, { category: string, entrees: number, sorties: number }> = {};
    
    // Use filteredRecap to sync global diagram with filter constraints
    filteredRecap.forEach(item => {
      const cat = item.categorie || 'Autre';
      if (!agg[cat]) {
        agg[cat] = { category: cat, entrees: 0, sorties: 0 };
      }
      agg[cat].entrees += item.entrees;
      agg[cat].sorties += item.sorties;
    });
    
    return Object.values(agg);
  }, [filteredRecap]);

  const maxGlobalValue = useMemo(() => {
    let max = 10;
    categoryAggregates.forEach(item => {
      if (item.entrees > max) max = item.entrees;
      if (item.sorties > max) max = item.sorties;
    });
    return Math.ceil(max * 1.15);
  }, [categoryAggregates]);

  const maxSpecificValue = useMemo(() => {
    if (!selectedSpecificItem) return 10;
    const maxVal = Math.max(
      selectedSpecificItem.initialStock,
      selectedSpecificItem.entrees,
      selectedSpecificItem.sorties,
      selectedSpecificItem.finalStock
    );
    return Math.max(10, Math.ceil(maxVal * 1.15));
  }, [selectedSpecificItem]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalInitial = 0;
    let totalEntrees = 0;
    let totalSorties = 0;
    let totalFinal = 0;

    filteredRecap.forEach(item => {
      totalInitial += item.initialStock;
      totalEntrees += item.entrees;
      totalSorties += item.sorties;
      totalFinal += item.finalStock;
    });

    return { totalInitial, totalEntrees, totalSorties, totalFinal };
  }, [filteredRecap]);

  // Export recap as a beautifully-formatted Excel workbook
  const handleExportExcel = () => {
    const dataToExport = filteredRecap.map(item => ({
      'Référence': item.id,
      'Désignation du Matériel': item.nom,
      'Catégorie': item.categorie,
      'Marque': item.marque,
      'Stock Initial': item.initialStock,
      'Entrées': item.entrees,
      'Sorties': item.sorties,
      'Stock Final': item.finalStock,
      'Unité': item.unite
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = [
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recapitulatif Stock');
    
    const fileName = `Recap_Stock_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
      
      {/* Tab Header & Quick Filter Rows */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center">
            <TrendingUp className="h-5 w-5 text-red-600 mr-2" />
            Tableau Récapitulatif des Mouvements
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-0.5">
            Suivi périodique consolidé des entrées, sorties et variations de stocks régionaux.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exporter Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 print:hidden">
        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
          Période du Rapport :
        </span>
        <div className="flex flex-wrap gap-2">
          {(['journalier', 'mensuel', 'trimestriel', 'semestriel', 'annuel', 'personnalise'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                period === p
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {p === 'journalier' ? 'Aujourd\'hui' :
               p === 'mensuel' ? 'Mensuel (30j)' :
               p === 'trimestriel' ? 'Trimestriel (90j)' :
               p === 'semestriel' ? 'Semestriel (180j)' :
               p === 'annuel' ? 'Annuel (365j)' : 'Personnalisé'}
            </button>
          ))}
        </div>

        {/* Custom Calendar datepickers */}
        {period === 'personnalise' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-md animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Date Début</span>
              <div className="relative">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-red-500"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Date Fin</span>
              <div className="relative">
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-red-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Widget 1: Stock initial */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Stock Initial</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">{summaryMetrics.totalInitial}</span>
          </div>
          <div className="p-2.5 bg-slate-200/50 rounded-xl print:hidden">
            <Layers className="h-5 w-5 text-slate-500" />
          </div>
        </div>

        {/* Widget 2: Entrées */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-emerald-600/80 font-black uppercase tracking-wider block">Total Entrées</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">+{summaryMetrics.totalEntrees}</span>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl print:hidden">
            <ArrowUpRight className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        {/* Widget 3: Sorties */}
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-red-600/80 font-black uppercase tracking-wider block">Total Sorties</span>
            <span className="text-xl font-black text-red-700 mt-1 block">-{summaryMetrics.totalSorties}</span>
          </div>
          <div className="p-2.5 bg-red-500/10 rounded-xl print:hidden">
            <ArrowDownLeft className="h-5 w-5 text-red-600" />
          </div>
        </div>

        {/* Widget 4: Stock final */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-600/80 font-black uppercase tracking-wider block">Stock Final</span>
            <span className="text-xl font-black text-amber-800 mt-1 block">{summaryMetrics.totalFinal}</span>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-xl print:hidden">
            <Briefcase className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Analytics Diagrams Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-3xl border border-slate-150">
        
        {/* Diagramme 1: Diagramme Global */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                <Layers className="h-4 w-4 text-indigo-600 mr-1.5 shrink-0" />
                Diagramme Global (par Catégorie)
              </h3>
              <p className="text-[9px] text-slate-400 font-bold">Volumes consolidés d'entrées et de sorties.</p>
            </div>
            <div className="flex items-center space-x-3 text-[9px] font-black uppercase">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-emerald-600 rounded-sm" />
                <span className="text-slate-500">Entrées</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-red-600 rounded-sm" />
                <span className="text-slate-500">Sorties</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-center">
            {categoryAggregates.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
                Aucun mouvement pour afficher le diagramme global.
              </div>
            ) : (
              <div className="w-full">
                <svg viewBox="0 0 500 200" className="w-full h-48">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="65" x2="480" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="110" x2="480" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="155" x2="480" y2="155" stroke="#cbd5e1" strokeWidth="1" />
                  
                  {/* Y Axis scale labels */}
                  <text x="32" y="24" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{maxGlobalValue}</text>
                  <text x="32" y="69" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{Math.round(maxGlobalValue * 0.66)}</text>
                  <text x="32" y="114" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{Math.round(maxGlobalValue * 0.33)}</text>
                  <text x="32" y="159" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">0</text>

                  {/* Bars */}
                  {categoryAggregates.map((item, i) => {
                    const numCategories = categoryAggregates.length;
                    const spacing = 430 / numCategories;
                    const xCenter = 45 + i * spacing + spacing / 2;
                    const barWidth = Math.min(18, spacing / 3);
                    
                    const entreeHeight = (item.entrees / maxGlobalValue) * 135;
                    const sortieHeight = (item.sorties / maxGlobalValue) * 135;
                    
                    return (
                      <g key={i}>
                        {/* Entrees Bar (Green) */}
                        <rect
                          x={xCenter - barWidth - 1.5}
                          y={155 - entreeHeight}
                          width={barWidth}
                          height={entreeHeight}
                          fill="#059669"
                          rx="2"
                          className="transition-all duration-300 hover:opacity-85"
                        >
                          <title>{`Catégorie ${item.category} | Entrées: ${item.entrees}`}</title>
                        </rect>
                        
                        {/* Sorties Bar (Red) */}
                        <rect
                          x={xCenter + 1.5}
                          y={155 - sortieHeight}
                          width={barWidth}
                          height={sortieHeight}
                          fill="#dc2626"
                          rx="2"
                          className="transition-all duration-300 hover:opacity-85"
                        >
                          <title>{`Catégorie ${item.category} | Sorties: ${item.sorties}`}</title>
                        </rect>
                        
                        {/* Category text label */}
                        <text
                          x={xCenter}
                          y="173"
                          textAnchor="middle"
                          className="text-[8px] font-extrabold fill-slate-500 uppercase tracking-tight"
                        >
                          {item.category.length > 9 ? `${item.category.slice(0, 8)}.` : item.category}
                        </text>
                        
                        {/* Interactive counts on top of bars if values fit */}
                        {item.entrees > 0 && entreeHeight > 18 && (
                          <text x={xCenter - barWidth/2 - 1} y={150 - entreeHeight} textAnchor="middle" className="text-[7px] font-black fill-emerald-800 font-mono">{item.entrees}</text>
                        )}
                        {item.sorties > 0 && sortieHeight > 18 && (
                          <text x={xCenter + barWidth/2 + 1} y={150 - sortieHeight} textAnchor="middle" className="text-[7px] font-black fill-red-800 font-mono">{item.sorties}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Diagramme 2: Diagramme Spécifique */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                <Briefcase className="h-4 w-4 text-red-600 mr-1.5 shrink-0" />
                Diagramme Spécifique par Matériel
              </h3>
              <p className="text-[9px] text-slate-400 font-bold">Bilan de stock initial, flux et stock final.</p>
            </div>
            
            {/* Searchable selector dropdown for choosing material */}
            <div className="print:hidden">
              <select
                value={selectedSpecificEquipmentId}
                onChange={(e) => setSelectedSpecificEquipmentId(e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 focus:outline-none cursor-pointer transition-all"
              >
                {recapData.map(item => (
                  <option key={item.id} value={item.id}>{item.nom}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="pt-2 flex justify-center">
            {!selectedSpecificItem ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-semibold">
                Sélectionnez un matériel pour visualiser son bilan de stock.
              </div>
            ) : (
              <div className="w-full">
                <div className="text-center mb-1 print:block hidden">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Matériel : {selectedSpecificItem.nom} ({selectedSpecificItem.id})</span>
                </div>
                <svg viewBox="0 0 400 200" className="w-full h-48">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#f8fafc" strokeWidth="1" />
                  <line x1="40" y1="65" x2="380" y2="65" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="110" x2="380" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="40" y1="155" x2="380" y2="155" stroke="#cbd5e1" strokeWidth="1" />
                  
                  {/* Y Axis scale labels */}
                  <text x="32" y="24" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{maxSpecificValue}</text>
                  <text x="32" y="69" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{Math.round(maxSpecificValue * 0.66)}</text>
                  <text x="32" y="114" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">{Math.round(maxSpecificValue * 0.33)}</text>
                  <text x="32" y="159" textAnchor="end" className="text-[8px] font-black fill-slate-400 font-mono">0</text>

                  {/* Bar 1: Stock Initial */}
                  <rect x="55" y={155 - (selectedSpecificItem.initialStock / maxSpecificValue) * 135} width="38" height={Math.max(2, (selectedSpecificItem.initialStock / maxSpecificValue) * 135)} fill="#64748b" rx="3" />
                  <text x="74" y="173" textAnchor="middle" className="text-[8px] font-black fill-slate-500 uppercase tracking-tight">Initial</text>
                  <text x="74" y={148 - (selectedSpecificItem.initialStock / maxSpecificValue) * 135} textAnchor="middle" className="text-[9px] font-black fill-slate-700 font-mono">{selectedSpecificItem.initialStock}</text>

                  {/* Bar 2: Entrées (+) */}
                  <rect x="135" y={155 - (selectedSpecificItem.entrees / maxSpecificValue) * 135} width="38" height={Math.max(2, (selectedSpecificItem.entrees / maxSpecificValue) * 135)} fill="#10b981" rx="3" />
                  <text x="154" y="173" textAnchor="middle" className="text-[8px] font-black fill-emerald-600 uppercase tracking-tight">Entrées</text>
                  <text x="154" y={148 - (selectedSpecificItem.entrees / maxSpecificValue) * 135} textAnchor="middle" className="text-[9px] font-black fill-emerald-700 font-mono">+{selectedSpecificItem.entrees}</text>

                  {/* Bar 3: Sorties (-) */}
                  <rect x="215" y={155 - (selectedSpecificItem.sorties / maxSpecificValue) * 135} width="38" height={Math.max(2, (selectedSpecificItem.sorties / maxSpecificValue) * 135)} fill="#f43f5e" rx="3" />
                  <text x="234" y="173" textAnchor="middle" className="text-[8px] font-black fill-rose-600 uppercase tracking-tight">Sorties</text>
                  <text x="234" y={148 - (selectedSpecificItem.sorties / maxSpecificValue) * 135} textAnchor="middle" className="text-[9px] font-black fill-rose-700 font-mono">-{selectedSpecificItem.sorties}</text>

                  {/* Bar 4: Stock Final */}
                  <rect x="295" y={155 - (selectedSpecificItem.finalStock / maxSpecificValue) * 135} width="38" height={Math.max(2, (selectedSpecificItem.finalStock / maxSpecificValue) * 135)} fill="#dc2626" rx="3" />
                  <text x="314" y="173" textAnchor="middle" className="text-[8px] font-black fill-red-700 uppercase tracking-tight">Final</text>
                  <text x="314" y={148 - (selectedSpecificItem.finalStock / maxSpecificValue) * 135} textAnchor="middle" className="text-[9px] font-black fill-red-800 font-mono">{selectedSpecificItem.finalStock}</text>
                </svg>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 print:hidden">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-red-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none transition-all"
            placeholder="Rechercher par désignation, référence ou code matériel..."
          />
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recap Table Preview (5 lines) on screen */}
      <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-3xs print:hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
              <th className="p-4 rounded-tl-xl">Réf</th>
              <th className="p-4">Désignation Matériel</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4 text-center bg-slate-800">Stock Initial</th>
              <th className="p-4 text-center text-emerald-400 bg-slate-800">Entrées (+)</th>
              <th className="p-4 text-center text-red-400 bg-slate-800">Sorties (-)</th>
              <th className="p-4 text-center bg-slate-800 rounded-tr-xl">Stock Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedRecap.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-bold uppercase tracking-wide">
                  Aucun mouvement enregistré pour cette période.
                </td>
              </tr>
            ) : (
              displayedRecap.map((item, idx) => {
                const variation = item.finalStock - item.initialStock;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors font-medium text-slate-700">
                    <td className="p-4 font-mono font-black text-slate-900">{item.id}</td>
                    <td className="p-4 font-bold text-slate-900">
                      <div>{item.nom}</div>
                      {item.reference && <span className="text-[10px] text-slate-400 font-medium block">Ref: {item.reference}</span>}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-extrabold uppercase text-[9px]">
                        {item.categorie}
                      </span>
                    </td>
                    <td className="p-4 text-center bg-slate-50/50 font-bold">{item.initialStock} {item.unite}</td>
                    <td className="p-4 text-center bg-slate-50/50 text-emerald-600 font-black">
                      {item.entrees > 0 ? `+${item.entrees}` : '-'}
                    </td>
                    <td className="p-4 text-center bg-slate-50/50 text-red-500 font-black">
                      {item.sorties > 0 ? `-${item.sorties}` : '-'}
                    </td>
                    <td className="p-4 text-center bg-slate-50/80 font-black text-slate-950 flex items-center justify-center space-x-1.5">
                      <span>{item.finalStock} {item.unite}</span>
                      {variation !== 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                          variation > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {variation > 0 ? `↑ +${variation}` : `↓ ${variation}`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Accordion toggle button to show all items */}
      {filteredRecap.length > 5 && (
        <div className="flex justify-center pt-1 print:hidden">
          <button
            onClick={() => setShowAllItems(!showAllItems)}
            className="px-5 py-2.5 border border-slate-200 hover:border-red-400 rounded-xl text-xs font-black uppercase text-slate-700 hover:text-red-600 transition-all flex items-center space-x-1 bg-white cursor-pointer shadow-3xs"
          >
            <span>{showAllItems ? "Voir moins (Aperçu 5 lignes)" : `Afficher tout (${filteredRecap.length} articles)`}</span>
          </button>
        </div>
      )}

      {/* Complete Table for physical printing (Always printed, matching user request) */}
      <div className="hidden print:block border border-slate-200 rounded-2xl overflow-hidden mt-6">
        <div className="bg-slate-100 p-3 border-b border-slate-200 text-center font-black text-xs uppercase text-slate-800">
          RAPPORT DE MOUVEMENTS DE STOCK COMPLET
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
              <th className="p-4">Réf</th>
              <th className="p-4">Désignation Matériel</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4 text-center">Stock Initial</th>
              <th className="p-4 text-center text-emerald-400">Entrées (+)</th>
              <th className="p-4 text-center text-red-400">Sorties (-)</th>
              <th className="p-4 text-center">Stock Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecap.map((item, idx) => {
              const variation = item.finalStock - item.initialStock;
              return (
                <tr key={idx} className="font-medium text-slate-700">
                  <td className="p-4 font-mono font-black text-slate-900">{item.id}</td>
                  <td className="p-4 font-bold text-slate-900">
                    <div>{item.nom}</div>
                    {item.reference && <span className="text-[10px] text-slate-400 font-medium block">Ref: {item.reference}</span>}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded font-extrabold uppercase text-[9px]">
                      {item.categorie}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold">{item.initialStock} {item.unite}</td>
                  <td className="p-4 text-center text-emerald-600 font-black">
                    {item.entrees > 0 ? `+${item.entrees}` : '-'}
                  </td>
                  <td className="p-4 text-center text-red-500 font-black">
                    {item.sorties > 0 ? `-${item.sorties}` : '-'}
                  </td>
                  <td className="p-4 text-center font-black text-slate-900">
                    {item.finalStock} {item.unite} {variation !== 0 ? ` (${variation > 0 ? '+' : ''}${variation})` : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
