import React, { useState, useRef, DragEvent, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Database, 
  FileSpreadsheet, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  User as UserIcon, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  FileCheck,
  Building,
  Building2,
  FileText,
  Edit3,
  Trash2,
  X,
  MapPin,
  ChevronRight,
  Store,
  Warehouse,
  ChevronLeft,
  Eye,
  Undo2,
  FolderTree,
  Upload,
  CheckCircle,
  FileUp,
  Tag,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType, Equipment } from '../types';
import SiteTechnicalSheetModal from './SiteTechnicalSheetModal';

export interface DatabaseInfo {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  itemCount: number;
  region: 'Rabat-Salé-Kénitra';
  year: string;
  service: 'Patrimoine';
  volet: 'magasin' | 'depot';
  siteId: string;
  siteName: string;
}

export interface SiteDefinition {
  id: string;
  name: string;
  volet: 'magasin' | 'depot';
  city: string;
  address: string;
  description: string;
}

// Fixed sites for Région Rabat-Salé-Kénitra - Service Patrimoine
export const RSK_SITES: SiteDefinition[] = [
  {
    id: 'magasin_kenitra',
    name: 'Magasin de Kénitra',
    volet: 'magasin',
    city: 'Kénitra',
    address: 'Centre de Secours et Magasin Régional, Kénitra',
    description: 'Magasin régional du service Patrimoine de Kénitra.'
  },
  {
    id: 'magasin_dgpc_siege',
    name: 'Magasin DGPC Siège',
    volet: 'magasin',
    city: 'Rabat',
    address: 'Direction Générale de la Protection Civile, Siège Rabat',
    description: 'Magasin central DGPC Siège du service Patrimoine.'
  },
  {
    id: 'depot_sidi_allal_bahraoui',
    name: 'Dépôt de Sidi Allal Bahraoui',
    volet: 'depot',
    city: 'Sidi Allal El Bahraoui',
    address: 'Dépôt Central Stratégique de Matériels, Sidi Allal Bahraoui',
    description: 'Dépôt logistique et patrimonial stratégique de Sidi Allal Bahraoui.'
  }
];

export const INITIAL_DEFAULT_DATABASES: DatabaseInfo[] = [
  // Dépôt de Sidi Allal Bahraoui
  {
    id: 'site_depot_bahraoui_patrimoine_2026',
    name: 'Patrimoine 2026',
    description: 'Inventaire et gestion du patrimoine 2026 au Dépôt de Sidi Allal Bahraoui.',
    createdAt: '01/01/2026',
    lastModified: '08/07/2026',
    itemCount: 40,
    region: 'Rabat-Salé-Kénitra',
    year: '2026',
    service: 'Patrimoine',
    volet: 'depot',
    siteId: 'depot_sidi_allal_bahraoui',
    siteName: 'Dépôt de Sidi Allal Bahraoui'
  },
  {
    id: 'site_depot_bahraoui_patrimoine_2025',
    name: 'Patrimoine 2025',
    description: 'Inventaire archivé du patrimoine 2025 au Dépôt de Sidi Allal Bahraoui.',
    createdAt: '01/01/2025',
    lastModified: '31/12/2025',
    itemCount: 35,
    region: 'Rabat-Salé-Kénitra',
    year: '2025',
    service: 'Patrimoine',
    volet: 'depot',
    siteId: 'depot_sidi_allal_bahraoui',
    siteName: 'Dépôt de Sidi Allal Bahraoui'
  },
  {
    id: 'site_depot_bahraoui_patrimoine_2024',
    name: 'Patrimoine 2024',
    description: 'Inventaire archivé du patrimoine 2024 au Dépôt de Sidi Allal Bahraoui.',
    createdAt: '01/01/2024',
    lastModified: '31/12/2024',
    itemCount: 28,
    region: 'Rabat-Salé-Kénitra',
    year: '2024',
    service: 'Patrimoine',
    volet: 'depot',
    siteId: 'depot_sidi_allal_bahraoui',
    siteName: 'Dépôt de Sidi Allal Bahraoui'
  },

  // Magasin de Kénitra
  {
    id: 'site_magasin_kenitra_patrimoine_2026',
    name: 'Patrimoine 2026',
    description: 'Inventaire et matériel du patrimoine 2026 au Magasin de Kénitra.',
    createdAt: '01/01/2026',
    lastModified: '08/07/2026',
    itemCount: 24,
    region: 'Rabat-Salé-Kénitra',
    year: '2026',
    service: 'Patrimoine',
    volet: 'magasin',
    siteId: 'magasin_kenitra',
    siteName: 'Magasin de Kénitra'
  },
  {
    id: 'site_magasin_kenitra_patrimoine_2025',
    name: 'Patrimoine 2025',
    description: 'Inventaire archivé du patrimoine 2025 au Magasin de Kénitra.',
    createdAt: '01/01/2025',
    lastModified: '31/12/2025',
    itemCount: 18,
    region: 'Rabat-Salé-Kénitra',
    year: '2025',
    service: 'Patrimoine',
    volet: 'magasin',
    siteId: 'magasin_kenitra',
    siteName: 'Magasin de Kénitra'
  },

  // Magasin DGPC Siège
  {
    id: 'site_magasin_siege_patrimoine_2026',
    name: 'Patrimoine 2026',
    description: 'Inventaire et matériel du patrimoine 2026 au Magasin DGPC Siège Rabat.',
    createdAt: '01/01/2026',
    lastModified: '08/07/2026',
    itemCount: 30,
    region: 'Rabat-Salé-Kénitra',
    year: '2026',
    service: 'Patrimoine',
    volet: 'magasin',
    siteId: 'magasin_dgpc_siege',
    siteName: 'Magasin DGPC Siège'
  },
  {
    id: 'site_magasin_siege_patrimoine_2025',
    name: 'Patrimoine 2025',
    description: 'Inventaire archivé du patrimoine 2025 au Magasin DGPC Siège Rabat.',
    createdAt: '01/01/2025',
    lastModified: '31/12/2025',
    itemCount: 22,
    region: 'Rabat-Salé-Kénitra',
    year: '2025',
    service: 'Patrimoine',
    volet: 'magasin',
    siteId: 'magasin_dgpc_siege',
    siteName: 'Magasin DGPC Siège'
  }
];

// Helper to sort databases chronologically from newest year to oldest year
export function sortDatabasesChronologically(dbs: DatabaseInfo[]): DatabaseInfo[] {
  return [...dbs].sort((a, b) => {
    const yearA = parseInt(a.year || '') || 0;
    const yearB = parseInt(b.year || '') || 0;
    if (yearA !== yearB) {
      return yearB - yearA; // descending (e.g. 2026, 2025, 2024...)
    }
    const parseDate = (dateStr: string) => {
      if (!dateStr) return 0;
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
      }
      const t = Date.parse(dateStr);
      return isNaN(t) ? 0 : t;
    };
    const timeA = parseDate(a.lastModified || a.createdAt);
    const timeB = parseDate(b.lastModified || b.createdAt);
    return timeB - timeA;
  });
}

// CSV Parsing helper
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let cols: string[] = [];
  let col = '';
  let insideQuote = false;
  
  const firstLineEnd = text.indexOf('\n');
  const firstRow = firstLineEnd !== -1 ? text.substring(0, firstLineEnd) : text;
  const commaCount = (firstRow.match(/,/g) || []).length;
  const semicolonCount = (firstRow.match(/;/g) || []).length;
  const separator = semicolonCount > commaCount ? ';' : ',';

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        col += '"';
        i += 2;
        continue;
      }
      insideQuote = !insideQuote;
      i++;
    } else if (char === separator && !insideQuote) {
      cols.push(col.trim());
      col = '';
      i++;
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      cols.push(col.trim());
      col = '';
      if (cols.length > 0 && cols.some(c => c !== '')) {
        lines.push(cols);
      }
      cols = [];
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }
    } else {
      col += char;
      i++;
    }
  }
  
  if (col !== '' || cols.length > 0) {
    cols.push(col.trim());
    if (cols.length > 0 && cols.some(c => c !== '')) {
      lines.push(cols);
    }
  }

  return lines;
}

export interface ParsedSheetInfo {
  sheetName: string;
  dbId: string;
  dbName: string;
  description: string;
  equipments: Equipment[];
  year: string;
}

interface DatabaseSelectionScreenProps {
  user: UserType;
  onSelectDatabase: (dbId: string, initialData?: Equipment[]) => void;
  onLogout: () => void;
  spreadsheetId?: string;
}

export default function DatabaseSelectionScreen({ 
  user, 
  onSelectDatabase, 
  onLogout, 
  spreadsheetId 
}: DatabaseSelectionScreenProps) {
  // Navigation workflow state:
  // Step 1: 'site_organization' (Choix direct Magasin vs Dépôt)
  // Step 2: 'welcome_post_login' (Présentation & informations de session)
  // Step 3: 'site_databases' (Bases de données classées par année pour le site sélectionné)
  const [currentStep, setCurrentStep] = useState<'welcome_post_login' | 'site_organization' | 'site_databases'>('site_organization');

  // Selected volet ('magasin' | 'depot')
  const [selectedVolet, setSelectedVolet] = useState<'magasin' | 'depot' | null>(null);

  // Selected site definition
  const [selectedSite, setSelectedSite] = useState<SiteDefinition | null>(null);

  // Databases collection
  const [databases, setDatabases] = useState<DatabaseInfo[]>(() => {
    const saved = localStorage.getItem('gis_dgpc_databases_rsk_patrimoine');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DatabaseInfo[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback to initial
      }
    }
    localStorage.setItem('gis_dgpc_databases_rsk_patrimoine', JSON.stringify(INITIAL_DEFAULT_DATABASES));
    return INITIAL_DEFAULT_DATABASES;
  });

  // Persist databases whenever they change
  useEffect(() => {
    localStorage.setItem('gis_dgpc_databases_rsk_patrimoine', JSON.stringify(databases));
  }, [databases]);

  // Modals & form states
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTechnicalSheetModal, setShowTechnicalSheetModal] = useState(false);
  const [selectedTechnicalSiteId, setSelectedTechnicalSiteId] = useState<string | undefined>(undefined);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);
  const [parsedSheets, setParsedSheets] = useState<ParsedSheetInfo[]>([]);
  const [selectedSheetIndices, setSelectedSheetIndices] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Import fields
  const [importYear, setImportYear] = useState<string>(new Date().getFullYear().toString());
  const [importDbName, setImportDbName] = useState<string>('');

  // Manual creation fields
  const [newDbYear, setNewDbYear] = useState<string>(new Date().getFullYear().toString());
  const [newDbName, setNewDbName] = useState<string>('');
  const [newDbDescription, setNewDbDescription] = useState<string>('');

  // Delete confirmation & Undo state
  const [dbToDelete, setDbToDelete] = useState<DatabaseInfo | null>(null);
  const [lastDeletedDb, setLastDeletedDb] = useState<DatabaseInfo | null>(null);
  const [lastDeletedEquipments, setLastDeletedEquipments] = useState<string | null>(null);
  const [lastDeletedHistory, setLastDeletedHistory] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Undo delete support (Ctrl+Z)
  const handleUndoDelete = () => {
    if (!lastDeletedDb) return;
    const restored = lastDeletedDb;
    const dbId = restored.id;

    setDatabases(prev => {
      const updated = [...prev, restored];
      return updated;
    });

    if (lastDeletedEquipments) {
      localStorage.setItem(`database_${dbId}_equipments`, lastDeletedEquipments);
    }
    if (lastDeletedHistory) {
      localStorage.setItem(`database_${dbId}_history`, lastDeletedHistory);
    }

    setLastDeletedDb(null);
    setLastDeletedEquipments(null);
    setLastDeletedHistory(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (lastDeletedDb) {
          e.preventDefault();
          handleUndoDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastDeletedDb, lastDeletedEquipments, lastDeletedHistory]);

  // Filter databases for the currently selected site and sort chronologically (newest year first)
  const siteDatabases = React.useMemo(() => {
    if (!selectedSite) return [];
    const filtered = databases.filter(db => db.siteId === selectedSite.id);
    return sortDatabasesChronologically(filtered);
  }, [databases, selectedSite]);

  // Open a specific site to view its databases
  const handleSelectSite = (site: SiteDefinition) => {
    setSelectedSite(site);
    setCurrentStep('site_databases');
  };

  // Open database in the main inventory app
  const handleOpenDatabase = (db: DatabaseInfo) => {
    // Save active site & db info in localStorage
    localStorage.setItem('gis_dgpc_selected_db', db.id);
    localStorage.setItem('gis_dgpc_selected_site_id', db.siteId);
    localStorage.setItem('gis_dgpc_selected_site_name', db.siteName);
    localStorage.setItem('gis_dgpc_workspace_type', db.volet);
    localStorage.setItem('gis_dgpc_selected_year', db.year);
    localStorage.setItem(`database_${db.id}_depot_name`, `${db.siteName} — ${db.name}`);
    localStorage.setItem(`database_${db.id}_depot_location`, `${db.siteName}, Rabat-Salé-Kénitra`);

    onSelectDatabase(db.id);
  };

  // Delete database handler
  const handleDeleteDatabaseConfirm = async () => {
    if (!dbToDelete) return;
    const dbId = dbToDelete.id;

    // Backup before deleting
    const backupEquipments = localStorage.getItem(`database_${dbId}_equipments`);
    const backupHistory = localStorage.getItem(`database_${dbId}_history`);

    setLastDeletedDb(dbToDelete);
    setLastDeletedEquipments(backupEquipments);
    setLastDeletedHistory(backupHistory);

    const updated = databases.filter(db => db.id !== dbId);
    setDatabases(updated);

    localStorage.removeItem(`database_${dbId}_equipments`);
    localStorage.removeItem(`database_${dbId}_history`);
    localStorage.removeItem(`database_${dbId}_depot_name`);
    localStorage.removeItem(`database_${dbId}_depot_location`);

    // Sync deletion to Google Sheet if configured
    const appsScriptUrl = localStorage.getItem('elec_stock_apps_script_url');
    if (appsScriptUrl) {
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl,
            payload: {
              spreadsheetId,
              action: 'deleteDatabase',
              sheetName: dbToDelete.name
            }
          })
        });
      } catch (err) {
        console.error("Erreur lors de la suppression de la feuille sur Google Sheets:", err);
      }
    }

    setDbToDelete(null);
  };

  // Create database manually
  const handleCreateDatabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) return;

    const trimmedYear = newDbYear.trim() || new Date().getFullYear().toString();
    const finalName = newDbName.trim() || `Patrimoine ${trimmedYear}`;
    const timestamp = Date.now();
    const uniqueDbId = `site_${selectedSite.id}_patrimoine_${trimmedYear}_${timestamp}`;

    const newDb: DatabaseInfo = {
      id: uniqueDbId,
      name: finalName,
      description: newDbDescription.trim() || `Inventaire Patrimoine ${trimmedYear} rattaché au ${selectedSite.name}.`,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      lastModified: new Date().toLocaleDateString('fr-FR'),
      itemCount: 0,
      region: 'Rabat-Salé-Kénitra',
      year: trimmedYear,
      service: 'Patrimoine',
      volet: selectedSite.volet,
      siteId: selectedSite.id,
      siteName: selectedSite.name
    };

    const updated = [...databases, newDb];
    setDatabases(updated);

    // Initialize clean isolated equipment and history for this database
    localStorage.setItem(`database_${uniqueDbId}_equipments`, JSON.stringify([]));
    localStorage.setItem(`database_${uniqueDbId}_history`, JSON.stringify([
      {
        id: `M-INIT-${timestamp}`,
        date: new Date().toLocaleString('fr-FR', { hour12: false }),
        type: 'Création',
        equipmentId: 'N/A',
        equipmentNom: 'Initialisation de la base',
        quantite: 0,
        employe: user.fullName,
        employeUsername: user.username,
        service: 'Patrimoine',
        notes: `Création de la base indépendante ${finalName} pour ${selectedSite.name}.`
      }
    ]));

    // Sync creation with Google Sheets Apps Script if configured
    const appsScriptUrl = localStorage.getItem('elec_stock_apps_script_url');
    if (appsScriptUrl) {
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl,
            payload: {
              spreadsheetId,
              action: 'createDatabase',
              sheetName: finalName,
              equipments: []
            }
          })
        });
      } catch (err) {
        console.error("Erreur de synchronisation Google Sheets:", err);
      }
    }

    setNewDbName('');
    setNewDbDescription('');
    setShowCreateModal(false);
  };

  // Excel Drag and Drop parsing
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setParseError(null);
    setParseSuccess(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
      if (isExcel) {
        setExcelFile(file);
        parseExcelFile(file);
      } else {
        setParseError("Veuillez déposer un fichier Excel valide (.XLSX, .XLS, ou .CSV).");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParseSuccess(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setExcelFile(file);
      parseExcelFile(file);
    }
  };

  // Robust Excel file parser preserving the full multi-column mapping
  const parseExcelFile = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Impossible de lire les données du fichier.");

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetsResults: ParsedSheetInfo[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          if (rawRows.length < 2) return; // Skip empty sheets

          const headerRow = rawRows[0] as string[];
          
          const normHeader = (h: any) => {
            return String(h || '')
              .trim()
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9#°]/g, "");
          };

          const cleanedHeaders = headerRow.map(h => normHeader(h));
          
          const findColIndex = (exactNames: string[], containsNames: string[], excludedTerms: string[] = []) => {
            for (const name of exactNames) {
              const target = normHeader(name);
              const idx = cleanedHeaders.indexOf(target);
              if (idx !== -1) return idx;
            }
            for (const name of containsNames) {
              const target = normHeader(name);
              const idx = cleanedHeaders.findIndex((cleaned) => {
                if (cleaned.includes(target)) {
                  const hasExcluded = excludedTerms.some(term => cleaned.includes(normHeader(term)));
                  if (!hasExcluded) return true;
                }
                return false;
              });
              if (idx !== -1) return idx;
            }
            return -1;
          };

          const colIndices = {
            id: findColIndex(['Article N°', 'Article Numéro', 'Article No', 'ID'], ['articlen', 'id', 'codemat', 'matricule'], ['nummarche', 'numeromarche', 'marche', 'bc', 'rfid']),
            nom: findColIndex(['Désignation', 'Designation', 'Désignations', 'Designations', 'Article', 'Matériel', 'Materiel', 'Nom'], ['designation', 'nom', 'materiel', 'matériel'], ['num', 'n°', 'no', 'reference', 'ref', 'rfid']),
            categorie: findColIndex(['Catégorie', 'Categorie'], ['categor', 'type']),
            reference: findColIndex(['Référence', 'Reference'], ['ref', 'model']),
            quantite: findColIndex(['Quantité Actuelle', 'Quantite Actuelle', 'Quantité', 'Quantite', 'Stock Actuel'], ['quantite', 'qte', 'stock'], ['min', 'seuil', 'reception', 'livr', 'envoi', 'envoy']),
            qteMin: findColIndex(['Qté Min', 'Qte Min', 'Seuil Alerte', 'Seuil'], ['min', 'seuil']),
            marcheOuBc: findColIndex(['Marché ou Bon de commande d\'entrée', 'Marché ou Bon de commande', 'Marche/BC'], ['marche', 'bondecomm', 'bc'], ['n°', 'num', 'societe', 'attributaire', 'sortie']),
            numMarche: findColIndex(['N° d\'entrée', 'No d\'entree', 'N° d\'entree', 'N°', 'N', 'Numéro'], ['n°', 'num', 'reference'], ['article', 'date', 'reception', 'livraison', 'envoi', 'sortie']),
            societeAttributaire: findColIndex(['Société attributaire', 'Societe attributaire', 'Société', 'Societe', 'Fournisseur'], ['attributaire', 'fournisseur', 'marque', 'constructeur', 'societe'], ['marche', 'bc']),
            qteReceptionnee: findColIndex(['Qté Réceptionnée', 'Qte Receptionnee', 'Qté Récept'], ['reception', 'recept'], ['date', 'observation']),
            dateReception: findColIndex(['Date de réception', 'Date de reception', 'Date Réception'], ['date', 'reception', 'recu'], ['livr', 'envoi', 'maj', 'crea']),
            observationReception: findColIndex(['Observation de réception', 'Observation de reception'], ['observation', 'obs', 'remarque', 'note'], ['envoi', 'livr']),
            marcheOuBcSortie: findColIndex(['Message', 'Marché ou Bon de commande de sortie', 'Marché/BC de sortie'], ['marche', 'bc'], ['entrée', 'entree', 'reception']),
            numMarcheSortie: findColIndex(['N° de sortie', 'No de sortie', 'Numéro de sortie'], ['n°', 'num'], ['article', 'entrée', 'entree', 'reception']),
            beneficiaires: findColIndex(['Bénéficiaires', 'Beneficiaires', 'Bénéficiaire', 'Destinataire'], ['beneficiaire', 'destinataire', 'affectation', 'client']),
            region: findColIndex(['Région', 'Region'], ['region', 'secteur']),
            qteLivree: findColIndex(['Qté Livrée', 'Qte Livree', 'Qté Envoyée'], ['livr', 'envoy', 'sort'], ['date', 'observation']),
            dateLivraison: findColIndex(['Date de livraison', 'Date d\'envoi'], ['date', 'livr', 'envoi'], ['reception', 'maj', 'crea']),
            observationsEnvoi: findColIndex(['Observations sur l\'envoi', 'Observation sur l\'envoi'], ['observation', 'obs', 'remarque', 'note'], ['reception']),
            unite: findColIndex(['Unité', 'Unite'], ['unite', 'cond', 'mesure']),
            zone: findColIndex(['Zone', 'Secteur', 'Zone de stockage'], ['zone', 'secteur', 'depot', 'magasin']),
            emplacement: findColIndex(['Emplacement', 'Position', 'Etagère', 'Allée'], ['emplacement', 'position', 'case', 'etagere', 'allee']),
            rfid: findColIndex(['RFID', 'Tag RFID'], ['rfid', 'tag']),
            codeBarres: findColIndex(['CodeBarres', 'Code-barres', 'Barcode'], ['barre', 'code', 'barcode'], ['id', 'article']),
            etat: findColIndex(['État', 'Etat', 'Statut'], ['etat', 'statut', 'condition']),
            derniereMaj: findColIndex(['Dernière MAJ', 'Derniere MAJ', 'Date de mise à jour'], ['maj', 'miseajou', 'modifi', 'date'], ['reception', 'livr', 'envoi'])
          };

          const equipments: Equipment[] = [];

          for (let r = 1; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const getValue = (idx: number, fallback: string = "") => {
              if (idx === -1 || idx >= row.length) return fallback;
              return row[idx] !== undefined ? String(row[idx]).trim() : fallback;
            };

            const getNumber = (idx: number, fallback: number = 0) => {
              if (idx === -1 || idx >= row.length) return fallback;
              const v = parseFloat(row[idx]);
              return isNaN(v) ? fallback : v;
            };

            const equipName = getValue(colIndices.nom);
            if (!equipName) continue;

            const idVal = getValue(colIndices.id) || `EQ-${Math.floor(Math.random() * 90000 + 10000)}`;

            equipments.push({
              id: idVal,
              nom: equipName,
              categorie: getValue(colIndices.categorie, "Patrimoine"),
              marque: getValue(colIndices.societeAttributaire, "Protection Civile"),
              reference: getValue(colIndices.reference, "REF-PAT"),
              quantite: getNumber(colIndices.quantite, 0),
              qteMin: getNumber(colIndices.qteMin, 2),
              expediteur: getValue(colIndices.societeAttributaire, "Fournisseur Officiel"),
              qteReceptionnee: getNumber(colIndices.qteReceptionnee, 0),
              dateReception: getValue(colIndices.dateReception, ""),
              observationReception: getValue(colIndices.observationReception, ""),
              beneficiaires: getValue(colIndices.beneficiaires, ""),
              region: 'Rabat-Salé-Kénitra',
              qteLivree: getNumber(colIndices.qteLivree, 0),
              dateLivraison: getValue(colIndices.dateLivraison, ""),
              observationsEnvoi: getValue(colIndices.observationsEnvoi, ""),
              unite: getValue(colIndices.unite, "Pièce"),
              zone: getValue(colIndices.zone, "Zone A"),
              emplacement: getValue(colIndices.emplacement, "A01"),
              rfid: getValue(colIndices.rfid, `RFID-${Math.floor(Math.random() * 90000 + 10000)}`),
              codeBarres: getValue(colIndices.codeBarres, `CB-${Math.floor(Math.random() * 900000 + 100000)}`),
              etat: getValue(colIndices.etat, "Bon"),
              derniereMaj: getValue(colIndices.derniereMaj, new Date().toLocaleDateString('fr-FR')),
              rowIndex: r + 1,
              marcheOuBc: getValue(colIndices.marcheOuBc, ""),
              numMarche: getValue(colIndices.numMarche, ""),
              societeAttributaire: getValue(colIndices.societeAttributaire, ""),
              marcheOuBcSortie: getValue(colIndices.marcheOuBcSortie, ""),
              numMarcheSortie: getValue(colIndices.numMarcheSortie, "")
            });
          }

          if (equipments.length > 0) {
            const detectedYear = importYear.trim() || new Date().getFullYear().toString();
            const sheetDbName = `Patrimoine ${detectedYear} (${sheetName})`;

            sheetsResults.push({
              sheetName,
              dbId: `import_${selectedSite?.id || 'site'}_${detectedYear}_${Date.now()}_${sheetsResults.length}`,
              dbName: sheetDbName,
              description: `Importation Excel de la feuille "${sheetName}" - Année ${detectedYear} pour ${selectedSite?.name || 'Rabat-Salé-Kénitra'}.`,
              equipments,
              year: detectedYear
            });
          }
        });

        if (sheetsResults.length === 0) {
          throw new Error("Aucune donnée d'inventaire valide n'a été détectée dans ce fichier Excel.");
        }

        setParsedSheets(sheetsResults);
        setSelectedSheetIndices(sheetsResults.map((_, i) => i));
        setParseSuccess(`✅ ${sheetsResults.length} feuille(s) lue(s) avec succès avec un total de ${sheetsResults.reduce((sum, s) => sum + s.equipments.length, 0)} articles.`);
      } catch (err: any) {
        console.error("Excel parse error:", err);
        setParseError(err.message || "Erreur lors du traitement du fichier Excel.");
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Finalize Excel ingestion & create totally independent databases
  const handleFinalizeImport = async () => {
    if (!selectedSite || selectedSheetIndices.length === 0) return;

    const chosenYear = importYear.trim() || new Date().getFullYear().toString();
    const finalName = importDbName.trim() || `Patrimoine ${chosenYear}`;
    const timestamp = Date.now();
    
    // Check if a database already exists for this site and year
    let targetDb = databases.find(db => db.siteId === selectedSite.id && db.year === chosenYear && db.service === 'Patrimoine');
    let isNewDb = false;

    if (!targetDb) {
      targetDb = {
        id: `site_${selectedSite.id}_patrimoine_${chosenYear}_${timestamp}`,
        name: finalName,
        description: `Base de données globale pour l'année ${chosenYear} au ${selectedSite.name}.`,
        createdAt: new Date().toLocaleDateString('fr-FR'),
        lastModified: new Date().toLocaleDateString('fr-FR'),
        itemCount: 0,
        region: 'Rabat-Salé-Kénitra',
        year: chosenYear,
        service: 'Patrimoine',
        volet: selectedSite.volet,
        siteId: selectedSite.id,
        siteName: selectedSite.name
      };
      isNewDb = true;
    }

    // Load existing equipments if any
    const existingEquipmentsRaw = localStorage.getItem(`database_${targetDb.id}_equipments`);
    const existingEquipments: any[] = existingEquipmentsRaw ? JSON.parse(existingEquipmentsRaw) : [];
    
    const existingHistoryRaw = localStorage.getItem(`database_${targetDb.id}_history`);
    const existingHistory: any[] = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];

    let allNewEquipments: any[] = [];
    let totalNewQuantite = 0;

    for (const idx of selectedSheetIndices) {
      const pSheet = parsedSheets[idx];
      if (!pSheet) continue;
      
      allNewEquipments = [...allNewEquipments, ...pSheet.equipments];
      totalNewQuantite += pSheet.equipments.reduce((sum: number, e: any) => sum + (e.quantite || 0), 0);
    }

    // Merge and deduplicate if necessary, or simply append (as per 'add without replacing')
    const updatedEquipments = [...existingEquipments, ...allNewEquipments];
    targetDb.itemCount = updatedEquipments.length;
    targetDb.lastModified = new Date().toLocaleDateString('fr-FR');

    const newHistoryEvent = {
      id: `M-IMPORT-${timestamp}`,
      date: new Date().toLocaleString('fr-FR', { hour12: false }),
      type: 'Création',
      equipmentId: 'N/A',
      equipmentNom: `Import de fichiers Excel (${allNewEquipments.length} articles)`,
      quantite: totalNewQuantite,
      employe: user.fullName,
      employeUsername: user.username,
      service: 'Patrimoine',
      notes: `Fusion automatique: Ajout de ${allNewEquipments.length} articles à la base de données globale.`
    };
    const updatedHistory = [newHistoryEvent, ...existingHistory];

    // Save to local storage
    localStorage.setItem(`database_${targetDb.id}_equipments`, JSON.stringify(updatedEquipments));
    localStorage.setItem(`database_${targetDb.id}_history`, JSON.stringify(updatedHistory));

    // Update databases state
    let updatedDatabases = [...databases];
    if (isNewDb) {
      updatedDatabases.push(targetDb);
    } else {
      updatedDatabases = updatedDatabases.map(db => db.id === targetDb!.id ? targetDb! : db);
    }
    setDatabases(updatedDatabases);

    // Sync creation with Google Sheets if configured (skipped for now for brevity, or kept minimal)
    const appsScriptUrl = localStorage.getItem('elec_stock_apps_script_url');
    if (appsScriptUrl) {
      try {
        await fetch('/api/sync-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appsScriptUrl,
            payload: {
              action: isNewDb ? 'createDatabase' : 'updateDatabase',
              sheetName: targetDb.name,
              equipments: updatedEquipments
            }
          })
        });
      } catch (err) {
        console.error("Erreur de synchronisation Google Sheets:", err);
      }
    }

    // Reset import modal
    setExcelFile(null);
    setParsedSheets([]);
    setParseSuccess(null);
    setParseError(null);
    setImportDbName('');
    setShowImportModal(false);
  };
  // ----------------------------------------------------
  // STEP 1: ÉCRAN APRÈS CONNEXION (« Bienvenue au Service Patrimoine »)
  // ----------------------------------------------------
  if (currentStep === 'welcome_post_login') {
    return (
      <div 
        className="min-h-screen flex flex-col justify-between items-center py-10 px-4 sm:px-6 lg:px-8 relative bg-slate-900 select-none overflow-hidden text-slate-100 font-sans" 
      >
        {/* Rich Institutional Background: Micro-grid + Deep Gradient + Moroccan Lattice Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,#0f172a,#1e293b_50%,#0f172a)] opacity-95" />
        
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Micro-dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Watermark Moroccan Geometric Star */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <svg viewBox="0 0 100 100" className="w-[700px] h-[700px] text-white stroke-current fill-none stroke-[0.5]">
            <polygon points="50,0 61,39 100,50 61,61 50,100 39,61 0,50 39,39" />
            <polygon points="15,15 50,29 85,15 71,50 85,85 50,71 15,85 29,50" />
            <circle cx="50" cy="50" r="48" />
            <circle cx="50" cy="50" r="35" />
          </svg>
        </div>

        {/* Top Header Bar */}
        <header className="relative z-10 w-full max-w-4xl flex justify-between items-center px-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-1.5 bg-emerald-500 rounded-full" />
              <div className="w-2.5 h-1.5 bg-amber-400 rounded-full" />
              <div className="w-6 h-1.5 bg-red-600 rounded-full" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              DGPC • Royaume du Maroc
            </span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 text-xs font-black text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 shadow-sm px-3.5 py-2 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-red-400" />
            <span>Déconnexion</span>
          </button>
        </header>

        {/* Main Welcome Institutional Card */}
        <main className="max-w-3xl w-full relative z-10 bg-slate-800/90 backdrop-blur-md p-8 sm:p-10 rounded-3xl border border-slate-700 shadow-2xl my-6 text-center flex flex-col items-center">
          
          {/* Official Coat of Arms & Emblem */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-28 w-28 sm:h-32 sm:w-32 items-center justify-center bg-white rounded-3xl p-3 flex border-2 border-amber-500/80 shadow-2xl shadow-amber-500/20 mb-6 relative group"
          >
            <img 
              src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
              alt="Logo Protection Civile" 
              className="h-full w-full object-contain filter drop-shadow-md" 
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Subtitle / Header Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className="text-[10px] font-black tracking-widest text-amber-300 uppercase bg-amber-950/70 px-3.5 py-1 rounded-full border border-amber-600/50">
              Royaume du Maroc • Ministère de l'Intérieur
            </span>
            <span className="text-[10px] font-black tracking-widest text-red-300 uppercase bg-red-950/70 px-3.5 py-1 rounded-full border border-red-600/50">
              Direction Générale de la Protection Civile
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase leading-tight mt-1">
            Bienvenue au Service Patrimoine
          </h1>

          <div className="mt-3 flex items-center justify-center space-x-2">
            <MapPin className="h-4 w-4 text-[#C84B31] shrink-0" />
            <h2 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wider bg-slate-900/80 px-3.5 py-1 rounded-lg border border-amber-500/40">
              Commandement Régional : Rabat-Salé-Kénitra
            </h2>
          </div>

          <div className="w-48 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent my-6" />

          {/* User Profile Recap Card */}
          <div className="w-full bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 text-left flex items-center space-x-4 mb-6 shadow-inner">
            <div className="h-12 w-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm text-amber-400">
              <UserIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-white truncate">{user.fullName}</span>
                <span className="text-[9px] font-extrabold uppercase bg-red-900/60 text-red-300 border border-red-700 px-2 py-0.5 rounded-md">
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
                {user.grade && user.grade !== '-' ? `${user.grade} — ` : ''}{user.fonction || 'Agent Responsable du Patrimoine'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-extrabold text-emerald-400 block uppercase">● Session Active</span>
              <span className="text-[9px] text-slate-400 font-mono font-bold">PATRIMOINE RSK</span>
            </div>
          </div>

          {/* Scope Highlights: Magasins & Dépôt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
            <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 text-left flex items-start space-x-3">
              <Store className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-amber-300 block uppercase">Volet Magasins</span>
                <span className="text-[11px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                  Magasin de Kénitra & Magasin DGPC Siège
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-700/70 rounded-xl p-4 text-left flex items-start space-x-3">
              <Warehouse className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-black text-red-300 block uppercase">Volet Dépôt</span>
                <span className="text-[11px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                  Dépôt Central de Sidi Allal Bahraoui
                </span>
              </div>
            </div>
          </div>

          {/* « Suivant » Navigation Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep('site_organization')}
            className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#C84B31] via-amber-600 to-[#C84B31] hover:from-[#b54027] hover:to-[#b54027] transition-all cursor-pointer shadow-xl shadow-red-900/40"
          >
            <span>Accéder à l'Organisation des Sites</span>
            <ArrowRight className="ml-2 h-4 w-4 text-white" />
          </motion.button>

        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center text-slate-500 text-[10px] font-extrabold tracking-wider uppercase">
          Service Patrimoine — Direction Générale de la Protection Civile • Région Rabat-Salé-Kénitra
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 2: ORGANISATION DES SITES (MAGASINS VS DÉPÔT)
  // ----------------------------------------------------
  if (currentStep === 'site_organization') {
    return (
      <div 
        className="min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative bg-slate-900 select-none text-slate-100 font-sans" 
      >
        {/* Rich Institutional Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,#0f172a,#1e293b_50%,#0f172a)] opacity-95" />
        
        {/* Micro-dot grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Top Bar with Back & User info */}
        <header className="relative z-10 max-w-5xl mx-auto w-full flex justify-between items-center pb-6 border-b border-slate-700/80">
          <button
            onClick={() => setCurrentStep('welcome_post_login')}
            className="flex items-center space-x-2 text-xs font-black text-slate-200 hover:text-white bg-slate-800/90 shadow-sm px-4 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-amber-400" />
            <span>Accueil Patrimoine</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-white block">{user.fullName}</span>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase">Patrimoine • RSK</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 border border-slate-700 shadow-sm transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </header>

        {/* Main Content: Site Selection */}
        <main className="relative z-10 max-w-5xl mx-auto w-full my-8">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-amber-950/80 text-amber-300 border border-amber-600/50 text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-3 shadow-xs">
              <span>Région Rabat-Salé-Kénitra • Service Patrimoine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Organisation des Sites
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1.5 max-w-lg mx-auto">
              Sélectionnez votre espace de travail : Magasin ou Dépôt Central
            </p>
          </div>

          {/* Quick Access to Technical Sheets Banner */}
          <div className="mb-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/90 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-2xl bg-[#C84B31] text-white flex items-center justify-center shadow-lg shrink-0 border border-white/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Fiches Techniques des Sites
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                    3 Sites Enregistrés
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight mt-0.5">
                  Fiches Techniques & Caractéristiques des Sites
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Consultez, modifiez et mettez à jour les caractéristiques, superficies, responsables et zones de stockage.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTechnicalSiteId('depot_sidi_allal_bahraoui');
                setShowTechnicalSheetModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C84B31] hover:bg-[#b54027] text-white font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg shadow-red-950/40 cursor-pointer shrink-0 uppercase tracking-wider"
            >
              <FileText className="h-4 w-4" />
              <span>Consulter & Modifier les Fiches</span>
            </button>
          </div>

          {/* 2 Main Structure Blocks: Magasins vs Dépôt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. SECTION MAGASINS */}
            <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700 p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:border-amber-500/60 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center shadow-inner">
                    <Store className="h-7 w-7 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-900/60 text-amber-300 border border-amber-700/60 px-3 py-1 rounded-full">
                    2 Magasins Régionaux
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Espace Magasins
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                  Gestion des stocks de proximité et inventaires des magasins de Kénitra et du Siège DGPC.
                </p>

                {/* Quick Entrance Button */}
                {(() => {
                  const quickMagasinDb = databases.find(d => d.volet === 'magasin' && d.year === '2026') || databases.find(d => d.volet === 'magasin');
                  return quickMagasinDb ? (
                    <div className="mt-5">
                      <button
                        onClick={() => handleOpenDatabase(quickMagasinDb)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 cursor-pointer"
                      >
                        <Store className="h-4 w-4" />
                        <span>Entrer dans l'Espace Magasin (2026)</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Sub-sites list under Magasins */}
                <div className="space-y-3 mt-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Sites disponibles & Historiques :
                  </span>
                  {RSK_SITES.filter(s => s.volet === 'magasin').map(site => {
                    const count = databases.filter(d => d.siteId === site.id).length;
                    return (
                      <div
                        key={site.id}
                        className="w-full bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-amber-500/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 group transition-all shadow-sm"
                      >
                        <div 
                          onClick={() => handleSelectSite(site)}
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-amber-500/80 shadow-sm">
                            <Building className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-200 block uppercase group-hover:text-amber-300 transition-colors">
                              {site.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {site.city} • {count} base(s) de données
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTechnicalSiteId(site.id);
                              setShowTechnicalSheetModal(true);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 hover:border-amber-500/50 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            title="Consulter et modifier la fiche technique du site"
                          >
                            <FileText className="h-3.5 w-3.5 text-amber-400" />
                            <span>Fiche</span>
                          </button>

                          <button
                            onClick={() => handleSelectSite(site)}
                            className="p-1.5 text-slate-400 group-hover:text-amber-400 transition-colors cursor-pointer"
                            title="Entrer dans le site"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 text-[10px] font-bold text-amber-400/80 uppercase">
                Service Patrimoine • Volet Magasins
              </div>
            </div>

            {/* 2. SECTION DÉPÔT */}
            <div className="bg-slate-800/90 backdrop-blur-md rounded-3xl border border-slate-700 p-6 sm:p-8 flex flex-col justify-between shadow-2xl hover:border-red-500/60 transition-all">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-red-950/60 border border-red-600/50 flex items-center justify-center shadow-inner">
                    <Warehouse className="h-7 w-7 text-red-400" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-900/60 text-red-300 border border-red-700/60 px-3 py-1 rounded-full">
                    1 Dépôt Central Stratégique
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Espace Dépôt Central
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                  Gestion du stock central régional, réserves et approvisionnements à Sidi Allal Bahraoui.
                </p>

                {/* Quick Entrance Button */}
                {(() => {
                  const quickDepotDb = databases.find(d => d.volet === 'depot' && d.year === '2026') || databases.find(d => d.volet === 'depot');
                  return quickDepotDb ? (
                    <div className="mt-5">
                      <button
                        onClick={() => handleOpenDatabase(quickDepotDb)}
                        className="w-full bg-[#C84B31] hover:bg-[#b54027] text-white font-black text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 cursor-pointer"
                      >
                        <Warehouse className="h-4 w-4" />
                        <span>Entrer dans l'Espace Dépôt (2026)</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null;
                })()}

                {/* Sub-sites list under Dépôt */}
                <div className="space-y-3 mt-5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Sites disponibles & Historiques :
                  </span>
                  {RSK_SITES.filter(s => s.volet === 'depot').map(site => {
                    const count = databases.filter(d => d.siteId === site.id).length;
                    return (
                      <div
                        key={site.id}
                        className="w-full bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-red-500/80 rounded-2xl p-3.5 flex items-center justify-between gap-2 group transition-all shadow-sm"
                      >
                        <div 
                          onClick={() => handleSelectSite(site)}
                          className="flex items-center space-x-3 flex-1 cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-red-500/80 shadow-sm">
                            <Warehouse className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-200 block uppercase group-hover:text-red-300 transition-colors">
                              {site.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {site.city} • {count} base(s) de données
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTechnicalSiteId(site.id);
                              setShowTechnicalSheetModal(true);
                            }}
                            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-red-500/20 text-red-300 border border-slate-700 hover:border-red-500/50 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            title="Consulter et modifier la fiche technique du dépôt"
                          >
                            <FileText className="h-3.5 w-3.5 text-red-400" />
                            <span>Fiche</span>
                          </button>

                          <button
                            onClick={() => handleSelectSite(site)}
                            className="p-1.5 text-slate-400 group-hover:text-red-400 transition-colors cursor-pointer"
                            title="Entrer dans le dépôt"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 text-[10px] font-bold text-red-400/80 uppercase">
                Service Patrimoine • Volet Dépôt
              </div>
            </div>

          </div>

        </main>

        {/* Technical Sheet Modal right in the Organisation des sites step */}
        <SiteTechnicalSheetModal
          isOpen={showTechnicalSheetModal}
          onClose={() => setShowTechnicalSheetModal(false)}
          initialSiteId={selectedTechnicalSiteId}
          onOpenSiteDatabase={(siteId) => {
            setShowTechnicalSheetModal(false);
            const s = RSK_SITES.find(x => x.id === siteId);
            if (s) {
              handleSelectSite(s);
            } else {
              const defaultDb = databases.find(d => d.siteId === siteId) || databases[0];
              if (defaultDb) handleOpenDatabase(defaultDb);
            }
          }}
        />

        {/* Footer */}
        <footer className="relative z-10 text-center text-slate-500 text-[10px] font-bold tracking-wider uppercase py-4">
          Direction Générale de la Protection Civile • Région Rabat-Salé-Kénitra
        </footer>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 3: BASES DE DONNÉES DU SITE SÉLECTIONNÉ
  // Classées chronologiquement par année (de la plus récente à la plus ancienne)
  // Totalement indépendantes les unes des autres
  // ----------------------------------------------------
  return (
    <div 
      className="min-h-screen flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-slate-50 via-gray-100 to-amber-50/40 select-none" 
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      {/* Top Header & Breadcrumb */}
      <header className="relative z-10 max-w-6xl mx-auto w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentStep('site_organization')}
            className="flex items-center space-x-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white shadow-sm px-3.5 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="h-4 w-4 text-amber-600" />
            <span>Changer de site</span>
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 overflow-x-auto py-1">
            <span className="text-slate-500">Patrimoine (RSK)</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="uppercase text-amber-800 font-extrabold">{selectedSite?.volet === 'magasin' ? 'Magasins' : 'Dépôt'}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-extrabold truncate">{selectedSite?.name}</span>
          </div>
        </div>

        {/* User & Actions */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          {lastDeletedDb && (
            <button
              onClick={handleUndoDelete}
              className="flex items-center space-x-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer shadow-sm"
              title="Restaurer la dernière base supprimée (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Annuler suppression (Ctrl+Z)</span>
            </button>
          )}

          <div className="bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-right shadow-sm">
            <span className="text-xs font-black text-slate-900 block">{user.fullName}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">Service Patrimoine</span>
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-sm transition-colors cursor-pointer"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </header>

      {/* Main Content: Databases by Year */}
      <main className="relative z-10 max-w-6xl mx-auto w-full my-8 flex-1">
        
        {/* Site Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-start space-x-4">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                selectedSite?.volet === 'magasin' 
                  ? 'bg-amber-50 border-amber-200 text-amber-600' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {selectedSite?.volet === 'magasin' ? (
                  <Store className="h-8 w-8" />
                ) : (
                  <Warehouse className="h-8 w-8" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                    selectedSite?.volet === 'magasin'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {selectedSite?.volet === 'magasin' ? 'Magasin Régional' : 'Dépôt Central'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                    Région : Rabat-Salé-Kénitra
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mt-1.5">
                  {selectedSite?.name}
                </h1>
                
                <p className="text-xs text-slate-600 font-medium mt-1 flex items-center space-x-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span>{selectedSite?.address}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setImportYear(new Date().getFullYear().toString());
                  setImportDbName('');
                  setExcelFile(null);
                  setParsedSheets([]);
                  setParseError(null);
                  setParseSuccess(null);
                  setShowImportModal(true);
                }}
                className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white text-xs font-black uppercase tracking-wider px-4 py-3 rounded-2xl shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Importer une base de données</span>
              </button>

              <button
                onClick={() => {
                  setNewDbYear(new Date().getFullYear().toString());
                  setNewDbName(`Patrimoine ${new Date().getFullYear()}`);
                  setNewDbDescription('');
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider px-4 py-3 rounded-2xl border border-slate-200 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4 text-amber-600" />
                <span>Créer manuellement</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTechnicalSiteId(selectedSite?.id);
                  setShowTechnicalSheetModal(true);
                }}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-black uppercase tracking-wider px-4 py-3 rounded-2xl border border-slate-300 hover:border-[#C84B31] transition-all cursor-pointer shadow-sm"
              >
                <FileText className="h-4 w-4 text-[#C84B31]" />
                <span>Fiche Technique du Site</span>
              </button>
            </div>

          </div>
        </div>

        {/* Databases Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center space-x-2">
              <Database className="h-5 w-5 text-amber-600" />
              <span>Bases de données par année</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Classées automatiquement de la plus récente à la plus ancienne. Chaque base est 100% indépendante.
            </p>
          </div>
          <span className="text-xs font-black uppercase bg-white border border-slate-200 text-amber-800 px-3 py-1.5 rounded-xl shadow-sm">
            {siteDatabases.length} base(s) enregistrée(s)
          </span>
        </div>

        {/* Database Cards Grid */}
        {siteDatabases.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-lg">
            <Database className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900 uppercase">Aucune base de données enregistrée</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-md mx-auto">
              Importez un fichier Excel (.xlsx, .csv) ou créez manuellement la première base pour le {selectedSite?.name}.
            </p>
            <button
              onClick={() => setShowImportModal(true)}
              className="mt-6 inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase px-5 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-red-600/20"
            >
              <Upload className="h-4 w-4" />
              <span>Importer une base</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {siteDatabases.map((db, idx) => (
              <motion.div
                key={db.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-3xl border border-slate-200 hover:border-amber-400 p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all group"
              >
                <div>
                  
                  {/* Card Header with Year badge & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-3 py-1 rounded-xl shadow-sm font-mono">
                        {db.year || '2026'}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg">
                        Patrimoine
                      </span>
                    </div>

                    <button
                      onClick={() => setDbToDelete(db)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette base de données"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Database Name & Description */}
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-amber-700 transition-colors">
                    {db.name}
                  </h3>

                  <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                    {db.description || `Inventaire du patrimoine pour l'année ${db.year} au ${selectedSite?.name}.`}
                  </p>

                  {/* Metrics Badge */}
                  <div className="grid grid-cols-2 gap-2 mt-5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">Articles enregistrés</span>
                      <span className="text-xs font-black text-slate-900 font-mono mt-0.5 block">{db.itemCount} articles</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">Dernière MAJ</span>
                      <span className="text-xs font-black text-slate-700 font-mono mt-0.5 block">{db.lastModified || db.createdAt}</span>
                    </div>
                  </div>

                </div>

                {/* Open Inventory Button */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenDatabase(db)}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-amber-600 hover:to-red-600 text-white text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-2xl transition-all cursor-pointer shadow-md"
                  >
                    <span>Ouvrir l'inventaire</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-slate-500 text-[10px] font-bold tracking-wider uppercase py-4 border-t border-slate-200 mt-8">
        Service Patrimoine — Région Rabat-Salé-Kénitra • Gestion Indépendante Multi-Années
      </footer>

      {/* ---------------------------------------------------- */}
      {/* MODAL: IMPORTER UNE NOUVELLE BASE DE DONNÉES         */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8 text-slate-900"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900">Importer une base de données</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedSite?.name} • Service Patrimoine</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Year & Name Input Section */}
              <div className="space-y-4 mb-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-800 mb-1.5 tracking-wider">
                      Année de référence *
                    </label>
                    <input
                      type="number"
                      min="1990"
                      max="2050"
                      required
                      value={importYear}
                      onChange={(e) => setImportYear(e.target.value)}
                      placeholder="Ex: 2026"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                      Nom de la base (optionnel)
                    </label>
                    <input
                      type="text"
                      value={importDbName}
                      onChange={(e) => setImportDbName(e.target.value)}
                      placeholder={`Ex: Patrimoine ${importYear || '2026'}`}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  Cette base sera automatiquement classée par année (de la plus récente à la plus ancienne) et restera totalement isolée.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-slate-300 bg-slate-50 hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <FileSpreadsheet className="h-10 w-10 text-amber-600 mx-auto mb-3" />
                <span className="text-xs font-black uppercase text-slate-900 block">
                  {excelFile ? excelFile.name : 'Déposez votre fichier Excel / CSV ici'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  Formats supportés : .xlsx, .xls, .csv (multi-feuilles supporté)
                </span>
              </div>

              {/* Parsing status feedbacks */}
              {isParsing && (
                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center space-x-2.5 text-xs text-amber-800 font-bold">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span>Analyse et détection des colonnes en cours...</span>
                </div>
              )}

              {parseError && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2.5 text-xs text-red-700 font-bold">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {parseSuccess && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{parseSuccess}</span>
                </div>
              )}

              {/* Parsed sheets checklist if multi-sheet */}
              {parsedSheets.length > 0 && (
                <div className="mt-5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  <span className="text-[10px] font-black uppercase text-slate-600 block tracking-wider">
                    Feuilles prêtes à être importées :
                  </span>
                  {parsedSheets.map((ps, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <span className="font-black text-slate-900">{ps.sheetName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({ps.equipments.length} articles)</span>
                      </div>
                      <span className="text-[10px] font-black text-amber-800 uppercase font-mono bg-amber-100 px-2 py-0.5 rounded">
                        Année : {ps.year}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  disabled={parsedSheets.length === 0 || isParsing}
                  onClick={handleFinalizeImport}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Valider l'importation
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL: CRÉER MANUELLEMENT UNE BASE DE DONNÉES        */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-900"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-slate-900">Créer une base de données</h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedSite?.name} • Service Patrimoine</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDatabaseSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[10px] font-black uppercase text-amber-800 mb-1.5 tracking-wider">
                    Année de référence *
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2050"
                    required
                    value={newDbYear}
                    onChange={(e) => {
                      setNewDbYear(e.target.value);
                      if (!newDbName || newDbName.startsWith('Patrimoine')) {
                        setNewDbName(`Patrimoine ${e.target.value}`);
                      }
                    }}
                    placeholder="Ex: 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                    Nom de la base *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    placeholder="Ex: Patrimoine 2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-700 mb-1.5 tracking-wider">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newDbDescription}
                    onChange={(e) => setNewDbDescription(e.target.value)}
                    placeholder={`Inventaire du patrimoine pour l'année ${newDbYear} au ${selectedSite?.name}...`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    Créer la base
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* MODAL: CONFIRMATION DE SUPPRESSION DE BASE           */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {dbToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900"
            >
              <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4 text-red-600">
                <Trash2 className="h-6 w-6" />
              </div>

              <h3 className="text-base font-black uppercase text-slate-900">Supprimer la base de données ?</h3>
              <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer la base <strong className="text-slate-900 font-bold">"{dbToDelete.name}"</strong> ({dbToDelete.itemCount} articles) ? 
                Cette action est réversible avec le raccourci <strong className="text-amber-700 font-mono">Ctrl+Z</strong>.
              </p>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDbToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDatabaseConfirm}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/20"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Technical Sheet Modal */}
      <SiteTechnicalSheetModal
        isOpen={showTechnicalSheetModal}
        onClose={() => setShowTechnicalSheetModal(false)}
        initialSiteId={selectedTechnicalSiteId}
        onOpenSiteDatabase={(siteId) => {
          setShowTechnicalSheetModal(false);
          const s = RSK_SITES.find(x => x.id === siteId);
          if (s) {
            handleSelectSite(s);
          } else {
            const defaultDb = databases.find(d => d.siteId === siteId) || databases[0];
            if (defaultDb) handleOpenDatabase(defaultDb);
          }
        }}
      />

    </div>
  );
}
