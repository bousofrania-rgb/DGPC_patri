import React, { useState, useEffect, useMemo } from 'react';
import { Equipment } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  FileDown, 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  CheckSquare, 
  Square,
  Sparkles,
  Info,
  Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { 
  addOfficialHeader, 
  addDocumentTitleBanner, 
  addSummaryCards, 
  getStandardAutoTableOptions, 
  addOfficialSignatureBlock, 
  addOfficialPageFooters 
} from '../pdfUtils';
import autoTable from 'jspdf-autotable';

interface UrgenceTabProps {
  equipments: Equipment[];
  onUpdateEquipment: (updated: Equipment) => void;
}

export default function UrgenceTab({ equipments, onUpdateEquipment }: UrgenceTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  // Single global urgency context input, persisted in localStorage
  const [globalUrgencyText, setGlobalUrgencyText] = useState(() => {
    return localStorage.getItem('gis_dgpc_global_urgency_text') || '';
  });

  useEffect(() => {
    localStorage.setItem('gis_dgpc_global_urgency_text', globalUrgencyText);
    
    // Auto-update urgenceText for all required items to match the global text
    equipments.forEach(item => {
      if (item.requisEnCasDUrgence && item.urgenceText !== globalUrgencyText) {
        onUpdateEquipment({
          ...item,
          urgenceText: globalUrgencyText.trim() || "Urgence générale"
        });
      }
    });
  }, [globalUrgencyText]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = equipments.map(item => item.categorie).filter(Boolean);
    return ['Tous', ...Array.from(new Set(cats))].sort();
  }, [equipments]);

  // Filter equipments for the main list
  const filteredEquipments = useMemo(() => {
    return equipments.filter(item => {
      const matchSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Tous' || item.categorie === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [equipments, searchTerm, selectedCategory]);

  // Requisite items for the summary table
  const requiredItems = useMemo(() => {
    return equipments.filter(item => item.requisEnCasDUrgence);
  }, [equipments]);

  // Handle toggling requisition checkbox
  const handleRequisiteToggle = (item: Equipment) => {
    onUpdateEquipment({
      ...item,
      requisEnCasDUrgence: !item.requisEnCasDUrgence,
      urgenceText: !item.requisEnCasDUrgence ? (globalUrgencyText.trim() || "Urgence générale") : ""
    });
  };

  // Bulk action: check/uncheck all filtered items
  const toggleAllFiltered = (check: boolean) => {
    filteredEquipments.forEach(item => {
      onUpdateEquipment({
        ...item,
        requisEnCasDUrgence: check,
        urgenceText: check ? (globalUrgencyText.trim() || "Urgence générale") : ""
      });
    });
  };

  // Export to Excel (CSV with UTF-8 BOM for French accents)
  const exportToExcel = () => {
    if (requiredItems.length === 0) return;
    
    const motifStr = globalUrgencyText.trim() || 'Urgence non spécifiée';
    const firstRow = [`MOTIF DE L'URGENCE : ${motifStr}`];
    const headers = ['Article N°', 'Désignation', 'Catégorie', 'Quantité Actuelle', 'Stock Faible (Seuil)'];
    
    const rows = requiredItems.map(item => [
      item.id,
      item.nom,
      item.categorie,
      item.quantite.toString(),
      item.quantite <= item.qteMin ? `Oui (Min: ${item.qteMin})` : `Non (Min: ${item.qteMin})`
    ]);

    const csvContent = "\uFEFF" + [
      firstRow.join(';'),
      '', // empty line
      headers.join(';'),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Plan_Urgence_${motifStr.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF via jsPDF
  const exportToPDF = async () => {
    if (requiredItems.length === 0) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    let startY = await addOfficialHeader(doc, {
      siteName: "Cellule de Crise & Logistique Opérationnelle",
      depotLocation: "Région Rabat-Salé-Kénitra",
      documentReference: `URG-MOBIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    });
    
    const motifStr = globalUrgencyText.trim() || 'Intervention Opérationnelle Spéciale';
    const weakStockCount = requiredItems.filter(i => i.quantite <= i.qteMin).length;

    startY = addDocumentTitleBanner(doc, {
      startY,
      title: "PLAN DE MOBILISATION D'URGENCE — ÉQUIPEMENTS",
      subtitle: `Ordre de réquisition et dotation : ${motifStr}`,
      badge: "ALERTE OPÉRATIONNELLE",
      badgeColor: [185, 28, 28],
      metadata: [
        { label: "Date d'émission", value: new Date().toLocaleDateString('fr-FR') },
        { label: "Articles mobilisés", value: `${requiredItems.length}` },
        { label: "Articles en alerte stock", value: `${weakStockCount}` }
      ]
    });

    startY = addSummaryCards(doc, startY, [
      {
        title: "Articles Requis",
        value: `${requiredItems.length}`,
        subtitle: "Matériels opérationnels",
        color: [185, 28, 28],
        bgColor: [254, 242, 242]
      },
      {
        title: "Alertes Stocks Faibles",
        value: `${weakStockCount}`,
        subtitle: "Seuil critique atteint",
        color: [217, 119, 6],
        bgColor: [255, 251, 235]
      },
      {
        title: "Disponibilité Globale",
        value: weakStockCount === 0 ? "OPTIMALE" : "ATTENTION",
        subtitle: "État du parc mobilisable",
        color: weakStockCount === 0 ? [22, 101, 52] : [185, 28, 28],
        bgColor: weakStockCount === 0 ? [240, 253, 244] : [254, 242, 242]
      }
    ]);

    const bodyData = requiredItems.map(item => [
      item.id,
      item.nom,
      item.categorie,
      item.quantite.toString(),
      item.quantite <= item.qteMin ? "⚠️ Stock Faible" : "✅ Stock OK"
    ]);

    autoTable(doc, getStandardAutoTableOptions({
      startY,
      head: [['Code Article', 'Désignation du Matériel', 'Catégorie / Famille', 'Qté Dispo', 'État du Stock']],
      body: bodyData,
      headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 24, halign: 'center' }
      }
    }));

    const finalY = (doc as any).lastAutoTable.finalY || (startY + 50);

    addOfficialSignatureBlock(doc, finalY + 4, {
      leftTitle: "« Le Responsable Logistique Urgence »",
      leftSubtitle: "Visa de mise à disposition des matériels",
      rightTitle: "« Le Chef d'Opérations / Commandant »",
      rightSubtitle: "Ordre de déploiement et validation"
    });

    addOfficialPageFooters(doc);

    doc.save(`Plan_Urgence_DGPC_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6" id="urgence-section">
      
      {/* Introduction Card */}
      <div className="border-2 border-slate-900 rounded-3xl bg-slate-900 text-white p-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 bg-red-600/10 rounded-full blur-2xl" />
        <div className="absolute left-1/3 bottom-0 w-60 h-20 bg-amber-500/5 rounded-full blur-xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl shrink-0 mt-1">
              <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>Planification d'Urgence</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-500/30">
                  Sécurisé
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                Préparez instantanément la liste de matériel nécessaire pour une urgence spécifique. Saisissez le motif de l'urgence une fois ci-dessous, cochez les articles requis et téléchargez le document officiel d'intervention.
              </p>
            </div>
          </div>
          
          <div className="shrink-0 flex items-center space-x-3 self-end md:self-center">
            <div className="bg-slate-850 border border-slate-800 rounded-2xl px-4 py-2 text-right">
              <span className="text-[9px] text-slate-400 block font-bold uppercase">Éléments Sélectionnés</span>
              <span className="text-lg font-black text-amber-500 font-mono">
                {requiredItems.length} / {equipments.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Box: Set global context to selected items */}
      <div className="border-2 border-slate-900 rounded-3xl bg-white p-5 shadow-xs">
        <div className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-red-600 animate-pulse" />
              <span>Motif ou Contexte de l'Urgence *</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Saisissez le motif unique pour cette opération d'urgence (ce motif s'affichera clairement sur les exports PDF et Excel officiels).
            </p>
          </div>
          
          <div className="w-full">
            <input
              type="text"
              value={globalUrgencyText}
              onChange={(e) => setGlobalUrgencyText(e.target.value)}
              placeholder="Saisissez le motif d'urgence (ex: Tempête hivernale, Inspection nationale, Exercice d'alerte, Visite du DG...)"
              className="w-full rounded-xl border border-slate-250 bg-slate-50/20 px-4 py-3 text-xs text-slate-900 font-bold placeholder-slate-400 focus:ring-1 focus:ring-red-500 focus:outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main Table: Selection of Equipment */}
      <div className="border-2 border-slate-900 rounded-3xl bg-white shadow-xs overflow-hidden">
        {/* Table header/filters bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              1. Sélectionner les Équipements Requis
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par désignation, famille..."
                className="pl-9 pr-4 py-2 w-full sm:w-60 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-3 pr-8 py-2 w-full sm:w-48 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white appearance-none cursor-pointer font-semibold"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-3 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/20 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
          <button 
            onClick={() => toggleAllFiltered(true)}
            className="hover:text-red-600 transition-colors cursor-pointer"
          >
            Tout cocher dans la liste filtrée
          </button>
          <span>|</span>
          <button 
            onClick={() => toggleAllFiltered(false)}
            className="hover:text-red-600 transition-colors cursor-pointer"
          >
            Tout décocher
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">Requis</th>
                <th className="py-3 px-4 w-24">Article N°</th>
                <th className="py-3 px-4 min-w-[200px]">Désignation du matériel</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4 text-center">Quantité actuelle</th>
                <th className="py-3 px-4 text-center">Stock faible (Seuil)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEquipments.map((item) => {
                const isLow = item.quantite <= item.qteMin;
                return (
                  <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.requisEnCasDUrgence ? 'bg-red-50/10' : ''}`}>
                    {/* Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRequisiteToggle(item)}
                        className="p-1 rounded-md hover:bg-slate-100 inline-block focus:outline-none cursor-pointer"
                        title={item.requisEnCasDUrgence ? "Retirer de l'urgence" : "Ajouter à l'urgence"}
                      >
                        {item.requisEnCasDUrgence ? (
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* Article N° */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      {item.id}
                    </td>

                    {/* Nom (Désignation) */}
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-slate-900">{item.nom}</div>
                      {item.marque && <span className="text-[10px] text-slate-400">Société / Marque : {item.marque}</span>}
                    </td>

                    {/* Catégorie */}
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                        {item.categorie}
                      </span>
                    </td>

                    {/* Quantité actuelle */}
                    <td className="py-3 px-4 text-center font-black">
                      <span className={`inline-block px-2.5 py-1 rounded-md ${
                        item.quantite === 0 
                          ? 'bg-red-100 text-red-700' 
                          : isLow 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {item.quantite} {item.unite || 'pcs'}
                      </span>
                    </td>

                    {/* Stock faible */}
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <AlertTriangle className="h-3 w-3 animate-pulse" />
                          <span>Oui (Seuil : {item.qteMin})</span>
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          Non (Seuil : {item.qteMin})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredEquipments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                    Aucun matériel trouvé pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Recap section: Tableau Récapitulatif */}
      <div className="border-2 border-slate-900 rounded-3xl bg-white shadow-xs overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <FileDown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider">
                2. Tableau Récapitulatif des Équipements Mobilisés
              </h2>
              {globalUrgencyText.trim() ? (
                <p className="text-[10px] text-amber-400 mt-0.5 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  <span>Motif : {globalUrgencyText}</span>
                </p>
              ) : (
                <p className="text-[10px] text-red-400 mt-0.5 font-bold">
                  ⚠️ Motif d'urgence non spécifié en haut de page !
                </p>
              )}
            </div>
          </div>

          {requiredItems.length > 0 && (
            <div className="flex items-center space-x-2 mt-3 sm:mt-0">
              <button
                onClick={exportToExcel}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-700 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Excel (CSV)</span>
              </button>

              <button
                onClick={exportToPDF}
                className="flex items-center space-x-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-600/10"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>PDF Officiel</span>
              </button>
            </div>
          )}
        </div>

        {requiredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-4 w-16 text-center">Annuler</th>
                  <th className="py-3 px-4 w-24">Article N°</th>
                  <th className="py-3 px-4">Désignation du matériel</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4 text-center">Quantité actuelle</th>
                  <th className="py-3 px-4 text-center">Alerte Stock Faible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {requiredItems.map((item) => {
                  const isLow = item.quantite <= item.qteMin;
                  return (
                    <tr key={`recap-${item.id}`} className="hover:bg-slate-50/50">
                      {/* Interactive cancel checkbox inside recap table */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleRequisiteToggle(item)}
                          className="p-1 rounded-md text-red-600 hover:bg-red-50 inline-block focus:outline-none cursor-pointer transition-colors"
                          title="Retirer de la liste d'urgence"
                        >
                          <CheckSquare className="h-5 w-5 text-red-600" />
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">{item.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900">{item.nom}</span>
                        {item.marque && <span className="text-[10px] text-slate-400 block">Marque : {item.marque}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {item.categorie}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.quantite} {item.unite || 'pcs'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider">
                            Urgent (Insuffisant)
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider">
                            Stock OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-6 text-center text-slate-400 font-semibold space-y-3 bg-slate-50/20">
            <div className="inline-flex p-3 bg-slate-100 rounded-full text-slate-300">
              <Info className="h-6 w-6" />
            </div>
            <p className="max-w-md mx-auto text-xs leading-relaxed text-slate-400">
              Aucun matériel coché comme requis pour le moment. Cochez des éléments ci-dessus pour bâtir votre liste d'urgence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
