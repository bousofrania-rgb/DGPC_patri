import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart2, 
  ShoppingCart, Users, AlertTriangle, FileText, Download,
  Plus, Search, Edit2, Check, X, ShieldAlert, FileSpreadsheet, Building2,
  Database, RefreshCw, ChevronRight, AlertCircle, Calculator, Save
} from 'lucide-react';
import { User, Fournisseur, MarcheBC, ArticleCommande, Budget, Equipment } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  addOfficialHeader, 
  addDocumentTitleBanner, 
  addSummaryCards, 
  getStandardAutoTableOptions, 
  addOfficialSignatureBlock, 
  addOfficialPageFooters 
} from '../pdfUtils';

interface FinanceModuleProps {
  currentUser: User;
  equipments?: Equipment[];
}

export default function FinanceModule({ currentUser, equipments = [] }: FinanceModuleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'marches' | 'fournisseurs' | 'ecarts' | 'rapports'>('dashboard');
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // Initialize all budgets to 0
  const [budget, setBudget] = useState<Budget>({
    id: 'b-2026',
    annee: new Date().getFullYear(),
    libelle: `Budget Fonctionnement & Équipement ${new Date().getFullYear()}`,
    montantGlobalTTC: 0,
    montantEngageTTC: 0,
    montantConsommeTTC: 0,
  });

  const [editBudgetFormData, setEditBudgetFormData] = useState({
    global: '0',
    engage: '0',
    consomme: '0'
  });

  // Start with empty lists for real zero-state
  const [fournisseurs] = useState<Fournisseur[]>([]);
  const [marches] = useState<MarcheBC[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const handleStartEdit = () => {
    setEditBudgetFormData({
      global: budget.montantGlobalTTC.toString(),
      engage: budget.montantEngageTTC.toString(),
      consomme: budget.montantConsommeTTC.toString()
    });
    setIsEditingBudget(true);
  };

  const handleSaveBudget = () => {
    setBudget({
      ...budget,
      montantGlobalTTC: parseFloat(editBudgetFormData.global) || 0,
      montantEngageTTC: parseFloat(editBudgetFormData.engage) || 0,
      montantConsommeTTC: parseFloat(editBudgetFormData.consomme) || 0,
    });
    setIsEditingBudget(false);
  };

  const autoCalculateFromStock = () => {
    let totalStockValue = 0;
    equipments.forEach(eq => {
      const price = eq.prixUnitaire || 0;
      if (price > 0 && eq.quantite > 0) {
        totalStockValue += (price * eq.quantite);
      }
    });

    setEditBudgetFormData({
      ...editBudgetFormData,
      engage: totalStockValue.toString(),
      consomme: totalStockValue.toString()
    });
    
    // Automatically save it too if we're not currently editing
    if (!isEditingBudget) {
      setBudget({
        ...budget,
        montantEngageTTC: totalStockValue,
        montantConsommeTTC: totalStockValue,
      });
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Budget Setup / Edit Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Configuration du Budget</h3>
            <p className="text-xs text-slate-500 mt-1">Définissez manuellement les montants ou calculez-les automatiquement selon la valeur du stock.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={autoCalculateFromStock}
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border border-indigo-200"
            >
              <Calculator className="h-4 w-4" /> Auto-calculer via Stock
            </button>
            {!isEditingBudget ? (
              <button 
                onClick={handleStartEdit}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Edit2 className="h-4 w-4" /> Modifier manuellement
              </button>
            ) : (
              <button 
                onClick={handleSaveBudget}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Save className="h-4 w-4" /> Enregistrer
              </button>
            )}
          </div>
        </div>

        {isEditingBudget && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Budget Global Alloué (MAD)</label>
              <input 
                type="number" 
                value={editBudgetFormData.global}
                onChange={e => setEditBudgetFormData({...editBudgetFormData, global: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Montant Engagé (MAD)</label>
              <input 
                type="number" 
                value={editBudgetFormData.engage}
                onChange={e => setEditBudgetFormData({...editBudgetFormData, engage: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Montant Consommé (MAD)</label>
              <input 
                type="number" 
                value={editBudgetFormData.consomme}
                onChange={e => setEditBudgetFormData({...editBudgetFormData, consomme: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium"
              />
            </div>
          </div>
        )}
      </div>

      {/* Budget KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database className="h-16 w-16" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Budget Global Alloué</h3>
          <div className="text-2xl font-black text-slate-800">{formatCurrency(budget.montantGlobalTTC)}</div>
          <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{budget.annee} - {budget.libelle}</div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText className="h-16 w-16 text-indigo-600" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Montant Engagé</h3>
          <div className="text-2xl font-black text-indigo-600">{formatCurrency(budget.montantEngageTTC)}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${budget.montantGlobalTTC > 0 ? (budget.montantEngageTTC / budget.montantGlobalTTC) * 100 : 0}%` }} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">{budget.montantGlobalTTC > 0 ? ((budget.montantEngageTTC / budget.montantGlobalTTC) * 100).toFixed(1) : '0.0'}% du budget</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Check className="h-16 w-16 text-emerald-600" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Montant Consommé</h3>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(budget.montantConsommeTTC)}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${budget.montantEngageTTC > 0 ? (budget.montantConsommeTTC / budget.montantEngageTTC) * 100 : 0}%` }} />
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">{budget.montantEngageTTC > 0 ? ((budget.montantConsommeTTC / budget.montantEngageTTC) * 100).toFixed(1) : '0.0'}% des engagements</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertTriangle className="h-16 w-16 text-amber-600" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Solde Disponible</h3>
          <div className="text-2xl font-black text-amber-600">{formatCurrency(Math.max(0, budget.montantGlobalTTC - budget.montantEngageTTC))}</div>
          <div className="text-[10px] font-bold text-amber-700/70 mt-2 bg-amber-50 px-2 py-1 rounded-md inline-block">Reste à engager sur l'année</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recents Marchés */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-slate-400" />
              Marchés & BC Récents
            </h3>
            <button onClick={() => setActiveTab('marches')} className="text-[10px] font-bold text-indigo-600 uppercase hover:underline">Voir tout</button>
          </div>
          <div className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Réf</th>
                  <th className="px-4 py-3">Fournisseur</th>
                  <th className="px-4 py-3 text-right">Engagé</th>
                  <th className="px-4 py-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {marches.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{m.numero}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{m.fournisseurNom}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(m.montantEngageTTC)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                        m.statut === 'En cours' ? 'bg-indigo-50 text-indigo-700' :
                        m.statut === 'Livré Partiellement' ? 'bg-amber-50 text-amber-700' :
                        m.statut === 'Soldé' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.statut}
                      </span>
                    </td>
                  </tr>
                ))}
                {marches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">
                      Aucun marché enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ecarts Alertes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-500" />
              Écarts & Anomalies
            </h3>
            <button onClick={() => setActiveTab('ecarts')} className="text-[10px] font-bold text-emerald-600 uppercase hover:underline">Analyser</button>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-600">Aucune anomalie</div>
            <p className="text-xs text-slate-500 mt-2 font-medium max-w-sm">
              Les quantités facturées correspondent aux quantités physiquement réceptionnées dans le stock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const exportBilanPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    let y = await addOfficialHeader(doc, {
      isLandscape: true,
      siteName: "Service Gestion du Patrimoine & Finances",
      depotLocation: "Rabat-Salé-Kénitra",
      documentReference: `BILAN-FIN-${budget.annee}-${new Date().getMonth() + 1}`
    });

    const tauxEngagement = budget.montantGlobalTTC > 0 ? ((budget.montantEngageTTC / budget.montantGlobalTTC) * 100).toFixed(1) : '0.0';
    const reliquat = Math.max(0, budget.montantGlobalTTC - budget.montantEngageTTC);

    // Title banner
    y = addDocumentTitleBanner(doc, {
      startY: y,
      title: `BILAN FINANCIER & ÉTAT DES MARCHÉS — EXERCICE ${budget.annee}`,
      subtitle: `${budget.libelle} — Direction Générale de la Protection Civile`,
      badge: "SITUATION OFFICIELLE",
      badgeColor: [5, 150, 105],
      metadata: [
        { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
        { label: "Budget Global TTC", value: formatCurrency(budget.montantGlobalTTC) },
        { label: "Taux d'engagement", value: `${tauxEngagement} %` },
        { label: "Reliquat disponible", value: formatCurrency(reliquat) }
      ],
      isLandscape: true
    });

    // Metric cards
    y = addSummaryCards(doc, y, [
      {
        title: "Budget Alloué (TTC)",
        value: formatCurrency(budget.montantGlobalTTC),
        subtitle: `Année budgétaire ${budget.annee}`,
        color: [15, 23, 42],
        bgColor: [248, 250, 252]
      },
      {
        title: "Montant Engagé",
        value: formatCurrency(budget.montantEngageTTC),
        subtitle: `${tauxEngagement}% du budget total`,
        color: [79, 70, 229],
        bgColor: [238, 242, 255]
      },
      {
        title: "Montant Consommé (Payé)",
        value: formatCurrency(budget.montantConsommeTTC),
        subtitle: "Factures et décomptes réglés",
        color: [5, 150, 105],
        bgColor: [236, 253, 245]
      },
      {
        title: "Reliquat Disponible",
        value: formatCurrency(reliquat),
        subtitle: "Crédits de paiement restants",
        color: [217, 119, 6],
        bgColor: [255, 251, 235]
      }
    ]);

    // Table
    const tableData = marches.map(m => [
      m.numero,
      m.type,
      m.fournisseurNom,
      m.dateCommande,
      formatCurrency(m.montantEngageTTC),
      formatCurrency(m.montantConsommeTTC),
      m.statut
    ]);

    autoTable(doc, getStandardAutoTableOptions({
      startY: y,
      head: [['Réf Marché / BC', 'Type', 'Fournisseur / Attributaire', 'Date Commande', 'Montant Engagé (TTC)', 'Montant Consommé (TTC)', 'Statut Actuel']],
      body: tableData.length > 0 ? tableData : [['-', '-', 'Aucun marché', '-', '-', '-', '-']],
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 35 },
        1: { cellWidth: 28 },
        2: { cellWidth: 60 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 40, halign: 'right' },
        5: { cellWidth: 40, halign: 'right' },
        6: { cellWidth: 35, halign: 'center' }
      }
    }));

    y = (doc as any).lastAutoTable.finalY + 6;

    addOfficialSignatureBlock(doc, y, {
      leftTitle: "« Le Responsable des Marchés & Finances »",
      leftSubtitle: "Visa de conformité budgétaire",
      rightTitle: "« Le Commandant Régional DGPC »",
      rightSubtitle: "Validation officielle et visa d'ordonnancement"
    });

    addOfficialPageFooters(doc);

    doc.save(`Bilan_Financier_DGPC_${budget.annee}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestion Financière & Achats</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Module de suivi des budgets, marchés, commandes, et cohérence des stocks.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-wider">Accès Restreint : {currentUser.role}</span>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'dashboard', icon: PieChart, label: 'Tableau de bord' },
            { id: 'marches', icon: ShoppingCart, label: 'Marchés & BC' },
            { id: 'fournisseurs', icon: Building2, label: 'Fournisseurs' },
            { id: 'ecarts', icon: ShieldAlert, label: 'Écarts & Audit' },
            { id: 'rapports', icon: FileSpreadsheet, label: 'Rapports' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id 
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <t.icon className={`h-4 w-4 ${activeTab === t.id ? 'text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'dashboard' && renderDashboard()}
        
        {activeTab === 'marches' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Marchés & Bons de Commande</h3>
                <p className="text-xs text-slate-500 mt-1">Suivi détaillé des engagements financiers et des livraisons.</p>
              </div>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nouveau
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Réf & Type</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Fournisseur</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Dates</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-right">Montant (TTC)</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Consommation</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Statut</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marches.map(marche => {
                    const pourcentage = (marche.montantConsommeTTC / marche.montantEngageTTC) * 100;
                    return (
                      <tr key={marche.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{marche.numero}</div>
                          <div className="text-[10px] text-slate-500 uppercase">{marche.type}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{marche.fournisseurNom}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <div>Cmd: {marche.dateCommande}</div>
                          <div className="text-[10px] text-slate-400">Prévue: {marche.dateLivraisonPrevue}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-indigo-700">{formatCurrency(marche.montantEngageTTC)}</div>
                          <div className="text-[10px] text-slate-500">Reste: {formatCurrency(marche.montantEngageTTC - marche.montantConsommeTTC)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${pourcentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                style={{ width: `${Math.min(pourcentage, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-bold text-slate-600 w-9 text-right">{pourcentage.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            marche.statut === 'En cours' ? 'bg-amber-100 text-amber-700' :
                            marche.statut === 'Livré Partiellement' ? 'bg-blue-100 text-blue-700' :
                            marche.statut === 'Soldé' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {marche.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {marches.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Aucun marché ou bon de commande enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'fournisseurs' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Annuaire des Fournisseurs</h3>
                <p className="text-xs text-slate-500 mt-1">Gestion des prestataires et historique financier.</p>
              </div>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <Plus className="h-4 w-4" /> Ajouter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Société</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Contact</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase">Marchés/BC Actifs</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-right">Volume d'Affaires</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-center">Statut</th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-xs uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fournisseurs.map(fournisseur => (
                    <tr key={fournisseur.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{fournisseur.nom}</td>
                      <td className="px-4 py-3 text-slate-600">{fournisseur.contactNom || fournisseur.telephone}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">0</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(0)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                          {fournisseur.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fournisseurs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Aucun fournisseur enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ecarts' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">Analyse des Écarts & Audit Croisé</h3>
                <p className="text-xs text-slate-500 mt-1">Détection automatique des incohérences entre BC, réceptions et stock.</p>
              </div>
              <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors">
                <RefreshCw className="h-3 w-3" /> Lancer l'audit
              </button>
            </div>
            
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <h4 className="text-xl font-black text-slate-800">Aucune anomalie détectée</h4>
              <p className="text-sm text-slate-500 mt-2 max-w-md">
                Toutes les entrées en stock correspondent aux commandes. Il n'y a pas d'écart financier.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rapports' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center animate-fadeIn">
            <FileSpreadsheet className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-700 mb-2">Génération de Rapports Financiers</h3>
            <p className="text-sm text-slate-500 mb-6">Exportez les situations financières, les tableaux de consommation budgétaire et les audits au format PDF ou Excel.</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={exportBilanPDF}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Bilan PDF
              </button>
              <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors inline-flex items-center gap-2">
                <Download className="h-4 w-4" /> Export Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
