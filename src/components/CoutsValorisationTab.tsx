import React, { useMemo } from 'react';
import { Equipment } from '../types';
import { FileSpreadsheet, TrendingUp, DollarSign, PieChart as PieChartIcon, Package } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CoutsValorisationTabProps {
  equipments: Equipment[];
}

export default function CoutsValorisationTab({ equipments }: CoutsValorisationTabProps) {
  // Calculs de valorisation
  const stats = useMemo(() => {
    let totalValue = 0;
    let itemsWithValue = 0;
    let totalItems = equipments.length;
    
    const valueByCategory: Record<string, number> = {};
    const topValuableItems = [...equipments]
      .filter(eq => (eq.prixUnitaire || 0) > 0 && (eq.quantite || 0) > 0)
      .map(eq => ({ ...eq, totalValue: (eq.prixUnitaire || 0) * (eq.quantite || 0) }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);

    equipments.forEach(eq => {
      if (eq.prixUnitaire) {
        itemsWithValue++;
        const itemTotal = eq.prixUnitaire * (eq.quantite || 0);
        totalValue += itemTotal;
        
        if (itemTotal > 0) {
          valueByCategory[eq.categorie] = (valueByCategory[eq.categorie] || 0) + itemTotal;
        }
      }
    });

    const categoryData = Object.entries(valueByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { totalValue, itemsWithValue, totalItems, categoryData, topValuableItems };
  }, [equipments]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-100 text-red-700 rounded-xl">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tableau Financier</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Valorisation globale du stock et répartition des coûts</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Valeur Totale du Stock</h3>
            <div className="p-2 bg-red-100 text-red-700 rounded-lg"><DollarSign className="h-5 w-5" /></div>
          </div>
          <p className="text-3xl font-black text-slate-900">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs font-bold text-slate-400 mt-2">Basé sur les quantités actuelles</p>
        </div>
        
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Articles Valorisés</h3>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg"><Package className="h-5 w-5" /></div>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.itemsWithValue} <span className="text-lg text-slate-400">/ {stats.totalItems}</span></p>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-red-500 h-full rounded-full" 
              style={{ width: `${stats.totalItems > 0 ? (stats.itemsWithValue / stats.totalItems) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Catégorie Principale</h3>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <p className="text-xl font-black text-slate-900 truncate">{stats.categoryData[0]?.name || 'N/A'}</p>
          <p className="text-sm font-bold text-red-600 mt-1">{stats.categoryData[0] ? formatCurrency(stats.categoryData[0].value) : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de répartition */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-slate-400" /> Répartition par Catégorie
          </h3>
          <div className="h-[300px] w-full">
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400">Aucune donnée valorisée</div>
            )}
          </div>
          
          <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-2">
            {stats.categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="font-bold text-slate-700">{cat.name}</span>
                </div>
                <span className="font-black text-slate-900">{formatCurrency(cat.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top articles valorisés */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-400" /> Top 10 Valeurs en Stock
          </h3>
          <div className="space-y-3">
            {stats.topValuableItems.length > 0 ? (
              stats.topValuableItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm truncate max-w-[180px] sm:max-w-[250px]">{item.nom}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.quantite} {item.unite} à {item.prixUnitaire} MAD</p>
                    </div>
                  </div>
                  <div className="font-black text-slate-900">
                    {formatCurrency(item.totalValue)}
                  </div>
                </div>
              ))
            ) : (
               <div className="p-4 text-center text-sm font-bold text-slate-400">Aucun article valorisé en stock</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
