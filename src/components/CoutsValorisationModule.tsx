import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { DollarSign, Database, Search, Edit2, Check, X } from 'lucide-react';
import { Equipment, User } from '../types';

interface CoutsValorisationModuleProps {
  equipments: Equipment[];
  onUpdateEquipment: (eq: Equipment) => void;
  currentUser: User | null;
}

export default function CoutsValorisationModule({ equipments, onUpdateEquipment, currentUser }: CoutsValorisationModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  
  const savePrice = (eq: Equipment) => {
    const numPrice = parseFloat(editPrice);
    if (!isNaN(numPrice) && numPrice >= 0 && numPrice !== eq.prixUnitaire) {
      onUpdateEquipment({
        ...eq,
        prixUnitaire: numPrice,
        derniereMaj: new Date().toISOString()
      });
    }
    setEditingId(null);
  };

  const handleEditPrice = (eq: Equipment) => {
    setEditPrice((eq.prixUnitaire || 0).toString());
    setEditingId(eq.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  // Derived metrics for Valorisation
  const stockMetrics = useMemo(() => {
    let totalValue = 0;
    equipments.forEach(eq => {
      const price = eq.prixUnitaire || 0;
      const value = eq.quantite * price;
      if (price > 0 && eq.quantite > 0) {
        totalValue += value;
      }
    });
    return { totalValue };
  }, [equipments]);

  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => 
      eq.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (eq.reference && eq.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.categorie && eq.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [equipments, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Coût du Matériel</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Valorisation financière du stock d'articles.
          </p>
        </div>
      </div>

      {/* Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Global Valuation Card */}
        <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
          <div>
            <h3 className="text-emerald-100 font-bold uppercase tracking-wider text-sm mb-1">Valeur Totale du Matériel</h3>
            <div className="text-4xl font-black">{formatCurrency(stockMetrics.totalValue)}</div>
          </div>
          <Database className="h-16 w-16 opacity-20" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un matériel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right w-48">Prix unitaire</th>
                  <th className="px-4 py-3 text-right">Prix total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipments.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-800">{eq.nom}</td>
                    <td className="px-4 py-3 text-right font-medium">{eq.quantite}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {editingId === eq.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 text-right border border-emerald-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePrice(eq);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => savePrice(eq)} className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-sm">
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3 group-hover:bg-slate-50 rounded-lg pr-2 py-1">
                          <span className="text-slate-800">{formatCurrency(eq.prixUnitaire || 0)}</span>
                          <button 
                            onClick={() => handleEditPrice(eq)} 
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Modifier le montant unitaire"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">
                      {formatCurrency(eq.quantite * (eq.prixUnitaire || 0))}
                    </td>
                  </tr>
                ))}
                {filteredEquipments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Aucun matériel trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
