import React, { useState, useMemo } from 'react';
import { User, Equipment, StockMovement } from '../types';
import { Plus, Search, CheckCircle, Package, FileText, Building2, Truck, Save, ArrowDownLeft, ArrowUpRight, Barcode, ShieldCheck } from 'lucide-react';

interface TransactionsEntreesTabProps {
  user: User;
  equipments: Equipment[];
  onUpdateEquipment: (eq: Equipment) => void;
  onAddEquipment: (eq: Equipment) => void;
  onAddMovement: (mvt: StockMovement) => void;
  showToast: (msg: string) => void;
  onNavigate?: (tab: string) => void;
}

export default function TransactionsEntreesTab({ 
  user, 
  equipments, 
  onUpdateEquipment, 
  onAddEquipment, 
  onAddMovement, 
  showToast,
  onNavigate 
}: TransactionsEntreesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);

  const [quantite, setQuantite] = useState<number | ''>('');
  const [marcheOuBc, setMarcheOuBc] = useState('');
  const [numMarche, setNumMarche] = useState('');
  const [societeAttributaire, setSocieteAttributaire] = useState('');
  const [expediteur, setExpediteur] = useState('');
  const [livreurNom, setLivreurNom] = useState('');
  const [conducteurNom, setConducteurNom] = useState('');
  const [observations, setObservations] = useState('');

  const filteredEquipments = useMemo(() => {
    if (!searchTerm) return [];
    return equipments.filter(eq => 
      eq.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
      eq.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.codeBarres && eq.codeBarres.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 10);
  }, [searchTerm, equipments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) {
      showToast('Veuillez sélectionner un article');
      return;
    }
    const qteToAdd = Number(quantite);
    if (!qteToAdd || qteToAdd <= 0) {
      showToast('La quantité doit être supérieure à 0');
      return;
    }

    // 1. Update Equipment
    const updatedEq = {
      ...selectedEq,
      quantite: (Number(selectedEq.quantite) || 0) + qteToAdd,
      derniereMaj: new Date().toLocaleDateString('fr-FR'),
    };
    onUpdateEquipment(updatedEq);

    // 2. Add History Movement
    const newMovement: StockMovement = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'Entrée',
      equipmentId: updatedEq.id,
      equipmentNom: updatedEq.nom,
      quantite: qteToAdd,
      employe: user.fullName,
      employeUsername: user.username,
      service: user.service || '',
      marcheOuBc,
      numMarche,
      societeAttributaire,
      expediteur,
      livreurNom,
      conducteurNom,
      observations
    };
    onAddMovement(newMovement);

    showToast(`Entrée de ${qteToAdd} ${updatedEq.unite} pour ${updatedEq.nom} enregistrée`);
    
    // Reset Form
    setSelectedEq(null);
    setSearchTerm('');
    setQuantite('');
    setMarcheOuBc('');
    setNumMarche('');
    setSocieteAttributaire('');
    setExpediteur('');
    setLivreurNom('');
    setConducteurNom('');
    setObservations('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 md:p-8 shadow-xs">
        
        {/* Navigation Bar Across Transactions Sub-Modules */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white flex items-center gap-2 shadow-xs cursor-default"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Entrées de stock (Actif)
            </button>
            <button 
              onClick={() => onNavigate?.('transactions-sorties')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4 text-[#C84B31]" />
              Sorties de stock
            </button>
            <button 
              onClick={() => onNavigate?.('scanner')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Barcode className="h-4 w-4 text-blue-600" />
              Scan & RFID
            </button>
            <button 
              onClick={() => onNavigate?.('verification')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              ✨ Vérification IA
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Saisie des Entrées</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Enregistrer la réception de nouveaux articles dans le stock</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Article Selection */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Search className="h-4 w-4 text-slate-400" /> Sélection de l'Article
            </h3>
            
            {!selectedEq ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom, réf, code barres..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 text-sm font-bold text-slate-900"
                  />
                  <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                </div>

                {searchTerm && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-64 overflow-y-auto">
                    {filteredEquipments.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {filteredEquipments.map(eq => (
                          <li 
                            key={eq.id}
                            onClick={() => setSelectedEq(eq)}
                            className="p-3 hover:bg-emerald-50 cursor-pointer transition-colors"
                          >
                            <p className="font-bold text-slate-900 text-sm">{eq.nom}</p>
                            <p className="text-xs text-slate-500 font-medium">Réf: {eq.reference} | Stock Actuel: {eq.quantite} {eq.unite}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm font-bold text-slate-500">
                        Aucun article trouvé.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 flex flex-col items-start relative">
                <button 
                  onClick={() => setSelectedEq(null)}
                  className="absolute top-4 right-4 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 px-2 py-1 rounded-lg"
                >
                  Changer
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-6 w-6 text-emerald-600" />
                  <h4 className="font-black text-lg text-slate-900">{selectedEq.nom}</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3 w-full">
                  <p className="text-slate-500">Référence <br/><span className="font-bold text-slate-900">{selectedEq.reference}</span></p>
                  <p className="text-slate-500">Stock Actuel <br/><span className="font-black text-slate-900 text-base">{selectedEq.quantite} {selectedEq.unite}</span></p>
                  <p className="text-slate-500">Emplacement <br/><span className="font-bold text-slate-900">{selectedEq.emplacement}</span></p>
                  <p className="text-slate-500">Catégorie <br/><span className="font-bold text-slate-900">{selectedEq.categorie}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="h-4 w-4 text-slate-400" /> Détails de l'Entrée
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Quantité Reçue <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedEq}
                    className="w-full text-lg p-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-0 font-black text-emerald-700 bg-white"
                  />
                  {selectedEq && <span className="absolute right-4 top-3.5 text-slate-400 font-bold">{selectedEq.unite}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Marché / Bon de Commande</label>
                  <input
                    type="text"
                    value={marcheOuBc}
                    onChange={(e) => setMarcheOuBc(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                    placeholder="Ex: BC-2026-04"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">N° d'Entrée / Réf Document</label>
                  <input
                    type="text"
                    value={numMarche}
                    onChange={(e) => setNumMarche(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Building2 className="h-3 w-3"/> Société Attributaire</label>
                  <input
                    type="text"
                    value={societeAttributaire}
                    onChange={(e) => setSocieteAttributaire(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Building2 className="h-3 w-3"/> Expéditeur (Fournisseur)</label>
                  <input
                    type="text"
                    value={expediteur}
                    onChange={(e) => setExpediteur(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Truck className="h-3 w-3"/> Nom du Livreur</label>
                  <input
                    type="text"
                    value={livreurNom}
                    onChange={(e) => setLivreurNom(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"><Truck className="h-3 w-3"/> Nom du Conducteur</label>
                  <input
                    type="text"
                    value={conducteurNom}
                    onChange={(e) => setConducteurNom(e.target.value)}
                    disabled={!selectedEq}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations / État à la réception</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={!selectedEq}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 font-medium text-sm disabled:opacity-50"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={!selectedEq || !quantite || Number(quantite) <= 0}
                className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Save className="h-5 w-5" /> Enregistrer l'entrée
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
