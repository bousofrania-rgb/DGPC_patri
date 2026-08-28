import { useState, useEffect, useMemo, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchPublicInventory, fetchLoginUsers, fetchHistoryLogs } from './lib/publicSheets';
import { Equipment, StockMovement, DatabaseImport, AuthState, UserRole, User as UserType } from './types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Zap, 
  Search, 
  RefreshCw, 
  Database, 
  Package, 
  AlertTriangle, 
  FileSpreadsheet, 
  Plus,
  History,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowUpDown,
  User,
  Barcode,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  MapPin,
  RotateCcw,
  Volume2,
  Copy,
  Check,
  Box,
  Camera,
  CameraOff,
  Download,
  FileText,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Home,
  Menu,
  Users,
  Mail,
  SlidersHorizontal,
  Columns,
  Settings,
  Store,
  Warehouse,
  Layers
} from 'lucide-react';
import EquipmentModal, { CATEGORIES, ETATS } from './components/EquipmentModal';
import ColumnCustomizerModal from './components/ColumnCustomizerModal';
import ConfirmModal from './components/ConfirmModal';
import AccountModal from './components/AccountModal';
import Warehouse3D from './components/Warehouse3D';
import StockRecap from './components/StockRecap';
import InternalMessages from './components/InternalMessages';
import UrgenceTab from './components/UrgenceTab';
import HomeTab from './components/HomeTab';
import TransactionsEntreesTab from './components/TransactionsEntreesTab';
import TransactionsSortiesTab from './components/TransactionsSortiesTab';
import VerificationTab from './components/VerificationTab';
import DocsEntreesTab from './components/DocsEntreesTab';
import DocsSortiesTab from './components/DocsSortiesTab';
import FichesTechniquesTab from './components/FichesTechniquesTab';
import Sidebar from './components/Sidebar';
import DatabasesTab from './components/DatabasesTab';
import AgendaTab from './components/AgendaTab';
import UserManagementView from './components/UserManagementView';
import FinanceModule from './components/FinanceModule';
import CoutsValorisationModule from './components/CoutsValorisationModule';
import { getAccessibleTabs } from './lib/permissions';



import jsPDF from 'jspdf';
import { 
  addOfficialHeader, 
  addDocumentTitleBanner, 
  addSummaryCards, 
  getStandardAutoTableOptions, 
  addOfficialSignatureBlock, 
  addOfficialPageFooters 
} from './pdfUtils';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const DEFAULT_COLUMN_HEADERS: Record<string, string> = {
  id: "Article N°",
  nom: "Désignation",
  categorie: "Catégorie",
  reference: "Référence",
  quantite: "Quantité Actuelle",
  qteMin: "Qté Min",
  marcheOuBc: "Marché ou Bon de commande d'entrée",
  numMarche: "N° d'entrée",
  societeAttributaire: "Société attributaire",
  qteReceptionnee: "Qté Réceptionnée",
  dateReception: "Date de réception",
  observationReception: "Observation de réception",
  marcheOuBcSortie: "Message",
  numMarcheSortie: "N° de sortie",
  beneficiaires: "Bénéficiaires",
  region: "Région",
  qteLivree: "Qté Livrée",
  dateLivraison: "Date de livraison",
  observationsEnvoi: "Observations sur l'envoi",
  unite: "Unité",
  zone: "Zone",
  emplacement: "Emplacement",
  rfid: "RFID",
  codeBarres: "CodeBarres",
  etat: "État",
  derniereMaj: "Dernière MAJ",
};

const DEFAULT_SPREADSHEET_ID = '1l8iepIDvNT893nbRQ5bS-vAw0_mrBiQToDpB0VnTgGg';

// Default preloaded 40 items from the actual official Google Sheet as fallback
const INITIAL_EQUIPMENT: Equipment[] = [
  { id: "1", nom: "Disjoncteur 10A", categorie: "Protection", marque: "Schneider", reference: "A9F74110", quantite: 45, qteMin: 10, unite: "Pièce", zone: "Zone A", emplacement: "A01", rfid: "RFID0001", codeBarres: "CB000001", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 2 },
  { id: "2", nom: "Disjoncteur 16A", categorie: "Protection", marque: "Schneider", reference: "A9F74116", quantite: 38, qteMin: 10, unite: "Pièce", zone: "Zone A", emplacement: "A02", rfid: "RFID0002", codeBarres: "CB000002", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 3 },
  { id: "3", nom: "Disjoncteur 20A", categorie: "Protection", marque: "Schneider", reference: "A9F74120", quantite: 30, qteMin: 8, unite: "Pièce", zone: "Zone A", emplacement: "A03", rfid: "RFID0003", codeBarres: "CB000003", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 4 },
  { id: "4", nom: "Disjoncteur différentiel 40A", categorie: "Protection", marque: "Legrand", reference: "DX³", quantite: 20, qteMin: 5, unite: "Pièce", zone: "Zone A", emplacement: "A04", rfid: "RFID0004", codeBarres: "CB000004", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 5 },
  { id: "5", nom: "Interrupteur différentiel 63A", categorie: "Protection", marque: "ABB", reference: "F204", quantite: 15, qteMin: 4, unite: "Pièce", zone: "Zone A", emplacement: "A05", rfid: "RFID0005", codeBarres: "CB000005", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 6 },
  { id: "6", nom: "Contacteur 9A", categorie: "Commande", marque: "Schneider", reference: "LC1D09", quantite: 25, qteMin: 6, unite: "Pièce", zone: "Zone B", emplacement: "B01", rfid: "RFID0006", codeBarres: "CB000006", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 7 },
  { id: "7", nom: "Contacteur 18A", categorie: "Commande", marque: "Schneider", reference: "LC1D18", quantite: 18, qteMin: 5, unite: "Pièce", zone: "Zone B", emplacement: "B02", rfid: "RFID0007", codeBarres: "CB000007", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 8 },
  { id: "8", nom: "Relais thermique", categorie: "Protection", marque: "Schneider", reference: "LRD12", quantite: 12, qteMin: 3, unite: "Pièce", zone: "Zone B", emplacement: "B03", rfid: "RFID0008", codeBarres: "CB000008", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 9 },
  { id: "9", nom: "Relais auxiliaire", categorie: "Commande", marque: "Schneider", reference: "RXM2AB2", quantite: 35, qteMin: 8, unite: "Pièce", zone: "Zone B", emplacement: "B04", rfid: "RFID0009", codeBarres: "CB000009", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 10 },
  { id: "10", nom: "Automate PLC S7-1200", categorie: "Automatisme", marque: "Siemens", reference: "CPU1212C", quantite: 5, qteMin: 2, unite: "Pièce", zone: "Zone C", emplacement: "C01", rfid: "RFID0010", codeBarres: "CB000010", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 11 },
  { id: "11", nom: "Module Entrées/Sorties", categorie: "Automatisme", marque: "Siemens", reference: "SM1223", quantite: 7, qteMin: 2, unite: "Pièce", zone: "Zone C", emplacement: "C02", rfid: "RFID0011", codeBarres: "CB000011", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 12 },
  { id: "12", nom: "Écran HMI KTP700", categorie: "Automatisme", marque: "Siemens", reference: "KTP700", quantite: 4, qteMin: 1, unite: "Pièce", zone: "Zone C", emplacement: "C03", rfid: "RFID0012", codeBarres: "CB000012", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 13 },
  { id: "13", nom: "Variateur ATV320", categorie: "Variation", marque: "Schneider", reference: "ATV320U07", quantite: 6, qteMin: 2, unite: "Pièce", zone: "Zone C", emplacement: "C04", rfid: "RFID0013", codeBarres: "CB000013", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 14 },
  { id: "14", nom: "Variateur ATV630", categorie: "Variation", marque: "Schneider", reference: "ATV630D15", quantite: 3, qteMin: 1, unite: "Pièce", zone: "Zone C", emplacement: "C05", rfid: "RFID0014", codeBarres: "CB000014", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 15 },
  { id: "15", nom: "Moteur 0.75 kW", categorie: "Machines", marque: "Siemens", reference: "1LE1001", quantite: 8, qteMin: 2, unite: "Pièce", zone: "Zone D", emplacement: "D01", rfid: "RFID0015", codeBarres: "CB000015", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 16 },
  { id: "16", nom: "Moteur 1.5 kW", categorie: "Machines", marque: "Siemens", reference: "1LE1002", quantite: 7, qteMin: 2, unite: "Pièce", zone: "Zone D", emplacement: "D02", rfid: "RFID0016", codeBarres: "CB000016", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 17 },
  { id: "17", nom: "Moteur 5.5 kW", categorie: "Machines", marque: "Siemens", reference: "1LE1003", quantite: 3, qteMin: 1, unite: "Pièce", zone: "Zone D", emplacement: "D03", rfid: "RFID0017", codeBarres: "CB000017", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 18 },
  { id: "18", nom: "Capteur inductif M18", categorie: "Capteurs", marque: "Omron", reference: "E2E-X8", quantite: 30, qteMin: 10, unite: "Pièce", zone: "Zone E", emplacement: "E01", rfid: "RFID0018", codeBarres: "CB000018", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 19 },
  { id: "19", nom: "Capteur capacitif", categorie: "Capteurs", marque: "Omron", reference: "E2K-C25", quantite: 15, qteMin: 5, unite: "Pièce", zone: "Zone E", emplacement: "E02", rfid: "RFID0019", codeBarres: "CB000019", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 20 },
  { id: "20", nom: "Cellule photoélectrique", categorie: "Capteurs", marque: "Sick", reference: "WL18", quantite: 14, qteMin: 5, unite: "Pièce", zone: "Zone E", emplacement: "E03", rfid: "RFID0020", codeBarres: "CB000020", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 21 },
  { id: "21", nom: "Fin de course", categorie: "Capteurs", marque: "Schneider", reference: "XCKM", quantite: 20, qteMin: 5, unite: "Pièce", zone: "Zone E", emplacement: "E04", rfid: "RFID0021", codeBarres: "CB000021", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 22 },
  { id: "22", nom: "Bouton poussoir Vert", categorie: "Commande", marque: "Schneider", reference: "XB5AA31", quantite: 50, qteMin: 15, unite: "Pièce", zone: "Zone F", emplacement: "F01", rfid: "RFID0022", codeBarres: "CB000022", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 23 },
  { id: "23", nom: "Bouton poussoir Rouge", categorie: "Commande", marque: "Schneider", reference: "XB5AA42", quantite: 48, qteMin: 15, unite: "Pièce", zone: "Zone F", emplacement: "F02", rfid: "RFID0023", codeBarres: "CB000023", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 24 },
  { id: "24", nom: "Arrêt d'urgence", categorie: "Sécurité", marque: "Schneider", reference: "XB5AS", quantite: 15, qteMin: 5, unite: "Pièce", zone: "Zone F", emplacement: "F03", rfid: "RFID0024", codeBarres: "CB000024", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 25 },
  { id: "25", nom: "Voyant Vert", categorie: "Signalisation", marque: "Schneider", reference: "XB5AVB3", quantite: 40, qteMin: 10, unite: "Pièce", zone: "Zone F", emplacement: "F04", rfid: "RFID0025", codeBarres: "CB000025", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 26 },
  { id: "26", nom: "Voyant Rouge", categorie: "Signalisation", marque: "Schneider", reference: "XB5AVM3", quantite: 35, qteMin: 10, unite: "Pièce", zone: "Zone F", emplacement: "F05", rfid: "RFID0026", codeBarres: "CB000026", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 27 },
  { id: "27", nom: "Alimentation 24VDC", categorie: "Alimentation", marque: "Siemens", reference: "SITOP PSU100", quantite: 10, qteMin: 3, unite: "Pièce", zone: "Zone G", emplacement: "G01", rfid: "RFID0027", codeBarres: "CB000027", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 28 },
  { id: "28", nom: "Transformateur 400/24V", categorie: "Alimentation", marque: "Schneider", reference: "ABL6", quantite: 6, qteMin: 2, unite: "Pièce", zone: "Zone G", emplacement: "G02", rfid: "RFID0028", codeBarres: "CB000028", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 29 },
  { id: "29", nom: "Onduleur UPS 2kVA", categorie: "Alimentation", marque: "APC", reference: "SMT2200", quantite: 2, qteMin: 1, unite: "Pièce", zone: "Zone G", emplacement: "G03", rfid: "RFID0029", codeBarres: "CB000029", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 30 },
  { id: "30", nom: "Câble U1000 R2V 3G2.5", categorie: "Câblage", marque: "Nexans", reference: "U1000", quantite: 500, qteMin: 100, unite: "m", zone: "Zone H", emplacement: "H01", rfid: "RFID0030", codeBarres: "CB000030", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 31 },
  { id: "31", nom: "Câble U1000 R2V 5G6", categorie: "Câblage", marque: "Nexans", reference: "U1000", quantite: 350, qteMin: 80, unite: "m", zone: "Zone H", emplacement: "H02", rfid: "RFID0031", codeBarres: "CB000031", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 32 },
  { id: "32", nom: "Goulotte PVC", categorie: "Accessoires", marque: "Legrand", reference: "DLPlus", quantite: 120, qteMin: 30, unite: "m", zone: "Zone H", emplacement: "H03", rfid: "RFID0032", codeBarres: "CB000032", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 33 },
  { id: "33", nom: "Bornier", categorie: "Accessoires", marque: "Phoenix Contact", reference: "UK5N", quantite: 200, qteMin: 50, unite: "Pièce", zone: "Zone H", emplacement: "H04", rfid: "RFID0033", codeBarres: "CB000033", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 34 },
  { id: "34", nom: "Rail DIN", categorie: "Accessoires", marque: "Schneider", reference: "NSY", quantite: 90, qteMin: 20, unite: "Pièce", zone: "Zone H", emplacement: "H05", rfid: "RFID0034", codeBarres: "CB000034", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 35 },
  { id: "35", nom: "Coffret électrique", categorie: "Armoires", marque: "Schneider", reference: "PrismaSeT", quantite: 12, qteMin: 3, unite: "Pièce", zone: "Zone I", emplacement: "I01", rfid: "RFID0035", codeBarres: "CB000035", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 36 },
  { id: "36", nom: "Armoire électrique", categorie: "Armoires", marque: "Schneider", reference: "Spacial", quantite: 5, qteMin: 2, unite: "Pièce", zone: "Zone I", emplacement: "I02", rfid: "RFID0036", codeBarres: "CB000036", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 37 },
  { id: "37", nom: "Prise industrielle 32A", categorie: "Distribution", marque: "Legrand", reference: "P17", quantite: 18, qteMin: 5, unite: "Pièce", zone: "Zone I", emplacement: "I03", rfid: "RFID0037", codeBarres: "CB000037", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 38 },
  { id: "38", nom: "Fiche industrielle 32A", categorie: "Distribution", marque: "Legrand", reference: "P17", quantite: 20, qteMin: 5, unite: "Pièce", zone: "Zone I", emplacement: "I04", rfid: "RFID0038", codeBarres: "CB000038", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 39 },
  { id: "39", nom: "Fusible NH", categorie: "Protection", marque: "ABB", reference: "NH00", quantite: 60, qteMin: 20, unite: "Pièce", zone: "Zone J", emplacement: "J01", rfid: "RFID0039", codeBarres: "CB000039", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 40 },
  { id: "40", nom: "Sectionneur porte-fusible", categorie: "Protection", marque: "Schneider", reference: "TeSys", quantite: 16, qteMin: 4, unite: "Pièce", zone: "Zone J", emplacement: "J02", rfid: "RFID0040", codeBarres: "CB000040", etat: "Bon", derniereMaj: "03/07/2026", rowIndex: 41 }
];

const GOOGLE_APPS_SCRIPT_CODE = `function doPost(e) {
  var response = { success: false };
  try {
    var params = JSON.parse(e.postData.contents);
    var spreadsheetId = params.spreadsheetId;
    var action = params.action; // 'add', 'update', 'delete', 'addMovement'
    var data = params.data;
    var customColumns = params.customColumns || [];
    
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = params.sheetName ? ss.getSheetByName(params.sheetName) : ss.getSheets()[0];
    
    function findHeaderIndexIn(headerArr, nameRegexes) {
      // 1. First attempt: exact match (case-insensitive and trimmed)
      for (var idx = 0; idx < headerArr.length; idx++) {
        var h = String(headerArr[idx]).trim().toLowerCase();
        for (var r = 0; r < nameRegexes.length; r++) {
          var target = String(nameRegexes[r]).trim().toLowerCase();
          if (h === target) {
            return idx;
          }
        }
      }
      // 2. Second attempt: substring match, but skip dangerous short terms like "N°" or "id" matching inside longer headers (e.g. "Article N°")
      for (var idx = 0; idx < headerArr.length; idx++) {
        var h = String(headerArr[idx]).trim().toLowerCase();
        for (var r = 0; r < nameRegexes.length; r++) {
          var target = String(nameRegexes[r]).trim().toLowerCase();
          if (target === "n°" || target === "id" || target === "n" || target.length <= 2 || target === "numero") {
            continue;
          }
          // Prevent matching 'N°' or 'numero' to 'Article N°'
          if (target.indexOf("n°") !== -1 && h.indexOf("article") !== -1) {
            continue;
          }
          if (h.indexOf(target) !== -1) {
            return idx;
          }
        }
      }
      return -1;
    }

    if (action === 'test') {
      response.success = true;
      response.message = "Connexion réussie avec le Google Sheet !";
    } else if (action === 'createDatabase') {
      var newSheetName = params.sheetName;
      if (newSheetName) {
        var newSheet = ss.getSheetByName(newSheetName);
        if (!newSheet) {
          newSheet = ss.insertSheet(newSheetName);
        }
        // Append headers
        var headers = [
          "Article N°", "Désignation", "Catégorie", "Référence", "Quantité Actuelle", "Qté Min",
          "Marché ou Bon de commande d'entrée", "N° d'entrée", "Société attributaire", "Qté Réceptionnée", 
          "Date de réception", "Observation de réception", "Message", "N° de sortie",
          "Bénéficiaires", "Région", "Qté Livrée", "Date de livraison", "Observations sur l'envoi", "Unité", "Zone", 
          "Emplacement", "RFID", "CodeBarres", "État", "Dernière MAJ", ...customColumns
        ];
        newSheet.clear();
        newSheet.appendRow(headers);
        
        // Append equipments if any
        var equipments = params.equipments || [];
        for (var idx = 0; idx < equipments.length; idx++) {
          var eq = equipments[idx];
          
          var rowValuesAdd = [
            eq.id || "",
            eq.nom || "",
            eq.categorie || "",
            eq.reference || "",
            eq.quantite || 0,
            eq.qteMin || 0,
            eq.marcheOuBc || "",
            eq.numMarche || "",
            eq.societeAttributaire || "",
            eq.qteReceptionnee || 0,
            eq.dateReception || "",
            eq.observationReception || "",
            eq.marcheOuBcSortie || "",
            eq.numMarcheSortie || "",
            eq.beneficiaires || "",
            eq.region || "",
            eq.qteLivree || 0,
            eq.dateLivraison || "",
            eq.observationsEnvoi || "",
            eq.unite || "Pièce",
            eq.zone || "Zone A",
            eq.emplacement || "",
            eq.rfid || "",
            eq.codeBarres || "",
            eq.etat || "Bon",
            eq.derniereMaj || new Date().toLocaleDateString('fr-FR')
          ];
          if (customColumns && customColumns.length > 0) {
            for (var cIdx = 0; cIdx < customColumns.length; cIdx++) {
              var colName = customColumns[cIdx];
              rowValuesAdd.push(eq.extraColumns ? (eq.extraColumns[colName] || "") : "");
            }
          }
          newSheet.appendRow(rowValuesAdd);
        }
        response.success = true;
        response.message = "Feuille '" + newSheetName + "' créée et synchronisée avec " + equipments.length + " équipements !";
      } else {
        response.error = "Le paramètre sheetName est obligatoire pour l'action createDatabase.";
      }
    } else if (action === 'createInfra') {
      var infraSheetName = params.sheetName || 'Magasin';
      var infraSheet = ss.getSheetByName(infraSheetName);
      if (!infraSheet) {
        infraSheet = ss.insertSheet(infraSheetName);
      }
      var headers = [];
      if (infraSheet.getLastColumn() > 0) {
        headers = infraSheet.getRange(1, 1, 1, infraSheet.getLastColumn()).getValues()[0].map(function(h) {
          return String(h).trim();
        });
      }
      if (headers.length === 0 || headers[0] === "") {
        if (infraSheetName === 'Magasin') {
          headers = ["id", "region", "province", "type", "denomination", "superficieTotale", "superficieBatie", "situation"];
        } else {
          headers = ["id", "region", "province", "type", "denomination", "superficieTotale", "superficieBatie", "dateConstruction", "dateMiseService", "situation", "adresse", "propriete"];
        }
        infraSheet.appendRow(headers);
      }
      var infraData = params.data;
      if (infraData) {
        if (infraSheetName === 'Magasin') {
          infraSheet.appendRow([
            infraData.id,
            infraData.region,
            infraData.province,
            infraData.type,
            infraData.denomination,
            infraData.superficieTotale,
            infraData.superficieBatie,
            infraData.situation
          ]);
        } else {
          infraSheet.appendRow([
            infraData.id,
            infraData.region,
            infraData.province,
            infraData.type,
            infraData.denomination,
            infraData.superficieTotale,
            infraData.superficieBatie,
            infraData.dateConstruction || '',
            infraData.dateMiseService || '',
            infraData.situation,
            infraData.adresse || '',
            infraData.propriete || ''
          ]);
        }
        response.success = true;
      }
    } else if (action === 'updateInfra') {
      var targetSheet = ss.getSheetByName(params.sheetName || 'Magasin');
      if (targetSheet) {
        var values = targetSheet.getDataRange().getValues();
        var rowIndex = -1;
        for (var i = 1; i < values.length; i++) {
          if (String(values[i][0]).trim() === String(data.id).trim()) {
            rowIndex = i + 1;
            break;
          }
        }
        if (rowIndex !== -1) {
          if (params.sheetName === 'Magasin') {
            targetSheet.getRange(rowIndex, 1, 1, 8).setValues([[
              data.id,
              data.region,
              data.province,
              data.type,
              data.denomination,
              data.superficieTotale,
              data.superficieBatie,
              data.situation
            ]]);
          } else {
            targetSheet.getRange(rowIndex, 1, 1, 12).setValues([[
              data.id,
              data.region,
              data.province,
              data.type,
              data.denomination,
              data.superficieTotale,
              data.superficieBatie,
              data.dateConstruction || '',
              data.dateMiseService || '',
              data.situation,
              data.adresse || '',
              data.propriete || ''
            ]]);
          }
          response.success = true;
        }
      }
    } else if (action === 'addUser') {
      var loginSheet = ss.getSheetByName('Login');
      if (!loginSheet) {
        loginSheet = ss.insertSheet('Login');
        loginSheet.appendRow(['Grade', 'Nom et Prénom', 'Fonction', 'Service de rattachement', 'Mot de passe', 'Région', 'Ville', 'Email']);
      }
      loginSheet.appendRow([
        data.grade || '-',
        data.fullName,
        data.fonction || '',
        data.service || '',
        data.password,
        data.region || '',
        data.ville || '',
        data.email || ''
      ]);
      
      // Automatic email notification
      if (data.email) {
        try {
          var subject = "Vos identifiants de connexion - GIS-PATRIMOINE Protection Civile";
          var body = "Bonjour " + (data.grade && data.grade !== '-' ? data.grade + " " : "") + data.fullName + ",\\n\\n" +
                     "Votre compte d'accès pour la plateforme de Gestion des Stocks GIS-PATRIMOINE (Protection Civile Maroc) a été créé avec succès.\\n\\n" +
                     "Voici vos identifiants pour vous connecter :\\n" +
                     "• Nom d'utilisateur (Nom et Prénom) : " + data.fullName + "\\n" +
                     "• Code secret à 6 chiffres : " + data.password + "\\n\\n" +
                     "Pour des raisons de sécurité, veuillez conserver ce code confidentiel.\\n\\n" +
                     "Cordialement,\\n" +
                     "Direction Générale de la Protection Civile\\n" +
                     "Royaume du Maroc";
          MailApp.sendEmail(data.email, subject, body);
        } catch(e) {
          // If Gmail permissions are not accepted yet by spreadsheet owner, save silently
        }
      }
      response.success = true;
    } else if (action === 'updateUser') {
      var loginSheet = ss.getSheetByName('Login');
      if (loginSheet) {
        var loginValues = loginSheet.getDataRange().getValues();
        var userRowIndex = -1;
        for (var k = 1; k < loginValues.length; k++) {
          if (String(loginValues[k][1]).trim().toLowerCase() === String(data.fullName).trim().toLowerCase()) {
            userRowIndex = k + 1;
            break;
          }
        }
        if (userRowIndex !== -1) {
          loginSheet.getRange(userRowIndex, 1, 1, 8).setValues([[
            data.grade || '-',
            data.fullName,
            data.fonction || '',
            data.service || '',
            data.password,
            data.region || '',
            data.ville || '',
            data.email || ''
          ]]);
          response.success = true;
        }
      }
    } else if (action === 'deleteUser') {
      var loginSheet = ss.getSheetByName('Login');
      if (loginSheet) {
        var loginValues = loginSheet.getDataRange().getValues();
        var userRowIndex = -1;
        for (var k = 1; k < loginValues.length; k++) {
          if (String(loginValues[k][1]).trim().toLowerCase() === String(data.fullName).trim().toLowerCase()) {
            userRowIndex = k + 1;
            break;
          }
        }
        if (userRowIndex !== -1) {
          loginSheet.deleteRow(userRowIndex);
          response.success = true;
        }
      }
    } else if (action === 'addMovement') {
      var histSheetName = params.sheetName || 'Historique';
      var histSheet = ss.getSheetByName(histSheetName);
      if (!histSheet) {
        histSheet = ss.insertSheet(histSheetName);
      }
      
      var histHeaders = [];
      if (histSheet.getLastColumn() > 0) {
        histHeaders = histSheet.getRange(1, 1, 1, histSheet.getLastColumn()).getValues()[0].map(function(h) {
          return String(h).trim();
        });
      }
      
      if (histHeaders.length === 0 || histHeaders[0] === "") {
        histHeaders = [
          "Article N°", "Désignation", "Catégorie", "Référence", "Quantité Actuelle", "Qté Min",
          "Marché ou Bon de commande d'entrée", "N° d'entrée", "Société attributaire", "Qté Réceptionnée", 
          "Date de réception", "Observation de réception", "Message", "N° de sortie",
          "Bénéficiaires", "Région", "Qté Livrée", "Date de livraison", "Observations sur l'envoi", "Unité", "Zone", 
          "Emplacement", "RFID", "CodeBarres", "État", "Dernière MAJ", ...customColumns
        ];
        histSheet.appendRow(histHeaders);
      }
      
      var histColIndices = {
        id: findHeaderIndexIn(histHeaders, ["Article N°", "Article", "id"]),
        nom: findHeaderIndexIn(histHeaders, ["Désignation", "Designation", "nom", "matériel"]),
        categorie: findHeaderIndexIn(histHeaders, ["Catégorie", "Categorie", "type"]),
        reference: findHeaderIndexIn(histHeaders, ["Référence", "Reference", "modèle", "ref"]),
        quantite: findHeaderIndexIn(histHeaders, ["Quantité Actuelle", "Quantite Actuelle", "Quantité", "Quantite", "stock"]),
        qteMin: findHeaderIndexIn(histHeaders, ["Qté Min", "Qte Min", "seuil"]),
        marcheOuBc: findHeaderIndexIn(histHeaders, ["Marché ou Bon de commande d'entrée", "Marché ou Bon de commande", "marché", "marche", "bon de commande"]),
        numMarche: findHeaderIndexIn(histHeaders, ["N° d'entrée", "numéro d'entrée", "numero d'entree"]),
        societeAttributaire: findHeaderIndexIn(histHeaders, ["Société attributaire", "Societe attributaire", "attributaire", "société", "societe", "marque"]),
        qteReceptionnee: findHeaderIndexIn(histHeaders, ["Qté Réceptionnée", "Qte Receptionnee", "réceptionnée"]),
        dateReception: findHeaderIndexIn(histHeaders, ["Date de réception", "Date de reception"]),
        observationReception: findHeaderIndexIn(histHeaders, ["Observation de réception", "Observation de reception"]),
        marcheOuBcSortie: findHeaderIndexIn(histHeaders, ["Message", "Message"]),
        numMarcheSortie: findHeaderIndexIn(histHeaders, ["N° de sortie"]),
        beneficiaires: findHeaderIndexIn(histHeaders, ["Bénéficiaires", "Beneficiaires", "bénéficiaire"]),
        region: findHeaderIndexIn(histHeaders, ["Région", "Region"]),
        qteLivree: findHeaderIndexIn(histHeaders, ["Qté Livrée", "Qte Livree", "Livrée", "Livree", "Qté Envoyée", "Qte Envoyee"]),
        dateLivraison: findHeaderIndexIn(histHeaders, ["Date de livraison", "Date de livraison", "Date d'envoi", "Date d'envoi", "envoi"]),
        observationsEnvoi: findHeaderIndexIn(histHeaders, ["Observations sur l'envoi", "Observations sur l'envoi", "observations", "observation"]),
        unite: findHeaderIndexIn(histHeaders, ["Unité", "Unite"]),
        zone: findHeaderIndexIn(histHeaders, ["Zone"]),
        emplacement: findHeaderIndexIn(histHeaders, ["Emplacement"]),
        rfid: findHeaderIndexIn(histHeaders, ["RFID"]),
        codeBarres: findHeaderIndexIn(histHeaders, ["CodeBarres", "barre"]),
        etat: findHeaderIndexIn(histHeaders, ["État", "Etat"]),
        derniereMaj: findHeaderIndexIn(histHeaders, ["Dernière MAJ", "Derniere MAJ", "MAJ"])
      };
      
      var rowValues = [];
      for (var colIdx = 0; colIdx < histHeaders.length; colIdx++) {
        rowValues.push("");
      }
      
      function writeValueHist(key, val) {
        var idx = histColIndices[key];
        if (idx !== -1 && idx < rowValues.length) {
          rowValues[idx] = val;
        }
      }
      
      writeValueHist("id", data.equipmentId || data.id);
      writeValueHist("nom", data.nom);
      writeValueHist("categorie", data.categorie);
      writeValueHist("reference", data.reference);
      writeValueHist("quantite", data.quantite);
      writeValueHist("qteMin", data.qteMin);
      writeValueHist("marcheOuBc", data.marcheOuBc || data.marche || "");
      writeValueHist("numMarche", data.numMarche || "");
      writeValueHist("societeAttributaire", data.societeAttributaire || data.marque || "");
      writeValueHist("qteReceptionnee", data.qteReceptionnee || 0);
      writeValueHist("dateReception", data.dateReception || "");
      writeValueHist("observationReception", data.observationReception || "");
      writeValueHist("marcheOuBcSortie", data.marcheOuBcSortie || "");
      writeValueHist("numMarcheSortie", data.numMarcheSortie || "");
      writeValueHist("beneficiaires", data.beneficiaires || "");
      writeValueHist("region", data.region || "");
      writeValueHist("qteLivree", data.qteLivree || data.qteEnvoyee || 0);
      writeValueHist("dateLivraison", data.dateLivraison || data.dateEnvoi || "");
      writeValueHist("observationsEnvoi", data.observationsEnvoi || "");
      writeValueHist("unite", data.unite || "Pièce");
      writeValueHist("zone", data.zone || "Zone A");
      writeValueHist("emplacement", data.emplacement || "");
      writeValueHist("rfid", data.rfid || "");
      writeValueHist("codeBarres", data.codeBarres || "");
      writeValueHist("etat", data.etat || "Bon");
      writeValueHist("derniereMaj", data.derniereMaj || new Date().toLocaleDateString('fr-FR'));
      
      if (data.extraColumns) {
        for (var extraHeader in data.extraColumns) {
          var idx = histHeaders.indexOf(extraHeader);
          if (idx !== -1 && idx < rowValues.length) {
            rowValues[idx] = data.extraColumns[extraHeader];
          }
        }
      }
      
      histSheet.appendRow(rowValues);
      response.success = true;
    } else if (action === 'deleteMovement') {
      var histSheetName = params.sheetName || 'Historique';
      var histSheet = ss.getSheetByName(histSheetName);
      if (histSheet) {
        var values = histSheet.getDataRange().getValues();
        var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });
        
        var idMouvementIdx = headers.indexOf("id mouvement");
        var articleIdx = -1;
        var dateReceptionIdx = -1;
        var dateLivraisonIdx = -1;
        var dateIdx = headers.indexOf("date");
        
        for (var idx = 0; idx < headers.length; idx++) {
          var h = headers[idx];
          if (h.indexOf("article") !== -1 || h.indexOf("id") !== -1) {
            if (articleIdx === -1) articleIdx = idx;
          }
          if (h.indexOf("réception") !== -1 || h.indexOf("reception") !== -1) {
            if (h.indexOf("date") !== -1) dateReceptionIdx = idx;
          }
          if (h.indexOf("livraison") !== -1 || h.indexOf("envoi") !== -1) {
            if (h.indexOf("date") !== -1) dateLivraisonIdx = idx;
          }
        }
        
        var rowIndex = -1;
        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          if (idMouvementIdx !== -1 && String(row[idMouvementIdx]).trim() === String(data.id).trim()) {
            rowIndex = i + 1;
            break;
          }
          var rowArtId = articleIdx !== -1 ? String(row[articleIdx]).trim() : String(row[0]).trim();
          if (rowArtId === String(data.equipmentId).trim()) {
            var matchDate = false;
            if (dateIdx !== -1 && String(row[dateIdx]).indexOf(data.date) !== -1) matchDate = true;
            if (dateReceptionIdx !== -1 && String(row[dateReceptionIdx]).indexOf(data.date) !== -1) matchDate = true;
            if (dateLivraisonIdx !== -1 && String(row[dateLivraisonIdx]).indexOf(data.date) !== -1) matchDate = true;
            
            if (matchDate) {
              rowIndex = i + 1;
              break;
            }
          }
        }
        
        if (rowIndex !== -1) {
          histSheet.deleteRow(rowIndex);
          response.success = true;
        }
      }
    } else if (action === 'add' || action === 'update' || action === 'delete') {
      var headers = [];
      if (sheet.getLastColumn() > 0) {
        headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
          return String(h).trim();
        });
      }
      
      if (headers.length === 0 || headers[0] === "") {
        headers = [
          "Article N°", "Désignation", "Catégorie", "Référence", "Quantité Actuelle", "Qté Min",
          "Marché ou Bon de commande d'entrée", "N° d'entrée", "Société attributaire", "Qté Réceptionnée", 
          "Date de réception", "Observation de réception", "Message", "N° de sortie",
          "Bénéficiaires", "Région", "Qté Livrée", "Date de livraison", "Observations sur l'envoi", "Unité", "Zone", 
          "Emplacement", "RFID", "CodeBarres", "État", "Dernière MAJ", ...customColumns
        ];
        sheet.appendRow(headers);
      }
      
      var colIndices = {
        id: findHeaderIndexIn(headers, ["Article N°", "Article", "id"]),
        nom: findHeaderIndexIn(headers, ["Désignation", "Designation", "nom", "matériel"]),
        categorie: findHeaderIndexIn(headers, ["Catégorie", "Categorie", "type"]),
        reference: findHeaderIndexIn(headers, ["Référence", "Reference", "modèle", "ref"]),
        quantite: findHeaderIndexIn(headers, ["Quantité Actuelle", "Quantite Actuelle", "Quantité", "Quantite", "stock"]),
        qteMin: findHeaderIndexIn(headers, ["Qté Min", "Qte Min", "seuil"]),
        marcheOuBc: findHeaderIndexIn(headers, ["Marché ou Bon de commande d'entrée", "Marché ou Bon de commande", "marché", "marche", "bon de commande"]),
        numMarche: findHeaderIndexIn(headers, ["N° d'entrée", "numéro d'entrée", "numero d'entree"]),
        societeAttributaire: findHeaderIndexIn(headers, ["Société attributaire", "Societe attributaire", "attributaire", "société", "societe", "marque"]),
        qteReceptionnee: findHeaderIndexIn(headers, ["Qté Réceptionnée", "Qte Receptionnee", "réceptionnée"]),
        dateReception: findHeaderIndexIn(headers, ["Date de réception", "Date de reception"]),
        observationReception: findHeaderIndexIn(headers, ["Observation de réception", "Observation de reception"]),
        marcheOuBcSortie: findHeaderIndexIn(headers, ["Message", "Message"]),
        numMarcheSortie: findHeaderIndexIn(headers, ["N° de sortie"]),
        beneficiaires: findHeaderIndexIn(headers, ["Bénéficiaires", "Beneficiaires", "bénéficiaire"]),
        region: findHeaderIndexIn(headers, ["Région", "Region"]),
        qteLivree: findHeaderIndexIn(headers, ["Qté Livrée", "Qte Livree", "Livrée", "Livree", "Qté Envoyée", "Qte Envoyee"]),
        dateLivraison: findHeaderIndexIn(headers, ["Date de livraison", "Date de livraison", "Date d'envoi", "Date d'envoi", "envoi"]),
        observationsEnvoi: findHeaderIndexIn(headers, ["Observations sur l'envoi", "Observations sur l'envoi", "observations", "observation"]),
        unite: findHeaderIndexIn(headers, ["Unité", "Unite"]),
        zone: findHeaderIndexIn(headers, ["Zone"]),
        emplacement: findHeaderIndexIn(headers, ["Emplacement"]),
        rfid: findHeaderIndexIn(headers, ["RFID"]),
        codeBarres: findHeaderIndexIn(headers, ["CodeBarres", "barre"]),
        etat: findHeaderIndexIn(headers, ["État", "Etat"]),
        derniereMaj: findHeaderIndexIn(headers, ["Dernière MAJ", "Derniere MAJ", "MAJ"])
      };
      
      var values = sheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim() === String(data.id).trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (action === 'delete') {
        if (rowIndex !== -1) {
          sheet.deleteRow(rowIndex);
          response.success = true;
        }
      } else {
        // Construct the row to write
        var rowValues = [];
        if (action === 'update' && rowIndex !== -1) {
          rowValues = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
        } else {
          for (var colIdx = 0; colIdx < headers.length; colIdx++) {
            rowValues.push("");
          }
        }
        
        function writeValueMain(key, val) {
          var idx = colIndices[key];
          if (idx !== -1 && idx < rowValues.length) {
            rowValues[idx] = val;
          }
        }
        
        writeValueMain("id", data.id);
        writeValueMain("nom", data.nom);
        writeValueMain("categorie", data.categorie);
        writeValueMain("reference", data.reference);
        writeValueMain("quantite", data.quantite);
        writeValueMain("qteMin", data.qteMin);
        writeValueMain("marcheOuBc", data.marcheOuBc || data.marche || "");
        writeValueMain("numMarche", data.numMarche || "");
        writeValueMain("societeAttributaire", data.societeAttributaire || data.marque || "");
        writeValueMain("qteReceptionnee", data.qteReceptionnee || 0);
        writeValueMain("dateReception", data.dateReception || "");
        writeValueMain("observationReception", data.observationReception || "");
        writeValueMain("marcheOuBcSortie", data.marcheOuBcSortie || "");
        writeValueMain("numMarcheSortie", data.numMarcheSortie || "");
        writeValueMain("beneficiaires", data.beneficiaires || "");
        writeValueMain("region", data.region || "");
        writeValueMain("qteLivree", data.qteLivree || data.qteEnvoyee || 0);
        writeValueMain("dateLivraison", data.dateLivraison || data.dateEnvoi || "");
        writeValueMain("observationsEnvoi", data.observationsEnvoi || "");
        writeValueMain("unite", data.unite || "Pièce");
        writeValueMain("zone", data.zone || "Zone A");
        writeValueMain("emplacement", data.emplacement || "");
        writeValueMain("rfid", data.rfid || "");
        writeValueMain("codeBarres", data.codeBarres || "");
        writeValueMain("etat", data.etat || "Bon");
        writeValueMain("derniereMaj", data.derniereMaj || new Date().toLocaleDateString('fr-FR'));
        
        if (data.extraColumns) {
          for (var extraHeader in data.extraColumns) {
            var idx = headers.indexOf(extraHeader);
            if (idx !== -1 && idx < rowValues.length) {
              rowValues[idx] = data.extraColumns[extraHeader];
            }
          }
        }

        if (action === 'update' && rowIndex !== -1) {
          sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
          response.success = true;
        } else {
          sheet.appendRow(rowValues);
          response.success = true;
        }
      }
    }
  } catch (err) {
    response.error = err.toString();
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var response = { success: false };
  try {
    var spreadsheetId = e.parameter.spreadsheetId;
    var sheetName = e.parameter.sheetName;
    if (!spreadsheetId) {
      response.error = "Le paramètre spreadsheetId est obligatoire.";
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
    if (!sheet) {
      response.error = "La feuille de calcul '" + (sheetName || "par défaut") + "' est introuvable.";
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      response.success = true;
      response.data = [];
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = values[0].map(function(h) {
      return String(h).trim();
    });
    
    var data = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var item = {};
      var hasValue = false;
      for (var j = 0; j < headers.length; j++) {
        var val = row[j];
        item[headers[j]] = val;
        if (val !== undefined && val !== null && val !== "") {
          hasValue = true;
        }
      }
      if (hasValue) {
        data.push(item);
      }
    }
    
    response.success = true;
    response.data = data;
  } catch (err) {
    response.error = err.toString();
  }
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}`;

const OFFICIAL_EMPLOYEES = [
  'Capitaine Benali (Responsable Logistique)',
  'Lieutenant Slimani (Gestionnaire de Dépôt)',
  'Adjudant Mansouri (Contrôleur de Stock)',
  'Sergent-Chef Boumediene (Technicien Électricien)',
];

const REGIONS_MAROC = [
  "Tanger-Tétouan-Al Hoceïma",
  "L'Oriental",
  "Fès-Meknès",
  "Rabat-Salé-Kénitra",
  "Béni Mellal-Khénifra",
  "Casablanca-Settat",
  "Marrakech-Safi",
  "Drâa-Tafilalet",
  "Souss-Massa",
  "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra",
  "Dakhla-Oued Eddahab"
];

import LoginScreen from './components/LoginScreen';
import WelcomeScreen from './components/WelcomeScreen';
import DatabaseSelectionScreen from './components/DatabaseSelectionScreen';

export default function App() {
  const [visitedWelcome, setVisitedWelcome] = useState<boolean>(() => {
    return localStorage.getItem('gis_dgpc_visited_welcome') === 'true';
  });

  const [initialRegisterMode, setInitialRegisterMode] = useState<boolean>(false);

  const [selectedDbId, setSelectedDbId] = useState<string | null>(() => {
    return localStorage.getItem('gis_dgpc_selected_db');
  });

  const [workspaceType, setWorkspaceType] = useState<'magasin' | 'depot'>(() => {
    const saved = localStorage.getItem('gis_dgpc_workspace_type');
    return (saved === 'magasin' || saved === 'depot') ? saved : 'depot';
  });

  const [siteName, setSiteName] = useState<string>(() => {
    return localStorage.getItem('gis_dgpc_selected_site_name') || 'Dépôt de Sidi Allal Bahraoui';
  });

  // Keep workspace and site name in sync with selectedDbId changes
  useEffect(() => {
    if (selectedDbId) {
      const savedType = localStorage.getItem('gis_dgpc_workspace_type') as 'magasin' | 'depot';
      if (savedType) setWorkspaceType(savedType);
      const savedSiteName = localStorage.getItem('gis_dgpc_selected_site_name');
      if (savedSiteName) setSiteName(savedSiteName);
    }
  }, [selectedDbId]);

  const handleSwitchWorkspace = (newType: 'magasin' | 'depot') => {
    setWorkspaceType(newType);
    localStorage.setItem('gis_dgpc_workspace_type', newType);
    
    // Find default or recent DB for this workspace type
    const dbsRaw = localStorage.getItem('gis_dgpc_databases_rsk_patrimoine');
    if (dbsRaw) {
      try {
        const dbs = JSON.parse(dbsRaw);
        const match = dbs.find((d: any) => d.volet === newType);
        if (match) {
          setSelectedDbId(match.id);
          localStorage.setItem('gis_dgpc_selected_db', match.id);
          localStorage.setItem('gis_dgpc_selected_site_id', match.siteId);
          localStorage.setItem('gis_dgpc_selected_site_name', match.siteName);
          localStorage.setItem('gis_dgpc_selected_year', match.year);
          setSiteName(match.siteName);
          showToast(`Espace ${newType === 'magasin' ? 'Magasin' : 'Dépôt'} sélectionné (${match.siteName})`);
          return;
        }
      } catch (e) {
        // Fallback
      }
    }
    
    // If no direct DB found, take user to the selection screen
    setSelectedDbId(null);
    localStorage.removeItem('gis_dgpc_selected_db');
  };

  const handleOpenWorkspaceSelection = () => {
    setSelectedDbId(null);
    localStorage.removeItem('gis_dgpc_selected_db');
  };

  const isSheetsSyncEnabled = useMemo(() => {
    if (!selectedDbId) return false;
    
    // Default databases of RSK region
    const rskDefaultDbIds = [
      'electrique', 'electinfo', 'patrimoine', 'informatique', 'dml1', 'dml2',
      'patrimoine_rabat_sale_kenitra', 'electinfo_rabat_sale_kenitra_magasin', 
      'electinfo_rabat_sale_kenitra_depot', 'dml1_rabat_sale_kenitra', 'dml2_rabat_sale_kenitra'
    ];
    
    if (rskDefaultDbIds.includes(selectedDbId)) {
      return true;
    }
    
    const savedDbs = localStorage.getItem('gis_dgpc_databases');
    if (savedDbs) {
      try {
        const dbs = JSON.parse(savedDbs);
        const activeDb = dbs.find((db: any) => db.id === selectedDbId);
        if (activeDb) {
          return activeDb.region === 'Rabat-Salé-Kénitra';
        }
      } catch (e) {
        // Ignore
      }
    }
    return false;
  }, [selectedDbId]);

  const [auth, setAuth] = useState<AuthState>(() => {
    const savedAuth = localStorage.getItem('elec_stock_auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth);
      } catch (e) {
        return { isAuthenticated: false, user: null };
      }
    }
    return { isAuthenticated: false, user: null };
  });

  useEffect(() => {
    localStorage.setItem('elec_stock_auth', JSON.stringify(auth));
  }, [auth]);

  // Spreadsheet ID
  const [spreadsheetId, setSpreadsheetId] = useState(() => {
    return localStorage.getItem('elec_stock_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });

  // Depot Info
  const [depotName, setDepotName] = useState(() => {
    return localStorage.getItem('elec_stock_depot_name') || 'Dépôt Central de Matériels - DGPC';
  });
  const [depotLocation, setDepotLocation] = useState(() => {
    return localStorage.getItem('elec_stock_depot_location') || 'Alger, Algérie';
  });

  const [isEditingDepot, setIsEditingDepot] = useState(false);
  const [tempDepotName, setTempDepotName] = useState(depotName);
  const [tempDepotLocation, setTempDepotLocation] = useState(depotLocation);

  const [showConfig, setShowConfig] = useState(false);
  const [tempSpreadsheetId, setTempSpreadsheetId] = useState(spreadsheetId);
  const [loginSpreadsheetId, setLoginSpreadsheetId] = useState(() => localStorage.getItem('gis_login_db_id') || '');

  // Google Apps Script Web App URL for direct writing/editing
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('elec_stock_apps_script_url') || 'https://script.google.com/macros/s/AKfycbwLX37zHYbvaPQhUzDF7LBqTj4zOnUDe_wdZZP8qnd-igZO4ick4QeyChTPLxDsTCO6/exec';
  });
  const [tempAppsScriptUrl, setTempAppsScriptUrl] = useState(appsScriptUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [hasServerAppsScriptUrl, setHasServerAppsScriptUrl] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check server configuration for Apps Script URL on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.hasAppsScriptUrl) {
          setHasServerAppsScriptUrl(true);
        }
      })
      .catch(err => console.error("Erreur de chargement de la config serveur:", err));
  }, []);

  // Track scroll position to hide SmartStock branding header when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync settings and state on database switch
  useEffect(() => {
    if (!selectedDbId) return;

    // Load equipments
    const savedEquips = localStorage.getItem(`database_${selectedDbId}_equipments`);
    if (savedEquips) {
      setLocalOverrides(JSON.parse(savedEquips));
    } else {
      const lowerDbId = selectedDbId.toLowerCase();
      if (lowerDbId.includes('electrique') || lowerDbId.includes('electinfo')) {
        setLocalOverrides(INITIAL_EQUIPMENT);
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(INITIAL_EQUIPMENT));
      } else if (lowerDbId.includes('patrimoine')) {
        const defaultPatrimoine: Equipment[] = [
          { id: "P-001", nom: "Tente de secours d'urgence type A", categorie: "Secours", marque: "Trigano", reference: "T-SECOURS-A", quantite: 12, qteMin: 5, unite: "Unité", zone: "Zone Nord", emplacement: "N-01", rfid: "RFID-PAT-0001", codeBarres: "CBPAT0001", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 2 },
          { id: "P-002", nom: "Lit de camp pliable renforcé", categorie: "Mobilier", marque: "SNC", reference: "L-CAMP-R", quantite: 80, qteMin: 20, unite: "Pièce", zone: "Zone Nord", emplacement: "N-02", rfid: "RFID-PAT-0002", codeBarres: "CBPAT0002", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 3 },
          { id: "P-003", nom: "Générateur électrique mobile 5kVA", categorie: "Énergie", marque: "Honda", reference: "GEN-5KVA", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-PAT-0003", codeBarres: "CBPAT0003", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 4 }
        ];
        setLocalOverrides(defaultPatrimoine);
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(defaultPatrimoine));
      } else if (lowerDbId.includes('informatique')) {
        const defaultInfo: Equipment[] = [
          { id: "I-001", nom: "Talkie-Walkie professionnel UHF/VHF", categorie: "Télécom", marque: "Motorola", reference: "GP340", quantite: 45, qteMin: 10, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-INF-0001", codeBarres: "CBINF0001", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 2 },
          { id: "I-002", nom: "Serveur de communication d'urgence", categorie: "Réseau", marque: "Dell", reference: "R740", quantite: 2, qteMin: 1, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-INF-0002", codeBarres: "CBINF0002", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 3 }
        ];
        setLocalOverrides(defaultInfo);
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(defaultInfo));
      } else if (lowerDbId.includes('dml1') || (lowerDbId.includes('dml') && !lowerDbId.includes('dml2'))) {
        const defaultDml1: Equipment[] = [
          { id: "E-001", nom: "Civière de transport renforcée", categorie: "Secours", marque: "Ferno", reference: "CIV-REINF", quantite: 15, qteMin: 5, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-DML1-0001", codeBarres: "CBDML10001", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 2 },
          { id: "E-002", nom: "Sac à dos d'intervention médicale d'urgence", categorie: "Médical", marque: "Elite Bags", reference: "SAC-URG-M", quantite: 30, qteMin: 10, unite: "Pièce", zone: "Zone Sud", emplacement: "S-02", rfid: "RFID-DML1-0002", codeBarres: "CBDML10002", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 3 },
          { id: "E-003", nom: "Projecteur LED autonome de zone", categorie: "Éclairage", marque: "Peli", reference: "PROJ-LED-9430", quantite: 8, qteMin: 3, unite: "Unité", zone: "Zone Nord", emplacement: "N-03", rfid: "RFID-DML1-0003", codeBarres: "CBDML10003", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 4 }
        ];
        setLocalOverrides(defaultDml1);
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(defaultDml1));
      } else if (lowerDbId.includes('dml2')) {
        const defaultDml2: Equipment[] = [
          { id: "V-001", nom: "Roue de secours renforcée pour camion", categorie: "Pièces", marque: "Michelin", reference: "PNEU-14R20", quantite: 12, qteMin: 4, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-DML2-0001", codeBarres: "CBDML20001", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 2 },
          { id: "V-002", nom: "Défibrillateur cardiaque semi-automatique DSA", categorie: "Médical", marque: "Zoll", reference: "DSA-AED3", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-DML2-0002", codeBarres: "CBDML20002", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 3 },
          { id: "V-003", nom: "Respirateur de transport d'urgence", categorie: "Médical", marque: "Weinmann", reference: "RESP-MEDUMAT", quantite: 5, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-02", rfid: "RFID-DML2-0003", codeBarres: "CBDML20003", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 4 }
        ];
        setLocalOverrides(defaultDml2);
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(defaultDml2));
      } else {
        setLocalOverrides([]);
      }
    }

    // Load history logs
    const savedHistory = localStorage.getItem(`database_${selectedDbId}_history`);
    if (savedHistory) {
      setHistoryLogs(JSON.parse(savedHistory));
    } else {
      if (selectedDbId === 'electrique') {
        const defaultHistory = [
          { id: "M-001", date: "05/07/2026 09:32", type: "Entrée", equipmentId: "30", equipmentNom: "Câble U1000 R2V 3G2.5", quantite: 100, employe: "Capitaine Benali (Responsable Logistique)", notes: "Réception de commande fournisseur Nexans" },
          { id: "M-002", date: "05/07/2026 14:15", type: "Sortie", equipmentId: "1", equipmentNom: "Disjoncteur 10A", quantite: 5, employe: "Lieutenant Slimani (Gestionnaire de Dépôt)", notes: "Remplacement coffret d'urgence Poste 3" },
          { id: "M-003", date: "06/07/2026 11:04", type: "Sortie", equipmentId: "10", equipmentNom: "Automate PLC S7-1200", quantite: 1, employe: "Adjudant Mansouri (Contrôleur de Stock)", notes: "Déploiement sur l'unité mobile de secours" }
        ];
        setHistoryLogs(defaultHistory);
        localStorage.setItem(`database_electrique_history`, JSON.stringify(defaultHistory));
      } else {
        const emptyHistory = [
          { id: "M-INIT", date: "07/07/2026 08:00", type: "Création", equipmentId: "N/A", equipmentNom: "Initialisation", quantite: 0, employe: "Système", notes: "Création de la base de données" }
        ];
        setHistoryLogs(emptyHistory);
        localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(emptyHistory));
      }
    }

    // Load depot info
    const savedDepotName = localStorage.getItem(`database_${selectedDbId}_depot_name`);
    if (savedDepotName) {
      setDepotName(savedDepotName);
      setTempDepotName(savedDepotName);
    } else {
      let initialName = "Dépôt Central de Matériels - DGPC";
      if (selectedDbId === 'electrique' || selectedDbId === 'electinfo') initialName = "Dépôt Électrique et Informatique - DGPC";
      else if (selectedDbId === 'patrimoine') initialName = "Dépôt Patrimoine - DGPC";
      else if (selectedDbId === 'informatique') initialName = "Dépôt Informatique - DGPC";
      else if (selectedDbId === 'dml1') initialName = "Dépôt DML 1 (Équipements et Logistique)";
      else if (selectedDbId === 'dml2') initialName = "Dépôt DML 2 (Véhicules et Ambulances)";
      setDepotName(initialName);
      setTempDepotName(initialName);
      localStorage.setItem(`database_${selectedDbId}_depot_name`, initialName);
    }

    const savedDepotLocation = localStorage.getItem(`database_${selectedDbId}_depot_location`);
    if (savedDepotLocation) {
      setDepotLocation(savedDepotLocation);
      setTempDepotLocation(savedDepotLocation);
    } else {
      const initialLoc = "Rabat, Maroc";
      setDepotLocation(initialLoc);
      setTempDepotLocation(initialLoc);
      localStorage.setItem(`database_${selectedDbId}_depot_location`, initialLoc);
    }

    // Load apps script / spreadsheet settings for this DB
    const savedSpreadsheetId = localStorage.getItem(`database_${selectedDbId}_spreadsheet_id`);
    if (savedSpreadsheetId) {
      setSpreadsheetId(savedSpreadsheetId);
      setTempSpreadsheetId(savedSpreadsheetId);
    } else {
      setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
      setTempSpreadsheetId(DEFAULT_SPREADSHEET_ID);
    }

    const savedAppsScriptUrl = localStorage.getItem(`database_${selectedDbId}_apps_script_url`);
    if (savedAppsScriptUrl) {
      setAppsScriptUrl(savedAppsScriptUrl);
      setTempAppsScriptUrl(savedAppsScriptUrl);
    } else {
      setAppsScriptUrl('');
      setTempAppsScriptUrl('');
    }
  }, [selectedDbId]);

  // Loaded stock list from Google Sheet
  const [stockList, setStockList] = useState<Equipment[]>([]);
  
  // Local modifications / Overrides store (starts pre-populated with default items)
  const [customColumns, setCustomColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('elec_stock_custom_cols');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  
  const [scannerExtraFields, setScannerExtraFields] = useState<Record<string, string>>({});

  const handleAddCustomColumn = (e: FormEvent) => {
    e.preventDefault();
    if (newColumnName.trim() && !customColumns.includes(newColumnName.trim())) {
      const updated = [...customColumns, newColumnName.trim()];
      setCustomColumns(updated);
      localStorage.setItem('elec_stock_custom_cols', JSON.stringify(updated));
      showToast(`Nouvelle colonne "${newColumnName.trim()}" ajoutée avec succès !`);
      setNewColumnName('');
      setIsAddColumnModalOpen(false);
    }
  };



  const [localOverrides, setLocalOverrides] = useState<Equipment[]>(() => {
    const activeDb = localStorage.getItem('gis_dgpc_selected_db');
    if (activeDb) {
      const saved = localStorage.getItem(`database_${activeDb}_equipments`);
      if (saved) return JSON.parse(saved);
      if (activeDb === 'electrique' || activeDb === 'electinfo') return INITIAL_EQUIPMENT;
      if (activeDb === 'patrimoine') return [
        { id: "P-001", nom: "Tente de secours d'urgence type A", categorie: "Secours", marque: "Trigano", reference: "T-SECOURS-A", quantite: 12, qteMin: 5, unite: "Unité", zone: "Zone Nord", emplacement: "N-01", rfid: "RFID-PAT-0001", codeBarres: "CBPAT0001", etat: "Bon", derniereMaj: "07/07/2026" },
        { id: "P-002", nom: "Lit de camp pliable renforcé", categorie: "Mobilier", marque: "SNC", reference: "L-CAMP-R", quantite: 80, qteMin: 20, unite: "Pièce", zone: "Zone Nord", emplacement: "N-02", rfid: "RFID-PAT-0002", codeBarres: "CBPAT0002", etat: "Bon", derniereMaj: "07/07/2026" },
        { id: "P-003", nom: "Générateur électrique mobile 5kVA", categorie: "Énergie", marque: "Honda", reference: "GEN-5KVA", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-PAT-0003", codeBarres: "CBPAT0003", etat: "Bon", derniereMaj: "07/07/2026" }
      ];
      if (activeDb === 'informatique') return [
        { id: "I-001", nom: "Talkie-Walkie professionnel UHF/VHF", categorie: "Télécom", marque: "Motorola", reference: "GP340", quantite: 45, qteMin: 10, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-INF-0001", codeBarres: "CBINF0001", etat: "Bon", derniereMaj: "07/07/2026" },
        { id: "I-002", nom: "Serveur de communication d'urgence", categorie: "Réseau", marque: "Dell", reference: "R740", quantite: 2, qteMin: 1, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-INF-0002", codeBarres: "CBINF0002", etat: "Bon", derniereMaj: "07/07/2026" }
      ];
      if (activeDb === 'dml1') return [
        { id: "E-001", nom: "Civière de transport renforcée", categorie: "Secours", marque: "Ferno", reference: "CIV-REINF", quantite: 15, qteMin: 5, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-DML1-0001", codeBarres: "CBDML10001", etat: "Bon", derniereMaj: "08/07/2026" },
        { id: "E-002", nom: "Sac à dos d'intervention médicale d'urgence", categorie: "Médical", marque: "Elite Bags", reference: "SAC-URG-M", quantite: 30, qteMin: 10, unite: "Pièce", zone: "Zone Sud", emplacement: "S-02", rfid: "RFID-DML1-0002", codeBarres: "CBDML10002", etat: "Bon", derniereMaj: "08/07/2026" },
        { id: "E-003", nom: "Projecteur LED autonome de zone", categorie: "Éclairage", marque: "Peli", reference: "PROJ-LED-9430", quantite: 8, qteMin: 3, unite: "Unité", zone: "Zone Nord", emplacement: "N-03", rfid: "RFID-DML1-0003", codeBarres: "CBDML10003", etat: "Bon", derniereMaj: "08/07/2026" }
      ];
      if (activeDb === 'dml2') return [
        { id: "V-001", nom: "Roue de secours renforcée pour camion", categorie: "Pièces", marque: "Michelin", reference: "PNEU-14R20", quantite: 12, qteMin: 4, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-DML2-0001", codeBarres: "CBDML20001", etat: "Bon", derniereMaj: "08/07/2026" },
        { id: "V-002", nom: "Défibrillateur cardiaque semi-automatique DSA", categorie: "Médical", marque: "Zoll", reference: "DSA-AED3", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-DML2-0002", codeBarres: "CBDML20002", etat: "Bon", derniereMaj: "08/07/2026" },
        { id: "V-003", nom: "Respirateur de transport d'urgence", categorie: "Médical", marque: "Weinmann", reference: "RESP-MEDUMAT", quantite: 5, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-02", rfid: "RFID-DML2-0003", codeBarres: "CBDML20003", etat: "Bon", derniereMaj: "08/07/2026" }
      ];
    }
    return INITIAL_EQUIPMENT;
  });

  // Stock Movement History logs (offline store)
    useEffect(() => {
    // Auto-detect any extra columns from the loaded data
    const detectedCols = new Set(customColumns);
    let changed = false;
    localOverrides.forEach(item => {
      if (item.extraColumns) {
        Object.keys(item.extraColumns).forEach(k => {
          if (!detectedCols.has(k)) {
            detectedCols.add(k);
            changed = true;
          }
        });
      }
    });
    if (changed) {
      const arr = Array.from(detectedCols);
      setCustomColumns(arr);
      localStorage.setItem('elec_stock_custom_cols', JSON.stringify(arr));
    }
  }, [localOverrides]);

  const [historyLogs, setHistoryLogs] = useState<StockMovement[]>(() => {
    const activeDb = localStorage.getItem('gis_dgpc_selected_db');
    if (activeDb) {
      const saved = localStorage.getItem(`database_${activeDb}_history`);
      if (saved) return JSON.parse(saved);
      if (activeDb === 'electrique') return [
        { id: "M-001", date: "05/07/2026 09:32", type: "Entrée", equipmentId: "30", equipmentNom: "Câble U1000 R2V 3G2.5", quantite: 100, employe: "Capitaine Benali (Responsable Logistique)", notes: "Réception de commande fournisseur Nexans" },
        { id: "M-002", date: "05/07/2026 14:15", type: "Sortie", equipmentId: "1", equipmentNom: "Disjoncteur 10A", quantite: 5, employe: "Lieutenant Slimani (Gestionnaire de Dépôt)", notes: "Remplacement coffret d'urgence Poste 3" },
        { id: "M-003", date: "06/07/2026 11:04", type: "Sortie", equipmentId: "10", equipmentNom: "Automate PLC S7-1200", quantite: 1, employe: "Adjudant Mansouri (Contrôleur de Stock)", notes: "Déploiement sur l'unité mobile de secours" }
      ];
    }
    return [
      { id: "M-001", date: "05/07/2026 09:32", type: "Entrée", equipmentId: "30", equipmentNom: "Câble U1000 R2V 3G2.5", quantite: 100, employe: "Capitaine Benali (Responsable Logistique)", notes: "Réception de commande fournisseur Nexans" },
      { id: "M-002", date: "05/07/2026 14:15", type: "Sortie", equipmentId: "1", equipmentNom: "Disjoncteur 10A", quantite: 5, employe: "Lieutenant Slimani (Gestionnaire de Dépôt)", notes: "Remplacement coffret d'urgence Poste 3" },
      { id: "M-003", date: "06/07/2026 11:04", type: "Sortie", equipmentId: "10", equipmentNom: "Automate PLC S7-1200", quantite: 1, employe: "Adjudant Mansouri (Contrôleur de Stock)", notes: "Déploiement sur l'unité mobile de secours" }
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collapse status of navigation panel
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Settings state
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dgpc_app_settings');
      return saved ? JSON.parse(saved) : { theme: 'light', textSize: 'normal', bgImage: null };
    } catch {
      return { theme: 'light', textSize: 'normal', bgImage: null };
    }
  });

  const updateSettings = (newSettings: Partial<typeof appSettings>) => {
    setAppSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('dgpc_app_settings', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save settings:", e);
      }
      return updated;
    });
  };

  // Apply settings to document
  useEffect(() => {
    // Apply Theme
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    // Apply Text Size globally via root font-size
    let fontSize = '16px'; // default normal size (Tailwind uses 1rem = 16px)
    switch (appSettings.textSize) {
      case 'small': fontSize = '14px'; break; // 87.5%
      case 'normal': fontSize = '16px'; break; // 100%
      case 'large': fontSize = '18px'; break; // 112.5%
      case 'very-large': fontSize = '20px'; break; // 125%
    }
    document.documentElement.style.fontSize = fontSize;
  }, [appSettings.theme, appSettings.textSize]);

  // Tabs state: 'accueil' | 'stock' | 'history' | 'alerts' | 'scanner' | '3d' | 'recap' | 'messages' | 'urgence' | 'users' | 'settings' | 'verification'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'stock-faible' | 'recap' | '3d' | 'transactions-scan' | 'scanner' | 'transactions-entrees' | 'transactions-sorties' | 'verification' | 'finance-module' | 'couts-valorisation-module' | 'docs-historique' | 'history' | 'docs-entrees' | 'docs-sorties' | 'communication-messages' | 'messages' | 'planification-agenda' | 'urgence' | 'users' | 'settings'>('dashboard');

  const visibleTabs = useMemo(() => {
    return getAccessibleTabs(auth.user);
  }, [auth.user]);

  // Enforce tab access restrictions
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [visibleTabs, activeTab]);

  // Force redirection to Home tab ('accueil') on login/logout/re-login
  useEffect(() => {
    setActiveTab('dashboard');
  }, [auth.user?.id]);

  const currentTabIdx = useMemo(() => {
    return visibleTabs.indexOf(activeTab);
  }, [visibleTabs, activeTab]);

  // Material selection state (Nom de MAT dropdown from the hand-drawn sketch)
  const [selectedMatName, setSelectedMatName] = useState<string>('Disjoncteur 16A');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Table display controls
  const [tableSearch, setTableSearch] = useState('');

  const [importHistory, setImportHistory] = useState<DatabaseImport[]>(() => {
    const activeDb = localStorage.getItem('gis_dgpc_selected_db');
    if (activeDb) {
      const saved = localStorage.getItem(`database_${activeDb}_imports`);
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Tous');
  const [sortField, setSortField] = useState<keyof Equipment>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Column headers customization state & modal
  const [columnHeaders, setColumnHeaders] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('dgpc_custom_column_headers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [isColumnCustomizerOpen, setIsColumnCustomizerOpen] = useState(false);

  const getColHeader = (key: string, fallback: string) => {
    return columnHeaders[key] || fallback;
  };

  const handleSaveColumnHeaders = (newHeaders: Record<string, string>) => {
    setColumnHeaders(newHeaders);
    try {
      localStorage.setItem('dgpc_custom_column_headers', JSON.stringify(newHeaders));
    } catch (e) {
      console.error("Failed to save column headers:", e);
    }
    showToast("Intitulés des colonnes mis à jour avec succès !");
  };

  // User logins list from the 'Login' sheet
  const [fetchedLogins, setFetchedLogins] = useState<UserType[]>([]);
  const [isLoginsLoading, setIsLoginsLoading] = useState(false);

  const reloadLogins = async () => {
    if (!spreadsheetId) return;
    setIsLoginsLoading(true);
    try {
      const logins = await fetchLoginUsers(loginSpreadsheetId || spreadsheetId, appsScriptUrl);
      if (logins && logins.length > 0) {
        setFetchedLogins(logins);
      }
    } catch (err: any) {
      console.warn("Logins non synchronisés depuis le serveur, utilisation des utilisateurs locaux/mis en cache.");
    } finally {
      setIsLoginsLoading(false);
    }
  };

  // Automatically load logins if spreadsheetId is available and user is admin/direction
  useEffect(() => {
    if (spreadsheetId && auth.isAuthenticated && auth.user?.role !== 'Employé') {
      reloadLogins();
    }
  }, [spreadsheetId, auth.isAuthenticated, auth.user?.role]);

  // User management states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userModalOpen, setUserModalOpen] = useState<'add' | 'edit' | null>(null);
  const [isUserSaving, setIsUserSaving] = useState(false);
  const [lastCreatedCredentials, setLastCreatedCredentials] = useState<{ fullName: string; password: string; email?: string } | null>(null);
  const [userForm, setUserForm] = useState({
    grade: 'M.',
    fullName: '',
    fonction: 'Employé',
    service: 'Service Électrique',
    password: '',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: ''
  });

  // Scanner Simulator state
  const scannerEmployee = auth.user?.fullName || 'Utilisateur inconnu';
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scannerOpType, setScannerOpType] = useState<'Entrée' | 'Sortie'>('Entrée');
  const [scannerQty, setScannerQty] = useState<number>(1);
  const [scannerNotes, setScannerNotes] = useState('');
  const [scannerRegion, setScannerRegion] = useState('');
  const [scannerFournisseur, setScannerFournisseur] = useState('');
  const [scannerDestinataire, setScannerDestinataire] = useState('');
  const [scannerDate, setScannerDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newScanFournisseur, setNewScanFournisseur] = useState('');
  const [scannerMarcheOuBc, setScannerMarcheOuBc] = useState<'Marché' | 'Bon de commande'>('Marché');
  const [scannerNumMarche, setScannerNumMarche] = useState('');
  const [scannerSocieteAttributaire, setScannerSocieteAttributaire] = useState('');
  const [scannerMarcheOuBcSortie, setScannerMarcheOuBcSortie] = useState<'Marché' | 'Bon de commande'>('Marché');
  const [scannerNumMarcheSortie, setScannerNumMarcheSortie] = useState('');
  const [scannerLivreurNom, setScannerLivreurNom] = useState('');
  const [scannerAgentSortieNom, setScannerAgentSortieNom] = useState('');
  const [scannerMatriculeVehicule, setScannerMatriculeVehicule] = useState('');
  const [scannerConducteurNom, setScannerConducteurNom] = useState('');
  const [lastTransactionLog, setLastTransactionLog] = useState<any | null>(null);
  const [scannerFeedback, setScannerFeedback] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [scannerBrand, setScannerBrand] = useState('');
  const [recentScannerSessionLogs, setRecentScannerSessionLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('elec_stock_scanner_session_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const lastScanRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastPrepopulatedBarcodeRef = useRef<string>('');

  // States for creating a brand new equipment upon scanning an unknown code
  const [newScanNom, setNewScanNom] = useState('');
  const [newScanMarque, setNewScanMarque] = useState('');
  const [newScanCategorie, setNewScanCategorie] = useState('Protection');
  const [newScanQuantite, setNewScanQuantite] = useState<number>(10);
  const [newScanQteMin, setNewScanQteMin] = useState<number>(2);
  const [newScanUnite, setNewScanUnite] = useState('Pièce');
  const [newScanDepotId, setNewScanDepotId] = useState('1000g');
  const [newScanZone, setNewScanZone] = useState('Zone A');
  const [newScanEmplacement, setNewScanEmplacement] = useState('A01');
  const [newScanEtat, setNewScanEtat] = useState('Neuf');
  const [newScanRfid, setNewScanRfid] = useState('');
  const [generatorTargetCode, setGeneratorTargetCode] = useState('CB000001');
  const [scanFullFrame, setScanFullFrame] = useState(true);

  // Helper to determine service based on the item's zone
  const getItemService = (item: Equipment): string => {
    const zone = item.zone || '';
    if (['Zone A', 'Zone B', 'Zone C'].includes(zone)) {
      return 'Patrimoine';
    }
    if (['Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H'].includes(zone)) {
      return 'DML';
    }
    if (['Zone I', 'Zone J'].includes(zone)) {
      return 'Électricité & Informatique';
    }
    return 'Autre';
  };

  // Helper to check if the current user is authorized to perform operations on the item
  const isUserAuthorizedForItem = (item: Equipment): boolean => {
    if (auth.user?.role === 'Direction') {
      return true; // Le Directeur a accès à l'ensemble des stocks sans aucune restriction.
    }
    const itemService = getItemService(item);
    const userServ = auth.user?.service || '';
    
    // Normalize string comparisons (remove accents, lowercase)
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    
    const normItemService = normalize(itemService);
    const normUserServ = normalize(userServ);
    
    // Check match
    if (normUserServ.includes('patrimoine') && normItemService.includes('patrimoine')) return true;
    if (normUserServ.includes('dml') && normItemService.includes('dml')) return true;
    if ((normUserServ.includes('electrique') || normUserServ.includes('informatique')) && normItemService.includes('electrique')) return true;
    
    return false;
  };

  // Robust lookup helper function to find equipment by Designation (name) primarily, then by barcode/RFID
  const findEquipmentByCode = (code: string) => {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return null;

    // 1. First priority: Exact or case-insensitive match on Désignation (nom)
    let match = localOverrides.find(item => {
      const name = String(item.nom || '').trim().toLowerCase();
      return name === trimmed;
    });

    if (match) return match;

    // 2. Second priority: Partial/includes match on Désignation (nom)
    match = localOverrides.find(item => {
      const name = String(item.nom || '').trim().toLowerCase();
      return name.includes(trimmed) || trimmed.includes(name);
    });

    if (match) return match;

    // 3. Third priority: Exact or case-insensitive match on barcode or RFID or Article ID
    match = localOverrides.find(item => {
      const cb = String(item.codeBarres || '').trim().toLowerCase();
      const rf = String(item.rfid || '').trim().toLowerCase();
      const id = String(item.id || '').trim().toLowerCase();
      return cb === trimmed || rf === trimmed || id === trimmed;
    });

    if (match) return match;

    // 4. Try match after removing leading zeroes (useful for EAN/UPC scanners)
    const cleanTrimmed = trimmed.replace(/^0+/, '');
    if (cleanTrimmed) {
      match = localOverrides.find(item => {
        const cbClean = String(item.codeBarres || '').trim().toLowerCase().replace(/^0+/, '');
        const rfClean = String(item.rfid || '').trim().toLowerCase().replace(/^0+/, '');
        const idClean = String(item.id || '').trim().toLowerCase().replace(/^0+/, '');
        return (cbClean && cbClean === cleanTrimmed) || 
               (rfClean && rfClean === cleanTrimmed) || 
               (idClean && idClean === cleanTrimmed);
      });
    }

    if (match) return match;

    // 5. Try partial matches on barcode or RFID
    match = localOverrides.find(item => {
      const cb = String(item.codeBarres || '').trim().toLowerCase();
      const rf = String(item.rfid || '').trim().toLowerCase();
      if (!cb && !rf) return false;
      return (cb && (trimmed.includes(cb) || cb.includes(trimmed))) || 
             (rf && (trimmed.includes(rf) || rf.includes(trimmed)));
    });

    return match || null;
  };

  // Auto pre-populate the brand field of existing equipment when its barcode is scanned
  useEffect(() => {
    const trimmed = scannedBarcode.trim();
    if (trimmed !== lastPrepopulatedBarcodeRef.current) {
      lastPrepopulatedBarcodeRef.current = trimmed;
      if (trimmed) {
        const matched = findEquipmentByCode(trimmed);
        if (matched) {
          setScannerBrand(matched.marque);
          setScannerMarcheOuBc((matched.marcheOuBc === 'Marché' || matched.marcheOuBc === 'Bon de commande') ? matched.marcheOuBc : 'Marché');
          setScannerNumMarche(matched.numMarche || '');
          setScannerSocieteAttributaire(matched.societeAttributaire || matched.marque || '');
          setScannerFournisseur(matched.societeAttributaire || matched.marque || '');
          setScannerDestinataire(matched.beneficiaires || '');
          setScannerRegion(matched.region || '');
        } else {
          setScannerBrand('');
          setScannerMarcheOuBc('Marché');
          setScannerNumMarche('');
          setScannerSocieteAttributaire('');
          setScannerFournisseur('');
          setScannerDestinataire('');
          setScannerRegion('');
        }
      } else {
        setScannerBrand('');
        setScannerMarcheOuBc('Marché');
        setScannerNumMarche('');
        setScannerSocieteAttributaire('');
        setScannerFournisseur('');
        setScannerDestinataire('');
        setScannerRegion('');
      }
    }
  }, [scannedBarcode, localOverrides]);

  // Manage camera scanning lifecycle
  useEffect(() => {
    let activeScanner: Html5Qrcode | null = null;
    let isStopped = false;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (isStopped) return;

        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          
          // Try to find the back/rear camera by default
          const backCam = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('arrière') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment') ||
            device.label.toLowerCase().includes('cam2')
          );
          
          const defaultCamId = backCam ? backCam.id : devices[0].id;
          const targetCamId = activeCameraId || defaultCamId;
          
          if (!activeCameraId) {
            setActiveCameraId(targetCamId);
          }

          // Create the scanner instance on our div
          const html5QrCode = new Html5Qrcode("camera-reader-viewport", {
            verbose: false,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.ITF
            ],
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          });
          activeScanner = html5QrCode;
          scannerRef.current = html5QrCode;

          const baseQrBox = (width: number, height: number) => {
            // Horizontal wide box ideal for barcode line formats
            const boxWidth = Math.min(width - 10, 340);
            const boxHeight = Math.min(height - 10, 160);
            return { width: boxWidth, height: boxHeight };
          };

          try {
            // Attempt to start with high-resolution constraints and continuous focus
            await html5QrCode.start(
              targetCamId,
              {
                fps: 20, // High scan rate for faster response
                qrbox: scanFullFrame ? undefined : baseQrBox,
                aspectRatio: 1.333333,
                videoConstraints: {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "environment",
                  focusMode: "continuous"
                } as any
              },
              (decodedText) => {
                handleBarcodeScanInput(decodedText);
              },
              () => {
                // Ignore frame errors to prevent console spam
              }
            );
          } catch (firstErr) {
            console.warn("Retrying scanner with standard constraints because advanced ones failed:", firstErr);
            if (isStopped) return;
            // Fallback to standard start config if specific track constraints are rejected
            await html5QrCode.start(
              targetCamId,
              {
                fps: 15,
                qrbox: scanFullFrame ? undefined : (w, h) => {
                  const bw = Math.min(w - 10, 320);
                  const bh = Math.min(h - 10, 140);
                  return { width: bw, height: bh };
                },
                aspectRatio: 1.333333
              },
              (decodedText) => {
                handleBarcodeScanInput(decodedText);
              },
              () => {
                // Ignore frame errors to prevent console spam
              }
            );
          }
        } else {
          showToast("Aucune caméra détectée sur cet appareil.");
          setIsCameraActive(false);
        }
      } catch (err) {
        console.error("Camera scanner error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("allowed") || errMsg.toLowerCase().includes("notfound")) {
          showToast("⚠️ Accès caméra refusé. Veuillez autoriser la caméra dans votre navigateur (icône 🔒) ou utiliser la saisie manuelle.");
        } else {
          showToast("Erreur caméra : " + errMsg);
        }
        setIsCameraActive(false);
      }
    };

    if (isCameraActive) {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        isStopped = true;
        if (activeScanner && activeScanner.isScanning) {
          activeScanner.stop().catch(err => console.error("Error stopping scanner:", err));
        }
      };
    }
  }, [isCameraActive, activeCameraId, scanFullFrame]);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<Equipment | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<Equipment | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning' | 'info';
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    type: 'info',
    action: null,
  });

  // Get the Google Sheet sheet name for the current active database
  const getCurrentSheetName = () => {
    if (!selectedDbId) return undefined;
    try {
      const savedDbs = localStorage.getItem('gis_dgpc_databases');
      const parsedDbs = savedDbs ? JSON.parse(savedDbs) : [];
      const activeDbObj = parsedDbs.find((db: any) => db.id === selectedDbId);
      if (activeDbObj && activeDbObj.name) {
        return activeDbObj.name;
      }
    } catch (e) {
      console.error("Error reading current sheet name from local databases:", e);
    }
    const lowerDbId = selectedDbId.toLowerCase();
    if (lowerDbId.includes('patrimoine')) return 'Patrimoine';
    if (lowerDbId.includes('electinfo') || lowerDbId.includes('electrique')) return 'Electrique et informatique';
    if (lowerDbId.includes('dml')) return 'DML 1';
    return undefined;
  };

  // Get the Google Sheet history sheet name for the current active database
  const getCurrentHistorySheetName = () => {
    if (!selectedDbId) return 'Historique';
    try {
      const savedDbs = localStorage.getItem('gis_dgpc_databases');
      const parsedDbs = savedDbs ? JSON.parse(savedDbs) : [];
      const activeDbObj = parsedDbs.find((db: any) => db.id === selectedDbId);
      if (activeDbObj && activeDbObj.name) {
        return `Historique_${activeDbObj.name}`;
      }
    } catch (e) {
      console.error("Error reading current history sheet name from local databases:", e);
    }
    return 'Historique';
  };

  // Load from Google Sheets
  const loadData = async (id: string, isManualRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isSheetsSyncEnabled) {
        // Load exclusively from local storage
        if (selectedDbId) {
          const savedEquips = localStorage.getItem(`database_${selectedDbId}_equipments`);
          if (savedEquips) {
            const data = JSON.parse(savedEquips);
            setStockList(data);
            setLocalOverrides(data);
          } else {
            setStockList([]);
            setLocalOverrides([]);
          }
          
          const savedHistory = localStorage.getItem(`database_${selectedDbId}_history`);
          if (savedHistory) {
            setHistoryLogs(JSON.parse(savedHistory));
          } else {
            setHistoryLogs([]);
          }
        }
        if (isManualRefresh) {
          showToast("Mise à jour des données locales effectuée !");
        }
        setIsLoading(false);
        return;
      }

      const sheetName = getCurrentSheetName();
      
      const data = await fetchPublicInventory(id, sheetName, appsScriptUrl);
      setStockList(data);
      
      // Update local storage
      setLocalOverrides(data);
      if (selectedDbId) {
        localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(data));
      } else {
        localStorage.setItem('elec_stock_local_list_v2', JSON.stringify(data));
      }

      // Load movements / history from the 'Historique' sheet
      try {
        const historySheetName = getCurrentHistorySheetName();
        const movements = await fetchHistoryLogs(id, appsScriptUrl, historySheetName);
        if (movements && movements.length > 0) {
          setHistoryLogs(movements);
          if (selectedDbId) {
            localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(movements));
          } else {
            localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(movements));
          }
        }
      } catch (histErr) {
        console.error("Erreur lors du chargement de l'historique :", histErr);
      }
       
      if (isManualRefresh) {
        showToast("Synchronisé avec succès depuis Google Sheet !");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        "Erreur lors du chargement de la feuille Google Sheet. L'application utilise les données locales préchargées."
      );
    } finally {
      setIsLoading(false);
    }
  };
 
  // Bidirectional real-time polling synchronization (every 8 seconds when active)
  useEffect(() => {
    if (!spreadsheetId) return;

    // Load initial data and logins on mount/id change
    loadData(spreadsheetId, false);
    if (auth.isAuthenticated && auth.user?.role !== 'Employé') {
      reloadLogins();
    }

    const interval = setInterval(async () => {
      // Avoid querying when the page/tab is inactive or document is hidden
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!isSheetsSyncEnabled) return;

      try {
        const sheetName = getCurrentSheetName();

        // 1. Fetch updated stock inventory
        const data = await fetchPublicInventory(spreadsheetId, sheetName, appsScriptUrl);
        if (data && data.length > 0) {
          setStockList(data);
          setLocalOverrides(data);
          if (selectedDbId) {
            localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(data));
          } else {
            localStorage.setItem('elec_stock_local_list_v2', JSON.stringify(data));
          }
        }

        // 2. Fetch updated stock movements / history
        const historySheetName = getCurrentHistorySheetName();
        const movements = await fetchHistoryLogs(spreadsheetId, appsScriptUrl, historySheetName);
        if (movements && movements.length > 0) {
          setHistoryLogs(movements);
          if (selectedDbId) {
            localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(movements));
          } else {
            localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(movements));
          }
        }

        // 3. Fetch updated logins database for users & access rights
        if (auth.isAuthenticated) {
          try {
            const logins = await fetchLoginUsers(loginSpreadsheetId || spreadsheetId, appsScriptUrl);
            if (logins && logins.length > 0) {
              setFetchedLogins(logins);

              // Synchronize the current user's role and passwords with the Google Sheet in real-time
              if (auth.user) {
                const currentUserInDb = logins.find(
                  (u) => u.fullName.toLowerCase().trim() === auth.user?.fullName.toLowerCase().trim()
                );
                if (currentUserInDb) {
                  if (
                    currentUserInDb.role !== auth.user.role ||
                    currentUserInDb.service !== auth.user.service ||
                    currentUserInDb.password !== auth.user.password
                  ) {
                    setAuth({
                      isAuthenticated: true,
                      user: currentUserInDb,
                    });
                  }
                }
              }
            }
          } catch (loginSyncErr) {
            // Silently ignore login sync error during background polling
          }
        }
      } catch (err) {
        console.error("Erreur de synchronisation automatique en arrière-plan :", err);
      }
    }, 8000); // 8 seconds bidirectional real-time polling

    return () => clearInterval(interval);
  }, [spreadsheetId, selectedDbId, auth.isAuthenticated, auth.user?.role, auth.user?.fullName, auth.user?.password, auth.user?.service, loginSpreadsheetId]);
 
   // Sync state to local storage
   const saveLocalList = (newList: Equipment[]) => {
     setLocalOverrides(newList);
     setStockList(newList);
     if (selectedDbId) {
       localStorage.setItem(`database_${selectedDbId}_equipments`, JSON.stringify(newList));
     } else {
       localStorage.setItem('elec_stock_local_list_v2', JSON.stringify(newList));
     }
   };

  // Synchronisation avec l'Apps Script Google Sheets via notre proxy serveur (évite CORS et suit les redirections)
  const syncToAppsScript = async (
    action: 'add' | 'update' | 'delete',
    item: Equipment
  ) => {
    if (!isSheetsSyncEnabled) return;
    const urlToUse = localStorage.getItem('elec_stock_apps_script_url') || appsScriptUrl;
    if (!urlToUse && !hasServerAppsScriptUrl) {
      showToast("ℹ️ Sauvegardé en local. Configurez l'Apps Script pour l'envoyer au Google Sheet !");
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appsScriptUrl: urlToUse || '',
          payload: {
            spreadsheetId: spreadsheetId,
            action,
            sheetName: getCurrentSheetName(),
            data: item
          }
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        showToast(`✅ Synchronisé ! Modification enregistrée dans le Google Sheet.`);
      } else {
        const errorMsg = resData.error || "Réponse invalide de l'Apps Script.";
        console.error("Erreur renvoyée par l'Apps Script:", errorMsg);
        showToast(`⚠️ Enregistré en local, mais échec de synchronisation Google Sheet: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error("Erreur de synchronisation avec le serveur proxy:", err);
      showToast("⚠️ Enregistré en local, mais impossible de joindre le serveur de synchronisation.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Synchroniser les actions utilisateur (ajout, modification, suppression) avec la feuille Google Sheet "Login"
  const syncUserToAppsScript = async (
    action: 'addUser' | 'updateUser' | 'deleteUser',
    user: any
  ) => {
    const urlToUse = localStorage.getItem('elec_stock_apps_script_url') || appsScriptUrl;
    if (!urlToUse && !hasServerAppsScriptUrl) {
      console.warn("Apps Script URL non configuré.");
      return false;
    }
    try {
      const response = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appsScriptUrl: urlToUse || '',
          payload: {
            spreadsheetId: loginSpreadsheetId || spreadsheetId,
            action,
            data: {
              fullName: user.fullName || user.username,
              grade: user.grade || '-',
              fonction: user.fonction || '',
              service: user.service || '',
              password: user.password,
              region: user.region || '',
              ville: user.ville || '',
              email: user.email || ''
            }
          }
        })
      });

      const resData = await response.json();
      return !!(response.ok && resData.success);
    } catch (err) {
      console.error(`Erreur d'envoi de l'action ${action} à l'Apps Script:`, err);
      return false;
    }
  };

  // Synchroniser un mouvement de stock avec la feuille "Historique" Google Sheets
  const syncMovementToAppsScript = async (movement: StockMovement) => {
    if (!isSheetsSyncEnabled) return;
    const urlToUse = localStorage.getItem('elec_stock_apps_script_url') || appsScriptUrl;
    if (!urlToUse && !hasServerAppsScriptUrl) {
      console.warn("Apps Script URL non configuré pour la synchronisation du mouvement.");
      return;
    }
    
    const item = localOverrides.find(e => e.id === movement.equipmentId);
    const isEntry = movement.type === 'Entrée';
    const isExit = movement.type === 'Sortie';

    const payloadData = item ? {
      ...item,
      // Entry fields (populated for Entrée or kept for Création/Modification if they exist)
      marcheOuBc: isEntry ? (movement.marcheOuBc || '—') : (isExit ? '—' : (item.marcheOuBc || '—')),
      numMarche: isEntry ? (movement.numMarche || '—') : (isExit ? '—' : (item.numMarche || '—')),
      societeAttributaire: isEntry ? (movement.societeAttributaire || '—') : (isExit ? '—' : (item.societeAttributaire || '—')),
      qteReceptionnee: isEntry ? movement.quantite : (isExit ? 0 : (item.qteReceptionnee || 0)),
      dateReception: isEntry ? movement.date : (isExit ? '—' : (item.dateReception || '—')),
      observationReception: isEntry ? (movement.notes || '—') : (isExit ? '—' : (item.observationReception || '—')),
      expediteur: isEntry ? (movement.expediteur || '—') : (isExit ? '—' : (item.expediteur || '—')),
      
      // Exit fields (populated for Sortie or kept for Création/Modification if they exist)
      marcheOuBcSortie: isExit ? (movement.marcheOuBcSortie || '—') : (isEntry ? '—' : (item.marcheOuBcSortie || '—')),
      numMarcheSortie: isExit ? (movement.numMarcheSortie || '—') : (isEntry ? '—' : (item.numMarcheSortie || '—')),
      beneficiaires: isExit ? (movement.beneficiaire || '—') : (isEntry ? '—' : (item.beneficiaires || '—')),
      region: isExit ? (movement.region || '—') : (isEntry ? '—' : (item.region || '—')),
      qteLivree: isExit ? movement.quantite : (isEntry ? 0 : (item.qteLivree || 0)),
      dateLivraison: isExit ? movement.date : (isEntry ? '—' : (item.dateLivraison || '—')),
      observationsEnvoi: isExit ? (movement.notes || '—') : (isEntry ? '—' : (item.observationsEnvoi || '—')),
      
      derniereMaj: movement.date
    } : {
      id: movement.equipmentId,
      nom: movement.equipmentNom,
      quantite: movement.quantite,
      
      marcheOuBc: isEntry ? (movement.marcheOuBc || '—') : '—',
      numMarche: isEntry ? (movement.numMarche || '—') : '—',
      societeAttributaire: isEntry ? (movement.societeAttributaire || '—') : '—',
      qteReceptionnee: isEntry ? movement.quantite : 0,
      dateReception: isEntry ? movement.date : '—',
      observationReception: isEntry ? (movement.notes || '—') : '—',
      expediteur: isEntry ? (movement.expediteur || '—') : '—',
      
      marcheOuBcSortie: isExit ? (movement.marcheOuBcSortie || '—') : '—',
      numMarcheSortie: isExit ? (movement.numMarcheSortie || '—') : '—',
      beneficiaires: isExit ? (movement.beneficiaire || '—') : '—',
      region: isExit ? (movement.region || '—') : '—',
      qteLivree: isExit ? movement.quantite : 0,
      dateLivraison: isExit ? movement.date : '—',
      observationsEnvoi: isExit ? (movement.notes || '—') : '—',
      
      derniereMaj: movement.date
    };

    try {
      await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appsScriptUrl: urlToUse || '',
          payload: {
            spreadsheetId: spreadsheetId,
            action: 'addMovement',
            sheetName: getCurrentHistorySheetName(),
            data: payloadData
          }
        })
      });
    } catch (err) {
      console.error("Erreur d'envoi du mouvement de stock à l'Apps Script:", err);
    }
  };

  // Supprimer un mouvement de stock dans la feuille "Historique" Google Sheets
  const syncDeleteMovementToAppsScript = async (movement: StockMovement) => {
    if (!isSheetsSyncEnabled) return;
    const urlToUse = localStorage.getItem('elec_stock_apps_script_url') || appsScriptUrl;
    if (!urlToUse && !hasServerAppsScriptUrl) {
      console.warn("Apps Script URL non configuré pour la suppression du mouvement.");
      return;
    }

    try {
      await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appsScriptUrl: urlToUse || '',
          payload: {
            spreadsheetId: spreadsheetId,
            action: 'deleteMovement',
            sheetName: getCurrentHistorySheetName(),
            data: {
              id: movement.id,
              equipmentId: movement.equipmentId,
              date: movement.date,
              type: movement.type,
              quantite: movement.quantite
            }
          }
        })
      });
    } catch (err) {
      console.error("Erreur d'envoi de la suppression de mouvement à l'Apps Script:", err);
    }
  };

  // Tester la connexion directe au Google Sheet via Apps Script
  const testAppsScriptConnection = async () => {
    const urlToUse = tempAppsScriptUrl.trim();
    if (!urlToUse) {
      showToast("Veuillez d'abord saisir une URL d'Apps Script.");
      return;
    }
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appsScriptUrl: urlToUse,
          payload: {
            spreadsheetId,
            action: 'test',
            data: {}
          }
        })
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        showToast("✅ Connexion réussie ! L'Apps Script communique parfaitement.");
      } else {
        showToast(`❌ Échec : ${resData.error || "Vérifiez que l'Apps Script est publié pour 'Tout le monde' (Anyone)."}`);
      }
    } catch (err: any) {
      console.error("Test connection error:", err);
      showToast(`❌ Erreur : ${err.message || "Impossible de contacter l'Apps Script."}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = () => {
    const headers = [
      getColHeader("id", "Article N°"),
      getColHeader("nom", "Désignation"),
      getColHeader("categorie", "Catégorie"),
      getColHeader("reference", "Référence"),
      getColHeader("quantite", "Quantité Actuelle"),
      getColHeader("qteMin", "Qté Min"),
      getColHeader("marcheOuBc", "Marché ou Bon de commande d'entrée"),
      getColHeader("numMarche", "N° d'entrée"),
      getColHeader("societeAttributaire", "Société attributaire"),
      getColHeader("qteReceptionnee", "Qté Réceptionnée"),
      getColHeader("dateReception", "Date de réception"),
      getColHeader("observationReception", "Observation de réception"),
      getColHeader("marcheOuBcSortie", "Message"),
      getColHeader("numMarcheSortie", "N° de sortie"),
      getColHeader("beneficiaires", "Bénéficiaires"),
      getColHeader("region", "Région"),
      getColHeader("qteLivree", "Qté Livrée"),
      getColHeader("dateLivraison", "Date de livraison"),
      getColHeader("observationsEnvoi", "Observations sur l'envoi"),
      getColHeader("unite", "Unité"),
      getColHeader("zone", "Zone"),
      getColHeader("emplacement", "Emplacement"),
      getColHeader("rfid", "RFID"),
      getColHeader("codeBarres", "CodeBarres"),
      getColHeader("etat", "État"),
      getColHeader("derniereMaj", "Dernière MAJ"),
      ...customColumns
    ];
    
    const rows = filteredTableItems.map(item => [
      item.id,
      item.nom,
      item.categorie,
      item.reference,
      item.quantite,
      item.qteMin,
      item.marcheOuBc || '',
      item.numMarche || '',
      item.societeAttributaire || item.marque || '',
      item.qteReceptionnee || 0,
      item.dateReception || '',
      item.observationReception || '',
      item.marcheOuBcSortie || '',
      item.numMarcheSortie || '',
      item.beneficiaires || '',
      item.region || '',
      item.qteLivree ?? item.qteEnvoyee ?? 0,
      item.dateLivraison || item.dateEnvoi || '',
      item.observationsEnvoi || '',
      item.unite,
      item.zone,
      item.emplacement,
      item.rfid,
      item.codeBarres,
      item.etat,
      item.derniereMaj,
      ...customColumns.map(col => item.extraColumns?.[col] || '')
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(';'))
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `INVENTAIRE_DGPC_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✅ Fichier CSV exporté avec succès !");
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    let startY = await addOfficialHeader(doc, {
      isLandscape: true,
      siteName: depotName,
      depotLocation: depotLocation,
      documentReference: `INV-STOCK-${new Date().getFullYear()}-${new Date().getMonth() + 1}`
    });
    
    startY = addDocumentTitleBanner(doc, {
      startY,
      title: "INVENTAIRE OFFICIEL DES ARTICLES EN STOCK",
      subtitle: `Direction Générale de la Protection Civile — Dépôt : ${depotName}`,
      badge: "SITUATION DE STOCK",
      badgeColor: [15, 23, 42],
      metadata: [
        { label: "Dépôt", value: depotName },
        { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
        { label: "Total Articles", value: `${filteredTableItems.length}` }
      ],
      isLandscape: true
    });
    
    const headers = [
      [
        getColHeader("id", "N°"),
        getColHeader("nom", "Désignation"),
        getColHeader("categorie", "Catégorie"),
        getColHeader("societeAttributaire", "Société"),
        getColHeader("reference", "Référence"),
        getColHeader("quantite", "Qté"),
        getColHeader("qteMin", "Min"),
        getColHeader("zone", "Zone"),
        getColHeader("emplacement", "Emplacement"),
        getColHeader("codeBarres", "CodeBarres"),
        getColHeader("etat", "État")
      ]
    ];
    
    const data = filteredTableItems.map(item => [
      item.id,
      item.nom,
      item.categorie,
      item.societeAttributaire || item.marque || '',
      item.reference,
      item.quantite,
      item.qteMin,
      item.zone,
      item.emplacement,
      item.codeBarres,
      item.etat
    ]);
    
    autoTable(doc, getStandardAutoTableOptions({
      startY,
      head: headers,
      body: data,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 28 },
        3: { cellWidth: 32 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 18 },
        8: { cellWidth: 25 },
        9: { cellWidth: 25 },
        10: { cellWidth: 20, halign: 'center' }
      }
    }));

    const finalY = (doc as any).lastAutoTable.finalY + 4;
    addOfficialSignatureBlock(doc, finalY, {
      leftTitle: "« Le Gestionnaire Principal du Stock »",
      leftSubtitle: "Visa d'inventaire physique",
      rightTitle: "« Le Chef de Service / Dépôt »",
      rightSubtitle: "Validation générale de l'inventaire"
    });

    addOfficialPageFooters(doc);
    
    doc.save(`INVENTAIRE_DGPC_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
    showToast("✅ Document PDF exporté avec succès !");
  };

  // Export History to split PDF (Partie 1 — Entrées & Partie 2 — Sorties)
  const handleExportHistoryPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    let startY = await addOfficialHeader(doc, {
      isLandscape: true,
      siteName: depotName,
      depotLocation: depotLocation,
      documentReference: `REG-MVT-${new Date().getFullYear()}-${new Date().getMonth() + 1}`
    });

    const logs = getFilteredHistoryLogs();
    const entreeLogs = logs.filter(l => l.type === 'Entrée' || l.type === 'Création');
    const sortieLogs = logs.filter(l => l.type === 'Sortie');

    startY = addDocumentTitleBanner(doc, {
      startY,
      title: "REGISTRE OFFICIEL DE L'HISTORIQUE DES MOUVEMENTS DE STOCK",
      subtitle: `Journal des flux : ${entreeLogs.length} Réception(s) & ${sortieLogs.length} Sortie(s)`,
      badge: "REGISTRE OFFICIEL",
      badgeColor: [79, 70, 229],
      metadata: [
        { label: "Dépôt", value: depotName },
        { label: "Date d'export", value: new Date().toLocaleDateString('fr-FR') },
        { label: "Total Entrées", value: `${entreeLogs.length}` },
        { label: "Total Sorties", value: `${sortieLogs.length}` }
      ],
      isLandscape: true
    });

    let currentY = startY;

    // --- PARTIE 1 : ENTRÉES & RÉCEPTIONS ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("PARTIE 1 — ENTRÉES & RÉCEPTIONS FOURNISSEURS", 12, currentY + 3);

    const entreeHead = [
      ["N° ID", "Date", "Désignation Matériel", "Qté Reçue", "Marché / BC", "N° Entrée", "Société / Expéditeur", "Livreur / Conducteur", "Agent Réception", "Observations"]
    ];

    const entreeBody = entreeLogs.map(l => [
      l.id,
      l.date,
      l.equipmentNom,
      `+${l.quantite}`,
      l.marcheOuBc || '—',
      l.numMarche || '—',
      l.societeAttributaire || l.expediteur || '—',
      l.livreurNom || l.conducteurNom || '—',
      l.employe || '—',
      l.observations || l.notes || '—'
    ]);

    autoTable(doc, getStandardAutoTableOptions({
      startY: currentY + 6,
      head: entreeHead,
      body: entreeBody.length > 0 ? entreeBody : [["-", "-", "Aucune entrée enregistrée", "-", "-", "-", "-", "-", "-", "-"]],
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 45 },
        3: { cellWidth: 16, halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 35 },
        7: { cellWidth: 30 },
        8: { cellWidth: 25 },
        9: { cellWidth: 33 }
      }
    }));

    // --- PARTIE 2 : SORTIES & EXPÉDITIONS ---
    let nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : currentY + 40;
    if (nextY > 150) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text("PARTIE 2 — SORTIES & EXPÉDITIONS BÉNÉFICIAIRES", 12, nextY + 3);

    const sortieHead = [
      ["N° ID", "Date", "Désignation Matériel", "Qté Livrée", "Marché / Message", "N° Sortie", "Bénéficiaire", "Région", "Véhicule / Conducteur", "Agent Sortie", "Observations"]
    ];

    const sortieBody = sortieLogs.map(l => [
      l.id,
      l.date,
      l.equipmentNom,
      `-${l.quantite}`,
      l.marcheOuBcSortie || l.message || '—',
      l.numMarcheSortie || '—',
      l.beneficiaire || '—',
      l.region || l.regionDestinataire || '—',
      [l.matriculeVehicule, l.conducteurNom].filter(Boolean).join(' / ') || '—',
      l.agentSortieNom || l.employe || '—',
      l.observations || l.notes || '—'
    ]);

    autoTable(doc, getStandardAutoTableOptions({
      startY: nextY + 6,
      head: sortieHead,
      body: sortieBody.length > 0 ? sortieBody : [["-", "-", "Aucune sortie enregistrée", "-", "-", "-", "-", "-", "-", "-", "-"]],
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { cellWidth: 24 },
        2: { cellWidth: 45 },
        3: { cellWidth: 16, halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 35 },
        7: { cellWidth: 25 },
        8: { cellWidth: 30 },
        9: { cellWidth: 25 },
        10: { cellWidth: 28 }
      }
    }));

    const finalHistoryY = (doc as any).lastAutoTable.finalY + 4;
    addOfficialSignatureBlock(doc, finalHistoryY, {
      leftTitle: "« Le Responsable Registre & Mouvements »",
      leftSubtitle: "Visa de conformité des flux",
      rightTitle: "« Le Commandant de Groupement »",
      rightSubtitle: "Validation et visa d'inspection"
    });

    addOfficialPageFooters(doc);

    doc.save(`HISTORIQUE_MOUVEMENTS_DGPC_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
    showToast("✅ Historique PDF exporté avec succès (Partie 1 & Partie 2) !");
  };

  // Export History to formatted Excel with tabs
  const handleExportHistoryExcel = () => {
    const logs = getFilteredHistoryLogs();
    const entreeLogs = logs.filter(l => l.type === 'Entrée' || l.type === 'Création');
    const sortieLogs = logs.filter(l => l.type === 'Sortie');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Entrées
    const entreeData = entreeLogs.map(l => ({
      "ID Mouvement": l.id,
      "Date & Heure": l.date,
      "ID Article": l.equipmentId,
      "Désignation": l.equipmentNom,
      "Quantité Reçue": l.quantite,
      "Marché / BC d'entrée": l.marcheOuBc || '',
      "N° Entrée / Marché": l.numMarche || '',
      "Société attributaire": l.societeAttributaire || '',
      "Expéditeur": l.expediteur || '',
      "Livreur": l.livreurNom || '',
      "Conducteur": l.conducteurNom || '',
      "Agent Réceptionnaire": l.employe,
      "Service": l.service || '',
      "Observations": l.observations || l.notes || ''
    }));
    const wsEntrees = XLSX.utils.json_to_sheet(entreeData.length > 0 ? entreeData : [{ Message: "Aucune entrée enregistrée" }]);
    XLSX.utils.book_append_sheet(wb, wsEntrees, "Partie 1 — Entrées");

    // Sheet 2: Sorties
    const sortieData = sortieLogs.map(l => ({
      "ID Mouvement": l.id,
      "Date & Heure": l.date,
      "ID Article": l.equipmentId,
      "Désignation": l.equipmentNom,
      "Quantité Livrée": l.quantite,
      "Marché / BC Sortie": l.marcheOuBcSortie || '',
      "Message / N° Sortie": l.numMarcheSortie || l.message || '',
      "Bénéficiaire": l.beneficiaire || '',
      "Région": l.region || l.regionDestinataire || '',
      "Véhicule (Matricule)": l.matriculeVehicule || '',
      "Conducteur": l.conducteurNom || '',
      "Agent Sortie": l.agentSortieNom || l.employe,
      "Service": l.service || '',
      "Observations": l.observations || l.notes || ''
    }));
    const wsSorties = XLSX.utils.json_to_sheet(sortieData.length > 0 ? sortieData : [{ Message: "Aucune sortie enregistrée" }]);
    XLSX.utils.book_append_sheet(wb, wsSorties, "Partie 2 — Sorties");

    // Sheet 3: Tous les Mouvements
    const allData = logs.map(l => ({
      "ID Mouvement": l.id,
      "Type": l.type,
      "Date & Heure": l.date,
      "ID Article": l.equipmentId,
      "Désignation": l.equipmentNom,
      "Quantité": l.quantite,
      "Opérateur": l.employe,
      "Service": l.service || '',
      "Marché / BC": l.marcheOuBc || l.marcheOuBcSortie || '',
      "N° Marché / Message": l.numMarche || l.numMarcheSortie || l.message || '',
      "Société / Expéditeur": l.societeAttributaire || l.expediteur || '',
      "Bénéficiaire": l.beneficiaire || '',
      "Région": l.region || l.regionDestinataire || '',
      "Livreur / Conducteur": l.livreurNom || l.conducteurNom || '',
      "Véhicule": l.matriculeVehicule || '',
      "Agent Sortie": l.agentSortieNom || '',
      "Observations": l.observations || l.notes || ''
    }));
    const wsAll = XLSX.utils.json_to_sheet(allData);
    XLSX.utils.book_append_sheet(wb, wsAll, "Tous les Mouvements");

    XLSX.writeFile(wb, `HISTORIQUE_MOUVEMENTS_DGPC_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    showToast("✅ Fichier Excel exporté avec succès (Partie 1 & Partie 2) !");
  };

  const handleClearLocalHistory = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer l'historique de cette interface ? Cette action ne modifiera pas la base de données de stock originale.")) {
      saveHistoryLogs([]);
      showToast("Historique local effacé avec succès.");
    }
  };

   const saveHistoryLogs = (newLogs: StockMovement[]) => {
     setHistoryLogs(newLogs);
     if (selectedDbId) {
       localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(newLogs));
     } else {
       localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(newLogs));
     }
   };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Browser Audio API Beep synthesizer for scanner simulator
  const playScannerBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Sound sequence: short sharp high-frequency beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime); // 1200 Hz
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context beep blocked. Interaction required first.", e);
    }
  };

  const playErrorBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Error sequence: Low buzz tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime); // Low buzz
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context beep blocked.", e);
    }
  };

  // Depot info handler
  const handleSaveDepotInfo = (e: FormEvent) => {
    e.preventDefault();
    if (tempDepotName.trim()) {
      setDepotName(tempDepotName.trim());
      localStorage.setItem('elec_stock_depot_name', tempDepotName.trim());
    }
    if (tempDepotLocation.trim()) {
      setDepotLocation(tempDepotLocation.trim());
      localStorage.setItem('elec_stock_depot_location', tempDepotLocation.trim());
    }
    setIsEditingDepot(false);
    showToast("Informations du dépôt mises à jour !");
  };

  // Handle spreadsheet config apply
  const handleApplyConfig = (e: FormEvent) => {
    e.preventDefault();
    
    // Save Apps Script URL
    const scriptUrlToSave = tempAppsScriptUrl.trim();
    setAppsScriptUrl(scriptUrlToSave);
    localStorage.setItem('elec_stock_apps_script_url', scriptUrlToSave);

    if (tempSpreadsheetId.trim()) {
      let finalId = tempSpreadsheetId.trim();
      const match = finalId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        finalId = match[1];
      }
      setSpreadsheetId(finalId);
      localStorage.setItem('elec_stock_spreadsheet_id', finalId);
      setShowConfig(false);
      loadData(finalId, true);
    } else {
      setShowConfig(false);
      showToast("Configuration d'écriture enregistrée !");
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    showToast("Code de synchronisation copié dans le presse-papiers !");
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Reset local edits to match the raw sheet or clean state
  const handleResetToDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Réinitialiser l\'inventaire ?',
      message: 'Voulez-vous réinitialiser tous les stocks locaux, effacer l\'historique personnalisé et recharger les données depuis Google Sheets ?',
      confirmText: 'Réinitialiser complètement',
      type: 'warning',
      action: () => {
        if (selectedDbId) {
          localStorage.removeItem(`database_${selectedDbId}_equipments`);
          localStorage.removeItem(`database_${selectedDbId}_history`);
          localStorage.removeItem(`database_${selectedDbId}_loaded_once`);
          
          if (selectedDbId === 'electrique' || selectedDbId === 'electinfo') {
            setLocalOverrides(INITIAL_EQUIPMENT);
            setHistoryLogs([
              { id: "M-001", date: "05/07/2026 09:32", type: "Entrée", equipmentId: "30", equipmentNom: "Câble U1000 R2V 3G2.5", quantite: 100, employe: "Capitaine Benali (Responsable Logistique)", notes: "Réception de commande fournisseur Nexans" },
            ]);
          } else if (selectedDbId === 'patrimoine') {
            const defaultPatrimoine: Equipment[] = [
              { id: "P-001", nom: "Tente de secours d'urgence type A", categorie: "Secours", marque: "Trigano", reference: "T-SECOURS-A", quantite: 12, qteMin: 5, unite: "Unité", zone: "Zone Nord", emplacement: "N-01", rfid: "RFID-PAT-0001", codeBarres: "CBPAT0001", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 2 },
              { id: "P-002", nom: "Lit de camp pliable renforcé", categorie: "Mobilier", marque: "SNC", reference: "L-CAMP-R", quantite: 80, qteMin: 20, unite: "Pièce", zone: "Zone Nord", emplacement: "N-02", rfid: "RFID-PAT-0002", codeBarres: "CBPAT0002", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 3 },
              { id: "P-003", nom: "Générateur électrique mobile 5kVA", categorie: "Énergie", marque: "Honda", reference: "GEN-5KVA", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-PAT-0003", codeBarres: "CBPAT0003", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 4 }
            ];
            setLocalOverrides(defaultPatrimoine);
            setHistoryLogs([
              { id: "M-INIT", date: "07/07/2026 08:00", type: "Création", equipmentId: "N/A", equipmentNom: "Initialisation", quantite: 0, employe: "Système", notes: "Création de la base de données" }
            ]);
          } else if (selectedDbId === 'informatique') {
            const defaultInfo: Equipment[] = [
              { id: "I-001", nom: "Talkie-Walkie professionnel UHF/VHF", categorie: "Télécom", marque: "Motorola", reference: "GP340", quantite: 45, qteMin: 10, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-INF-0001", codeBarres: "CBINF0001", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 2 },
              { id: "I-002", nom: "Serveur de communication d'urgence", categorie: "Réseau", marque: "Dell", reference: "R740", quantite: 2, qteMin: 1, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-INF-0002", codeBarres: "CBINF0002", etat: "Bon", derniereMaj: "07/07/2026", rowIndex: 3 }
            ];
            setLocalOverrides(defaultInfo);
            setHistoryLogs([
              { id: "M-INIT", date: "07/07/2026 08:00", type: "Création", equipmentId: "N/A", equipmentNom: "Initialisation", quantite: 0, employe: "Système", notes: "Création de la base de données" }
            ]);
          } else if (selectedDbId === 'dml1') {
            const defaultDml1: Equipment[] = [
              { id: "E-001", nom: "Civière de transport renforcée", categorie: "Secours", marque: "Ferno", reference: "CIV-REINF", quantite: 15, qteMin: 5, unite: "Unité", zone: "Zone Sud", emplacement: "S-01", rfid: "RFID-DML1-0001", codeBarres: "CBDML10001", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 2 },
              { id: "E-002", nom: "Sac à dos d'intervention médicale d'urgence", categorie: "Médical", marque: "Elite Bags", reference: "SAC-URG-M", quantite: 30, qteMin: 10, unite: "Pièce", zone: "Zone Sud", emplacement: "S-02", rfid: "RFID-DML1-0002", codeBarres: "CBDML10002", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 3 },
              { id: "E-003", nom: "Projecteur LED autonome de zone", categorie: "Éclairage", marque: "Peli", reference: "PROJ-LED-9430", quantite: 8, qteMin: 3, unite: "Unité", zone: "Zone Nord", emplacement: "N-03", rfid: "RFID-DML1-0003", codeBarres: "CBDML10003", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 4 }
            ];
            setLocalOverrides(defaultDml1);
            setHistoryLogs([
              { id: "M-INIT", date: "08/07/2026 08:00", type: "Création", equipmentId: "N/A", equipmentNom: "Initialisation", quantite: 0, employe: "Système", notes: "Création de la base de données" }
            ]);
          } else if (selectedDbId === 'dml2') {
            const defaultDml2: Equipment[] = [
              { id: "V-001", nom: "Roue de secours renforcée pour camion", categorie: "Pièces", marque: "Michelin", reference: "PNEU-14R20", quantite: 12, qteMin: 4, unite: "Pièce", zone: "Zone Est", emplacement: "E-01", rfid: "RFID-DML2-0001", codeBarres: "CBDML20001", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 2 },
              { id: "V-002", nom: "Défibrillateur cardiaque semi-automatique DSA", categorie: "Médical", marque: "Zoll", reference: "DSA-AED3", quantite: 6, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-01", rfid: "RFID-DML2-0002", codeBarres: "CBDML20002", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 3 },
              { id: "V-003", nom: "Respirateur de transport d'urgence", categorie: "Médical", marque: "Weinmann", reference: "RESP-MEDUMAT", quantite: 5, qteMin: 2, unite: "Unité", zone: "Zone Ouest", emplacement: "W-02", rfid: "RFID-DML2-0003", codeBarres: "CBDML20003", etat: "Bon", derniereMaj: "08/07/2026", rowIndex: 4 }
            ];
            setLocalOverrides(defaultDml2);
            setHistoryLogs([
              { id: "M-INIT", date: "08/07/2026 08:00", type: "Création", equipmentId: "N/A", equipmentNom: "Initialisation", quantite: 0, employe: "Système", notes: "Création de la base de données" }
            ]);
          } else {
            setLocalOverrides([]);
            setHistoryLogs([]);
          }
        } else {
          localStorage.removeItem('elec_stock_local_list_v2');
          localStorage.removeItem('elec_stock_history_logs_v2');
          setLocalOverrides(INITIAL_EQUIPMENT);
          setHistoryLogs([
            { id: "M-001", date: "05/07/2026 09:32", type: "Entrée", equipmentId: "30", equipmentNom: "Câble U1000 R2V 3G2.5", quantite: 100, employe: "Capitaine Benali (Responsable Logistique)", notes: "Réception de commande fournisseur Nexans" },
          ]);
        }
        loadData(spreadsheetId, true);
      },
    });
  };

  // "Nom de MAT" dropdown list for sketch selection
  const uniqueMaterialNames = useMemo(() => {
    const names = localOverrides.map((item) => item.nom).filter(Boolean);
    return Array.from(new Set(names)).sort();
  }, [localOverrides]);

  // Selected item details based on the sketch selection
  const selectedSketchItem = useMemo(() => {
    if (!selectedMatName) return null;
    return localOverrides.find((item) => item.nom === selectedMatName) || null;
  }, [selectedMatName, localOverrides]);

  // Auto-set sketch selection to first item if empty
  useEffect(() => {
    if (uniqueMaterialNames.length > 0 && !selectedMatName) {
      setSelectedMatName(uniqueMaterialNames[0]);
    }
  }, [uniqueMaterialNames, selectedMatName]);

  // Search filtered table items for Tab 1
  const filteredTableItems = useMemo(() => {
    return localOverrides.filter((item) => {
      const matchSearch = item.nom.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          item.reference.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          item.codeBarres.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          item.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          item.marque.toLowerCase().includes(tableSearch.toLowerCase());
      
      const matchCategory = selectedCategoryFilter === 'Tous' || item.categorie === selectedCategoryFilter;
      
      return matchSearch && matchCategory;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Natural numeric sorting for Article N° (ID)
      if (sortField === 'id') {
        const numA = parseInt(String(valA).replace(/\D/g, ''), 10);
        const numB = parseInt(String(valB).replace(/\D/g, ''), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
      }
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (valA === undefined || valA === null) return sortOrder === 'asc' ? 1 : -1;
      if (valB === undefined || valB === null) return sortOrder === 'asc' ? -1 : 1;
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB, undefined, { numeric: true }) : strB.localeCompare(strA, undefined, { numeric: true });
    });
  }, [localOverrides, tableSearch, selectedCategoryFilter, sortField, sortOrder]);

  const allCategories = useMemo(() => {
    const cats = localOverrides.map(item => item.categorie).filter(Boolean);
    return ['Tous', ...Array.from(new Set(cats))].sort();
  }, [localOverrides]);

  // Tab 3: Low stock items list (Qty <= Seuil)
  const lowStockItems = useMemo(() => {
    return localOverrides.filter(item => item.quantite <= item.qteMin);
  }, [localOverrides]);

  // Get filtered history logs based on user roles
  const getFilteredHistoryLogs = () => {
    return historyLogs.filter((log) => {
      if (auth.user?.role === 'Direction') {
        return true;
      }
      if (auth.user?.role === 'Administrateur') {
        return !log.service || log.service === auth.user.service;
      }
      return log.employeUsername === auth.user?.username;
    });
  };

  // Export PDF functionality
  const exportToPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    let startY = await addOfficialHeader(doc, {
      siteName: depotName,
      depotLocation: depotLocation,
      documentReference: `RAP-STOCK-${new Date().getFullYear()}-${new Date().getMonth() + 1}`
    });
    
    startY = addDocumentTitleBanner(doc, {
      startY,
      title: `RAPPORT GLOBAL DE GESTION DU STOCK & PATRIMOINE`,
      subtitle: `Dépôt : ${depotName} — ${depotLocation}`,
      badge: "RAPPORT OFFICIEL",
      badgeColor: [15, 23, 42],
      metadata: [
        { label: "Date d'analyse", value: new Date().toLocaleDateString('fr-FR') },
        { label: "Total Articles", value: `${localOverrides.length}` },
        { label: "Alertes Stock Faible", value: `${lowStockItems.length}` }
      ]
    });

    startY = addSummaryCards(doc, startY, [
      {
        title: "Articles Actifs",
        value: `${localOverrides.length}`,
        subtitle: "Catalogue total du dépôt",
        color: [15, 23, 42],
        bgColor: [248, 250, 252]
      },
      {
        title: "Articles en Alerte",
        value: `${lowStockItems.length}`,
        subtitle: "Stock inférieur au seuil min",
        color: lowStockItems.length > 0 ? [185, 28, 28] : [22, 101, 52],
        bgColor: lowStockItems.length > 0 ? [254, 242, 242] : [240, 253, 244]
      },
      {
        title: "Total Mouvements",
        value: `${historyLogs.length}`,
        subtitle: "Flux entrées & sorties",
        color: [79, 70, 229],
        bgColor: [238, 242, 255]
      }
    ]);

    // Section 1: Low Stock
    if (lowStockItems.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(185, 28, 28);
      doc.text("1. Articles en Rupture ou Seuil Critique", 12, startY + 3);
      
      const lowStockData = lowStockItems.map(item => [
        item.codeBarres || item.id,
        item.nom,
        item.quantite.toString(),
        item.qteMin.toString(),
        "⚠️ Réapprovisionnement Requis"
      ]);
      
      autoTable(doc, getStandardAutoTableOptions({
        startY: startY + 6,
        head: [['Code / ID', 'Désignation', 'Stock Actuel', 'Seuil Min', 'Statut']],
        body: lowStockData,
        headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 75 },
          2: { cellWidth: 24, halign: 'center' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 33, halign: 'center' }
        }
      }));
      startY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Section 2: Complete Inventory
    if (startY > 220) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("2. Inventaire Synthétique du Stock", 12, startY + 3);

    const inventoryData = localOverrides.map(item => [
      item.codeBarres || item.id,
      item.nom,
      item.categorie,
      item.quantite.toString(),
      item.unite || 'Unité',
      item.quantite <= item.qteMin ? "Faible" : "Conforme"
    ]);

    autoTable(doc, getStandardAutoTableOptions({
      startY: startY + 6,
      head: [['Code / ID', 'Désignation', 'Catégorie', 'Qté', 'Unité', 'État']],
      body: inventoryData,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 65 },
        2: { cellWidth: 35 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      }
    }));

    const finalGeneralY = (doc as any).lastAutoTable.finalY + 4;
    addOfficialSignatureBlock(doc, finalGeneralY, {
      leftTitle: "« Le Gestionnaire du Dépôt »",
      leftSubtitle: "Visa de conformité d'inventaire",
      rightTitle: "« Le Commandant de Groupement »",
      rightSubtitle: "Validation et visa d'inspection"
    });

    addOfficialPageFooters(doc);

    doc.save(`Rapport_Stock_${depotName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Helper to load image as HTMLImageElement
  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  // Générer un Bon d'entrée ou de sortie (DÉCHARGE) PDF officiel imprimable
  const generateBonPDF = async (log: any) => {
    const doc = new jsPDF();
    let startY = await addOfficialHeader(doc);
    
    // Symmetrical, horizontal line separating the header from the content
    doc.setDrawColor(220, 38, 38); // DGPC Red
    doc.setLineWidth(1);
    doc.line(15, startY, 195, startY);

    // General Subtitle Meta info parsed and reorganized clearly
    let province = "Khémisset";
    let regionStr = "Rabat-Salé-Kénitra";
    if (depotLocation) {
      const parts = depotLocation.split(',');
      if (parts.length >= 2) {
        let provPart = parts[0].replace(/PROVINCE/i, '').trim();
        if (provPart.toUpperCase() === 'KHEMISSET') {
          province = 'Khémisset';
        } else {
          province = provPart.charAt(0).toUpperCase() + provPart.slice(1).toLowerCase();
        }
        regionStr = parts[1].trim();
      } else {
        province = depotLocation;
      }
    }

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600

    doc.setFont("Helvetica", "bold");
    doc.text("Dépôt :", 15, startY + 5);
    doc.setFont("Helvetica", "normal");
    doc.text(depotName, 27, startY + 5);

    doc.setFont("Helvetica", "bold");
    doc.text("Province :", 15, startY + 10);
    doc.setFont("Helvetica", "normal");
    doc.text(province, 31, startY + 10);

    doc.setFont("Helvetica", "bold");
    doc.text("Région :", 15, startY + 15);
    doc.setFont("Helvetica", "normal");
    doc.text(regionStr, 29, startY + 15);

    // Separator line (adjusted position down to fit the structured lines perfectly)
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(15, startY + 18, 195, startY + 18);
    startY += 22;

    const normalLog = {
      id: log.id,
      date: log.date,
      nom: log.nom || log.equipmentNom || 'Article',
      code: log.code || log.codeBarres || '—',
      type: log.type,
      qty: log.qty !== undefined ? log.qty : log.quantite || 0,
      unite: log.unite || 'unité',
      employe: log.employe,
      brand: log.brand || log.marque || '',
      region: log.region || log.regionDestinataire || log.region || '',
      fournisseur: log.fournisseur || log.expediteur || '',
      destinataire: log.destinataire || log.beneficiaire || log.destinataire || '—',
      observations: log.observations || log.notes || '',
      marcheOuBc: log.marcheOuBc || '',
      numMarche: log.numMarche || '',
      marcheOuBcSortie: log.marcheOuBcSortie || '',
      numMarcheSortie: log.numMarcheSortie || '',
      societeAttributaire: log.societeAttributaire || '',
      livreurNom: log.livreurNom || '',
      agentSortieNom: log.agentSortieNom || '',
      matriculeVehicule: log.matriculeVehicule || '',
      conducteurNom: log.conducteurNom || '',
      message: log.message || ''
    };

    if (normalLog.type === 'Sortie' || normalLog.type === 'Entrée' || normalLog.type === 'Création') {
      const isExit = normalLog.type === 'Sortie';
      
      // 1. Title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(isExit ? "DÉCHARGE DE SORTIE" : "BON D'ENTRÉE & RÉCEPTION", 105, startY + 10, { align: "center" });

      // 2. Checkboxes: Matériel, Fourniture, Imprimés
      const cbY = startY + 20;
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);

      // Draw Material checkbox (Checked)
      doc.rect(40, cbY - 3.5, 4, 4);
      doc.text("X", 41, cbY - 0.5);
      doc.text("Matériel", 47, cbY);

      // Draw Fourniture checkbox (Unchecked)
      doc.rect(90, cbY - 3.5, 4, 4);
      doc.text("Fourniture", 97, cbY);

      // Draw Imprimés checkbox (Unchecked)
      doc.rect(140, cbY - 3.5, 4, 4);
      doc.text("Imprimés", 147, cbY);

      // 3. Info Block
      let infoY = cbY + 10;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      
      if (isExit) {
        doc.text("Bénéficiaire :", 15, infoY);
        doc.setFont("Helvetica", "normal");
        doc.text(normalLog.destinataire || '—', 45, infoY);

        doc.setFont("Helvetica", "bold");
        doc.text("Région :", 120, infoY);
        doc.setFont("Helvetica", "normal");
        doc.text(normalLog.region || '—', 138, infoY);

        infoY += 5.5;
        const docTypeStr = normalLog.marcheOuBcSortie ? `${normalLog.marcheOuBcSortie} de sortie N° :` : 'Marché / BC / Message N° :';
        doc.setFont("Helvetica", "bold");
        doc.text(docTypeStr, 15, infoY);
        doc.setFont("Helvetica", "normal");
        doc.text(normalLog.numMarcheSortie || normalLog.message || '—', doc.getTextWidth(docTypeStr) + 18, infoY);

        if (normalLog.matriculeVehicule || normalLog.conducteurNom) {
          infoY += 5.5;
          doc.setFont("Helvetica", "bold");
          doc.text("Véhicule / Conducteur :", 15, infoY);
          doc.setFont("Helvetica", "normal");
          doc.text([normalLog.matriculeVehicule, normalLog.conducteurNom].filter(Boolean).join(' - ') || '—', 62, infoY);
        }

        if (normalLog.agentSortieNom) {
          infoY += 5.5;
          doc.setFont("Helvetica", "bold");
          doc.text("Agent de Sortie :", 15, infoY);
          doc.setFont("Helvetica", "normal");
          doc.text(normalLog.agentSortieNom, 50, infoY);
        }
      } else {
        const docTypeStr = normalLog.marcheOuBc ? `${normalLog.marcheOuBc} d'entrée N° :` : 'Marché ou BC d\'entrée N° :';
        doc.text(docTypeStr, 15, infoY);
        doc.setFont("Helvetica", "normal");
        doc.text(normalLog.numMarche || '—', doc.getTextWidth(docTypeStr) + 18, infoY);

        doc.setFont("Helvetica", "bold");
        doc.text("Société / Fournisseur :", 110, infoY);
        doc.setFont("Helvetica", "normal");
        doc.text(normalLog.societeAttributaire || normalLog.fournisseur || '—', 152, infoY);

        if (normalLog.livreurNom || normalLog.conducteurNom) {
          infoY += 5.5;
          doc.setFont("Helvetica", "bold");
          doc.text("Livreur / Conducteur :", 15, infoY);
          doc.setFont("Helvetica", "normal");
          doc.text([normalLog.livreurNom, normalLog.conducteurNom].filter(Boolean).join(' - ') || '—', 60, infoY);
        }
      }

      // 4. Table with Designation, Quantité, Observations
      const tableData = [
        [
          normalLog.nom, 
          `${normalLog.qty} ${normalLog.unite}(s)`, 
          normalLog.observations || '—'
        ]
      ];

      autoTable(doc, {
        startY: infoY + 6,
        head: [['Désignation', 'Quantité', 'Observations']],
        body: tableData,
        headStyles: { fillColor: [15, 23, 42] }, // Slate black header
        theme: 'grid',
        styles: { fontSize: 9.5, font: "Helvetica" }
      });

      const finalTableY = (doc as any).lastAutoTable.finalY || (infoY + 25);

      // 5. Bottom Signatures
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      if (isExit) {
        doc.text("« Bénéficiaires »", 30, finalTableY + 15);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Signature du bénéficiaire", 23, finalTableY + 21);
      } else {
        doc.text("« Société attributaire »", 25, finalTableY + 15);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(normalLog.societeAttributaire || '—', 25, finalTableY + 21);
      }
      doc.line(15, finalTableY + 45, 75, finalTableY + 45); // Line for signature

      // Bottom-right: "Lieu et date" with space for signature
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      const today = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
      doc.text(`Rabat, le ${dateStr}`, 130, finalTableY + 15);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      if (isExit) {
        doc.text("Signature et Cachet", 135, finalTableY + 21);
      } else {
        doc.text("Réceptionnaire de Dépôt", 135, finalTableY + 21);
      }
      
      const currentUserName = normalLog.agentSortieNom || normalLog.employe || auth.user?.fullName || '';
      if (currentUserName) {
        doc.text(currentUserName, 135, finalTableY + 27);
      }
      
      doc.line(125, finalTableY + 45, 185, finalTableY + 45); // Line for signature
    }

    // Uniform official footer
    addOfficialPageFooters(doc);

    // Save document
    doc.save(`BON_${normalLog.type.toUpperCase()}_${normalLog.id}.pdf`);
  };

  // Add/Edit Save trigger
  const handleSaveEquipment = (newItem: Omit<Equipment, 'rowIndex'>) => {
    setIsAddEditOpen(false);
    if (editingItem) {
      // Modify
      const formattedDate = new Date().toLocaleDateString('fr-FR');
      const updatedItem = { ...editingItem, ...newItem, derniereMaj: formattedDate };
      const updated = localOverrides.map((item) => 
        item.id === editingItem.id ? updatedItem : item
      );
      saveLocalList(updated);
      syncToAppsScript('update', updatedItem);

      // Log modify
      const isEntry = updatedItem.quantite > editingItem.quantite;
      const isExit = updatedItem.quantite < editingItem.quantite;
      const diffQty = Math.abs(updatedItem.quantite - editingItem.quantite);

      const modifyMovement: StockMovement = {
        id: `M-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toLocaleString('fr-FR'),
        type: isEntry ? 'Entrée' : (isExit ? 'Sortie' : 'Modification'),
        equipmentId: updatedItem.id,
        equipmentNom: updatedItem.nom,
        quantite: diffQty,
        employe: auth.user?.fullName || 'Inconnu',
        employeUsername: auth.user?.username || 'Inconnu',
        service: auth.user?.service || '',
        notes: `Modification de la fiche. Qté: ${editingItem.quantite} -> ${updatedItem.quantite}`,
        
        // Aligned entry/exit parameters for sheet sync
        marcheOuBc: isEntry ? updatedItem.marcheOuBc : undefined,
        numMarche: isEntry ? updatedItem.numMarche : undefined,
        societeAttributaire: isEntry ? updatedItem.societeAttributaire : undefined,
        expediteur: isEntry ? updatedItem.expediteur : undefined,
        
        marcheOuBcSortie: isExit ? updatedItem.marcheOuBcSortie : undefined,
        numMarcheSortie: isExit ? updatedItem.numMarcheSortie : undefined,
        beneficiaire: isExit ? updatedItem.beneficiaires : undefined,
        region: isExit ? updatedItem.region : undefined,
      };
      saveHistoryLogs([modifyMovement, ...historyLogs]);
      syncMovementToAppsScript(modifyMovement);

      let successMsg = `Équipement "${newItem.nom}" mis à jour.`;
      if (updatedItem.quantite > editingItem.quantite) successMsg = "Entrée validée avec succès";
      else if (updatedItem.quantite < editingItem.quantite) successMsg = "Sortie validée avec succès";
      showToast(successMsg);
      
      // Auto update active sketch name if needed
      if (selectedMatName === editingItem.nom) {
        setSelectedMatName(newItem.nom);
      }
    } else {
      // Create
      const formattedDate = new Date().toLocaleDateString('fr-FR');
      const created: Equipment = {
        ...newItem,
        derniereMaj: formattedDate,
        rowIndex: localOverrides.length + 2
      };
      saveLocalList([...localOverrides, created]);
      syncToAppsScript('add', created);

      // Log create
      const createMovement: StockMovement = {
        id: `M-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toLocaleString('fr-FR'),
        type: 'Création',
        equipmentId: created.id,
        equipmentNom: created.nom,
        quantite: created.quantite,
        employe: auth.user?.fullName || 'Inconnu',
        employeUsername: auth.user?.username || 'Inconnu',
        service: auth.user?.service || '',
        notes: 'Création manuelle via formulaire'
      };
      saveHistoryLogs([createMovement, ...historyLogs]);
      syncMovementToAppsScript(createMovement);

      showToast(`Équipement "${newItem.nom}" ajouté avec succès !`);
      setSelectedMatName(created.nom);
    }
    setEditingItem(null);
  };

  // Save Inline Edit row
  const handleSaveInlineRow = (updatedItem: Equipment) => {
    const formattedDate = new Date().toLocaleDateString('fr-FR');
    const itemWithDate = { ...updatedItem, derniereMaj: formattedDate };
    
    const previousItem = localOverrides.find(item => item.id === itemWithDate.id);
    
    const updated = localOverrides.map((item) => 
      item.id === itemWithDate.id ? itemWithDate : item
    );
    saveLocalList(updated);
    syncToAppsScript('update', itemWithDate);

    // If quantity changed, log a movement!
    if (previousItem && previousItem.quantite !== itemWithDate.quantite) {
      const diff = itemWithDate.quantite - previousItem.quantite;
      const modifyMovement: StockMovement = {
        id: `M-${Math.floor(Math.random() * 90000 + 10000)}`,
        date: new Date().toLocaleString('fr-FR'),
        type: diff > 0 ? 'Entrée' : 'Sortie',
        equipmentId: itemWithDate.id,
        equipmentNom: itemWithDate.nom,
        quantite: Math.abs(diff),
        employe: auth.user?.fullName || 'Inconnu',
        employeUsername: auth.user?.username || 'Inconnu',
        service: auth.user?.service || '',
        notes: `Ajustement de stock via modification en ligne. Qté: ${previousItem.quantite} -> ${itemWithDate.quantite}`
      };
      saveHistoryLogs([modifyMovement, ...historyLogs]);
      syncMovementToAppsScript(modifyMovement);
    }

    showToast(`Équipement "${itemWithDate.nom}" mis à jour avec succès.`);
    setEditingRowId(null);
    setEditingRowData(null);

    // Auto update active sketch name if needed
    if (previousItem && selectedMatName === previousItem.nom) {
      setSelectedMatName(itemWithDate.nom);
    }
  };

  // Delete Action
  const handleDeleteItem = (target: Equipment) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'équipement "${target.nom}" de la base de données de l'inventaire ?`,
      confirmText: 'Supprimer',
      type: 'danger',
      action: () => {
        const filtered = localOverrides.filter((item) => item.id !== target.id);
        saveLocalList(filtered);
        syncToAppsScript('delete', target);
        showToast(`"${target.nom}" a été supprimé.`);
        if (selectedMatName === target.nom) {
          setSelectedMatName(filtered[0]?.nom || '');
        }
      }
    });
  };

  // Delete Movement Action
  const handleDeleteMovement = (movement: StockMovement) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirmer la suppression du mouvement",
      message: `Êtes-vous sûr de vouloir supprimer définitivement ce mouvement de l'historique (${movement.type} de ${movement.quantite} pièces pour "${movement.equipmentNom}") ? Cette action est irréversible et supprimera la ligne dans Google Sheets.`,
      confirmText: 'Supprimer',
      type: 'danger',
      action: async () => {
        // 1. Update local state
        const updatedLogs = historyLogs.filter(log => log.id !== movement.id);
        setHistoryLogs(updatedLogs);
        
        // 2. Save to local storage
        if (selectedDbId) {
          localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(updatedLogs));
        } else {
          localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(updatedLogs));
        }
        
        // 3. Sync deletion to Google Sheets
        await syncDeleteMovementToAppsScript(movement);
        
        // 4. Close dialogs
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setSelectedMovement(null);
        showToast(`Le mouvement a été supprimé de l'historique.`);
      }
    });
  };

  // Barcode / Scanner input processing logic (supermarket check-out register flow)
  const handleBarcodeScanInput = (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    // Cooldown check to prevent duplicate scans of the exact same code in the same 2-second window
    const now = Date.now();
    if (lastScanRef.current.code === trimmed && (now - lastScanRef.current.time) < 2000) {
      return; 
    }
    lastScanRef.current = { code: trimmed, time: now };

    const matchedItem = findEquipmentByCode(trimmed);

    if (matchedItem) {
      // Check authorization
      if (!isUserAuthorizedForItem(matchedItem)) {
        playErrorBeep();
        setScannedBarcode('');
        setScannerFeedback({
          type: 'error',
          text: "Cet article appartient à un autre service. Vous n'avez pas l'autorisation d'effectuer des opérations sur ce matériel."
        });
        showToast("Erreur : Accès non autorisé à cet article.");
        return;
      }

      // Auto-close camera scanner once a valid material is successfully identified
      setIsCameraActive(false);

      const canonicalCode = matchedItem.codeBarres || matchedItem.rfid;

      if (scannedBarcode === canonicalCode) {
        // Successive scan: increment quantity
        setScannerQty(prev => prev + 1);
        playScannerBeep();
        setScannerFeedback({
          type: 'success',
          text: `🎯 Scan successif ! Quantité cumulée ajustée à : ${scannerQty + 1} ${matchedItem.unite}(s).`
        });
        showToast(`Scan successif : "${matchedItem.nom}" (+1)`);
      } else {
        // First scan of this item: load item
        setScannedBarcode(canonicalCode);
        setScannerQty(1);
        setScannerBrand(matchedItem.marque);
        
        // Intelligent pre-filling
        const lastMovement = historyLogs.find(log => log.equipmentId === matchedItem.id);
        const rawMarche = lastMovement?.marcheOuBc || matchedItem.marcheOuBc;
        const prefilledMarche = (rawMarche === 'Marché' || rawMarche === 'Bon de commande') 
          ? rawMarche 
          : 'Marché';
          
        setScannerMarcheOuBc(prefilledMarche);
        setScannerNumMarche(lastMovement?.numMarche || matchedItem.numMarche || '');
        setScannerSocieteAttributaire(lastMovement?.societeAttributaire || matchedItem.societeAttributaire || matchedItem.marque || '');
        setScannerFournisseur(lastMovement?.expediteur || matchedItem.expediteur || matchedItem.societeAttributaire || '');
        setScannerDestinataire(lastMovement?.beneficiaire || matchedItem.beneficiaires || '');
        setScannerRegion(lastMovement?.region || matchedItem.region || '');

        setScannerFeedback({
          type: 'success',
          text: `✅ Matériel identifié : "${matchedItem.nom}". (Marque : ${matchedItem.marque} | Stock : ${matchedItem.quantite} ${matchedItem.unite})`
        });
        playScannerBeep();
        showToast(`Matériel identifié : "${matchedItem.nom}"`);
      }
    } else {
      // Unrecognized barcode
      setScannedBarcode(trimmed);
      setScannerBrand('');
      // Pre-fill creation form fields
      setNewScanNom('');
      setNewScanMarque('');
      setNewScanQuantite(1); // Default to 1
      setNewScanRfid(trimmed.startsWith('RFID') ? trimmed : '');
      
      // Clear scanner transaction fields for unknown item
      setScannerNumMarche('');
      setScannerSocieteAttributaire('');
      setScannerFournisseur('');
      setScannerDestinataire('');
      setScannerRegion('');

      setScannerFeedback({
        type: 'warning',
        text: `🔍 Nouveau code "${trimmed}" détecté ! Remplissez la fiche technique à droite pour l'ajouter en stock.`
      });
      playErrorBeep();
      showToast(`⚠️ Nouveau matériel détecté : "${trimmed}"`);
    }
  };

  // Barcode / Scanner simulation trigger
  const handleScanOperation = (e: FormEvent) => {
    e.preventDefault();
    setScannerFeedback(null);

    if (!scannedBarcode.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'Veuillez saisir ou scanner un code-barres !' });
      return;
    }

    // Lookup item using the robust finder helper
    const targetItem = findEquipmentByCode(scannedBarcode);

    if (!targetItem) {
      playErrorBeep();
      setScannerFeedback({ 
        type: 'error', 
        text: `Code-barres ou RFID "${scannedBarcode}" introuvable dans la base ! Veuillez remplir le formulaire de création ci-dessous pour l'enregistrer.` 
      });
      return;
    }

    if (!isUserAuthorizedForItem(targetItem)) {
      playErrorBeep();
      setScannerFeedback({ 
        type: 'error', 
        text: "Cet article appartient à un autre service. Vous n'avez pas l'autorisation d'effectuer des opérations sur ce matériel." 
      });
      return;
    }

    if (scannerQty <= 0) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'La quantité de l\'opération doit être supérieure à 0.' });
      return;
    }

    // Stock checks
    if (scannerOpType === 'Sortie' && targetItem.quantite < scannerQty) {
      playErrorBeep();
      setScannerFeedback({ 
        type: 'error', 
        text: `Opération refusée : Stock insuffisant ! Quantité disponible : ${targetItem.quantite} ${targetItem.unite}(s).` 
      });
      return;
    }

    if (scannerOpType === 'Sortie' && !scannerRegion) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'La région destinataire est obligatoire pour une sortie.' });
      return;
    }

    if (scannerOpType === 'Entrée' && !scannerNumMarche.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: `Le numéro de ${scannerMarcheOuBc} d'entrée est obligatoire !` });
      return;
    }

    if (scannerOpType === 'Sortie' && !scannerNumMarcheSortie.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: `Le numéro de ${scannerMarcheOuBcSortie} de sortie est obligatoire !` });
      return;
    }

    if (scannerOpType === 'Entrée' && !scannerSocieteAttributaire.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: "La société attributaire est obligatoire pour une entrée." });
      return;
    }

    if (!scannerNotes.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: "L'observation est obligatoire." });
      return;
    }

    // Execute adjustment
    const updatedQty = scannerOpType === 'Entrée' 
      ? targetItem.quantite + scannerQty 
      : targetItem.quantite - scannerQty;

    const finalBrand = scannerOpType === 'Entrée' ? scannerSocieteAttributaire.trim() : (targetItem.societeAttributaire || targetItem.marque);

    const updatedItem: Equipment = { 
      ...targetItem,
      quantite: updatedQty,
      derniereMaj: new Date().toLocaleDateString('fr-FR'), // Dernière MAJ auto-updated
      
      ...(scannerOpType === 'Entrée' ? {
        marcheOuBc: scannerMarcheOuBc,
        numMarche: scannerNumMarche.trim(),
        societeAttributaire: scannerSocieteAttributaire.trim(),
        expediteur: scannerSocieteAttributaire.trim(),
        marque: scannerSocieteAttributaire.trim(),
        qteReceptionnee: Number(scannerQty),
        dateReception: scannerDate,
        observationReception: scannerNotes.trim(),
        livreurNom: scannerLivreurNom.trim(),
        // Conserver les données de sortie inchangées
        marcheOuBcSortie: targetItem.marcheOuBcSortie || '',
        numMarcheSortie: targetItem.numMarcheSortie || '',
        beneficiaires: targetItem.beneficiaires || '',
        region: targetItem.region || '',
        qteLivree: targetItem.qteLivree !== undefined ? Number(targetItem.qteLivree) : 0,
        dateLivraison: targetItem.dateLivraison || '',
        observationsEnvoi: targetItem.observationsEnvoi || '',
        qteEnvoyee: targetItem.qteEnvoyee !== undefined ? Number(targetItem.qteEnvoyee) : 0,
        dateEnvoi: targetItem.dateEnvoi || '',
      } : {
        // Conserver les données d'entrée inchangées
        marcheOuBc: targetItem.marcheOuBc || '',
        numMarche: targetItem.numMarche || '',
        societeAttributaire: targetItem.societeAttributaire || '',
        expediteur: targetItem.expediteur || '',
        marque: targetItem.societeAttributaire || targetItem.marque || '',
        qteReceptionnee: targetItem.qteReceptionnee !== undefined ? Number(targetItem.qteReceptionnee) : 0,
        dateReception: targetItem.dateReception || '',
        observationReception: targetItem.observationReception || '',
        // Mettre à jour les données de sortie
        marcheOuBcSortie: scannerMarcheOuBcSortie,
        numMarcheSortie: scannerNumMarcheSortie.trim(),
        beneficiaires: scannerDestinataire.trim(),
        region: scannerRegion.trim(),
        qteLivree: Number(scannerQty),
        dateLivraison: scannerDate,
        observationsEnvoi: scannerNotes.trim(),
        qteEnvoyee: Number(scannerQty),
        dateEnvoi: scannerDate,
        agentSortieNom: scannerAgentSortieNom.trim(),
        matriculeVehicule: scannerMatriculeVehicule.trim(),
        conducteurNom: scannerConducteurNom.trim(),
      }),
    };

    const updatedList = localOverrides.map(item => 
      item.id === targetItem.id 
        ? updatedItem 
        : item
    );

    // Save inventory update
    saveLocalList(updatedList);
    syncToAppsScript('update', updatedItem);

    // Add movement to History Logs
    const movementId = `M-${Math.floor(Math.random() * 90000 + 10000)}`;
    const formattedDate = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    
    const newMovement: StockMovement = {
      id: movementId,
      date: formattedDate,
      type: scannerOpType,
      equipmentId: targetItem.id,
      equipmentNom: targetItem.nom,
      quantite: scannerQty,
      employe: scannerEmployee,
      employeUsername: auth.user?.username || 'Inconnu',
      service: auth.user?.service || '',
      notes: scannerNotes.trim() || (scannerOpType === 'Entrée' ? 'Réapprovisionnement' : 'Sortie d\'inventaire standard'),
      regionDestinataire: scannerOpType === 'Sortie' ? scannerRegion : undefined,
      expediteur: scannerOpType === 'Entrée' ? scannerFournisseur : undefined,
      beneficiaire: scannerOpType === 'Sortie' ? scannerDestinataire : undefined,
      region: scannerOpType === 'Sortie' ? scannerRegion : undefined,
      observations: scannerNotes.trim() || (scannerOpType === 'Entrée' ? 'Réapprovisionnement' : 'Sortie d\'inventaire standard'),
      marcheOuBc: scannerOpType === 'Entrée' ? scannerMarcheOuBc : undefined,
      numMarche: scannerOpType === 'Entrée' ? scannerNumMarche : undefined,
      marcheOuBcSortie: scannerOpType === 'Sortie' ? scannerMarcheOuBcSortie : undefined,
      numMarcheSortie: scannerOpType === 'Sortie' ? scannerNumMarcheSortie : undefined,
      societeAttributaire: scannerOpType === 'Entrée' ? scannerSocieteAttributaire : undefined,
      livreurNom: scannerOpType === 'Entrée' ? scannerLivreurNom : undefined,
      agentSortieNom: scannerOpType === 'Sortie' ? scannerAgentSortieNom : undefined,
      matriculeVehicule: scannerOpType === 'Sortie' ? scannerMatriculeVehicule : undefined,
      conducteurNom: scannerOpType === 'Sortie' ? scannerConducteurNom : undefined,
      extraColumns: { ...scannerExtraFields }
    };

    saveHistoryLogs([newMovement, ...historyLogs]);
    syncMovementToAppsScript(newMovement);
    
    // Add rolling checkout ticket log
    const sessionLog = {
      id: movementId,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nom: targetItem.nom,
      code: targetItem.codeBarres,
      type: scannerOpType,
      qty: scannerQty,
      unite: targetItem.unite,
      employe: scannerEmployee,
      employeUsername: auth.user?.username || 'Inconnu',
      service: auth.user?.service || '',
      brand: finalBrand,
      marcheOuBc: scannerOpType === 'Entrée' ? scannerMarcheOuBc : undefined,
      numMarche: scannerOpType === 'Entrée' ? scannerNumMarche : undefined,
      marcheOuBcSortie: scannerOpType === 'Sortie' ? scannerMarcheOuBcSortie : undefined,
      numMarcheSortie: scannerOpType === 'Sortie' ? scannerNumMarcheSortie : undefined,
      societeAttributaire: scannerOpType === 'Entrée' ? scannerSocieteAttributaire : undefined,
      livreurNom: scannerOpType === 'Entrée' ? scannerLivreurNom : undefined,
      agentSortieNom: scannerOpType === 'Sortie' ? scannerAgentSortieNom : undefined,
      matriculeVehicule: scannerOpType === 'Sortie' ? scannerMatriculeVehicule : undefined,
      conducteurNom: scannerOpType === 'Sortie' ? scannerConducteurNom : undefined,
      extraColumns: { ...scannerExtraFields }
    };
    const updatedSessionLogs = [sessionLog, ...recentScannerSessionLogs].slice(0, 10);
    setRecentScannerSessionLogs(updatedSessionLogs);
    localStorage.setItem('elec_stock_scanner_session_logs', JSON.stringify(updatedSessionLogs));

    // Play scanner beep
    playScannerBeep();

    // Do not auto-download, instead store the transaction info for manual download
    const finalTransactionLog = {
      ...sessionLog,
      region: scannerOpType === 'Sortie' ? scannerRegion : undefined,
      fournisseur: scannerOpType === 'Entrée' ? scannerFournisseur : undefined,
      destinataire: scannerOpType === 'Sortie' ? scannerDestinataire : undefined,
      marcheOuBc: scannerOpType === 'Entrée' ? scannerMarcheOuBc : undefined,
      numMarche: scannerOpType === 'Entrée' ? scannerNumMarche : undefined,
      marcheOuBcSortie: scannerOpType === 'Sortie' ? scannerMarcheOuBcSortie : undefined,
      numMarcheSortie: scannerOpType === 'Sortie' ? scannerNumMarcheSortie : undefined,
      societeAttributaire: scannerOpType === 'Entrée' ? scannerSocieteAttributaire : undefined,
      livreurNom: scannerOpType === 'Entrée' ? scannerLivreurNom : undefined,
      agentSortieNom: scannerOpType === 'Sortie' ? scannerAgentSortieNom : undefined,
      matriculeVehicule: scannerOpType === 'Sortie' ? scannerMatriculeVehicule : undefined,
      conducteurNom: scannerOpType === 'Sortie' ? scannerConducteurNom : undefined,
      extraColumns: { ...scannerExtraFields }
    };
    setLastTransactionLog(finalTransactionLog);

    // Success response
    setScannerFeedback({ 
      type: 'success', 
      text: `${scannerOpType === 'Entrée' ? 'Entrée' : 'Sortie'} validée avec succès` 
    });
    
    // Quick success toast
    showToast(`${scannerOpType === 'Entrée' ? 'Entrée' : 'Sortie'} validée avec succès`);
    
    // Reset inputs
    setScannerQty(1);
    setScannerNotes('');
    setScannerRegion('');
    setScannerFournisseur('');
    setScannerDestinataire('');
    setScannedBarcode('');
    setScannerNumMarcheSortie('');
    setScannerExtraFields({});
  };

  // Create new material scanned with an unknown barcode/QR code
  const handleCreateNewEquipmentFromScan = (e: FormEvent) => {
    e.preventDefault();
    setScannerFeedback(null);

    if (!scannedBarcode.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'Veuillez saisir ou scanner un code-barres d\'abord.' });
      return;
    }

    if (!newScanNom.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'La désignation du matériel est obligatoire !' });
      return;
    }

    if (!newScanMarque.trim()) {
      playErrorBeep();
      setScannerFeedback({ type: 'error', text: 'La marque du matériel est obligatoire !' });
      return;
    }

    // Generate unique sequential integer ID to maintain integrity with sheet
    const nextId = String(Math.max(...localOverrides.map(item => parseInt(item.id) || 0), 0) + 1);

    const newEquipment: Equipment = {
      id: nextId,
      nom: newScanNom.trim(),
      categorie: newScanCategorie,
      marque: newScanMarque.trim(),
      reference: `REF-${Math.floor(Math.random() * 90000 + 10000)}`,
      quantite: newScanQuantite,
      qteMin: newScanQteMin,
      expediteur: newScanFournisseur.trim() || '',
      societeAttributaire: newScanMarque.trim(),
      marcheOuBc: scannerMarcheOuBc,
      numMarche: scannerNumMarche.trim() || `N°-${Math.floor(Math.random() * 9000 + 1000)}`,
      extraColumns: { ...scannerExtraFields },
      qteReceptionnee: newScanQuantite,
      dateReception: new Date().toISOString().split('T')[0],
      observationReception: 'Création initiale via scanner',
      beneficiaires: '',
      region: '',
      qteLivree: 0,
      dateLivraison: '',
      observationsEnvoi: '',
      qteEnvoyee: 0,
      observations: 'Création initiale via scanner',
      unite: newScanUnite.trim() || 'Pièce',
      zone: newScanZone,
      emplacement: newScanEmplacement.trim() || 'A01',
      rfid: newScanRfid.trim() || `RFID-${Math.floor(Math.random() * 90000 + 10000)}`,
      codeBarres: scannedBarcode.trim(),
      etat: newScanEtat,
      derniereMaj: new Date().toLocaleDateString('fr-FR'),
      noteUtilisateur: '',
      urgenceText: '',
      requisEnCasDUrgence: false,
      rowIndex: localOverrides.length + 2
    };

    // Save to local state & persist
    const updatedList = [...localOverrides, newEquipment];
    saveLocalList(updatedList);
    syncToAppsScript('add', newEquipment);

    // Create history entry
    const movementId = `M-${Math.floor(Math.random() * 90000 + 10000)}`;
    const initialMovement: StockMovement = {
      id: movementId,
      date: new Date().toLocaleString('fr-FR', { hour12: false }),
      type: 'Entrée',
      equipmentId: newEquipment.id,
      equipmentNom: newEquipment.nom,
      quantite: newScanQuantite,
      employe: scannerEmployee,
      employeUsername: auth.user?.username || 'Inconnu',
      service: auth.user?.service || '',
      notes: `Initialisation et création de l'article via Scanner. Stock initial : ${newScanQuantite} ${newEquipment.unite}(s)`,
      expediteur: newScanFournisseur.trim() || undefined,
      beneficiaire: undefined,
      region: undefined,
      observations: `Initialisation et création de l'article via Scanner.`
    };

    saveHistoryLogs([initialMovement, ...historyLogs]);
    syncMovementToAppsScript(initialMovement);

    // Add rolling checkout ticket log for creation
    const sessionLog = {
      id: movementId,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      nom: newEquipment.nom,
      code: newEquipment.codeBarres,
      type: 'Création',
      qty: newScanQuantite,
      unite: newEquipment.unite,
      employe: scannerEmployee,
      employeUsername: auth.user?.username || 'Inconnu',
      service: auth.user?.service || '',
      brand: newEquipment.marque,
      isNew: true
    };
    const updatedSessionLogs = [sessionLog, ...recentScannerSessionLogs].slice(0, 10);
    setRecentScannerSessionLogs(updatedSessionLogs);
    localStorage.setItem('elec_stock_scanner_session_logs', JSON.stringify(updatedSessionLogs));

    playScannerBeep();

    // Do not auto-download, instead store the transaction info for manual download
    const finalTransactionLog = {
      ...sessionLog,
      fournisseur: newScanFournisseur.trim() || undefined
    };
    setLastTransactionLog(finalTransactionLog);

    setScannerFeedback({
      type: 'success',
      text: `Nouveau matériel "${newEquipment.nom}" créé avec succès ! Code "${newEquipment.codeBarres}" enregistré sous la marque "${newEquipment.marque}". Vous pouvez maintenant télécharger le bon officiel de mouvement.`
    });

    showToast(`Matériel "${newEquipment.nom}" enregistré via le scanner !`);

    // Reset Creation form fields
    setNewScanNom('');
    setNewScanMarque('');
    setNewScanQuantite(10);
    setNewScanQteMin(2);
    setNewScanUnite('Pièce');
    setNewScanEmplacement('A01');
    setNewScanRfid('');
    setNewScanFournisseur('');
    setScannedBarcode('');
    setScannerExtraFields({});
  };

  // Quick replenish action for low stocks
  const handleQuickReplenish = (target: Equipment, qtyToAdd: number) => {
    const updatedItem: Equipment = { 
      ...target, 
      quantite: target.quantite + qtyToAdd, 
      derniereMaj: new Date().toLocaleDateString('fr-FR'),
      qteReceptionnee: qtyToAdd,
      dateReception: new Date().toLocaleDateString('fr-FR'),
      observationReception: "Réapprovisionnement rapide d'urgence"
    };
    const updated = localOverrides.map(item => 
      item.id === target.id 
        ? updatedItem 
        : item
    );
    saveLocalList(updated);
    syncToAppsScript('update', updatedItem);

    // Write movement to history
    const newMovement: StockMovement = {
      id: `M-${Math.floor(Math.random() * 90000 + 10000)}`,
      date: new Date().toLocaleString('fr-FR', { hour12: false }),
      type: 'Entrée',
      equipmentId: target.id,
      equipmentNom: target.nom,
      quantite: qtyToAdd,
      employe: auth.user?.fullName || 'Lieutenant Slimani (Gestionnaire de Dépôt)',
      employeUsername: auth.user?.username || 'Inconnu',
      service: auth.user?.service || '',
      notes: 'Réapprovisionnement rapide d\'urgence',
      observations: 'Réapprovisionnement rapide d\'urgence'
    };
    saveHistoryLogs([newMovement, ...historyLogs]);
    syncMovementToAppsScript(newMovement);

    playScannerBeep();
    showToast(`Réapprovisionné +${qtyToAdd} ${target.unite} pour "${target.nom}".`);
  };

  // Counters
  const totalEquipments = localOverrides.length;
  const totalItemsCount = localOverrides.reduce((sum, item) => sum + item.quantite, 0);
  const totalAlertsCount = lowStockItems.length;

  if (!visitedWelcome) {
    return (
      <WelcomeScreen 
        onNext={() => { 
          setVisitedWelcome(true); 
          localStorage.setItem('gis_dgpc_visited_welcome', 'true'); 
        }} 
        onConnexion={() => {
          setVisitedWelcome(true);
          localStorage.setItem('gis_dgpc_visited_welcome', 'true');
        }}
      />
    );
  }

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <LoginScreen 
        onLogin={setAuth} 
        spreadsheetId={spreadsheetId}
        loginSpreadsheetId={loginSpreadsheetId}
        appsScriptUrl={appsScriptUrl}
        onUpdateSpreadsheetIds={(mainId, loginId, scriptUrl) => {
          setSpreadsheetId(mainId);
          setLoginSpreadsheetId(loginId);
          if (scriptUrl !== undefined) {
            setAppsScriptUrl(scriptUrl);
            setTempAppsScriptUrl(scriptUrl);
          }
        }}
        onBack={() => {
          setVisitedWelcome(false);
          localStorage.removeItem('gis_dgpc_visited_welcome');
        }}
      />
    );
  }

  if (!selectedDbId) {
    return (
      <DatabaseSelectionScreen 
        user={auth.user} 
        spreadsheetId={spreadsheetId}
        onSelectDatabase={(dbId, initialData) => {
          setSelectedDbId(dbId);
          localStorage.setItem('gis_dgpc_selected_db', dbId);
          if (initialData) {
            setLocalOverrides(initialData);
          }
        }} 
        onLogout={() => {
          setAuth({ isAuthenticated: false, user: null });
          localStorage.removeItem('elec_stock_auth');
        }}
      />
    );
  }

  const isAdmin = auth.user.role === 'Administrateur';

  return (
    <div className={`min-h-screen text-slate-900 font-sans antialiased select-none flex bg-slate-50 ${appSettings.bgImage ? 'bg-cover bg-center bg-fixed' : ''}`} style={{ backgroundImage: appSettings.bgImage ? `url("${appSettings.bgImage}")` : 'none' }}>
      {appSettings.bgImage && <div className="fixed inset-0 bg-slate-50/70 backdrop-blur-[2px] z-0 pointer-events-none"></div>}
      <div className="relative z-10 flex w-full">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isNavCollapsed={isNavCollapsed} 
          setIsNavCollapsed={setIsNavCollapsed} 
          user={auth.user} 
          totalAlertsCount={totalAlertsCount}
          workspaceType={workspaceType}
          siteName={siteName}
          onSwitchWorkspace={handleSwitchWorkspace}
          onChangeWorkspaceScreen={handleOpenWorkspaceSelection}
          onLogout={() => {
            setAuth({ isAuthenticated: false, user: null });
            localStorage.removeItem('elec_stock_auth');
            localStorage.removeItem('gis_dgpc_selected_db');
          }}
        />
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-x-hidden ${isNavCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}>

      {/* Top Workspace Navigation & Context Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 py-3 sticky top-0 z-40 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border shadow-xs transition-colors shrink-0 ${
            workspaceType === 'magasin' 
              ? 'bg-amber-50 text-amber-700 border-amber-200' 
              : 'bg-red-50 text-[#C84B31] border-red-200'
          }`}>
            {workspaceType === 'magasin' ? <Store className="h-5 w-5" /> : <Warehouse className="h-5 w-5" />}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs ${
                workspaceType === 'magasin'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-red-100 text-[#C84B31] border-red-300'
              }`}>
                {workspaceType === 'magasin' ? '🏪 Espace Magasin' : '🏢 Espace Dépôt'}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {siteName || (workspaceType === 'magasin' ? 'Magasin Régional' : 'Dépôt Sidi Allal Bahraoui')}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold truncate hidden sm:inline">
              {workspaceType === 'magasin' 
                ? 'Distribution de proximité & gestion des dotations' 
                : 'Stock central, logistique lourde & réserves régionales'}
            </span>
          </div>
        </div>

        {/* Quick Workspace Switcher Actions */}
        <div className="flex items-center gap-2">
          {/* Dual Toggle Pill */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 shadow-xs">
            <button
              type="button"
              onClick={() => handleSwitchWorkspace('depot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                workspaceType === 'depot' 
                  ? 'bg-white text-[#C84B31] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Basculer vers l'Espace Dépôt"
            >
              <Warehouse className="h-3.5 w-3.5" />
              <span>Dépôt</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchWorkspace('magasin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                workspaceType === 'magasin' 
                  ? 'bg-amber-400 text-slate-950 shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
              title="Basculer vers l'Espace Magasin"
            >
              <Store className="h-3.5 w-3.5" />
              <span>Magasin</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenWorkspaceSelection}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Changer d'espace ou sélectionner un autre site / année"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Changer d'espace</span>
            <span className="md:hidden">Sites</span>
          </button>
        </div>
      </header>

      
      {/* Dynamic Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2.5 rounded-2xl bg-slate-900/95 px-5 py-3.5 text-xs font-bold text-white shadow-2xl backdrop-blur-xs border border-white/10"
          >
            <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>



      <main className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                  <div className="flex-1 w-full space-y-6">

        {/* Google Sheets Config Panel */}
        {isAdmin && showConfig && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                <span>Base de Données Google Sheets & Écriture en Temps Réel</span>
              </h3>
              <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Par défaut, l'application lit directement la feuille de calcul publique et enregistre les modifications localement. Pour activer <strong>la synchronisation en temps réel (écriture, ajout, suppression)</strong> sans authentification obligatoire, configurez l'URL Google Apps Script ci-dessous.
            </p>

            <form onSubmit={handleApplyConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. LECTURE CONFIG */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    1. ID de la Feuille (Lecture)
                  </label>
                  <input
                    id="input-config-sheet-id"
                    type="text"
                    value={tempSpreadsheetId}
                    onChange={(e) => setTempSpreadsheetId(e.target.value)}
                    placeholder="ID ou URL complète de votre feuille de calcul"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Sert à charger la liste d'équipements initiale et l'inventaire officiel.
                  </p>
                </div>

                {/* 2. ECRITURE CONFIG */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                    <span>2. URL Apps Script (Écriture en temps réel)</span>
                    {appsScriptUrl ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Actif</span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full font-bold">Local seul</span>
                    )}
                  </label>
                  <input
                    id="input-config-apps-script-url"
                    type="text"
                    value={tempAppsScriptUrl}
                    onChange={(e) => setTempAppsScriptUrl(e.target.value)}
                    placeholder="Ex: https://script.google.com/macros/s/.../exec"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-red-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Permet d'enregistrer, modifier et supprimer des lignes directement dans Google Sheets.
                  </p>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 pt-2">
                {tempAppsScriptUrl && (
                  <button
                    type="button"
                    onClick={testAppsScriptConnection}
                    disabled={isSyncing}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center space-x-1.5"
                  >
                    <span>Tester la connexion</span>
                  </button>
                )}
                <button
                  id="apply-sheet-config-btn"
                  type="submit"
                  disabled={isSyncing}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center space-x-1.5"
                >
                  {isSyncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Sauvegarder & Appliquer la configuration</span>
                </button>
              </div>
            </form>

            {/* Guide de configuration d'écriture directe */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-950 flex items-center space-x-1.5">
                <Info className="h-4 w-4 text-red-600 shrink-0" />
                <span>Guide d'activation : Comment synchroniser l'écriture sur votre Google Sheet ?</span>
              </h4>
              <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
                <li>Ouvrez votre document Google Sheet et cliquez sur <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Supprimez tout code existant et collez-y le script fourni ci-dessous.</li>
                <li>Cliquez sur <strong>Déployer &gt; Nouveau déploiement</strong>.</li>
                <li>Sélectionnez le type <strong>Application Web</strong>.</li>
                <li>Définissez <em>Exécuter en tant que :</em> <strong>Moi (votre adresse email)</strong> et <em>Qui a accès :</em> <strong>Tous les utilisateurs (même anonymes)</strong>.</li>
                <li>Cliquez sur <strong>Déployer</strong>, autorisez les accès, puis copiez l'<strong>URL de l'application Web</strong> et collez-la ci-dessus !</li>
              </ol>

              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs font-semibold text-slate-700">Script Google Apps Script prêt à l'emploi :</span>
                <button
                  onClick={handleCopyScript}
                  className="self-start inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
                  <span>{copiedScript ? "Copié !" : "Copier le code de synchronisation"}</span>
                </button>
              </div>
            </div>
            
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
              <a
                id="open-source-sheet-link"
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 hover:text-red-600 font-semibold"
              >
                <span>Consulter la feuille Google Sheets source</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              
              <button
                id="reset-overrides-btn"
                onClick={handleResetToDefault}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 font-bold"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Réinitialiser aux valeurs d'origine</span>
              </button>
            </div>
          </div>
        )}



        {/* ========================================================= */}
        {/* INTERACTIVE HAND-DRAWN SKETCH (REPLICA FIELD BY FIELD)    */}
        {/* ========================================================= */}
        {isAdmin && activeTab === 'stock' && (
          <section className="bg-white rounded-3xl border-2 border-red-700/60 p-5 md:p-6 shadow-md relative overflow-hidden">
            {/* Subtle branding seal */}
          <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-bl from-red-50 to-transparent pointer-events-none" />

          {/* Sketch Upper Title Section */}
          <div className="text-center pb-5 border-b border-dashed border-slate-200">
            <div className="inline-block relative">
              <h2 className="text-xl font-black text-slate-900 tracking-wider px-4 uppercase">
                Gestion de stock
              </h2>
              {/* Artistic double strike lines underneath */}
              <div className="h-0.5 bg-red-600 mx-auto mt-0.5 rounded-full w-5/6" />
              <div className="h-[1px] bg-slate-900 mx-auto mt-[2px] rounded-full w-2/3" />
            </div>
            <h3 className="text-xs font-black tracking-widest text-red-600 uppercase mt-1">
              Direction Générale de la Protection Civile
            </h3>
          </div>

          {/* Hand-drawn Replica Selection Card Fields */}
          <div className="mt-6 max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            
            {/* Left side: Interactive Dropdown "Nom de MAT" */}
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
                  <span>Nom de MAT</span>
                  <span className="text-[9px] bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    Liste Déroulante
                  </span>
                </label>

                <div className="relative">
                  <select
                    id="select-nom-de-mat"
                    value={selectedMatName}
                    onChange={(e) => setSelectedMatName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 rounded-xl px-4 py-3.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer appearance-none transition-all"
                  >
                    {uniqueMaterialNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-800">
                    <ChevronDown className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="mt-3.5 flex items-center space-x-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Recherche rapide de matériel..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Auto-select the first match in dropdown
                        const match = uniqueMaterialNames.find(n => n.toLowerCase().includes(e.target.value.toLowerCase()));
                        if (match) setSelectedMatName(match);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>

              {/* General Statistics Summary box */}
              <div className="bg-red-600 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-100 block uppercase tracking-wider">Équipements répertoriés</span>
                  <span className="text-2xl font-black">{totalEquipments}</span>
                </div>
                <div className="h-8 w-px bg-red-500" />
                <div>
                  <span className="text-[10px] font-bold text-red-100 block uppercase tracking-wider">Stock total disponible</span>
                  <span className="text-2xl font-black">{totalItemsCount}</span>
                </div>
                <div className="h-8 w-px bg-red-500" />
                <div>
                  <span className="text-[10px] font-bold text-red-100 block uppercase tracking-wider">Alertes en cours</span>
                  <span className="text-2xl font-black text-white bg-red-800 px-2 py-0.5 rounded-lg animate-pulse">{totalAlertsCount}</span>
                </div>
              </div>
            </div>

            {/* Right side: Hand-drawn Card Field values replicating image layout */}
            <div className="space-y-3.5">
              
              {/* Card 1: Nom */}
              <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Designation
                </span>
                <div className="pt-1">
                  <p className="text-xs font-extrabold text-slate-900 uppercase">
                    {selectedSketchItem ? selectedSketchItem.nom : '—'}
                  </p>
                  {selectedSketchItem && (
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-semibold text-slate-400">Réf:</span>
                      <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded">
                        {selectedSketchItem.reference || 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400">| Catégorie:</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {selectedSketchItem.categorie}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Marque */}
              <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Société
                </span>
                <div className="pt-1">
                  <p className="text-xs font-extrabold text-slate-900 uppercase">
                    {selectedSketchItem ? selectedSketchItem.marque : '—'}
                  </p>
                </div>
              </div>

              {/* Card 3: Quantite */}
              <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Quantité actuelle
                </span>
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-900">
                      {selectedSketchItem ? `${selectedSketchItem.quantite} ${selectedSketchItem.unite}(s)` : '0 unités'}
                    </p>
                    {selectedSketchItem && (
                      <span className="text-[9px] text-slate-400 block">
                        Quantité minimale : {selectedSketchItem.qteMin} unités
                      </span>
                    )}
                  </div>

                  {selectedSketchItem && (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${
                        selectedSketchItem.quantite === 0 
                          ? 'bg-red-100 text-red-700' 
                          : selectedSketchItem.quantite <= selectedSketchItem.qteMin 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {selectedSketchItem.quantite === 0 
                          ? 'Rupture' 
                          : selectedSketchItem.quantite <= selectedSketchItem.qteMin 
                          ? 'Alerte Faible' 
                          : 'Disponible'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Zone */}
              <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Zone
                </span>
                <div className="pt-1 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      {selectedSketchItem ? selectedSketchItem.zone : '—'}
                    </p>
                    {selectedSketchItem && (
                      <span className="text-[9px] text-slate-400 block">
                        Emplacement : {selectedSketchItem.emplacement || 'Non spécifié'}
                      </span>
                    )}
                  </div>

                  {selectedSketchItem && (
                    <div className="flex space-x-1.5">
                      <button
                        id="quick-edit-sketch-item-btn"
                        onClick={() => {
                          setEditingItem(selectedSketchItem);
                          setIsAddEditOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        title="Modifier l'équipement"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        id="quick-delete-sketch-item-btn"
                        onClick={() => handleDeleteItem(selectedSketchItem)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                        title="Supprimer l'équipement"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 5: Logistique (Expéditeur, Bénéficiaire, Région) */}
              {selectedSketchItem && (selectedSketchItem.expediteur || selectedSketchItem.beneficiaires || selectedSketchItem.region) && (
                <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                  <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Logistique & Distribution
                  </span>
                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Expéditeur</span>
                      <p className="text-xs font-extrabold text-slate-900">{selectedSketchItem.expediteur || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Bénéficiaires</span>
                      <p className="text-xs font-extrabold text-slate-900">{selectedSketchItem.beneficiaires || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Région</span>
                      <p className="text-xs font-extrabold text-slate-900">{selectedSketchItem.region || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 6: Flux de stocks */}
              {selectedSketchItem && (selectedSketchItem.qteReceptionnee !== undefined || selectedSketchItem.qteEnvoyee !== undefined) && (
                <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                  <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Flux de Stock
                  </span>
                  <div className="pt-1 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Quantité Réceptionnée</span>
                      <p className="text-sm font-black text-emerald-600">+{selectedSketchItem.qteReceptionnee || 0} {selectedSketchItem.unite || 'unité(s)'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Quantité Envoyée</span>
                      <p className="text-sm font-black text-red-600">-{selectedSketchItem.qteEnvoyee || 0} {selectedSketchItem.unite || 'unité(s)'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 7: Observations */}
              {selectedSketchItem && selectedSketchItem.observations && (
                <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                  <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Observations
                  </span>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedSketchItem.observations}
                    </p>
                  </div>
                </div>
              )}

              {/* Card 8: Note utilisateur */}
              {selectedSketchItem && selectedSketchItem.noteUtilisateur && (
                <div className="border-2 border-slate-900 rounded-2xl bg-white p-4 relative transition-all shadow-xs">
                  <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Note utilisateur
                  </span>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedSketchItem.noteUtilisateur}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </section>
        )}

        {/* Navigation is now handled by the permanent vertical sidebar on the right */}

        {/* ========================================================= */}
        {/* TAB 0: ACCUEIL (HOME SCREEN)                              */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && auth.user && (
          <HomeTab
            user={auth.user}
            historyLogs={historyLogs}
            workspaceType={workspaceType}
            siteName={siteName}
            onChangeWorkspace={handleOpenWorkspaceSelection}
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsNavCollapsed(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            equipments={localOverrides}
            showToast={showToast}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationTab 
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsNavCollapsed(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            equipments={localOverrides}
            historyLogs={historyLogs}
            user={auth.user}
            showToast={showToast}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 1: STOCK COMPLET (DETAILED TABLE)                      */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
          <section id="inventory-table-section" className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-4 p-4 md:p-6">
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-md font-black text-slate-950 uppercase tracking-wide">
                  Base de données globale d'inventaire
                </h2>
                <p className="text-xs text-slate-400">
                  Liste ordonnée de l'ensemble des matériels électriques du dépôt de la Protection Civile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsColumnCustomizerOpen(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3.5 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
                  title="Personnaliser les intitulés des colonnes du tableau"
                >
                  <SlidersHorizontal className="h-4 w-4 text-amber-700" />
                  <span>Intitulés des colonnes</span>
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                  title="Télécharger l'inventaire en CSV"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Exporter CSV</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                  title="Télécharger l'inventaire en PDF"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>Exporter PDF</span>
                </button>
                {(auth.user?.role === 'Administrateur' || auth.user?.role === 'Direction') && (
                  <button
                    id="open-add-dialog-btn"
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddEditOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-500/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Nouveau matériel</span>
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setIsColumnCustomizerOpen(true)}
                      className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
                      title="Personnaliser les intitulés des colonnes"
                    >
                      <Edit2 className="h-4 w-4 text-slate-500" />
                      <span>Intitulés des colonnes</span>
                    </button>
                    <button
                      onClick={() => setIsAddColumnModalOpen(true)}
                      className="inline-flex items-center space-x-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Ajouter colonne</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Category selection bar */}
            <div className="flex items-center space-x-2 overflow-x-auto py-1 border-b border-slate-100">
              {allCategories.map((cat) => (
                <button
                  id={`cat-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategoryFilter === cat
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Filter Inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="table-search-input"
                  type="text"
                  placeholder="Filtrer par nom, marque, référence ou code-barres..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="text-xs font-bold text-red-600 hover:underline px-2"
                >
                  Effacer le filtre
                </button>
              )}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">
                      <button 
                        onClick={() => { setSortField('id'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                        className="flex items-center space-x-1 hover:text-slate-800 cursor-pointer"
                      >
                        <span>{getColHeader('id', 'Article N°')}</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">
                      <button 
                        onClick={() => { setSortField('nom'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                        className="flex items-center space-x-1 hover:text-slate-800 cursor-pointer"
                      >
                        <span>{getColHeader('nom', 'Désignation')}</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="py-3 px-4">{getColHeader('categorie', 'Catégorie')}</th>
                    <th className="py-3 px-4">{getColHeader('reference', 'Référence')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('quantite', 'Quantité Actuelle')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('qteMin', 'Qté Min')}</th>
                    <th className="py-3 px-4">{getColHeader('marcheOuBc', "Marché ou Bon de commande d'entrée")}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('numMarche', "N° d'entrée")}</th>
                    <th className="py-3 px-4">{getColHeader('societeAttributaire', 'Société attributaire')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('qteReceptionnee', 'Qté Réceptionnée')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('dateReception', 'Date de réception')}</th>
                    <th className="py-3 px-4">{getColHeader('observationReception', 'Observation de réception')}</th>
                    <th className="py-3 px-4">{getColHeader('marcheOuBcSortie', 'Message')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('numMarcheSortie', 'N° de sortie')}</th>
                    <th className="py-3 px-4">{getColHeader('beneficiaires', 'Bénéficiaires')}</th>
                    <th className="py-3 px-4">{getColHeader('region', 'Région')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('qteLivree', 'Qté Livrée')}</th>
                    <th className="py-3 px-4 text-center">{getColHeader('dateLivraison', 'Date de livraison')}</th>
                    <th className="py-3 px-4">{getColHeader('observationsEnvoi', "Observations sur l'envoi")}</th>
                    <th className="py-3 px-4">{getColHeader('unite', 'Unité')}</th>
                    <th className="py-3 px-4">{getColHeader('zone', 'Zone')}</th>
                    <th className="py-3 px-4">{getColHeader('emplacement', 'Emplacement')}</th>
                    <th className="py-3 px-4">{getColHeader('rfid', 'RFID')}</th>
                    <th className="py-3 px-4">{getColHeader('codeBarres', 'CodeBarres')}</th>
                    <th className="py-3 px-4">{getColHeader('etat', 'État')}</th>
                    <th className="py-3 px-4">{getColHeader('derniereMaj', 'Dernière MAJ')}</th>
                    {customColumns.map(col => (
                      <th key={col} className="py-3 px-4">{col}</th>
                    ))}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTableItems.map((item, idx) => {
                    const isLow = item.quantite <= item.qteMin;
                    const isOut = item.quantite === 0;
                    const canEditItem = auth.user && (
                      auth.user.role === 'Direction' || 
                      (auth.user.role === 'Administrateur' && isUserAuthorizedForItem(item))
                    );

                    if (editingRowId === item.id) {
                      return (
                        <tr 
                          key={`${item.id}-${item.rowIndex || idx}`} 
                          className="bg-red-50/20 border-2 border-red-500 animate-fadeIn"
                        >
                          {/* Article N° (Read-only) */}
                          <td className="py-2 px-3 font-mono font-bold text-slate-500 bg-slate-50/50">
                            {item.id}
                          </td>
                          
                          {/* Désignation (nom) */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.nom || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, nom: e.target.value } : null)}
                              className="w-64 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Désignation"
                            />
                          </td>
                          
                          {/* Catégorie */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.categorie || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, categorie: e.target.value } : null)}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          
                          {/* Référence */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.reference || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, reference: e.target.value } : null)}
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Référence"
                            />
                          </td>
                          
                          {/* Quantité Actuelle */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={editingRowData?.quantite ?? 0}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, quantite: Math.max(0, parseInt(e.target.value) || 0) } : null)}
                              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-center text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                          </td>
                          
                          {/* Qté Min */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={editingRowData?.qteMin ?? 0}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, qteMin: Math.max(0, parseInt(e.target.value) || 0) } : null)}
                              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-center text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                          </td>
                          
                          {/* Marché ou BC */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.marcheOuBc || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, marcheOuBc: e.target.value } : null)}
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Marché">Marché</option>
                              <option value="BC">Bon de commande</option>
                            </select>
                          </td>
                          
                          {/* N° Marché */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={editingRowData?.numMarche || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, numMarche: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="N°"
                            />
                          </td>
                          
                          {/* Société attributaire */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.societeAttributaire || editingRowData?.marque || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, societeAttributaire: e.target.value, marque: e.target.value } : null)}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Société"
                            />
                          </td>
                          
                          {/* Qté Réceptionnée */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={editingRowData?.qteReceptionnee ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const original = localOverrides.find(item => item.id === editingRowData?.id);
                                const baseQty = original ? (original.quantite - (original.qteReceptionnee || 0) + (original.qteLivree || original.qteEnvoyee || 0)) : 0;
                                setEditingRowData(prev => prev ? {
                                  ...prev,
                                  qteReceptionnee: val,
                                  qteLivree: 0,
                                  qteEnvoyee: 0,
                                  quantite: baseQty + val,
                                  dateReception: val > 0 ? new Date().toLocaleDateString('fr-FR') : (prev.dateReception || '')
                                } : null);
                              }}
                              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-center text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                          </td>
                          
                          {/* Date Réception */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={editingRowData?.dateReception || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, dateReception: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Date"
                            />
                          </td>
                          
                          {/* Obs Réception */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.observationReception || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, observationReception: e.target.value } : null)}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Observation"
                            />
                          </td>

                          {/* Marché ou BC Sortie */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.marcheOuBcSortie || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, marcheOuBcSortie: e.target.value } : null)}
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              <option value="">Sélectionner...</option>
                              <option value="Marché">Marché</option>
                              <option value="BC">Bon de commande</option>
                            </select>
                          </td>
                          
                          {/* N° de sortie */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={editingRowData?.numMarcheSortie || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, numMarcheSortie: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="N° de sortie"
                            />
                          </td>
                          
                          {/* Bénéficiaires */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.beneficiaires || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, beneficiaires: e.target.value } : null)}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Bénéficiaires"
                            />
                          </td>
                          
                          {/* Région */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.region || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, region: e.target.value } : null)}
                              className="w-40 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              <option value="">-- Choisir région --</option>
                              {REGIONS_MAROC.map(reg => (
                                <option key={reg} value={reg}>{reg}</option>
                              ))}
                            </select>
                          </td>
                          
                          {/* Qté Livrée */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={editingRowData?.qteLivree ?? editingRowData?.qteEnvoyee ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const original = localOverrides.find(item => item.id === editingRowData?.id);
                                const baseQty = original ? (original.quantite - (original.qteReceptionnee || 0) + (original.qteLivree || original.qteEnvoyee || 0)) : 0;
                                setEditingRowData(prev => prev ? {
                                  ...prev,
                                  qteLivree: val,
                                  qteEnvoyee: val,
                                  qteReceptionnee: 0,
                                  quantite: Math.max(0, baseQty - val),
                                  dateLivraison: val > 0 ? new Date().toLocaleDateString('fr-FR') : (prev.dateLivraison || ''),
                                  dateEnvoi: val > 0 ? new Date().toLocaleDateString('fr-FR') : (prev.dateEnvoi || '')
                                } : null);
                              }}
                              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-center text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            />
                          </td>
                          
                          {/* Date Livraison */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="text"
                              value={editingRowData?.dateLivraison || editingRowData?.dateEnvoi || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, dateLivraison: e.target.value, dateEnvoi: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Date"
                            />
                          </td>
                          
                          {/* Observations Envoi */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.observationsEnvoi || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, observationsEnvoi: e.target.value } : null)}
                              className="w-32 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Obs Envoi"
                            />
                          </td>
                          
                          {/* Unité */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.unite || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, unite: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              <option value="Pièce">Pièce</option>
                              <option value="Mètre">Mètre</option>
                              <option value="Unité">Unité</option>
                              <option value="Lot">Lot</option>
                              <option value="Boîte">Boîte</option>
                            </select>
                          </td>
                          
                          {/* Zone */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.zone || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, zone: e.target.value } : null)}
                              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Zone"
                            />
                          </td>
                          
                          {/* Emplacement */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.emplacement || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, emplacement: e.target.value } : null)}
                              className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="Empl."
                            />
                          </td>
                          
                          {/* RFID */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.rfid || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, rfid: e.target.value } : null)}
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="RFID"
                            />
                          </td>
                          
                          {/* CodeBarres */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={editingRowData?.codeBarres || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, codeBarres: e.target.value } : null)}
                              className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                              placeholder="CodeBarres"
                            />
                          </td>
                          
                          {/* État */}
                          <td className="py-2 px-3">
                            <select
                              value={editingRowData?.etat || ''}
                              onChange={(e) => setEditingRowData(prev => prev ? { ...prev, etat: e.target.value } : null)}
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            >
                              {ETATS.map(et => (
                                <option key={et} value={et}>{et}</option>
                              ))}
                            </select>
                          </td>
                          
                          {/* Dernière MAJ (Read-only) */}
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                            {item.derniereMaj || '—'}
                          </td>
                          {customColumns.map(col => (
                            <td key={col} className="py-2 px-3">
                              <input
                                type="text"
                                value={editingRowData?.extraColumns?.[col] || ''}
                                onChange={(e) => setEditingRowData(prev => prev ? { 
                                  ...prev, 
                                  extraColumns: { ...(prev.extraColumns || {}), [col]: e.target.value } 
                                } : null)}
                                className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder={col}
                              />
                            </td>
                          ))}
                          {/* Inline Actions (Save / Cancel) */}
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                id={`save-inline-btn-${item.id}`}
                                onClick={() => {
                                  if (editingRowData) {
                                    handleSaveInlineRow(editingRowData);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-2xs border border-emerald-200 cursor-pointer"
                                title="Enregistrer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                id={`cancel-inline-btn-${item.id}`}
                                onClick={() => {
                                  setEditingRowId(null);
                                  setEditingRowData(null);
                                }}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors shadow-2xs border border-slate-200 cursor-pointer"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr 
                        key={`${item.id}-${item.rowIndex || idx}`} 
                        className={`hover:bg-slate-50/50 transition-colors ${selectedMatName === item.nom ? 'bg-red-50/20' : ''}`}
                        onDoubleClick={() => {
                          if (canEditItem) {
                            setEditingRowId(item.id);
                            setEditingRowData({ ...item });
                          }
                        }}
                        title={canEditItem ? "Double-cliquez pour modifier" : ""}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{item.id}</td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setSelectedMatName(item.nom);
                              // Scroll slightly up to show the card replica
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="font-extrabold text-slate-900 hover:underline hover:text-red-700 text-left"
                          >
                            {item.nom}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {item.categorie}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{item.reference || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-black">
                          <span className={`inline-block px-2 py-0.5 rounded-md ${
                            isOut 
                              ? 'bg-red-100 text-red-700 font-extrabold' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {item.quantite}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{item.qteMin}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.marcheOuBc || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{item.numMarche || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-600">{item.societeAttributaire || item.marque || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-600">{item.qteReceptionnee || 0}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">{item.dateReception || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={item.observationReception}>{item.observationReception || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.marcheOuBcSortie || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600">{item.numMarcheSortie || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.beneficiaires || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.region || '—'}</td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-600">{item.qteLivree ?? item.qteEnvoyee ?? 0}</td>
                        <td className="py-3.5 px-4 text-center text-slate-600">{item.dateLivraison || item.dateEnvoi || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={item.observationsEnvoi}>{item.observationsEnvoi || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.unite || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{item.zone}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{item.emplacement || '—'}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{item.rfid || '—'}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">{item.codeBarres || '—'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            item.etat === 'Bon' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : item.etat === 'Moyen' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {item.etat}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">{item.derniereMaj || '—'}</td>
                        {customColumns.map(col => (
                          <td key={col} className="py-3.5 px-4 text-slate-600 font-semibold">
                            {item.extraColumns?.[col] || '—'}
                          </td>
                        ))}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              id={`history-item-btn-${item.id}`}
                              onClick={() => {
                                setHistoryModalItem(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Historique de l'article"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            {canEditItem && (
                              <>
                                <button
                                  id={`edit-item-inline-btn-${item.id}`}
                                  onClick={() => {
                                    setEditingRowId(item.id);
                                    setEditingRowData({ ...item });
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Modifier directement dans la ligne"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  id={`edit-item-modal-btn-${item.id}`}
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsAddEditOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Modifier par formulaire"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </button>
                                <button
                                  id={`delete-item-btn-${item.id}`}
                                  onClick={() => handleDeleteItem(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTableItems.length === 0 && (
                    <tr>
                      <td colSpan={25} className="py-12 text-center text-slate-400 font-semibold">
                        Aucun matériel de stock trouvé dans la base.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 2: HISTORIQUE DES MOUVEMENTS                          */}
        {/* ========================================================= */}
        {(activeTab === 'history' || activeTab === 'docs-historique') && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-md font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5 text-red-600" />
                  <span>Registre d'Historique des Mouvements</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Suivi et traçabilité complète de l'ensemble des entrées et sorties de matériel électrique.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleClearLocalHistory}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                  title="Effacer l'historique de cette interface"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span>Effacer l'historique</span>
                </button>
                <button
                  onClick={handleExportHistoryExcel}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
                  title="Exporter l'historique complet au format Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Exporter Excel</span>
                </button>
                <button
                  onClick={handleExportHistoryPDF}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition-colors shadow-xs"
                  title="Générer un PDF de l'historique divisé en deux parties (Entrées et Sorties)"
                >
                  <FileText className="h-4 w-4" />
                  <span>Générer PDF</span>
                </button>
              </div>
            </div>

            {/* List of movements */}
            <div className="space-y-3">
              {getFilteredHistoryLogs().map((log) => {
                const isEntree = log.type === 'Entrée';
                return (
                  <div 
                    key={log.id} 
                    onClick={() => setSelectedMovement(log)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Movement sign badge */}
                      <div className={`p-2 rounded-xl shrink-0 ${isEntree ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {isEntree ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {log.equipmentNom}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                            isEntree ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {log.type === 'Entrée' ? 'Entrée (+)' : 'Sortie (-)'}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          <span className="flex items-center space-x-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-600">{log.employe}</span>
                          </span>
                          <span>•</span>
                          <span className="font-mono">{log.date}</span>
                          {log.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-500 font-medium">Motif: {log.notes}</span>
                            </>
                          )}
                          {log.regionDestinataire && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-bold">Dest: {log.regionDestinataire}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity logged */}
                    <div className="sm:text-right self-end sm:self-center">
                      <span className={`text-md font-black ${isEntree ? 'text-emerald-700' : 'text-red-700'}`}>
                        {isEntree ? '+' : '-'}{log.quantite} pièces
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono uppercase">ID: {log.id}</span>
                    </div>
                  </div>
                );
              })}

              {getFilteredHistoryLogs().length === 0 && (
                <div className="py-12 text-center text-slate-400 font-semibold">
                  Aucun mouvement de stock enregistré pour le moment.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 3: STOCK FAIBLE (ALERTS)                              */}
        {/* ========================================================= */}
        {activeTab === 'alerts' && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-md font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <span>Articles en Alerte de Stock Faible</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Articles dont la quantité disponible est inférieure ou égale au seuil de quantité minimale de sécurité.
                </p>
              </div>

              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-xl">
                {lowStockItems.length} Alerte(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.map((item, idx) => {
                const isOut = item.quantite === 0;
                return (
                  <div 
                    key={`${item.id}-${item.rowIndex || idx}`}
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                      isOut ? 'border-red-200 bg-red-50/10' : 'border-amber-200 bg-amber-50/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            {item.categorie}
                          </span>
                          <h3 className="font-extrabold text-slate-950 mt-1">{item.nom}</h3>
                          <p className="text-[10px] text-slate-400">Société : {item.marque} | Réf : {item.reference}</p>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {isOut ? 'Rupture' : 'Critique'}
                        </span>
                      </div>

                      {/* Stock values bar layout */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Quantité actuelle :</span>
                          <span className={isOut ? 'text-red-700 font-black' : 'text-amber-700'}>
                            {item.quantite} {item.unite}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-500">Quantité minimale requise :</span>
                          <span className="text-slate-700">{item.qteMin} {item.unite}</span>
                        </div>
                        {/* Progress visual bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full ${isOut ? 'bg-red-600' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, (item.quantite / (item.qteMin || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Replenish button simulation */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <button
                        id={`replenish-btn-10-${item.id}`}
                        onClick={() => handleQuickReplenish(item, 10)}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-colors"
                      >
                        +10 {item.unite}
                      </button>
                      <button
                        id={`replenish-btn-50-${item.id}`}
                        onClick={() => handleQuickReplenish(item, 50)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-colors shadow-sm"
                      >
                        +50 {item.unite} (Dépôt)
                      </button>
                    </div>
                  </div>
                );
              })}

              {lowStockItems.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Excellent ! Aucun article n'est actuellement sous le seuil critique d'alerte.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 4: GESTION DU STOCK & SCANNER                         */}
        {/* ========================================================= */}
        {(activeTab === 'scanner' || activeTab === 'transactions-scan') && (() => {
          const matchedItem = scannedBarcode.trim()
            ? findEquipmentByCode(scannedBarcode)
            : null;
          const isUnknown = scannedBarcode.trim() && !matchedItem;
          
          // Filter available equipments based on user authority
          const filteredEquipmentsForScanner = localOverrides.filter(isUserAuthorizedForItem);

          // Filter session logs based on user authority (Requirement 2)
          const filteredSessionLogs = recentScannerSessionLogs.filter((log) => {
            if (!auth.user) return false;
            if (auth.user.role === 'Direction') {
              return true;
            }
            if (auth.user.role === 'Administrateur') {
              return !log.service || log.service === auth.user.service;
            }
            return log.employeUsername === auth.user.username;
          });

          return (
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
                <div>
                  <h2 className="text-md font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <Barcode className="h-5 w-5 text-red-600 animate-pulse" />
                    <span>Espace de Scan Intelligent</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Saisissez, simulez ou scannez un QR Code / Code-barres pour ajuster le stock ou enregistrer de nouveaux matériels.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {auth.user?.role === 'Direction' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                        🛡️ Directeur : Accès Global (Toutes désignations visibles)
                      </span>
                    ) : auth.user?.role === 'Administrateur' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                        🔑 Administrateur : {auth.user?.service || 'Votre Service'} uniquement
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        👤 Employé : {auth.user?.service || 'Votre Service'} uniquement
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-slate-500 uppercase">
                    <Volume2 className="h-3.5 w-3.5 text-red-600" />
                    <span>Bip audio actif</span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('stock');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-white" />
                    <span>Quitter le Scanner</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-6 w-full">
                
                {/* Visual scanner controls panel (full width) */}
                <div className="w-full space-y-4">
                  
                  {/* Laser & Camera Scanner Interface (Beautiful Blue Gradient, Full Width) */}
                  <div className="rounded-2xl border-2 border-blue-600 p-6 bg-gradient-to-b from-blue-950 to-blue-900 text-white relative overflow-hidden shadow-lg w-full">
                    {/* Glowing laser beam effect (when camera is NOT active) */}
                    {!isCameraActive && (
                      <>
                        <div className="absolute inset-x-0 h-[2px] bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.8)] opacity-50 animate-[bounce_3s_infinite]" />
                        <div className="absolute top-3 right-3 text-[9px] font-mono tracking-widest text-red-500 bg-red-950/50 px-2 py-0.5 rounded border border-red-800/40 uppercase">
                          Laser Prêt
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`} />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          {isCameraActive ? "Caméra en Direct" : "Lecteur laser ou Caméra"}
                        </span>
                      </div>
                      
                      {isCameraActive && (
                        <button
                          type="button"
                          onClick={() => setIsCameraActive(false)}
                          className="text-[9px] bg-red-950/80 hover:bg-red-900 border border-red-800/60 text-red-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-colors"
                        >
                          Fermer Caméra
                        </button>
                      )}
                    </div>

                    {/* If camera is active, render the HTML5 QR stream container */}
                    {isCameraActive ? (
                      <div className="mt-3 space-y-3">
                        {/* Camera selector if multiple cameras exist */}
                        {availableCameras.length > 1 && (
                          <div>
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Objectif actif :
                            </label>
                            <select
                              value={activeCameraId || ''}
                              onChange={(e) => setActiveCameraId(e.target.value)}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                            >
                              {availableCameras.map((device) => (
                                <option key={device.id} value={device.id}>
                                  {device.label || `Objectif ${device.id.slice(0, 5)}...`}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Scan Mode Toggle Pill */}
                        <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-xl border border-slate-850">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Ajuster la Visée :</span>
                          <div className="flex space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800/60">
                            <button
                              type="button"
                              onClick={() => setScanFullFrame(true)}
                              className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-md transition-all ${
                                scanFullFrame
                                  ? 'bg-red-700 text-white shadow-md'
                                  : 'bg-transparent text-slate-400 hover:text-white'
                              }`}
                            >
                              Tout l'Écran (Facile)
                            </button>
                            <button
                              type="button"
                              onClick={() => setScanFullFrame(false)}
                              className={`px-2.5 py-1 text-[9px] uppercase font-black rounded-md transition-all ${
                                !scanFullFrame
                                  ? 'bg-red-700 text-white shadow-md'
                                  : 'bg-transparent text-slate-400 hover:text-white'
                              }`}
                            >
                              Ligne Ciblée (Précis)
                            </button>
                          </div>
                        </div>

                        <div className="relative rounded-xl overflow-hidden border border-blue-800 bg-black aspect-video max-w-2xl w-full mx-auto shadow-inner flex items-center justify-center">
                          <div id="camera-reader-viewport" className="w-full h-full" />
                          
                          {/* Crosshair target overlay */}
                          <div className="absolute inset-0 pointer-events-none rounded-xl flex items-center justify-center">
                            {scanFullFrame ? (
                              // Big corner borders for full screen mode
                              <div className="absolute inset-4 border-2 border-dashed border-red-500/25 flex items-center justify-center">
                                {/* Ambient pulsing scan line across full screen */}
                                <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-[bounce_2.5s_infinite]" />
                                <div className="absolute top-2 left-2 text-[8px] text-red-400/80 font-mono font-bold uppercase tracking-widest bg-slate-950/80 px-1.5 py-0.5 rounded">Scan Total Actif</div>
                              </div>
                            ) : (
                              // Narrow centered horizontal targeting box
                              <div className="w-48 h-24 border border-dashed border-red-500/50 flex items-center justify-center relative">
                                <div className="absolute inset-x-0 -top-4 text-[7px] text-center text-red-400 font-bold uppercase tracking-widest">Aligner ici</div>
                                {/* Laser scanning beam line */}
                                <div className="absolute left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-[bounce_2s_infinite]" />
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[8px] text-center text-slate-400 leading-relaxed font-semibold italic">
                          Présentez le code-barres ou le QR code devant l'objectif pour scanner.<br />
                          Le bip confirmera l'identification automatique de l'article !
                        </p>
                      </div>
                    ) : (
                      /* If camera is inactive, show operator selection and manual scan trigger */
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            2. Scanner avec Caméra ou Saisie
                          </label>
                          <div className="mt-1 flex flex-col gap-2">
                            <div className="flex items-center space-x-1.5">
                              <input
                                id="scanner-barcode-input"
                                type="text"
                                value={scannedBarcode}
                                onChange={(e) => {
                                  setScannedBarcode(e.target.value);
                                  setScannerFeedback(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleBarcodeScanInput(scannedBarcode);
                                  }
                                }}
                                placeholder="Saisir la Désignation complète du matériel (ex: CLIMATISEUR...)..."
                                className="flex-1 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                              />

                              {/* Validate Typed Barcode button */}
                              <button
                                id="validate-typed-barcode-btn"
                                type="button"
                                onClick={() => handleBarcodeScanInput(scannedBarcode)}
                                className="bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded-xl text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center space-x-1 transition-all shrink-0 shadow-sm active:scale-95 cursor-pointer"
                                title="Valider la désignation saisie manuellement"
                              >
                                <Check className="h-3.5 w-3.5 text-white" />
                                <span>Valider</span>
                              </button>
                              
                              {/* Main camera scanner toggle button */}
                              <button
                                id="manual-trigger-scan-btn"
                                type="button"
                                onClick={() => setIsCameraActive(true)}
                                className="bg-red-700 hover:bg-red-600 px-3 py-2 rounded-xl text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center space-x-1 transition-all shrink-0 shadow-sm active:scale-95 cursor-pointer"
                                title="Activer la caméra pour scanner"
                              >
                                <Camera className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                                <span>Caméra</span>
                              </button>

                              {scannedBarcode && (
                                <button
                                  id="clear-barcode-btn"
                                  type="button"
                                  onClick={() => {
                                    setScannedBarcode('');
                                    setScannerFeedback(null);
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-slate-400 transition-colors shrink-0"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            
                            <p className="text-[8px] text-slate-500 font-medium leading-relaxed italic">
                              💡 <strong>Saisie manuelle :</strong> saisissez la Désignation complète du matériel, puis cliquez sur <strong>Valider</strong>.<br />
                              🎥 <strong>Scan Caméra :</strong> cliquez sur <strong>Caméra</strong> pour démarrer l'objectif (détecte la Désignation par QR ou Code-barres).
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* Rapid simulation toolkits */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Actions rapides de simulation :</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Simuler Article Répertorié</span>
                            <select
                              id="scanner-fast-simulate-select"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleBarcodeScanInput(e.target.value);
                                }
                              }}
                              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                            >
                              <option value="">-- Choisir un matériel --</option>
                              {filteredEquipmentsForScanner.map((item, idx) => (
                                <option key={`${item.id}-${item.rowIndex || idx}`} value={item.nom}>
                                  {item.nom}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col justify-end">
                            <span className="text-[8px] font-bold text-slate-400 block mb-0.5">Simuler Code Inconnu</span>
                            <button
                              id="scanner-simulate-unknown-btn"
                              type="button"
                              onClick={() => {
                                const randomCode = `QR-NEW-${Math.floor(Math.random() * 90000 + 10000)}`;
                                setScannedBarcode(randomCode);
                                setScannerFeedback({
                                  type: 'warning',
                                  text: `Code inconnu "${randomCode}" détecté ! Veuillez renseigner le formulaire de création à droite pour l'ajouter.`
                                });
                                playErrorBeep();
                              }}
                              className="w-full bg-indigo-950 hover:bg-indigo-900 text-indigo-100 text-[10px] font-black uppercase py-1.5 px-2 rounded-lg transition-colors border border-indigo-750 flex items-center justify-center space-x-1"
                            >
                              <Zap className="h-3 w-3 text-amber-400 animate-pulse" />
                              <span>Code Inconnu</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Real visual code generator for testing the camera with real images */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                          🛠️ Générateur de Codes Visuels de Test (pour caméra) :
                        </span>
                        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
                          <p className="text-[8px] text-slate-400 leading-normal">
                            Sélectionnez un code matériel pour afficher un <strong>vrai Code-barres</strong> ou <strong>QR code</strong> scannable à l'écran avec votre téléphone ou webcam !
                          </p>
                          <div className="flex gap-1.5">
                            <select
                              id="visual-code-generator-select"
                              value={generatorTargetCode}
                              onChange={(e) => setGeneratorTargetCode(e.target.value)}
                              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 text-[10px] font-semibold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              {filteredEquipmentsForScanner.map((item, idx) => (
                                <option key={`${item.id}-${item.rowIndex || idx}`} value={item.codeBarres}>
                                  {item.nom} ({item.codeBarres})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => setGeneratorTargetCode('CB000001')}
                              className="bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase"
                            >
                              Reset
                            </button>
                          </div>
                          
                          {generatorTargetCode && (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white p-3 rounded-xl w-full border border-slate-700">
                              {/* QR Code */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-900 uppercase mb-1">Vrai QR Code</span>
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(generatorTargetCode)}`}
                                  alt={`QR Code ${generatorTargetCode}`}
                                  className="w-[110px] h-[110px] object-contain border border-slate-100 p-1 bg-white rounded shadow-xs"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="text-[8px] font-mono text-slate-900 mt-1 font-bold">{generatorTargetCode}</span>
                              </div>

                              {/* Barcode */}
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-900 uppercase mb-1">Vrai Code-Barres 128</span>
                                <div className="h-[110px] flex items-center justify-center bg-white p-1 border border-slate-100 rounded shadow-xs">
                                  <img
                                    src={`https://quickchart.io/barcode?type=code128&text=${encodeURIComponent(generatorTargetCode)}&width=160&height=50&includeText=false`}
                                    alt={`Barcode ${generatorTargetCode}`}
                                    className="max-w-[150px] h-auto object-contain bg-white"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(generatorTargetCode)}&scale=1&rotate=N`;
                                    }}
                                  />
                                </div>
                                <span className="text-[8px] font-mono text-slate-900 mt-1 font-bold">{generatorTargetCode}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  {/* Feedback messaging area */}
                  {scannerFeedback && (
                    <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      scannerFeedback.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-xs' 
                        : scannerFeedback.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs'
                        : 'bg-red-50 border-red-200 text-red-800 shadow-xs'
                    }`}>
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start space-x-2.5">
                          <div className={`p-1 rounded shrink-0 ${
                            scannerFeedback.type === 'success' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : scannerFeedback.type === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {scannerFeedback.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-bold">
                              {scannerFeedback.type === 'success' ? 'Opération validée' : scannerFeedback.type === 'warning' ? 'Alerte Matériel' : 'Erreur de saisie'}
                            </p>
                            <p className="mt-0.5 font-medium">{scannerFeedback.text}</p>
                          </div>
                        </div>

                        {/* Manual Download Button for Success Transactions */}
                        {scannerFeedback.type === 'success' && lastTransactionLog && (
                          <div className="pt-2 border-t border-emerald-200/60">
                            <button
                              type="button"
                              onClick={() => generateBonPDF(lastTransactionLog)}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
                            >
                              <Download className="h-4 w-4" />
                              <span>Télécharger le Bon Officiel (PDF)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ticket de caisse virtuel (Session checkout rolling receipt) */}
                  <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 font-mono text-[11px] text-slate-800 shadow-2xs relative overflow-hidden">
                    {/* Thermal Paper zig-zag borders at top and bottom */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%)] bg-[size:6px_6px] z-10" />
                    
                    <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2 pt-1">
                      <p className="font-extrabold tracking-widest uppercase text-slate-900 text-[11px]">🛒 REÇU DE SESSION</p>
                      <p className="text-[8px] text-slate-500 font-sans mt-0.5 font-bold">TERMINAL DE CONTROLE DE STOCK</p>
                      <p className="text-[7px] text-slate-400 mt-0.5 font-sans">Session du {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>

                    {filteredSessionLogs.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 font-sans text-[11px] leading-relaxed">
                        <Barcode className="h-6 w-6 mx-auto mb-1.5 opacity-30 animate-pulse text-slate-500" />
                        Aucun article scanné dans cette session.<br />
                        <span className="text-[9px] text-slate-400 italic font-medium">Scannez un code ou utilisez l'action rapide pour commencer.</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {filteredSessionLogs.map((log, i) => (
                          <div key={log.id || i} className="flex flex-col border-b border-dotted border-slate-200 pb-1.5 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <span className="font-black text-slate-900 truncate max-w-[170px]">{log.nom}</span>
                              <span className={`font-black px-1 rounded text-[10px] ${
                                log.type === 'Entrée' || log.type === 'Création'
                                  ? 'text-emerald-700 bg-emerald-50' 
                                  : 'text-red-700 bg-red-50'
                              }`}>
                                {log.type === 'Entrée' || log.type === 'Création' ? '+' : '-'}{log.qty}
                              </span>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                              <span>Code: {log.code}</span>
                              <span className="font-bold">Marque: {log.brand || 'N/A'}</span>
                            </div>
                            {log.region && (
                              <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                                <span className="font-bold text-red-600">Dest: {log.region}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[8px] text-slate-400 font-sans mt-0.5 font-medium">
                              <span>{log.date} | {log.employe.split(' ')[0]} {log.employe.split(' ')[1] || ''}</span>
                              <button
                                type="button"
                                onClick={() => generateBonPDF(log)}
                                className="text-[8px] text-red-600 hover:text-red-700 hover:underline font-sans font-bold cursor-pointer flex items-center space-x-0.5"
                                title="Télécharger le Bon officiel"
                              >
                                <Download className="h-2.5 w-2.5 shrink-0" />
                                <span>Bon PDF</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredSessionLogs.length > 0 && (
                      <div className="border-t border-dashed border-slate-300 pt-2 mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-black text-slate-900">
                           <span>TOTAL MOUVEMENTÉ</span>
                           <span>
                             {filteredSessionLogs.reduce((acc, curr) => acc + (curr.qty || 1), 0)} unités
                           </span>
                        </div>
                        <div className="flex justify-center pt-2">
                          {/* Simulated mini barcode inside paper ticket */}
                          <div className="flex flex-col items-center opacity-70">
                            <div className="h-5 w-32 bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)]" />
                            <span className="text-[8px] font-sans text-slate-400 tracking-wider mt-0.5">ELEC-STOCK-2026</span>
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            id="clear-session-logs-btn"
                            type="button"
                            onClick={() => {
                              setRecentScannerSessionLogs([]);
                              localStorage.removeItem('elec_stock_scanner_session_logs');
                              showToast("Ticket de caisse virtuel réinitialisé !");
                            }}
                            className="text-[9px] text-red-600 hover:underline font-sans font-bold cursor-pointer"
                          >
                            Réinitialiser le ticket
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Thermal Paper zig-zag borders at bottom */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:6px_6px] z-10" />
                  </div>

                </div>

                {/* The dynamic Workspace Column (Formulaire depends on scannedBarcode match - rendered directly below the scanner zone) */}
                <div className="w-full">
                  
                  {!scannedBarcode.trim() ? (
                    <div className="h-full min-h-[350px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
                      <div className="p-3 bg-white rounded-full shadow-xs border border-slate-100 text-slate-400 animate-bounce">
                        <Barcode className="h-10 w-10" />
                      </div>
                      <h3 className="font-bold text-slate-800 mt-4">En attente de scan</h3>
                      <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                        Veuillez saisir un code-barres dans le module laser à gauche, ou utilisez le bouton "Code Inconnu" de simulation pour tester le processus de création.
                      </p>
                    </div>
                  ) : matchedItem ? (
                    // WORKSPACE CASE 1: MATCHED EQUIPMENT - MANAGE STOCK MOVE
                    <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
                      
                      {/* Matched item header badge card */}
                      <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs">
                        <div className="flex items-start space-x-3 border-b border-emerald-50 pb-3 mb-3">
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700 shrink-0">
                            <Box className="h-6 w-6 animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              INFORMATIONS RÉCUPÉRÉES DE LA BASE DE DONNÉES
                            </span>
                            <h3 className="font-black text-slate-950 mt-1 text-sm truncate">{matchedItem.nom}</h3>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[10px]">
                          <div><span className="text-slate-400 font-bold uppercase">Article N° :</span> <span className="font-bold text-slate-800">{matchedItem.id}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Désignation :</span> <span className="font-bold text-slate-800">{matchedItem.nom}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Catégorie :</span> <span className="font-bold text-slate-800">{matchedItem.categorie}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Référence :</span> <span className="font-bold text-slate-800">{matchedItem.reference}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Quantité Actuelle :</span> <span className="font-bold text-emerald-600">{matchedItem.quantite}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Qté Min :</span> <span className="font-bold text-red-600">{matchedItem.qteMin}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Marché ou Bon de commande :</span> <span className="font-bold text-slate-800">{matchedItem.marcheOuBc || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">N° :</span> <span className="font-bold text-slate-800">{matchedItem.numMarche || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Société attributaire :</span> <span className="font-bold text-slate-800">{matchedItem.societeAttributaire || matchedItem.marque || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Qté Réceptionnée :</span> <span className="font-bold text-slate-800">{matchedItem.qteReceptionnee || '0'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Date de réception :</span> <span className="font-bold text-slate-800">{matchedItem.dateReception || '—'}</span></div>
                          <div className="col-span-2 md:col-span-1"><span className="text-slate-400 font-bold uppercase">Observation de réception :</span> <span className="font-bold text-slate-800 truncate block" title={matchedItem.observationReception}>{matchedItem.observationReception || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Bénéficiaires :</span> <span className="font-bold text-slate-800">{matchedItem.beneficiaires || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Région :</span> <span className="font-bold text-slate-800">{matchedItem.region || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Qté Livrée :</span> <span className="font-bold text-slate-800">{matchedItem.qteLivree ?? matchedItem.qteEnvoyee ?? '0'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Date de livraison :</span> <span className="font-bold text-slate-800">{matchedItem.dateLivraison ?? matchedItem.dateEnvoi ?? '—'}</span></div>
                          <div className="col-span-2 md:col-span-1"><span className="text-slate-400 font-bold uppercase">Observations sur l'envoi :</span> <span className="font-bold text-slate-800 truncate block" title={matchedItem.observationsEnvoi}>{matchedItem.observationsEnvoi || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Unité :</span> <span className="font-bold text-slate-800">{matchedItem.unite}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Zone :</span> <span className="font-bold text-slate-800">{matchedItem.zone}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Emplacement :</span> <span className="font-bold text-slate-800">{matchedItem.emplacement || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">RFID :</span> <span className="font-bold text-slate-800">{matchedItem.rfid || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">CodeBarres :</span> <span className="font-bold text-slate-800">{matchedItem.codeBarres || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">État :</span> <span className="font-bold text-slate-800">{matchedItem.etat || '—'}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase">Dernière MAJ :</span> <span className="font-bold text-slate-800">{matchedItem.derniereMaj || '—'}</span></div>
                        </div>
                      </div>

                      {/* Operation Movement Form */}
                      <form onSubmit={handleScanOperation} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                          <Zap className="h-4 w-4 text-emerald-600" />
                          <span>Enregistrer un mouvement de stock</span>
                        </h4>

                        {/* In / Out Selector */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            Type de transaction *
                          </label>
                          <div className="mt-1 flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              id="scanner-type-entree-btn-workspace"
                              type="button"
                              onClick={() => setScannerOpType('Entrée')}
                              className={`flex-1 text-center py-2 rounded-lg text-xs font-extrabold uppercase transition-all ${
                                scannerOpType === 'Entrée' 
                                  ? 'bg-emerald-600 text-white shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Entrée (+)
                            </button>
                            <button
                              id="scanner-type-sortie-btn-workspace"
                              type="button"
                              onClick={() => setScannerOpType('Sortie')}
                              className={`flex-1 text-center py-2 rounded-lg text-xs font-extrabold uppercase transition-all ${
                                scannerOpType === 'Sortie' 
                                  ? 'bg-red-600 text-white shadow-sm' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Sortie (-)
                            </button>
                          </div>
                        </div>

                        {/* Marché ou Bon de commande Selection & N° (Conditional) */}
                        {scannerOpType === 'Entrée' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                                Marché ou Bon de commande d'entrée *
                              </label>
                              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setScannerMarcheOuBc('Marché')}
                                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                    scannerMarcheOuBc === 'Marché'
                                      ? 'bg-slate-700 text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  Marché
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setScannerMarcheOuBc('Bon de commande')}
                                  className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                    scannerMarcheOuBc === 'Bon de commande'
                                      ? 'bg-slate-700 text-white shadow-sm'
                                      : 'text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  BC
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                N° d'entrée *
                              </label>
                              <input
                                type="text"
                                required
                                value={scannerNumMarche}
                                onChange={(e) => setScannerNumMarche(e.target.value)}
                                placeholder="Ex. N° 12/2026"
                                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Message *
                            </label>
                            <input
                              type="text"
                              required
                              value={scannerNumMarcheSortie}
                              onChange={(e) => setScannerNumMarcheSortie(e.target.value)}
                              placeholder="Ex. Message N° 15/2026"
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        )}

                        {/* Region Destinataire - Only shown for Sortie */}
                        {scannerOpType === 'Sortie' && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Région *
                            </label>
                            <select
                              required
                              value={scannerRegion}
                              onChange={(e) => setScannerRegion(e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            >
                              <option value="">Sélectionnez la région de destination</option>
                              {REGIONS_MAROC.map((region) => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Société attributaire - Only shown for Entrée */}
                        {scannerOpType === 'Entrée' && (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Société attributaire *
                              </label>
                              <input
                                type="text"
                                required
                                value={scannerSocieteAttributaire}
                                onChange={(e) => setScannerSocieteAttributaire(e.target.value)}
                                placeholder="Ex. Schneider Electric, Legrand Maroc, etc."
                                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Nom et prénom du livreur
                              </label>
                              <input
                                type="text"
                                value={scannerLivreurNom}
                                onChange={(e) => setScannerLivreurNom(e.target.value)}
                                placeholder="Nom de la personne qui a livré la commande"
                                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </>
                        )}

                        {/* Nom du destinataire / Bénéficiaires - Only shown for Sortie */}
                        {scannerOpType === 'Sortie' && (
                          <>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Bénéficiaires *
                              </label>
                              <input
                                type="text"
                                required
                                value={scannerDestinataire}
                                onChange={(e) => setScannerDestinataire(e.target.value)}
                                placeholder="Ex. Unité de secours de Rabat, Chef d'Unité Y, etc."
                                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  Agent de sortie
                                </label>
                                <input
                                  type="text"
                                  value={scannerAgentSortieNom}
                                  onChange={(e) => setScannerAgentSortieNom(e.target.value)}
                                  placeholder="Personne effectuant la sortie"
                                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  Matricule véhicule
                                </label>
                                <input
                                  type="text"
                                  value={scannerMatriculeVehicule}
                                  onChange={(e) => setScannerMatriculeVehicule(e.target.value)}
                                  placeholder="Ex. 12345-A-6"
                                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                Conducteur
                              </label>
                              <input
                                type="text"
                                value={scannerConducteurNom}
                                onChange={(e) => setScannerConducteurNom(e.target.value)}
                                placeholder="Nom et prénom du conducteur"
                                className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                              />
                            </div>
                          </>
                        )}

                        {/* Quantity and Commentary Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Quantité {scannerOpType === 'Entrée' ? 'Réceptionnée' : 'Livrée'} *
                            </label>
                            <div className="mt-1 flex items-center space-x-1.5">
                              <button
                                id="qty-decrement-btn"
                                type="button"
                                onClick={() => setScannerQty(prev => Math.max(1, prev - 1))}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-sm w-9 h-9 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              >
                                -
                              </button>
                              <input
                                id="scanner-qty-input-workspace"
                                type="number"
                                min="1"
                                required
                                value={scannerQty}
                                onChange={(e) => setScannerQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 text-center font-bold text-xs border border-slate-200 rounded-lg h-9 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                id="qty-increment-btn"
                                type="button"
                                onClick={() => setScannerQty(prev => prev + 1)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-sm w-9 h-9 rounded-lg transition-colors flex items-center justify-center shrink-0"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Observations {scannerOpType === 'Entrée' ? 'de réception' : "sur l'envoi"}
                            </label>
                            <input
                              id="scanner-notes-input-workspace"
                              type="text"
                              required
                              value={scannerNotes}
                              onChange={(e) => setScannerNotes(e.target.value)}
                              placeholder={scannerOpType === 'Entrée' ? "Ex. Conforme, lot A1" : "Ex. Envoi urgent, par camion"}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 h-9 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Date Transaction Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              Date {scannerOpType === 'Entrée' ? 'de réception' : 'de livraison'} *
                            </label>
                            <input
                              type="date"
                              required
                              value={scannerDate}
                              onChange={(e) => setScannerDate(e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 h-9 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="pt-2 flex items-center justify-between gap-3">
                          <button
                            id="scanner-reset-btn"
                            type="button"
                            onClick={() => {
                              setScannedBarcode('');
                              setScannerFeedback(null);
                            }}
                            className="text-slate-500 hover:text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                          >
                            Annuler / Nouveau scan
                          </button>

                          <button
                            id="scanner-save-btn-workspace"
                            type="submit"
                            className={`flex-1 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm ${
                              scannerOpType === 'Entrée' 
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10' 
                                : 'bg-red-600 hover:bg-red-700 shadow-red-500/10'
                            }`}
                          >
                            Valider l'opération ({scannerOpType})
                          </button>
                        </div>
                      </form>

                    </div>
                  ) : (
                    // WORKSPACE CASE 2: UNRECOGNIZED CODE - CREATE MATERIAL DIRECTLY ON SCAN!
                    <div className="bg-slate-50/50 border border-amber-200 rounded-2xl p-5 md:p-6 space-y-5 animate-fadeIn">
                      
                      {/* Unknown item header card */}
                      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 shadow-2xs">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                          <AlertTriangle className="h-6 w-6 animate-bounce" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                            ⚠️ Code Inconnu Détecté !
                          </h3>
                          <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                            Le code <span className="font-mono font-bold text-indigo-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">{scannedBarcode}</span> n'existe pas encore dans la base de données.
                          </p>
                          {isAdmin ? (
                            <p className="text-[10px] text-slate-500 mt-1">
                              Remplissez ce formulaire pour créer automatiquement la fiche matériel et l'enregistrer dans l'inventaire.
                            </p>
                          ) : (
                            <p className="text-[10px] text-red-500 font-bold mt-1">
                              Vous n'avez pas l'autorisation de créer de nouveaux matériels. Veuillez contacter un administrateur.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Creation Form */}
                      {isAdmin && (
                        <form onSubmit={handleCreateNewEquipmentFromScan} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
                          <Box className="h-4 w-4 text-indigo-600" />
                          <span>Enregistrer un nouveau matériel</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* 1. Designation / Nom */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Désignation du matériel *
                            </label>
                            <input
                              id="new-scan-nom-input"
                              type="text"
                              required
                              value={newScanNom}
                              onChange={(e) => setNewScanNom(e.target.value)}
                              placeholder="Ex. Disjoncteur différentiel 32A"
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* 2. Marque */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Marque du matériel *
                            </label>
                            <input
                              id="new-scan-marque-input"
                              type="text"
                              required
                              value={newScanMarque}
                              onChange={(e) => setNewScanMarque(e.target.value)}
                              placeholder="Ex. Schneider, Legrand"
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          {/* 3. Catégorie */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Catégorie *
                            </label>
                            <select
                              id="new-scan-category-select"
                              value={newScanCategorie}
                              onChange={(e) => setNewScanCategorie(e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {allCategories.filter(cat => cat !== 'Tous').map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 4. Quantité Initiale */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Quantité initiale *
                            </label>
                            <input
                              id="new-scan-qty-input"
                              type="number"
                              min="0"
                              required
                              value={newScanQuantite}
                              onChange={(e) => setNewScanQuantite(Math.max(0, parseInt(e.target.value) || 0))}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* 5. Seuil de Sécurité */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Seuil d'alerte min *
                            </label>
                            <input
                              id="new-scan-min-qty-input"
                              type="number"
                              min="1"
                              required
                              value={newScanQteMin}
                              onChange={(e) => setNewScanQteMin(Math.max(1, parseInt(e.target.value) || 1))}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          {/* 6. Unité */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Unité de mesure
                            </label>
                            <input
                              id="new-scan-unite-input"
                              type="text"
                              required
                              value={newScanUnite}
                              onChange={(e) => setNewScanUnite(e.target.value)}
                              placeholder="Pièce, m, lot, kg"
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* 7. État */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              État matériel
                            </label>
                            <select
                              id="new-scan-etat-select"
                              value={newScanEtat}
                              onChange={(e) => setNewScanEtat(e.target.value)}
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="Neuf">Neuf (Emballage scellé)</option>
                              <option value="Excellent">Excellent</option>
                              <option value="Bon">Bon état</option>
                              <option value="Usé">Usé</option>
                              <option value="Défectueux">Défectueux</option>
                            </select>
                          </div>

                          {/* 8. RFID Tag (Optionnel) */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Tag RFID (Optionnel)
                            </label>
                            <input
                              id="new-scan-rfid-input"
                              type="text"
                              value={newScanRfid}
                              onChange={(e) => setNewScanRfid(e.target.value)}
                              placeholder="Ex. RFID0099"
                              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                        </div>

                        {/* Expéditeur */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            Expéditeur *
                          </label>
                          <input
                            type="text"
                            required
                            value={newScanFournisseur}
                            onChange={(e) => setNewScanFournisseur(e.target.value)}
                            placeholder="Ex. Fournisseur Schneider Electric, Magasin de Réserve Centrale, etc."
                            className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>

                        {/* Warehousing coordinates mapping matching the 3D Map perfectly */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-3.5">
                          <span className="text-[10px] uppercase font-black tracking-wider text-indigo-800 block flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 animate-bounce" />
                            <span>Emplacement dans le dépôt (Visualisation 3D)</span>
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            
                            {/* Depot select */}
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Dépôt / Stockage</span>
                              <select
                                id="new-scan-depot-select"
                                value={newScanDepotId}
                                onChange={(e) => setNewScanDepotId(e.target.value)}
                                className="w-full rounded-lg bg-white border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                              >
                                <option value="1000g">Stock 1000 m² (gauche)</option>
                                <option value="1000d">Stock 1000 m² (droite)</option>
                                <option value="400">Stock 400 m²</option>
                                <option value="200">Stock 200 m²</option>
                              </select>
                            </div>

                            {/* Zone select (A - J) */}
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Allée / Zone</span>
                              <select
                                id="new-scan-zone-select"
                                value={newScanZone}
                                onChange={(e) => setNewScanZone(e.target.value)}
                                className="w-full rounded-lg bg-white border border-slate-200 px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                              >
                                {['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G', 'Zone H', 'Zone I', 'Zone J'].map(z => (
                                  <option key={z} value={z}>{z}</option>
                                ))}
                              </select>
                            </div>

                            {/* Precise Coordinate */}
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Coordonnée d'Étagère</span>
                              <input
                                id="new-scan-emplacement-input"
                                type="text"
                                required
                                value={newScanEmplacement}
                                onChange={(e) => setNewScanEmplacement(e.target.value)}
                                placeholder="Ex. A01, B12"
                                className="w-full rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-mono font-bold text-slate-800 focus:outline-none"
                              />
                            </div>

                          </div>
                        </div>

                        {/* Creation actions */}
                        <div className="pt-2 flex items-center justify-between gap-3">
                          <button
                            id="new-scan-cancel-btn"
                            type="button"
                            onClick={() => {
                              setScannedBarcode('');
                              setScannerFeedback(null);
                            }}
                            className="text-slate-500 hover:text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                          >
                            Réinitialiser
                          </button>

                          <button
                            id="new-scan-save-btn"
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-500/15"
                          >
                            Créer et enregistrer le matériel
                          </button>
                        </div>
                      </form>
                      )}

                    </div>
                  )}

                </div>

              </div>

            </section>
          );
        })()}

        {activeTab === 'fiches-techniques' && (
          <FichesTechniquesTab
            user={auth.user}
            equipments={localOverrides}
            onNavigate={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showToast={showToast}
          />
        )}

        {activeTab === '3d' && auth.user && (
          <Warehouse3D
            user={auth.user}
            equipments={localOverrides}
            onUpdateEquipment={(updatedItem) => {
              const updated = localOverrides.map(item => item.id === updatedItem.id ? updatedItem : item);
              saveLocalList(updated);
            }}
            onSync={(action, item) => syncToAppsScript(action, item)}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'recap' && (
          <StockRecap 
            equipments={localOverrides} 
            movements={historyLogs} 
          />
        )}

        {activeTab === 'urgence' && (
          <UrgenceTab
            equipments={localOverrides}
            onUpdateEquipment={(updatedItem) => {
              const updated = localOverrides.map(item => item.id === updatedItem.id ? updatedItem : item);
              saveLocalList(updated);
            }}
          />
        )}

        {(activeTab === 'messages' || activeTab === 'communication-messages') && auth.user && (
          <InternalMessages 
            currentUser={auth.user} 
          />
        )}

        {activeTab === 'users' && auth.user && (
          <UserManagementView
            currentUser={auth.user}
            users={fetchedLogins}
            isLoading={isLoginsLoading}
            onRefresh={reloadLogins}
            onSaveUser={async (userData, isNew) => {
              const action = isNew ? 'addUser' : 'updateUser';
              const success = await syncUserToAppsScript(action, userData);
              if (success) {
                reloadLogins();
              }
              return success;
            }}
            onDeleteUser={async (user) => {
              const success = await syncUserToAppsScript('deleteUser', user);
              if (success) {
                reloadLogins();
              }
              return success;
            }}
            showToast={showToast}
          />
        )}

        {/* ========================================================= */}
        {/* TAB 11: PARAMÈTRES (SETTINGS)                             */}
        {/* ========================================================= */}
        
        {/* ========================================================= */}
        {/* NEW TABS PLACEHOLDERS */}
        {activeTab === 'transactions-entrees' && auth.user && (
          <TransactionsEntreesTab 
            user={auth.user} 
            equipments={localOverrides} 
            onUpdateEquipment={(updatedEq) => {
              const newList = localOverrides.map(e => e.id === updatedEq.id ? updatedEq : e);
              saveLocalList(newList);
              syncToAppsScript('update', updatedEq);
            }} 
            onAddEquipment={(newEq) => {
              const newList = [newEq, ...localOverrides];
              saveLocalList(newList);
              syncToAppsScript('add', newEq);
            }} 
            onAddMovement={(newMvt) => {
              saveHistoryLogs([newMvt, ...historyLogs]);
            }} 
            showToast={showToast} 
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsNavCollapsed(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'transactions-sorties' && auth.user && (
          <TransactionsSortiesTab 
            user={auth.user} 
            equipments={localOverrides} 
            onUpdateEquipment={(updatedEq) => {
              const newList = localOverrides.map(e => e.id === updatedEq.id ? updatedEq : e);
              saveLocalList(newList);
              syncToAppsScript('update', updatedEq);
            }} 
            onAddMovement={(newMvt) => {
              saveHistoryLogs([newMvt, ...historyLogs]);
            }} 
            showToast={showToast} 
            onNavigate={(tab) => {
              setActiveTab(tab);
              setIsNavCollapsed(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'finance-module' && auth.user && (
          <FinanceModule currentUser={auth.user} equipments={localOverrides} />
        )}
        
        {activeTab === 'couts-valorisation-module' && auth.user && (
          <CoutsValorisationModule 
            equipments={localOverrides}
            currentUser={auth.user}
            onUpdateEquipment={(updatedEq) => {
              const newList = localOverrides.map(e => e.id === updatedEq.id ? updatedEq : e);
              saveLocalList(newList);
              syncToAppsScript('update', updatedEq);
            }}
          />
        )}

        {activeTab === 'docs-entrees' && auth.user && (
          <DocsEntreesTab 
            historyLogs={historyLogs}
            user={auth.user}
            onDeleteLog={(logId) => {
              const log = historyLogs.find(l => l.id === logId);
              const updatedLogs = historyLogs.filter(l => l.id !== logId);
              setHistoryLogs(updatedLogs);
              if (selectedDbId) {
                localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(updatedLogs));
              } else {
                localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(updatedLogs));
              }
              if (log) {
                syncDeleteMovementToAppsScript(log);
              }
            }}
            siteName={siteName}
            depotLocation={workspaceType === 'magasin' ? 'Magasin Régional RSK' : 'Khémisset, Rabat-Salé-Kénitra'}
            workspaceType={workspaceType}
            showToast={showToast}
          />
        )}

        {activeTab === 'docs-sorties' && auth.user && (
          <DocsSortiesTab 
            historyLogs={historyLogs}
            user={auth.user}
            onDeleteLog={(logId) => {
              const log = historyLogs.find(l => l.id === logId);
              const updatedLogs = historyLogs.filter(l => l.id !== logId);
              setHistoryLogs(updatedLogs);
              if (selectedDbId) {
                localStorage.setItem(`database_${selectedDbId}_history`, JSON.stringify(updatedLogs));
              } else {
                localStorage.setItem('elec_stock_history_logs_v2', JSON.stringify(updatedLogs));
              }
              if (log) {
                syncDeleteMovementToAppsScript(log);
              }
            }}
            siteName={siteName}
            depotLocation={workspaceType === 'magasin' ? 'Magasin Régional RSK' : 'Khémisset, Rabat-Salé-Kénitra'}
            workspaceType={workspaceType}
            showToast={showToast}
          />
        )}

        {activeTab === 'planification-agenda' && auth.user && (
          <AgendaTab historyLogs={historyLogs} />
        )}

{activeTab === 'settings' && auth.user && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-6">
            <div>
              <h2 className="text-md font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Settings className="h-5 w-5 text-red-600" />
                <span>Paramètres de l'application</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Personnalisez l'apparence et l'affichage selon vos préférences.
              </p>
            </div>

            <div className="space-y-6 max-w-2xl">
              {/* Apparence */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Apparence</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${appSettings.theme === 'light' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50'}`}>
                    <input type="radio" name="theme" value="light" className="sr-only" checked={appSettings.theme === 'light'} onChange={() => updateSettings({ theme: 'light' })} />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span className="block text-sm font-black text-slate-900">Mode Clair</span>
                        <span className="block text-xs text-slate-500 font-medium">Thème par défaut</span>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${appSettings.theme === 'light' ? 'border-red-500 bg-red-600 text-white' : 'border-slate-300'}`}>
                        {appSettings.theme === 'light' && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${appSettings.theme === 'dark' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50'}`}>
                    <input type="radio" name="theme" value="dark" className="sr-only" checked={appSettings.theme === 'dark'} onChange={() => updateSettings({ theme: 'dark' })} />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-col">
                        <span className="block text-sm font-black text-slate-900">Mode Sombre</span>
                        <span className="block text-xs text-slate-500 font-medium">Confort visuel de nuit</span>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${appSettings.theme === 'dark' ? 'border-red-500 bg-red-600 text-white' : 'border-slate-300'}`}>
                        {appSettings.theme === 'dark' && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Fond de l'écran d'accueil */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Fond de l'écran d'accueil</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => updateSettings({ bgImage: null })} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs">
                      Fond par défaut
                    </button>
                    <label className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span>Importer une photo</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              updateSettings({ bgImage: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  </div>
                  {appSettings.bgImage && (
                    <div className="mt-2 relative w-full h-40 sm:h-64 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                      <img src={appSettings.bgImage} alt="Fond d'écran personnalisé" className="w-full h-full object-cover custom-bg-layer" />
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-[10px] font-bold backdrop-blur-sm">Aperçu</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Taille du texte */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Taille et affichage du texte</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'small', label: 'Petite' },
                    { id: 'normal', label: 'Normale' },
                    { id: 'large', label: 'Grande' },
                    { id: 'very-large', label: 'Très Grande' },
                  ].map((size) => (
                    <label key={size.id} className={`relative flex flex-col items-center cursor-pointer rounded-xl border p-3 shadow-xs transition-all text-center ${appSettings.textSize === size.id ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/50'}`}>
                      <input type="radio" name="textSize" value={size.id} className="sr-only" checked={appSettings.textSize === size.id} onChange={() => updateSettings({ textSize: size.id })} />
                      <span className="block text-xs font-black text-slate-900 mb-2">{size.label}</span>
                      <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${appSettings.textSize === size.id ? 'border-red-500 bg-red-600 text-white' : 'border-slate-300'}`}>
                        {appSettings.textSize === size.id && <Check className="h-2.5 w-2.5" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Reset button */}
              <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                 <button onClick={() => updateSettings({ theme: 'light', textSize: 'normal', bgImage: null })} className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors cursor-pointer">
                    Rétablir les paramètres par défaut
                 </button>
              </div>

            </div>
          </section>
        )}

        {/* Navigation Séquentielle Étape par Étape */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl mt-6">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Navigation Séquentielle</span>
            <span className="text-xs font-bold text-slate-300">
              Onglet actif : {currentTabIdx + 1} / {visibleTabs.length} ({
                activeTab === 'stock' ? 'Stock Complet' :
                activeTab === 'history' ? 'Historique' :
                activeTab === 'alerts' ? 'Stock Faible' :
                activeTab === 'scanner' ? 'Scanner RFID / Barcode' :
                activeTab === 'verification' ? 'Vérification IA' :
                activeTab === 'transactions-entrees' ? 'Entrées de Stock' :
                activeTab === 'transactions-sorties' ? 'Sorties de Stock' :
                activeTab === '3d' ? 'Visualisation 3D' :
                activeTab === 'recap' ? 'Tableau Récapitulatif' :
                activeTab === 'urgence' ? 'Préparation d\'Urgence' :
                activeTab === 'messages' ? 'Messagerie Interne' :
                activeTab === 'users' ? 'Gestion des Utilisateurs' : 'Accueil'
              })
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {currentTabIdx > 0 && (
              <button
                onClick={() => {
                  const prevTab = visibleTabs[currentTabIdx - 1];
                  setActiveTab(prevTab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-700 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>
            )}

            {currentTabIdx < visibleTabs.length - 1 ? (
              <button
                onClick={() => {
                  const nextTab = visibleTabs[currentTabIdx + 1];
                  setActiveTab(nextTab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <span>Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedDbId(null);
                  localStorage.removeItem('gis_dgpc_selected_db');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/15 cursor-pointer"
              >
                <span>Terminer / Bases</span>
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        auth={auth}
      />

      {/* Input Form Modal (Add / Edit equipment) */}
      <EquipmentModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveEquipment}
        equipment={editingItem}
        nextSuggestedId={String(Math.max(...localOverrides.map(item => parseInt(item.id) || 0), 0) + 1)}
      />

      {/* Corporate Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          if (confirmModal.action) {
            confirmModal.action();
          }
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
      />

      {/* Article History Modal */}
      <AnimatePresence>
        {historyModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryModalItem(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                    <History className="h-5 w-5 text-red-600 shrink-0" />
                    <span>Historique de l'Article</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Suivi complet et registre des mouvements pour : <span className="font-bold text-slate-800">{historyModalItem.nom}</span> (ID: <span className="font-mono font-bold">{historyModalItem.id}</span>)
                  </p>
                </div>
                <button
                  onClick={() => setHistoryModalItem(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-[11px] mt-4 shrink-0">
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Catégorie</span>
                  <span className="font-bold text-slate-700">{historyModalItem.categorie}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Référence</span>
                  <span className="font-mono font-bold text-slate-700">{historyModalItem.reference || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Société</span>
                  <span className="font-bold text-slate-700">{historyModalItem.societeAttributaire || historyModalItem.marque || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-mono text-[9px]">Quantité Actuelle</span>
                  <span className="font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">{historyModalItem.quantite} {historyModalItem.unite || 'Pièce'}(s)</span>
                </div>
              </div>

              {/* Timeline list of movements */}
              <div className="flex-1 overflow-y-auto py-4 min-h-[250px] space-y-3 pr-1">
                {(() => {
                  const filteredMovements = historyLogs.filter(m => m.equipmentId === historyModalItem.id);
                  if (filteredMovements.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 font-semibold text-xs">
                        Aucun mouvement de stock enregistré pour cet article.
                      </div>
                    );
                  }
                  return (
                    <div className="relative border-l border-slate-100 pl-4 ml-3 space-y-5">
                      {filteredMovements.map((mv, idx) => {
                        const isEntree = mv.type === 'Entrée';
                        const isCreation = mv.type === 'Création';
                        return (
                          <div key={mv.id || idx} className="relative">
                            {/* Dot */}
                            <div className={`absolute -left-[24.5px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                              isEntree ? 'bg-emerald-500' : isCreation ? 'bg-indigo-500' : 'bg-red-500'
                            }`} />
                            
                            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3 rounded-xl transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-slate-400">{mv.date}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isEntree ? 'bg-emerald-100 text-emerald-800' : isCreation ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {mv.type}
                                </span>
                              </div>
                              
                              <div className="mt-1 flex items-baseline justify-between">
                                <p className="text-xs font-semibold text-slate-700">
                                  Action par : <span className="text-slate-900 font-bold">{mv.employe}</span>
                                </p>
                                <span className={`text-xs font-black ${isEntree || isCreation ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {isEntree || isCreation ? '+' : '-'}{mv.quantite} pièce(s)
                                </span>
                              </div>

                              {mv.expediteur && mv.type === 'Entrée' && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  <span className="font-bold text-slate-600">Expéditeur :</span> {mv.expediteur}
                                </p>
                              )}

                              {mv.beneficiaire && mv.type === 'Sortie' && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                  <span className="font-bold text-slate-600">Bénéficiaire :</span> {mv.beneficiaire} {mv.region ? `(${mv.region})` : ''}
                                </p>
                              )}

                              {mv.notes && (
                                <p className="text-[10px] text-slate-500 italic mt-1 bg-white border border-slate-100 p-1.5 rounded-md">
                                  <span className="font-bold text-slate-600 not-italic">Notes/Motif :</span> {mv.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Footer / Buttons */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  onClick={() => {
                    const filteredMovements = historyLogs.filter(m => m.equipmentId === historyModalItem.id);
                    if (filteredMovements.length === 0) {
                      showToast("Aucun mouvement à exporter pour cet article.");
                      return;
                    }

                    // Build 26 columns headers matching user specifications
                    const headers = [
                      "Article N°", "Désignation", "Catégorie", "Référence", "Quantité Actuelle", "Qté Min",
                      "Marché ou Bon de commande d'entrée", "N° d'entrée", "Société attributaire", "Qté Réceptionnée", 
                      "Date de réception", "Observation de réception", "Message", "N° de sortie",
                      "Bénéficiaires", "Région", "Qté Livrée", "Date de livraison", "Observations sur l'envoi", "Unité", "Zone", 
                      "Emplacement", "RFID", "CodeBarres", "État", "Dernière MAJ", ...customColumns
                    ];

                    const rows = filteredMovements.map(mv => {
                      const isEntree = mv.type === 'Entrée' || mv.type === 'Création';
                      const fields = [
                        historyModalItem.id,
                        historyModalItem.nom,
                        historyModalItem.categorie,
                        historyModalItem.reference || '—',
                        historyModalItem.quantite,
                        historyModalItem.qteMin,
                        historyModalItem.marcheOuBc || historyModalItem.marche || '—',
                        historyModalItem.numMarche || '—',
                        historyModalItem.societeAttributaire || historyModalItem.marque || '—',
                        isEntree ? mv.quantite : 0,
                        isEntree ? mv.date : '—',
                        isEntree ? (mv.notes || '—') : '—',
                        !isEntree ? (mv.marcheOuBcSortie || '—') : '—',
                        !isEntree ? (mv.numMarcheSortie || '—') : '—',
                        !isEntree ? (mv.beneficiaire || '—') : '—',
                        !isEntree ? (mv.region || '—') : '—',
                        !isEntree ? mv.quantite : 0,
                        !isEntree ? mv.date : '—',
                        !isEntree ? (mv.notes || '—') : '—',
                        historyModalItem.unite || 'Pièce',
                        historyModalItem.zone,
                        historyModalItem.emplacement || '—',
                        historyModalItem.rfid || '—',
                        historyModalItem.codeBarres || '—',
                        historyModalItem.etat,
                        mv.date
                      ];
                      return fields.map(f => `"${String(f).replace(/"/g, '""')}"`).join(";");
                    });

                    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.setAttribute("download", `Historique_${historyModalItem.id}_${historyModalItem.nom.replace(/\s+/g, '_')}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Historique de l'article téléchargé avec succès !");
                  }}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger l'historique (CSV)</span>
                </button>
                <button
                  onClick={() => setHistoryModalItem(null)}
                  className="w-full sm:w-auto text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Movement Card Modal */}
      <AnimatePresence>
        {selectedMovement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMovement(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded font-bold">
                      {selectedMovement.id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                      selectedMovement.type === 'Entrée' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedMovement.type}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mt-2">
                    Fiche Mouvement de Stock
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {/* Product Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Désignation du Matériel</span>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {selectedMovement.equipmentNom}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-1">
                    ID Matériel : {selectedMovement.equipmentId}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Date & Heure</span>
                    <span className="text-xs font-bold text-slate-700">{selectedMovement.date}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Quantité</span>
                    <span className={`text-sm font-black ${selectedMovement.type === 'Entrée' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {selectedMovement.type === 'Entrée' ? '+' : '-'}{selectedMovement.quantite} pièces
                    </span>
                  </div>
                </div>

                {/* Actor Section */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Opérateur</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedMovement.employe}</span>
                    </span>
                  </div>
                  {selectedMovement.service && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Service de Rattachement</span>
                      <span className="text-xs font-bold text-slate-700">{selectedMovement.service}</span>
                    </div>
                  )}
                </div>

                {/* Specific Fields depending on type */}
                {selectedMovement.type === 'Entrée' ? (
                  <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50 space-y-3">
                    <h4 className="text-[10px] uppercase font-black tracking-wider text-emerald-800">Détails d'Entrée / Réception</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Marché ou BC</span>
                        <span className="text-xs font-bold text-slate-700">{selectedMovement.marcheOuBc || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">N° de Marché/BC</span>
                        <span className="text-xs font-bold font-mono text-slate-700">{selectedMovement.numMarche || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Société attributaire</span>
                        <span className="text-xs font-bold text-slate-700">{selectedMovement.societeAttributaire || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Expéditeur</span>
                        <span className="text-xs font-bold text-slate-700">{selectedMovement.expediteur || '—'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50/30 p-4 rounded-xl border border-red-100/50 space-y-3">
                    <h4 className="text-[10px] uppercase font-black tracking-wider text-red-800">Détails de Sortie / Expédition</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bénéficiaire</span>
                        <span className="text-xs font-bold text-slate-700">{selectedMovement.beneficiaire || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Région Destinataire</span>
                        <span className="text-xs font-bold text-red-600 font-semibold">{selectedMovement.region || selectedMovement.regionDestinataire || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes / Motif */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Motif / Notes</span>
                  <p className="text-xs text-slate-600 italic">
                    {selectedMovement.notes ? selectedMovement.notes : "Aucun motif ou note n'a été spécifié pour ce mouvement."}
                  </p>
                </div>

                {selectedMovement.observations && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-1">Observations supplémentaires</span>
                    <p className="text-xs text-slate-600">{selectedMovement.observations}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-2 shrink-0">
                <button
                  onClick={() => handleDeleteMovement(selectedMovement)}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 font-extrabold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer ce mouvement</span>
                </button>
                <button
                  onClick={() => setSelectedMovement(null)}
                  className="w-full sm:w-auto text-slate-500 hover:text-slate-700 hover:bg-slate-100 font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: Personnalisation des Intitulés des Colonnes --- */}
      <AnimatePresence>
        {isColumnCustomizerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-red-100 text-red-700">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Personnaliser les intitulés des colonnes</h3>
                    <p className="text-xs text-slate-500">Modifiez le nom des colonnes pour adapter l'affichage de l'application à votre structure de données.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsColumnCustomizerOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  💡 Les modifications apportées seront automatiquement appliquées dans le tableau de gestion de stock, les formulaires de scan, l'historique et les exports PDF/Excel.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'id', label: 'Article N° (Clé unique)' },
                    { key: 'nom', label: 'Désignation de l\'article' },
                    { key: 'categorie', label: 'Catégorie' },
                    { key: 'reference', label: 'Référence' },
                    { key: 'quantite', label: 'Quantité Actuelle' },
                    { key: 'qteMin', label: 'Qté Minimale de Sécurité' },
                    { key: 'marcheOuBc', label: 'Marché ou BC d\'entrée' },
                    { key: 'numMarche', label: 'N° d\'entrée' },
                    { key: 'societeAttributaire', label: 'Société attributaire / Fournisseur' },
                    { key: 'qteReceptionnee', label: 'Qté Réceptionnée' },
                    { key: 'dateReception', label: 'Date de réception' },
                    { key: 'observationReception', label: 'Observation de réception' },
                    { key: 'marcheOuBcSortie', label: 'Message de sortie' },
                    { key: 'numMarcheSortie', label: 'N° de sortie' },
                    { key: 'beneficiaires', label: 'Bénéficiaires' },
                    { key: 'region', label: 'Région' },
                    { key: 'qteLivree', label: 'Qté Livrée' },
                    { key: 'dateLivraison', label: 'Date de livraison' },
                    { key: 'observationsEnvoi', label: 'Observations sur l\'envoi' },
                    { key: 'unite', label: 'Unité de mesure' },
                    { key: 'zone', label: 'Zone de stockage' },
                    { key: 'emplacement', label: 'Emplacement / Allée' },
                    { key: 'rfid', label: 'Code RFID' },
                    { key: 'codeBarres', label: 'Code-Barres' },
                    { key: 'etat', label: 'État du matériel' },
                    { key: 'derniereMaj', label: 'Dernière mise à jour' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={columnHeaders[key] || ''}
                        placeholder={DEFAULT_COLUMN_HEADERS[key] || label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setColumnHeaders(prev => ({
                            ...prev,
                            [key]: val
                          }));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setColumnHeaders({});
                    localStorage.removeItem('dgpc_custom_column_headers');
                    showToast("Intitulés réinitialisés aux valeurs par défaut.");
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Rétablir les valeurs par défaut
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsColumnCustomizerOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveColumnHeaders(columnHeaders);
                      setIsColumnCustomizerOpen(false);
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all cursor-pointer"
                  >
                    Enregistrer les intitulés
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: Ajouter une colonne personnalisée --- */}
      <AnimatePresence>
        {isAddColumnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
            >
              <form onSubmit={handleAddCustomColumn}>
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-800">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Ajouter une colonne</h3>
                      <p className="text-xs text-slate-500">Ajoutez une nouvelle colonne au tableau de stock.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddColumnModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5">
                      Nom de la nouvelle colonne *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex. Numéro de série, Garantie, etc."
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {customColumns.length > 0 && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Colonnes personnalisées existantes ({customColumns.length})
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {customColumns.map((col, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700"
                          >
                            <span>{col}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = customColumns.filter((_, i) => i !== idx);
                                setCustomColumns(updated);
                                localStorage.setItem('elec_stock_custom_cols', JSON.stringify(updated));
                                showToast(`Colonne "${col}" supprimée.`);
                              }}
                              className="text-slate-400 hover:text-red-600 ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddColumnModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                  >
                    Ajouter la colonne
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </main>
      </div>
    </div>
  </div>
  );
}
