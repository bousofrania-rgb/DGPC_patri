import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  addOfficialHeader, 
  exportComplianceReportPDF, 
  exportSummaryComparisonTablePDF, 
  ComparisonSummaryRow,
  ArticleSummaryItem
} from '../pdfUtils';
import { 
  UploadCloud, ShieldCheck, AlertCircle, FileText, CheckCircle, 
  Search, RefreshCw, ArrowDownLeft, ArrowUpRight, Barcode, 
  Trash2, Eye, Printer, Download, Filter, HelpCircle, Check, X,
  Layers, Database, Sparkles, ChevronRight, AlertTriangle, FileSpreadsheet,
  MapPin, Sliders, CheckCircle2, XCircle, FileWarning, ArrowRight, Info,
  Table, ListChecks, CheckCheck
} from 'lucide-react';
import { Equipment, User, StockMovement } from '../types';

interface VerificationTabProps {
  onNavigate?: (tab: string) => void;
  equipments?: Equipment[];
  historyLogs?: StockMovement[];
  user?: User | null;
  showToast?: (msg: string) => void;
}

interface UploadedDoc {
  title: string;
  fileName?: string;
  content?: string;
  fileData?: string;
  mimeType?: string;
}

interface VerificationReport {
  id: string;
  date: string;
  tolerance: string;
  docTitles: string[];
  resume: string;
  statut_global?: string;
  conformite_globale_pourcentage?: number;
  caracteristiques_conformes?: number;
  caracteristiques_non_conformes?: number;
  caracteristiques_non_verifiables?: number;
  articles?: any[];
  divergences?: any[];
}

export default function VerificationTab({ 
  onNavigate, 
  equipments = [], 
  historyLogs = [], 
  user, 
  showToast 
}: VerificationTabProps) {
  // Navigation Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'comparator' | 'stock-audit' | 'history'>('comparator');

  // Comparator State
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [manualTextInputs, setManualTextInputs] = useState<Record<string, string>>({});
  const [activeManualInput, setActiveManualInput] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState('0%');
  const [isVerifying, setIsVerifying] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTableTerm, setSearchTableTerm] = useState('');

  // Summary Table Dedicated Controls
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'conforme' | 'non_conforme'>('all');
  const [summarySearch, setSummarySearch] = useState('');

  // Past Reports History State
  const [pastReports, setPastReports] = useState<VerificationReport[]>([]);

  // Stock Audit State
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [selectedAuditEq, setSelectedAuditEq] = useState<Equipment | null>(null);
  const [isAuditingItem, setIsAuditingItem] = useState(false);
  const [itemAuditResult, setItemAuditResult] = useState<string | null>(null);

  // Load past reports from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dgpc_verification_reports');
      if (saved) {
        setPastReports(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveReport = (report: VerificationReport) => {
    const updated = [report, ...pastReports];
    setPastReports(updated);
    localStorage.setItem('dgpc_verification_reports', JSON.stringify(updated));
  };

  const deleteReport = (id: string) => {
    const updated = pastReports.filter(r => r.id !== id);
    setPastReports(updated);
    localStorage.setItem('dgpc_verification_reports', JSON.stringify(updated));
    showToast?.('Rapport supprimé');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, title: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      let fileData: string | undefined = undefined;
      let mimeType: string | undefined = undefined;
      let content: string | undefined = undefined;

      if (isImage || isPdf) {
        const buffer = await file.arrayBuffer();
        const base64Str = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileData = base64Str;
        mimeType = file.type;
      } else {
        content = await file.text();
      }

      setDocuments(prev => {
        const existing = prev.filter(d => d.title !== title);
        return [...existing, { 
          title, 
          fileName: file.name, 
          content, 
          fileData, 
          mimeType 
        }];
      });

      showToast?.(`Document "${title}" chargé avec succès`);
    } catch (err: any) {
      setError("Erreur de lecture du fichier.");
    } finally {
      e.target.value = '';
    }
  };

  const handleManualTextSave = (title: string) => {
    const text = manualTextInputs[title];
    if (!text || !text.trim()) return;

    setDocuments(prev => {
      const existing = prev.filter(d => d.title !== title);
      return [...existing, {
        title,
        fileName: 'Saisie manuelle (Texte)',
        content: text.trim()
      }];
    });

    setActiveManualInput(null);
    showToast?.(`Contenu pour "${title}" enregistré`);
  };

  const removeDocument = (title: string) => {
    setDocuments(prev => prev.filter(d => d.title !== title));
  };

  const verifyDocuments = async () => {
    if (documents.length < 2) {
      setError("Veuillez importer au moins 2 documents (ex: Expression de besoin et Bon de commande) pour effectuer la comparaison croisée.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/ai/compare-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents, tolerance })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Erreur inconnue");

      setResults(data.data);

      // Save to history
      const newReport: VerificationReport = {
        id: `REP-${Date.now()}`,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        tolerance,
        docTitles: documents.map(d => d.title),
        resume: data.data.resume || '',
        statut_global: data.data.statut_global || 'CONFORME',
        conformite_globale_pourcentage: data.data.conformite_globale_pourcentage || 100,
        articles: data.data.articles || []
      };

      saveReport(newReport);
      showToast?.('Vérification technique article par article terminée et enregistrée');

    } catch (err: any) {
      setError(err.message || "Erreur lors de la vérification par l'IA");
    } finally {
      setIsVerifying(false);
    }
  };

  const exportCompliancePDF = async () => {
    if (!results) return;
    try {
      await exportComplianceReportPDF(results, documents, tolerance, showToast);
    } catch (err: any) {
      console.error("Error generating Compliance PDF:", err);
      showToast?.("Erreur lors de la génération du rapport PDF");
    }
  };

  // Complete Comparison Summary Table Rows (Reactive to user-selected tolerance)
  const summaryRows: ComparisonSummaryRow[] = useMemo(() => {
    if (!results) return [];
    const list: ComparisonSummaryRow[] = [];
    const articles = results.articles || [];
    const tolStr = tolerance || '0%';
    const tolNum = parseFloat(tolStr.replace(/[^0-9.]/g, '')) || 0;
    const isStrict = tolStr === '0%' || tolStr === '±0%';

    articles.forEach((art: any, artIdx: number) => {
      const artNom = art.designation || `Fourniture N°${artIdx + 1}`;
      const caracs = art.caracteristiques || [];

      caracs.forEach((c: any, cIdx: number) => {
        const caracName = c.caracteristique || `Spécification ${cIdx + 1}`;
        const val1 = String(c.valeur_demandee || c.valeur_doc1 || '—');
        const val2 = String(c.valeur_proposee || c.valeur_doc2 || '—');
        const rawEcart = c.ecart || c.ecart_constate || '0';
        
        let isConf = true;
        let ecartDesc = rawEcart;
        let ecartTolDesc = '';

        // Try extracting numbers for smart comparison
        const num1Match = val1.match(/([+-]?\d+(?:\.\d+)?)/);
        const num2Match = val2.match(/([+-]?\d+(?:\.\d+)?)/);

        if (num1Match && num2Match) {
          const num1 = parseFloat(num1Match[1]);
          const num2 = parseFloat(num2Match[1]);
          
          const diff = Math.abs(num2 - num1);
          const allowedDiff = (num1 * tolNum) / 100;
          
          isConf = diff <= allowedDiff;
          
          const sign = num2 > num1 ? '+' : (num2 < num1 ? '-' : '');
          
          if (diff === 0) {
            ecartDesc = '0';
          } else {
             ecartDesc = `${sign}${diff.toFixed(2).replace(/\.?0+$/, '')}`;
          }
          
          if (isStrict) {
             ecartTolDesc = isConf ? 'Conforme' : `Tolérance 0% dépassée`;
          } else {
             ecartTolDesc = isConf ? `Conforme (Dans la marge ${tolStr})` : `Inconformité (> marge ${tolStr})`;
          }
          
        } else {
          // Textual fallback
          const clean1 = val1.toLowerCase().replace(/\s+/g, ' ').trim();
          const clean2 = val2.toLowerCase().replace(/\s+/g, ' ').trim();
          
          if (clean1 === clean2 || clean1 === '—') {
            isConf = true;
            ecartDesc = 'Identique';
            ecartTolDesc = 'Conforme';
          } else {
            if (isStrict) {
              isConf = false;
              ecartDesc = 'Différent';
              ecartTolDesc = 'Inconformité (Tolérance 0%)';
            } else {
               const isExplicitNonConf = c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'));
               isConf = !isExplicitNonConf;
               ecartDesc = rawEcart !== '—' ? rawEcart : 'Différent';
               ecartTolDesc = isExplicitNonConf ? 'Inconformité' : 'Conforme';
            }
          }
        }

        list.push({
          id: `row-${artIdx}-${cIdx}`,
          articleNom: artNom,
          caracteristique: caracName,
          designationComplete: `${artNom} — ${caracName}`,
          pageDoc1: c.page_doc1 || 'P.1',
          sectionDoc1: c.section_doc1 || '',
          ligneDoc1: c.ligne_doc1 || 'L.1',
          pageDoc2: c.page_doc2 || 'P.2',
          sectionDoc2: c.section_doc2 || '',
          ligneDoc2: c.ligne_doc2 || 'L.1',
          valeurDoc1: val1,
          valeurDoc2: val2,
          differenceConstatee: ecartDesc,
          toleranceAppliquee: tolStr,
          ecartParRapportTolerance: ecartTolDesc,
          statut: isConf ? 'Conforme' : 'Non conforme',
          isConforme: isConf,
          observation: c.observation || (isConf ? 'Spécification conforme' : 'Divergence')
        });
      });
    });

    return list;
  }, [results, tolerance]);

  // Structured Articles Summary List with state, conformity rate and divergences per article
  const articlesSummaryList: ArticleSummaryItem[] = useMemo(() => {
    if (!results) return [];

    const articles = results.articles || [];
    const list: ArticleSummaryItem[] = [];

    articles.forEach((art: any, idx: number) => {
      const artName = art.designation || `Fourniture N°${idx + 1}`;
      // Filter rows belonging to this article
      const artRows = summaryRows.filter(r => r.articleNom === artName || r.designationComplete.startsWith(artName));
      
      const totalSpecs = artRows.length || (art.caracteristiques ? art.caracteristiques.length : 1);
      const conformesSpecs = artRows.filter(r => r.isConforme).length;
      const nonConformesSpecs = totalSpecs - conformesSpecs;
      const isConf = nonConformesSpecs === 0;
      const tauxConf = totalSpecs > 0 ? Math.round((conformesSpecs / totalSpecs) * 100) : 100;

      const divergencesConstates: string[] = artRows
        .filter(r => !r.isConforme)
        .map(r => `${r.caracteristique} : Exigence (${r.valeurDoc1}) ⟷ Livré (${r.valeurDoc2}) [Diff: ${r.differenceConstatee} | ${r.ecartParRapportTolerance}]`);

      // Fallback if no matching artRows but article marked with divergences
      if (divergencesConstates.length === 0 && !isConf && art.resume_article) {
        divergencesConstates.push(art.resume_article);
      }

      list.push({
        id: `art-summary-${idx}`,
        designation: artName,
        referenceModele: art.reference_modele || 'REF-STD',
        marque: art.marque || 'Standard Protection Civile',
        statut: isConf ? 'Conforme' : 'Non conforme',
        isConforme: isConf,
        tauxConformite: tauxConf,
        totalSpecs,
        conformesSpecs,
        nonConformesSpecs,
        divergencesConstates
      });
    });

    // Fallback if no articles array in results
    if (list.length === 0 && summaryRows.length > 0) {
      const groups: Record<string, typeof summaryRows> = {};
      summaryRows.forEach(r => {
        if (!groups[r.articleNom]) groups[r.articleNom] = [];
        groups[r.articleNom].push(r);
      });

      Object.entries(groups).forEach(([name, rows], idx) => {
        const total = rows.length;
        const conf = rows.filter(r => r.isConforme).length;
        const nonConf = total - conf;
        const isC = nonConf === 0;
        const taux = total > 0 ? Math.round((conf / total) * 100) : 100;
        const divs = rows.filter(r => !r.isConforme).map(r => `${r.caracteristique} : Exigence (${r.valeurDoc1}) ⟷ Livré (${r.valeurDoc2}) [${r.ecartParRapportTolerance}]`);

        list.push({
          id: `grouped-art-${idx}`,
          designation: name,
          referenceModele: 'REF-STD',
          marque: 'Standard Protection Civile',
          statut: isC ? 'Conforme' : 'Non conforme',
          isConforme: isC,
          tauxConformite: taux,
          totalSpecs: total,
          conformesSpecs: conf,
          nonConformesSpecs: nonConf,
          divergencesConstates: divs
        });
      });
    }

    return list;
  }, [results, summaryRows]);

  // Filtered Summary Rows for search and status tabs
  const filteredSummaryRows = useMemo(() => {
    return summaryRows.filter(row => {
      const matchStatus = 
        summaryFilter === 'all' ? true :
        summaryFilter === 'conforme' ? row.isConforme :
        summaryFilter === 'non_conforme' ? !row.isConforme : true;

      const q = summarySearch.toLowerCase().trim();
      const matchSearch = !q || (
        row.articleNom.toLowerCase().includes(q) ||
        row.caracteristique.toLowerCase().includes(q) ||
        row.valeurDoc1.toLowerCase().includes(q) ||
        row.valeurDoc2.toLowerCase().includes(q) ||
        row.differenceConstatee.toLowerCase().includes(q) ||
        row.ecartParRapportTolerance.toLowerCase().includes(q)
      );

      return matchStatus && matchSearch;
    });
  }, [summaryRows, summaryFilter, summarySearch]);

  // Dedicated PDF Export of the Summary Comparison Table
  const exportSummaryPDF = async () => {
    if (summaryRows.length === 0) {
      showToast?.("Aucune donnée de comparaison à exporter.");
      return;
    }
    try {
      await exportSummaryComparisonTablePDF(filteredSummaryRows, documents, tolerance, showToast, articlesSummaryList);
    } catch (err: any) {
      console.error("Error generating Summary Table PDF:", err);
      showToast?.("Erreur lors de la génération du tableau PDF");
    }
  };

  // Dedicated Excel Export of the Summary Comparison Table
  const exportSummaryXLSX = () => {
    if (summaryRows.length === 0) {
      showToast?.("Aucune donnée de comparaison à exporter.");
      return;
    }
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Articles Summary
      const articlesData = articlesSummaryList.map((art, idx) => ({
        "N°": idx + 1,
        "Article / Désignation": art.designation,
        "Référence / Modèle": art.referenceModele,
        "Marque": art.marque,
        "État de Conformité": art.statut,
        "Taux de Conformité": `${art.tauxConformite} %`,
        "Total Spécifications": art.totalSpecs,
        "Spécifications Conformes": art.conformesSpecs,
        "Divergences (Écarts)": art.nonConformesSpecs,
        "Détail des Divergences": art.divergencesConstates.join(" | ") || "Aucune divergence"
      }));
      const articlesWorksheet = XLSX.utils.json_to_sheet(articlesData);
      XLSX.utils.book_append_sheet(workbook, articlesWorksheet, "Synthèse Articles");

      // Sheet 2: Detailed Specifications (7 Columns)
      const excelData = filteredSummaryRows.map((r, idx) => ({
        "N°": idx + 1,
        "Fourniture / Désignation": `${r.articleNom} - ${r.caracteristique}`,
        "Valeur du Doc 1": r.valeurDoc1,
        "Valeur du Doc 2": r.valeurDoc2,
        "Différence constatée": r.differenceConstatee,
        "Tolérance appliquée": r.toleranceAppliquee,
        "Écart par rapport à la tolérance": r.ecartParRapportTolerance,
        "Statut": r.statut,
        "Repérage Doc 1": `Page ${r.pageDoc1 || '1'}, Section: ${r.sectionDoc1 || 'N/A'}, ${r.ligneDoc1 || 'L.1'}`,
        "Repérage Doc 2": `Page ${r.pageDoc2 || '1'}, Section: ${r.sectionDoc2 || 'N/A'}, ${r.ligneDoc2 || 'L.1'}`,
        "Observations": r.observation || ''
      }));

      const specsWorksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, specsWorksheet, "Tableau Récapitulatif 7 Col");

      XLSX.writeFile(workbook, `Tableau_Recapitulatif_Articles_DGPC_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast?.("Tableau récapitulatif Excel exporté avec succès !");
    } catch (err: any) {
      console.error("Error generating Excel:", err);
      showToast?.("Erreur lors de l'export Excel");
    }
  };

  // Extract all divergences across articles
  const allDivergences = useMemo(() => {
    if (!results) return [];
    if (results.divergences && Array.isArray(results.divergences) && results.divergences.length > 0) {
      return results.divergences;
    }
    const list: any[] = [];
    (results.articles || []).forEach((art: any) => {
      (art.caracteristiques || []).forEach((c: any) => {
        if (c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'))) {
          list.push({
            article: art.designation,
            element_concerne: c.caracteristique,
            page_doc1: c.page_doc1 || 'Page 1',
            section_doc1: c.section_doc1 || 'Spécifications techniques',
            ligne_doc1: c.ligne_doc1 || 'Ligne N/A',
            page_doc2: c.page_doc2 || 'Page 2',
            section_doc2: c.section_doc2 || 'Offre / Livrable',
            ligne_doc2: c.ligne_doc2 || 'Ligne N/A',
            valeur_doc1: c.valeur_demandee || '—',
            valeur_doc2: c.valeur_proposee || '—',
            ecart_constate: c.ecart || '—',
            tolerance: c.tolerance || tolerance,
            statut: c.resultat || '❌ Non conforme',
            explication: c.observation || 'Écart constaté hors de la tolérance autorisée.'
          });
        }
      });
    });
    return list;
  }, [results, tolerance]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    if (!results?.articles) return [];
    return results.articles.filter((art: any) => {
      const matchFilter = 
        filterStatus === 'all' ? true :
        filterStatus === 'conforme' ? art.statut_article === 'CONFORME' :
        filterStatus === 'divergence' ? art.statut_article === 'NON CONFORME' : true;

      const fullText = `${art.designation || ''} ${art.reference_modele || ''} ${art.marque || ''} ${art.resume_article || ''}`.toLowerCase();
      const matchSearch = !searchTableTerm || fullText.includes(searchTableTerm.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [results, filterStatus, searchTableTerm]);

  // Stock audit filtering
  const stockAnomalies = useMemo(() => {
    return equipments.filter(eq => {
      const qte = Number(eq.quantite) || 0;
      const qteMin = Number(eq.qteMin) || 0;
      const hasDefect = eq.etat && eq.etat !== 'Bon';
      const isStockLow = qte <= qteMin;
      const missingRef = !eq.reference || !eq.reference.trim();
      return isStockLow || hasDefect || missingRef;
    });
  }, [equipments]);

  const runItemAudit = (eq: Equipment) => {
    setIsAuditingItem(true);
    setSelectedAuditEq(eq);
    setItemAuditResult(null);

    // Dynamic AI prompt simulation
    setTimeout(() => {
      const qte = Number(eq.quantite) || 0;
      const min = Number(eq.qteMin) || 0;
      let diagnosis = `Diagnostic pour l'article ${eq.nom} (Réf: ${eq.reference || 'Non renseignée'}) :\n`;
      if (qte <= min) {
        diagnosis += `• Seuil critique atteint : Quantité actuelle (${qte} ${eq.unite}) inférieure ou égale au seuil de sécurité (${min} ${eq.unite}). Commande de réapprovisionnement requise.\n`;
      } else {
        diagnosis += `• Niveau de stock satisfaisant (${qte} ${eq.unite} en réserve).\n`;
      }
      if (eq.etat && eq.etat !== 'Bon') {
        diagnosis += `• Alerte état : Article signalé comme "${eq.etat}". Prévoir une inspection technique ou un retour fournisseur.\n`;
      }
      if (!eq.codeBarres && !eq.rfid) {
        diagnosis += `• Traçabilité incomplète : Aucun code-barres ni tag RFID associé.\n`;
      } else {
        diagnosis += `• Traçabilité OK : Tag ou code-barres présent (${eq.codeBarres || eq.rfid}).\n`;
      }
      diagnosis += `• Recommandation DGPC : Article prêt pour les contrôles réglementaires.`;

      setItemAuditResult(diagnosis);
      setIsAuditingItem(false);
    }, 600);
  };

  const printVerificationReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 w-full max-w-full">
      
      {/* 1. Global Module Header & Main Section Navigation */}
      <div className="bg-white rounded-3xl border-2 border-slate-900 p-6 md:p-8 shadow-xs">
        
        {/* Navigation Bar Across Transactions Sub-Modules */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => onNavigate?.('transactions-entrees')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
              Entrées de stock
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
              className="px-4 py-2 rounded-xl text-xs font-black bg-purple-600 text-white flex items-center gap-2 shadow-xs cursor-default"
            >
              <ShieldCheck className="h-4 w-4" />
              ✨ Vérification IA (Actif)
            </button>
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Module d'Intelligence Artificielle DGPC
          </div>
        </div>

        {/* Title and Internal Sub-tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-500/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                Vérification & Conformité IA
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-semibold mt-0.5">
                Contrôle automatisé des commandes, détection d'écarts et audits de stock
              </p>
            </div>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveSubTab('comparator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'comparator'
                  ? 'bg-white text-purple-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Comparateur 3-Voies
            </button>
            <button
              onClick={() => setActiveSubTab('stock-audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'stock-audit'
                  ? 'bg-white text-purple-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="h-4 w-4" />
              Audit de Stock ({stockAnomalies.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-white text-purple-700 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-4 w-4" />
              Rapports Enregistrés ({pastReports.length})
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUB-TAB 1: 3-WAY DOCUMENT COMPARATOR                      */}
        {/* ========================================================= */}
        {activeSubTab === 'comparator' && (
          <div className="space-y-8">
            
            {/* Control Bar: Tolerance & Execution */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-purple-600" />
                    Règle de Tolérance :
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: '0%', label: '±0 % (Stricte)', desc: 'Comparaison strictement exacte - Tout écart est non conforme' },
                      { val: '2%', label: '±2 % (Serrée)', desc: 'Écart ≤ ±2% conforme' },
                      { val: '5%', label: '±5 % (Standard)', desc: 'Comparaison flexible : Écart ≤ ±5% conforme, au-delà non conforme' },
                      { val: '10%', label: '±10 % (Large)', desc: 'Écart ≤ ±10% conforme' },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setTolerance(opt.val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          tolerance === opt.val
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {tolerance === '0%'
                    ? '⚡ Règle sélectionnée : Comparaison strictement exacte. Toute différence même minime sera signalée comme divergence non conforme.'
                    : `⚡ Règle sélectionnée : Comparaison flexible. Une différence comprise dans la plage de ${tolerance} est considérée comme conforme, un dépassement sera signalé non conforme.`}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {documents.length > 0 && (
                  <button 
                    onClick={() => { setDocuments([]); setResults(null); }}
                    className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-2 transition-colors cursor-pointer"
                  >
                    Réinitialiser
                  </button>
                )}
                <button 
                  onClick={verifyDocuments}
                  disabled={isVerifying || documents.length < 2}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyse des documents...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Lancer la Vérification Croisée ({documents.length}/3)
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold text-xs md:text-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Document Import Dropzones (3 Documents) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { key: 'Demande (Expression de besoin)', desc: 'Besoins initiaux formulés par le service', badge: 'Document 1' },
                { key: 'Bon de commande', desc: 'Commande officielle transmise au marché/fournisseur', badge: 'Document 2' },
                { key: 'Document fournisseur (BL)', desc: 'Bon de livraison et spécifications reçues', badge: 'Document 3' },
              ].map(({ key: docType, desc, badge }) => {
                const uploaded = documents.find(d => d.title === docType);
                const isWritingManual = activeManualInput === docType;

                return (
                  <div 
                    key={docType} 
                    className={`rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${
                      uploaded 
                        ? 'border-purple-400 bg-purple-50/40 shadow-xs' 
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-md">
                          {badge}
                        </span>
                        {uploaded && (
                          <button 
                            onClick={() => removeDocument(docType)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Retirer ce document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-slate-900">{docType}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{desc}</p>
                      
                      {uploaded ? (
                        <div className="mt-4 p-3.5 bg-white border border-purple-200 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {uploaded.fileName || 'Fichier chargé'}
                            </p>
                            <p className="text-[10px] font-extrabold text-emerald-600 mt-0.5">
                              Prêt pour l'analyse IA
                            </p>
                          </div>
                        </div>
                      ) : isWritingManual ? (
                        <div className="mt-4 space-y-2">
                          <textarea
                            rows={4}
                            value={manualTextInputs[docType] || ''}
                            onChange={(e) => setManualTextInputs({ ...manualTextInputs, [docType]: e.target.value })}
                            placeholder="Collez ou saisissez la liste des articles et quantités..."
                            className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-0 outline-none bg-white"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setActiveManualInput(null)}
                              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-bold"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={() => handleManualTextSave(docType)}
                              className="px-3 py-1.5 text-xs bg-purple-600 text-white font-bold rounded-lg"
                            >
                              Valider le texte
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 relative">
                          <input 
                            type="file" 
                            accept="image/*,.pdf,.txt,.doc,.docx,.csv"
                            onChange={e => handleFileUpload(e, docType)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="py-6 border border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center text-center p-3 group hover:border-purple-400 transition-colors">
                            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
                              <UploadCloud className="h-6 w-6" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 mt-2">
                              Cliquer pour importer
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              PDF, Image, CSV ou TXT
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!uploaded && !isWritingManual && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 text-center">
                        <button
                          onClick={() => setActiveManualInput(docType)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline cursor-pointer"
                        >
                          + Ou saisir le texte manuellement
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Results Section */}
            {results && (
              <div className="space-y-8 pt-4 animate-fadeIn">
                
                {/* Header of results & Action buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Rapport de Vérification de Conformité Technique
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Comparaison technique détaillée avec tolérance appliquée ({tolerance})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={exportSummaryPDF}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Télécharger le tableau récapitulatif officiel en format PDF"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger Tableau (PDF)
                    </button>
                    <button 
                      onClick={exportCompliancePDF}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Télécharger le rapport complet d'inspection technique"
                    >
                      <FileText className="h-4 w-4" />
                      Rapport Complet PDF
                    </button>
                    <button 
                      onClick={printVerificationReport}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </button>
                  </div>
                </div>

                {/* Tolerance Policy Banner */}
                <div className="p-4 rounded-2xl border bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/30">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-purple-300 tracking-wider">
                          Tolérance en vigueur : {tolerance}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          {tolerance === '0%' ? 'Strictement Exacte (±0%)' : 'Comparaison Flexible (±5%)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {tolerance === '0%'
                          ? 'Toute divergence constatée (même minime) est rigoureusement signalée comme non conforme.'
                          : `Une variation dans la limite de ${tolerance} est acceptée comme conforme. Tout dépassement au-delà est classé non conforme.`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Conformité globale</span>
                    <span className="text-xl font-black text-emerald-400">{results.conformite_globale_pourcentage || 100} %</span>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-purple-50/70 border-2 border-purple-200 rounded-2xl p-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-purple-600 text-white rounded-xl shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-purple-950 uppercase tracking-wide">
                            Statut Global : {results.statut_global || 'CONFORME'}
                          </h3>
                          <span className="bg-purple-200 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                            CONFORMITÉ : {results.conformite_globale_pourcentage || 100} %
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-purple-900 leading-relaxed font-medium mt-1.5">
                          {results.resume}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-purple-200/80">
                    <div className="bg-white rounded-xl p-3 border border-emerald-100 text-center">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Caractéristiques Conformes</span>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">
                        {results.caracteristiques_conformes || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-red-100 text-center">
                      <span className="text-[10px] font-black text-red-600 uppercase">Divergences / Non Conformes</span>
                      <p className="text-lg font-black text-red-700 mt-0.5">
                        {results.caracteristiques_non_conformes || 0}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase">Non Vérifiables</span>
                      <p className="text-lg font-black text-slate-800 mt-0.5">
                        {results.caracteristiques_non_verifiables || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* TABLEAU RÉCAPITULATIF COMPLET DE COMPARAISON CROISÉE     */}
                {/* (Conforme aux 7 colonnes requises & exportable en PDF)   */}
                {/* ========================================================= */}
                <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 shadow-sm space-y-6">
                  
                  {/* Table Card Header & Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                          <Table className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">
                            Tableau Récapitulatif de Comparaison Croisée
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Visualisation détaillée et comparative entre les deux documents avec tolérance dynamique ({tolerance})
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Export Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={exportSummaryPDF}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title="Télécharger le tableau récapitulatif officiel en format PDF"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger le Tableau (PDF)
                      </button>

                      <button
                        onClick={exportSummaryXLSX}
                        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                        title="Exporter les données du tableau vers Excel"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                        Excel (XLSX)
                      </button>

                      <button
                        onClick={exportCompliancePDF}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
                        title="Télécharger le rapport complet d'inspection technique"
                      >
                        <FileText className="h-4 w-4" />
                        Rapport Complet (PDF)
                      </button>
                    </div>
                  </div>

                  {/* Tolerance Quick Adjustment Bar */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-purple-600" />
                        Ajuster la tolérance de comparaison :
                      </span>
                      <div className="inline-flex rounded-xl bg-slate-200/70 p-1">
                        {[
                          { label: '0% (Stricte)', val: '0%' },
                          { label: '±5% (Standard)', val: '±5%' },
                          { label: '±10%', val: '±10%' },
                          { label: '±15%', val: '±15%' }
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            onClick={() => setTolerance(opt.val)}
                            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                              tolerance === opt.val
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-700 hover:text-purple-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
                      <span>Total : <strong className="text-slate-900">{summaryRows.length}</strong> spécifications</span>
                      <span className="text-emerald-700">Conformes : <strong>{summaryRows.filter(r => r.isConforme).length}</strong></span>
                      <span className="text-red-700">Divergences : <strong>{summaryRows.filter(r => !r.isConforme).length}</strong></span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* SECTION 1 : LISTE DES ARTICLES & ÉTAT DE CONFORMITÉ       */}
                  {/* ========================================================= */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-slate-900 text-white rounded-lg">
                          <ListChecks className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            1. Liste des Articles & État de Conformité Relevé
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Synthèse d'admissibilité par fourniture avec détail des divergences constatées
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                        {articlesSummaryList.length} Article(s) analysé(s)
                      </span>
                    </div>

                    {/* Articles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {articlesSummaryList.map((art, aIdx) => {
                        const isConf = art.isConforme;
                        const isFiltered = summarySearch.toLowerCase().trim() === art.designation.toLowerCase().trim();

                        return (
                          <div 
                            key={art.id || aIdx}
                            className={`rounded-2xl border-2 p-4.5 transition-all ${
                              isConf 
                                ? 'bg-emerald-50/20 border-emerald-300 hover:border-emerald-400' 
                                : 'bg-red-50/25 border-red-300 hover:border-red-400'
                            } ${isFiltered ? 'ring-2 ring-purple-500 shadow-md' : 'shadow-xs'}`}
                          >
                            {/* Article Header & Status */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Article {aIdx + 1}
                                </span>
                                <h5 className="text-sm font-black text-slate-900 leading-tight">
                                  {art.designation}
                                </h5>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                                    Réf : {art.referenceModele}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                                    Marque : {art.marque}
                                  </span>
                                </div>
                              </div>

                              {/* State Badge */}
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shrink-0 ${
                                isConf 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : 'bg-red-100 text-red-800 border-red-300'
                              }`}>
                                {isConf ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    CONFORME
                                  </>
                                ) : (
                                  <>
                                    <X className="h-3.5 w-3.5" />
                                    NON CONFORME
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Conformity Rate & Metrics */}
                            <div className="py-3 space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-600">Taux de conformité technique :</span>
                                <span className={isConf ? 'text-emerald-700 font-black' : 'text-red-700 font-black'}>
                                  {art.tauxConformite} %
                                </span>
                              </div>
                              
                              {/* Progress bar */}
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isConf ? 'bg-emerald-500' : art.tauxConformite >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${art.tauxConformite}%` }}
                                />
                              </div>

                              {/* Spec counts */}
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-0.5">
                                <span>Spécifications : {art.totalSpecs}</span>
                                <span className="text-emerald-700">Conformes : {art.conformesSpecs}</span>
                                <span className={art.nonConformesSpecs > 0 ? 'text-red-700 font-black' : 'text-slate-500'}>
                                  Écarts : {art.nonConformesSpecs}
                                </span>
                              </div>
                            </div>

                            {/* Divergences / Validation Box */}
                            <div className="pt-2">
                              {isConf ? (
                                <div className="p-3 bg-emerald-100/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  <span>
                                    Toutes les spécifications techniques de cet article respectent les exigences contractuelles et la tolérance ({tolerance}).
                                  </span>
                                </div>
                              ) : (
                                <div className="p-3 bg-red-100/70 border border-red-200 rounded-xl space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-red-900">
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                                    Divergence(s) constatée(s) :
                                  </div>
                                  <ul className="space-y-1 text-xs text-red-900 font-medium">
                                    {art.divergencesConstates.map((divText, dIdx) => (
                                      <li key={dIdx} className="flex items-start gap-1.5 pl-1">
                                        <span className="text-red-500 font-bold leading-tight">•</span>
                                        <span className="leading-snug">{divText}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Quick Filter Action Button */}
                            <div className="pt-3 flex justify-end">
                              <button
                                onClick={() => {
                                  if (isFiltered) {
                                    setSummarySearch('');
                                  } else {
                                    setSummarySearch(art.designation);
                                  }
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isFiltered 
                                    ? 'bg-purple-700 text-white shadow-xs' 
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <Search className="h-3 w-3" />
                                {isFiltered ? "Afficher toutes les fournitures" : "Filtrer cet article dans le tableau"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* SECTION 2 : TABLEAU RÉCAPITULATIF DÉTAILLÉ (7 COLONNES)   */}
                  {/* ========================================================= */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-slate-900 text-white rounded-lg">
                          <Table className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            2. Tableau Détaillé de Comparaison Croisée des Spécifications
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            Analyse ligne par ligne avec repérages dans les documents originaux
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSummaryFilter('all')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            summaryFilter === 'all'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Toutes les fournitures ({summaryRows.length})
                        </button>

                        <button
                          onClick={() => setSummaryFilter('conforme')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            summaryFilter === 'conforme'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Conformes ({summaryRows.filter(r => r.isConforme).length})
                        </button>

                        <button
                          onClick={() => setSummaryFilter('non_conforme')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            summaryFilter === 'non_conforme'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'bg-red-50 text-red-800 hover:bg-red-100'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Non conformes ({summaryRows.filter(r => !r.isConforme).length})
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={summarySearch}
                          onChange={(e) => setSummarySearch(e.target.value)}
                          placeholder="Rechercher une fourniture ou valeur..."
                          className="w-full sm:w-72 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-500 focus:bg-white transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* The 7-Column Comprehensive Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                          <th className="p-3.5 pl-4 border-r border-slate-800 min-w-[220px]">
                            Fourniture / Désignation
                          </th>
                          <th className="p-3.5 border-r border-slate-800 min-w-[160px]">
                            Valeur du Doc 1
                          </th>
                          <th className="p-3.5 border-r border-slate-800 min-w-[160px]">
                            Valeur du Doc 2
                          </th>
                          <th className="p-3.5 border-r border-slate-800 text-center min-w-[130px]">
                            Différence constatée
                          </th>
                          <th className="p-3.5 border-r border-slate-800 text-center min-w-[110px]">
                            Tolérance appliquée
                          </th>
                          <th className="p-3.5 border-r border-slate-800 min-w-[200px]">
                            Écart par rapport à la tolérance
                          </th>
                          <th className="p-3.5 pr-4 text-center min-w-[140px]">
                            Statut : Conforme / Non conforme
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-xs font-medium bg-white">
                        {filteredSummaryRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              Aucune fourniture ne correspond aux critères de filtre sélectionnés.
                            </td>
                          </tr>
                        ) : (
                          filteredSummaryRows.map((row, rIdx) => {
                            const isConf = row.isConforme;
                            const isDiffZero = row.differenceConstatee === '0 %' || row.differenceConstatee === '0' || row.differenceConstatee === '—';

                            return (
                              <tr 
                                key={row.id || rIdx}
                                className={`transition-colors hover:bg-slate-50 ${
                                  !isConf ? 'bg-red-50/25' : rIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                }`}
                              >
                                {/* 1. Fourniture / Désignation */}
                                <td className="p-3.5 pl-4 border-r border-slate-200 align-top">
                                  <div className="font-black text-slate-900 text-xs">
                                    {row.articleNom}
                                  </div>
                                  <div className="text-slate-600 font-semibold text-[11px] mt-0.5">
                                    • {row.caracteristique}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                      Doc 1: {row.pageDoc1 || 'P.1'}, {row.ligneDoc1 || 'L.1'}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                      Doc 2: {row.pageDoc2 || 'P.2'}, {row.ligneDoc2 || 'L.1'}
                                    </span>
                                  </div>
                                </td>

                                {/* 2. Valeur du Doc 1 */}
                                <td className="p-3.5 border-r border-slate-200 align-top">
                                  <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] font-bold text-slate-800 break-words">
                                    {row.valeurDoc1 || '—'}
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1 block uppercase">
                                    Document 1 (Exigence)
                                  </span>
                                </td>

                                {/* 3. Valeur du Doc 2 */}
                                <td className="p-3.5 border-r border-slate-200 align-top">
                                  <div className={`p-2 rounded-lg font-mono text-[11px] font-bold break-words border ${
                                    isConf 
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                                      : 'bg-red-50 text-red-900 border-red-200'
                                  }`}>
                                    {row.valeurDoc2 || '—'}
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1 block uppercase">
                                    Document 2 (Offre / Livré)
                                  </span>
                                </td>

                                {/* 4. Différence constatée */}
                                <td className="p-3.5 border-r border-slate-200 align-top text-center">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                                    isDiffZero
                                      ? 'bg-slate-100 text-slate-700'
                                      : isConf
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}>
                                    {row.differenceConstatee || '0 %'}
                                  </span>
                                </td>

                                {/* 5. Tolérance appliquée */}
                                <td className="p-3.5 border-r border-slate-200 align-top text-center">
                                  <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                                    {row.toleranceAppliquee || tolerance}
                                  </span>
                                </td>

                                {/* 6. Écart par rapport à la tolérance */}
                                <td className="p-3.5 border-r border-slate-200 align-top">
                                  <div className="flex items-start gap-1.5">
                                    {isConf ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                    )}
                                    <div>
                                      <span className={`text-xs font-bold ${
                                        isConf ? 'text-emerald-800' : 'text-red-700'
                                      }`}>
                                        {row.ecartParRapportTolerance}
                                      </span>
                                      {row.observation && (
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          {row.observation}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* 7. Statut : Conforme / Non conforme */}
                                <td className="p-3.5 pr-4 align-top text-center">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                    isConf
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-red-100 text-red-800 border-red-300'
                                  }`}>
                                    {isConf ? (
                                      <>
                                        <Check className="h-3.5 w-3.5" />
                                        Conforme
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-3.5 w-3.5" />
                                        Non conforme
                                      </>
                                    )}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Table Footer Information Banner */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                      <span>
                        Tableau récapitulatif généré et certifié selon les normes de contrôle technique de la Protection Civile.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportSummaryPDF}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Télécharger en PDF
                      </button>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* PRECISE DIVERGENCE MAPPING & DOCUMENT LOCATION            */}
                {/* ========================================================= */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-600" />
                        Aperçu Visuel Précis des Divergences & Repérage Documentaire
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Localisation exacte (Page, Section, Ligne) et écarts constatés par rapport à la tolérance ({tolerance})
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                      allDivergences.length === 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {allDivergences.length === 0 ? '0 Divergence' : `${allDivergences.length} Divergence(s) détectée(s)`}
                    </span>
                  </div>

                  {allDivergences.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {allDivergences.map((div: any, dIdx: number) => (
                        <div 
                          key={dIdx} 
                          className="bg-white border-2 border-red-200 hover:border-red-400 rounded-2xl p-5 shadow-xs transition-all space-y-4"
                        >
                          {/* Divergence Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
                                <FileWarning className="h-4 w-4" />
                              </span>
                              <div>
                                <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2 py-0.5 rounded">
                                  {div.article || 'Article concerné'}
                                </span>
                                <h4 className="text-sm font-black text-slate-900 mt-0.5">
                                  {div.element_concerne || div.caracteristique || 'Élément technique'}
                                </h4>
                              </div>
                            </div>
                            <span className="inline-flex items-center text-xs font-black text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full w-fit">
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Non Conforme (Écart : {div.ecart_constate || div.ecart || 'Constaté'})
                            </span>
                          </div>

                          {/* Side-by-Side Values & Document Location Mapping */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Document 1: Exigence */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                  Exigence – Document 1
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                  <MapPin className="h-3.5 w-3.5 text-purple-600" />
                                  <span>{div.page_doc1 || 'Page 1'}</span>
                                  <span>•</span>
                                  <span>{div.section_doc1 || 'Section spécifications'}</span>
                                  <span>•</span>
                                  <span className="text-purple-700">{div.ligne_doc1 || 'Ligne'}</span>
                                </div>
                              </div>
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Valeur demandée :</span>
                                <p className="text-sm font-mono font-black text-slate-900">
                                  {div.valeur_doc1 || div.valeur_demandee || '—'}
                                </p>
                              </div>
                            </div>

                            {/* Document 2: Proposition */}
                            <div className="bg-red-50/50 border border-red-200 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                  Proposition – Document 2
                                </span>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-800">
                                  <MapPin className="h-3.5 w-3.5 text-red-600" />
                                  <span>{div.page_doc2 || 'Page 2'}</span>
                                  <span>•</span>
                                  <span>{div.section_doc2 || 'Offre / Livrable'}</span>
                                  <span>•</span>
                                  <span className="text-red-700">{div.ligne_doc2 || 'Ligne'}</span>
                                </div>
                              </div>
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-red-400 block uppercase">Valeur fournie / proposée :</span>
                                <p className="text-sm font-mono font-black text-red-900">
                                  {div.valeur_doc2 || div.valeur_proposee || '—'}
                                </p>
                              </div>
                            </div>

                          </div>

                          {/* Divergence Analysis & Tolerance Rule Exceeded */}
                          <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-800">Motif technique du rejet : </strong>
                                <span className="text-slate-700 font-medium">
                                  {div.explication || div.observation || `L'écart de ${div.ecart_constate || 'valeur'} outrepasse la tolérance autorisée (${tolerance}).`}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 font-bold text-slate-600">
                              <span className="text-[10px] uppercase bg-white border border-slate-200 px-2 py-1 rounded">
                                Tolérance : {div.tolerance || tolerance}
                              </span>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 flex items-center gap-3 text-emerald-800">
                      <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-black">Aucune divergence technique détectée</h4>
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">
                          Toutes les spécifications analysées sont conformes aux exigences conformément à la tolérance en vigueur ({tolerance}).
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Master Table as requested */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tous les critères ({filteredSummaryRows.length || 0})
                    </button>
                    <button
                      onClick={() => setFilterStatus('conforme')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'conforme' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Conformes ({filteredSummaryRows.filter((r) => r.isConforme).length || 0})
                    </button>
                    <button
                      onClick={() => setFilterStatus('divergence')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === 'divergence' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      Inconformités ({filteredSummaryRows.filter((r) => !r.isConforme).length || 0})
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={summarySearch}
                      onChange={(e) => setSummarySearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full md:w-64 pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white mt-6 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-black">
                        <th className="p-4 border-r border-slate-800 w-1/4">Nom de l'article</th>
                        <th className="p-4 border-r border-slate-800">Spécifications du Doc 1</th>
                        <th className="p-4 border-r border-slate-800">Spécifications Doc 2</th>
                        <th className="p-4 border-r border-slate-800 text-center">L'écart</th>
                        <th className="p-4 text-center">Conforme ou non</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs font-medium">
                      {filteredSummaryRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400 font-bold">
                            Aucun élément ne correspond à votre recherche.
                          </td>
                        </tr>
                      ) : (
                        filteredSummaryRows.map((row, idx) => {
                          const isConf = row.isConforme;
                          return (
                            <tr key={idx} className={`transition-colors ${!isConf ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className="font-black text-slate-900 text-sm mb-1">{row.articleNom}</div>
                                <div className="text-slate-600 font-semibold">{row.caracteristique}</div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className="font-mono text-slate-800 bg-slate-100 px-2 py-1.5 rounded-lg inline-block border border-slate-200">
                                  {row.valeurDoc1}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">
                                  Doc 1 : {row.pageDoc1}, {row.ligneDoc1}
                                </div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top">
                                <div className={`font-mono px-2 py-1.5 rounded-lg inline-block border ${isConf ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
                                  {row.valeurDoc2}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">
                                  Doc 2 : {row.pageDoc2}, {row.ligneDoc2}
                                </div>
                              </td>
                              <td className="p-4 border-r border-slate-200 align-top text-center">
                                <div className="font-mono font-bold text-slate-800">{row.differenceConstatee}</div>
                                <div className="text-[10px] text-slate-500 mt-1">{row.toleranceAppliquee !== '0%' ? `Marge : ${row.toleranceAppliquee}` : 'Marge : 0%'}</div>
                              </td>
                              <td className="p-4 align-top text-center">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${
                                  isConf ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isConf ? <Check className="h-4 w-4 mr-1.5" /> : <X className="h-4 w-4 mr-1.5" />}
                                  {isConf ? 'Conforme' : 'Inconformité'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-TAB 2: INTERACTIVE STOCK AUDIT                       */}
        {/* ========================================================= */}
        {activeSubTab === 'stock-audit' && (
          <div className="space-y-6">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-1">
                <Database className="h-5 w-5 text-purple-600" />
                Audit Automatique du Stock en Temps Réel
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cette vue analyse l'inventaire physique GIS-PATRIMOINE et identifie les anomalies de seuils, d'états défectueux ou de traçabilité.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Anomalies List */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Articles avec anomalie détectée ({stockAnomalies.length})
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={auditSearchTerm}
                      onChange={(e) => setAuditSearchTerm(e.target.value)}
                      placeholder="Rechercher article..."
                      className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {stockAnomalies
                    .filter(eq => !auditSearchTerm || eq.nom.toLowerCase().includes(auditSearchTerm.toLowerCase()) || eq.reference.toLowerCase().includes(auditSearchTerm.toLowerCase()))
                    .map(eq => {
                      const qte = Number(eq.quantite) || 0;
                      const min = Number(eq.qteMin) || 0;
                      const isLow = qte <= min;
                      const isSelected = selectedAuditEq?.id === eq.id;

                      return (
                        <div 
                          key={eq.id}
                          onClick={() => runItemAudit(eq)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm' 
                              : 'border-slate-200 bg-white hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                {eq.id} • {eq.categorie}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">{eq.nom}</h4>
                              <p className="text-xs text-slate-500 font-medium">Réf: {eq.reference || 'Aucune'}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              {isLow && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Stock Faible ({qte}/{min})
                                </span>
                              )}
                              {eq.etat && eq.etat !== 'Bon' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-700">
                                  État: {eq.etat}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {stockAnomalies.length === 0 && (
                    <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 font-bold text-xs">
                      Aucune anomalie détectée dans le stock actuel. Tout est conforme.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Diagnosis for selected item */}
              <div className="lg:col-span-6">
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 h-full flex flex-col justify-between">
                  {selectedAuditEq ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                            Rapport d'audit IA
                          </span>
                          <h3 className="text-base font-black text-slate-900">{selectedAuditEq.nom}</h3>
                        </div>
                        <span className="text-xs font-black bg-purple-100 text-purple-800 px-3 py-1 rounded-lg">
                          {selectedAuditEq.quantite} {selectedAuditEq.unite}
                        </span>
                      </div>

                      {isAuditingItem ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                          <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
                          <p className="text-xs font-bold text-slate-600">Génération du diagnostic IA...</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-700">Résultat de l'analyse :</h4>
                          <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {itemAuditResult}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                      <Database className="h-10 w-10 text-slate-300" />
                      <p className="text-xs font-bold">Sélectionnez un article à gauche pour lancer l'audit IA complet.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-200 text-right">
                    <button
                      onClick={() => onNavigate?.('stock')}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline cursor-pointer"
                    >
                      Accéder à la gestion complète du stock →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-TAB 3: REPORTS HISTORY                               */}
        {/* ========================================================= */}
        {activeSubTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Journal des Rapports de Vérification IA
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Consultez et réouvrez les contrôles de conformité effectués précédemment.
                </p>
              </div>

              {pastReports.length > 0 && (
                <button
                  onClick={() => {
                    localStorage.removeItem('dgpc_verification_reports');
                    setPastReports([]);
                    showToast?.('Historique des vérifications vidé');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Effacer tout l'historique
                </button>
              )}
            </div>

            <div className="space-y-3">
              {pastReports.map(rep => (
                <div 
                  key={rep.id} 
                  className="bg-slate-50 hover:bg-white border-2 border-slate-200 rounded-2xl p-5 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md">
                        {rep.id}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {rep.date}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                        Tolérance: {rep.tolerance}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold line-clamp-1 mt-1">
                      {rep.resume || 'Rapport sans résumé'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 mt-1">
                      <span>Articles: {rep.total_articles}</span>
                      <span className="text-emerald-600">Conformes: {rep.total_conformes}</span>
                      <span className="text-red-600">Divergences: {rep.total_divergences}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setResults({
                          resume: rep.resume,
                          comparaisons: rep.comparaisons,
                          articles: rep.articles || [],
                          divergences: rep.divergences || [],
                          total_articles: rep.total_articles,
                          total_conformes: rep.total_conformes,
                          total_divergences: rep.total_divergences,
                          statut_global: rep.statut_global || (rep.total_divergences === 0 ? 'CONFORME' : 'NON CONFORME'),
                          conformite_globale_pourcentage: rep.conformite_globale_pourcentage || 100
                        });
                        setTolerance(rep.tolerance);
                        setActiveSubTab('comparator');
                        showToast?.(`Rapport ${rep.id} réouvert`);
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Voir les détails
                    </button>
                    <button
                      onClick={() => {
                        const targetRep = {
                          resume: rep.resume,
                          articles: rep.articles || [],
                          divergences: rep.divergences || [],
                          statut_global: rep.statut_global || (rep.total_divergences === 0 ? 'CONFORME' : 'NON CONFORME'),
                          conformite_globale_pourcentage: rep.conformite_globale_pourcentage || 100
                        };
                        exportComplianceReportPDF(targetRep, (rep.docTitles || []).map(t => ({ title: t })), rep.tolerance || '0%', showToast);
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Télécharger le rapport officiel au format PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </button>
                    <button
                      onClick={() => deleteReport(rep.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {pastReports.length === 0 && (
                <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                  <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Aucun rapport enregistré pour le moment.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Lancez une vérification dans le comparateur pour archiver un rapport.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
