import React, { useState, useMemo } from 'react';
import { Equipment } from '../types';
import { Search, DollarSign, Save, Edit2, CheckCircle, Package } from 'lucide-react';

interface CoutsPrixTabProps {
  equipments: Equipment[];
  onUpdateEquipment: (eq: Equipment) => void;
  showToast: (msg: string) => void;
}

export default function CoutsPrixTab({ equipments, onUpdateEquipment, showToast }: CoutsPrixTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number | ''>('');

  const filteredEquipments = useMemo(() => {
    return equipments.filter(eq => 
      eq.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      eq.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, equipments]);

  const handleEditClick = (eq: Equipment) => {
    setEditingId(eq.id);
    setEditPrice(eq.prixUnitaire || '');
  };

  const handleSaveClick = (eq: Equipment) => {
    const updatedEq = { ...eq, prixUnitaire: Number(editPrice) || 0 };
    onUpdateEquipment(updatedEq);
    showToast(`Prix unitaire mis à jour pour ${eq.nom}`);
    setEditingId(null);
    setEditPrice('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-700 rounded-xl">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestion des Prix Unitaires</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Définir les coûts unitaires pour la valorisation du stock</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-0 text-sm font-bold text-slate-900"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 text-sm">
                <th className="py-4 px-4 font-black uppercase tracking-wider">Article</th>
                <th className="py-4 px-4 font-black uppercase tracking-wider">Catégorie</th>
                <th className="py-4 px-4 font-black uppercase tracking-wider">Stock</th>
                <th className="py-4 px-4 font-black uppercase tracking-wider">Prix Unitaire (MAD)</th>
                <th className="py-4 px-4 font-black uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEquipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">Aucun article trouvé.</td>
                </tr>
              ) : (
                filteredEquipments.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{eq.nom}</p>
                          <p className="text-xs text-slate-500">Réf: {eq.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {eq.categorie}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{eq.quantite} {eq.unite}</span>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === eq.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value ? Number(e.target.value) : '')}
                            className="w-24 p-1.5 rounded-lg border-2 border-red-200 focus:border-red-500 text-sm font-bold bg-white"
                            autoFocus
                          />
                          <span className="text-xs font-bold text-slate-500">MAD</span>
                        </div>
                      ) : (
                        <span className={`font-black text-sm ${eq.prixUnitaire ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                          {eq.prixUnitaire ? `${eq.prixUnitaire.toLocaleString('fr-FR')} MAD` : 'Non défini'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === eq.id ? (
                        <button
                          onClick={() => handleSaveClick(eq)}
                          className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold"
                        >
                          <CheckCircle className="h-4 w-4" /> Enregistrer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(eq)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Modifier le prix"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
