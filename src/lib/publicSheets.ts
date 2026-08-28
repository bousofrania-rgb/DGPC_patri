import { Equipment, User } from '../types';

/**
 * Parses a standard CSV string handling comma/semicolon and double quotes.
 * Properly respects newline characters inside quoted fields.
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let cols: string[] = [];
  let col = '';
  let insideQuote = false;
  
  // First, let's detect the separator from the first non-empty line
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
        // Double quote inside a quoted value represents a single escaped quote
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

/**
 * Parse CSV rows into Equipment array mapping:
 * ID,Nom,Categorie,Marque,Reference,Quantite,Qte Min,Unite,Zone,Emplacement,RFID,CodeBarres,Etat,Derniere MAJ
 */
export function parseCSVToEquipment(text: string): Equipment[] {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map(h => {
    if (!h) return '';
    return h.replace(/^"|"$/g, '').trim();
  });
  console.log("CSV Headers:", headers);

  const items: Equipment[] = [];

  const clean = (val: string | undefined) => {
    if (!val) return '';
    return val.replace(/^"|"$/g, '').trim();
  };

  const normHeader = (h: string) => {
    return h
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9#°]/g, ""); // Keep alphanumeric plus '#' and '°'
  };

  const cleanedHeaders = headers.map(h => normHeader(h));
  
  const findColIndex = (exactNames: string[], containsNames: string[], excludedTerms: string[] = []): number => {
    // 1. Try exact match
    for (const name of exactNames) {
      const target = normHeader(name);
      const idx = cleanedHeaders.indexOf(target);
      if (idx !== -1) return idx;
    }
    
    // 2. Try partial match
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

  // Define column mappings with fallback to original positions if headers aren't detected
  const colIndices = {
    id: findColIndex(['Article N°', 'Article Numéro', 'Article No', 'ID'], ['articlen', 'id', 'codemat', 'matricule'], ['nummarche', 'numeromarche', 'marche', 'bc', 'rfid']),
    nom: findColIndex(['Désignation', 'Designation', 'Désignations', 'Designations', 'Article', 'Matériel', 'Materiel', 'Nom'], ['designation', 'nom', 'materiel', 'matériel'], ['num', 'n°', 'no', 'reference', 'ref', 'rfid']),
    categorie: findColIndex(['Catégorie', 'Categorie'], ['categor', 'type']),
    reference: findColIndex(['Référence', 'Reference'], ['ref', 'model']),
    quantite: findColIndex(['Quantité Actuelle', 'Quantite Actuelle', 'Quantité', 'Quantite', 'Stock Actuel'], ['quantite', 'qte', 'stock'], ['min', 'seuil', 'reception', 'livr', 'envoi', 'envoy']),
    qteMin: findColIndex(['Qté Min', 'Qte Min', 'Seuil Alerte', 'Seuil'], ['min', 'seuil']),
    marcheOuBc: findColIndex(['Marché ou Bon de commande d\'entrée', 'Marché ou Bon de commande d\'entree', 'Marché ou Bon de commande', 'Marche ou Bon de commande', 'Marché/BC', 'Marche/BC'], ['marche', 'bondecomm', 'bc'], ['n°', 'num', 'societe', 'attributaire', 'sortie']),
    numMarche: findColIndex(['N° d\'entrée', 'No d\'entree', 'N° d\'entree', 'Numéro d\'entrée', 'Numero d\'entree'], ['n° d\'entree', 'n° d\'entrée', 'numero d\'entree'], ['article', 'date', 'reception', 'livraison', 'envoi', 'teleph', 'tel', 'sortie']),
    societeAttributaire: findColIndex(['Société attributaire', 'Societe attributaire', 'Société', 'Societe', 'Fournisseur'], ['attributaire', 'fournisseur', 'marque', 'constructeur', 'societe'], ['marche', 'bc']),
    qteReceptionnee: findColIndex(['Qté Réceptionnée', 'Qte Receptionnee', 'Qté Récept', 'Qte Recept'], ['reception', 'recept'], ['date', 'observation']),
    dateReception: findColIndex(['Date de réception', 'Date de reception', 'Date Réception', 'Date Reception'], ['date', 'reception', 'recu'], ['livr', 'envoi', 'maj', 'crea']),
    observationReception: findColIndex(['Observation de réception', 'Observation de reception', 'Observations de réception', 'Observations de reception'], ['observation', 'obs', 'remarque', 'note'], ['envoi', 'livr']),
    marcheOuBcSortie: findColIndex(['Message', 'Marché ou Bon de commande de sortie', 'Marché/BC de sortie', 'Marche/BC de sortie'], ['marche', 'bc'], ['entrée', 'entree', 'reception']),
    numMarcheSortie: findColIndex(['N° de sortie', 'No de sortie', 'Numéro de sortie'], ['n°', 'num'], ['article', 'entrée', 'entree', 'reception']),
    beneficiaires: findColIndex(['Bénéficiaires', 'Beneficiaires', 'Bénéficiaire', 'Beneficiaire', 'Destinataire', 'Destinataires'], ['beneficiaire', 'destinataire', 'affectation', 'client']),
    region: findColIndex(['Région', 'Region'], ['region', 'secteur']),
    qteLivree: findColIndex(['Qté Livrée', 'Qte Livree', 'Qté Envoyée', 'Qte Envoyee'], ['livr', 'envoy', 'sort'], ['date', 'observation']),
    dateLivraison: findColIndex(['Date de livraison', 'Date de livraison', 'Date d\'envoi', 'Date d\'envoi', 'Date envoi'], ['date', 'livr', 'envoi'], ['reception', 'maj', 'crea']),
    observationsEnvoi: findColIndex(['Observations sur l\'envoi', 'Observations sur lenvoi', 'Observation sur l\'envoi', 'Observation sur lenvoi'], ['observation', 'obs', 'remarque', 'note'], ['reception']),
    unite: findColIndex(['Unité', 'Unite'], ['unite', 'cond', 'mesure']),
    zone: findColIndex(['Zone', 'Secteur', 'Zone de stockage'], ['zone', 'secteur', 'depot', 'magasin']),
    emplacement: findColIndex(['Emplacement', 'Position', 'Etagère', 'Etagere', 'Allée', 'Allee'], ['emplacement', 'position', 'case', 'etagere', 'allee']),
    rfid: findColIndex(['RFID', 'Tag RFID', 'rfid'], ['rfid', 'tag']),
    codeBarres: findColIndex(['CodeBarres', 'Code-barres', 'Code à barres', 'CodeBarre', 'Barcode'], ['barre', 'code', 'barcode'], ['id', 'article']),
    etat: findColIndex(['État', 'Etat', 'Statut'], ['etat', 'statut', 'condition']),
    derniereMaj: findColIndex(['Dernière MAJ', 'Derniere MAJ', 'Date MAJ', 'Date de mise à jour', 'Dernière modification'], ['maj', 'miseajou', 'modifi', 'date'], ['reception', 'livr', 'envoi']),
    
    // Fallbacks
    marque: findColIndex(['Société attributaire', 'Societe attributaire', 'Société', 'Societe', 'Fournisseur'], ['attributaire', 'fournisseur', 'marque', 'constructeur', 'societe'], ['marche', 'bc']),
    qteEnvoyee: findColIndex(['Qté Livrée', 'Qte Livree', 'Qté Envoyée', 'Qte Envoyee'], ['livr', 'envoy', 'sort'], ['date', 'observation']),
    dateEnvoi: findColIndex(['Date de livraison', 'Date de livraison', 'Date d\'envoi', 'Date d\'envoi', 'Date envoi'], ['date', 'livr', 'envoi'], ['reception', 'maj', 'crea']),
    observations: findColIndex(['Observations sur l\'envoi', 'Observations sur lenvoi', 'Observation sur l\'envoi', 'Observation sur lenvoi'], ['observation', 'obs', 'remarque', 'note'], ['reception'])
  };

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 2) continue;

    const getValue = (idx: number, fallback: string = "") => {
      if (idx === -1 || idx >= cols.length) return fallback;
      return cols[idx] !== undefined ? clean(cols[idx]) : fallback;
    };

    const getNumber = (idx: number, fallback: number = 0) => {
      if (idx === -1 || idx >= cols.length) return fallback;
      const cleanVal = clean(cols[idx]).replace(/[^\d-]/g, '');
      const parsed = parseInt(cleanVal, 10);
      return isNaN(parsed) ? fallback : parsed;
    };

    const id = getValue(colIndices.id, `EQ-${i}`);
    const nom = getValue(colIndices.nom);
    const categorie = getValue(colIndices.categorie, "Général");
    const reference = getValue(colIndices.reference, "—");
    const quantite = getNumber(colIndices.quantite, 0);
    const qteMin = getNumber(colIndices.qteMin, 5);
    const marcheOuBc = getValue(colIndices.marcheOuBc, "—");
    const numMarche = getValue(colIndices.numMarche, "—");
    const societeAttributaire = getValue(colIndices.societeAttributaire, "—");
    const qteReceptionnee = getNumber(colIndices.qteReceptionnee, 0);
    const dateReception = getValue(colIndices.dateReception, "—");
    const observationReception = getValue(colIndices.observationReception, "—");
    const marcheOuBcSortie = getValue(colIndices.marcheOuBcSortie, "—");
    const numMarcheSortie = getValue(colIndices.numMarcheSortie, "—");
    const beneficiaires = getValue(colIndices.beneficiaires, "—");
    const region = getValue(colIndices.region, "—");
    const qteLivree = getNumber(colIndices.qteLivree, 0);
    const dateLivraison = getValue(colIndices.dateLivraison, "—");
    const observationsEnvoi = getValue(colIndices.observationsEnvoi, "—");
    const unite = getValue(colIndices.unite, "Pièce");
    const zone = getValue(colIndices.zone, "Zone A");
    const emplacement = getValue(colIndices.emplacement, "—");
    const rfid = getValue(colIndices.rfid, "—");
    const codeBarres = getValue(colIndices.codeBarres, "—");
    const etat = getValue(colIndices.etat, "Bon");
    const derniereMaj = getValue(colIndices.derniereMaj, new Date().toLocaleDateString('fr-FR'));

    // Map custom columns that were not detected in our standard set
    const extraColumns: { [key: string]: string } = {};
    const knownIndices = Object.values(colIndices);
    headers.forEach((header, index) => {
      if (header && !knownIndices.includes(index) && index < cols.length) {
        extraColumns[header] = clean(cols[index]);
      }
    });

    if (nom) {
      items.push({
        id,
        nom,
        categorie,
        reference,
        quantite,
        qteMin,
        marcheOuBc,
        numMarche,
        societeAttributaire,
        qteReceptionnee,
        dateReception,
        observationReception,
        marcheOuBcSortie,
        numMarcheSortie,
        beneficiaires,
        region,
        qteLivree,
        dateLivraison,
        observationsEnvoi,
        unite,
        zone,
        emplacement,
        rfid,
        codeBarres,
        etat,
        derniereMaj,
        rowIndex: i + 1,
        extraColumns,
        
        // Backward-compatibility properties
        marque: societeAttributaire,
        qteEnvoyee: qteLivree,
        dateEnvoi: dateLivraison
      });
    }
  }

  return items;
}

/**
 * Fetch public inventory from Google Sheet export URL without needing OAuth
 */
export async function fetchPublicInventory(
  spreadsheetId: string, 
  sheetName?: string, 
  appsScriptUrl?: string
): Promise<Equipment[]> {
  const params = new URLSearchParams();
  params.append("spreadsheetId", spreadsheetId);
  if (sheetName) {
    params.append("sheetName", sheetName);
  }
  if (appsScriptUrl) {
    params.append("appsScriptUrl", appsScriptUrl);
  }
  
  const url = `/api/fetch-sheet?${params.toString()}`;
  
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error(
      `Impossible d'accéder au fichier (Status: ${res.status}). Assurez-vous que le document Google Sheet est partagé en mode public ("Tous les utilisateurs disposant du lien" peuvent lire).`
    );
  }
  
  if (appsScriptUrl) {
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error(`Erreur lors de la récupération des données via Apps Script.`);
    }
    return json.data.map((item: any, i: number) => {
      const getVal = (exactNames: string[], fallback = "—") => {
        for (const name of exactNames) {
          if (item[name] !== undefined && item[name] !== null) {
            return String(item[name]).trim();
          }
        }
        return fallback;
      };

      const getNum = (exactNames: string[], fallback = 0) => {
        const valStr = getVal(exactNames, "");
        if (!valStr) return fallback;
        const cleanVal = valStr.replace(/[^\d-]/g, '');
        const parsed = parseInt(cleanVal, 10);
        return isNaN(parsed) ? fallback : parsed;
      };

      const id = getVal(['Article N°', 'Article No', 'ID', 'id'], `EQ-${i}`);
      const nom = getVal(['Désignation', 'Designation', 'Désignations', 'Designations', 'Article', 'Matériel', 'Materiel', 'Nom'], '');
      const categorie = getVal(['Catégorie', 'Categorie', 'type'], 'Général');
      const reference = getVal(['Référence', 'Reference', 'modèle', 'ref'], '—');
      const quantite = getNum(['Quantité Actuelle', 'Quantite Actuelle', 'Quantité', 'Quantite', 'Stock Actuel'], 0);
      const qteMin = getNum(['Qté Min', 'Qte Min', 'Seuil Alerte', 'Seuil'], 5);
      
      const marcheOuBc = getVal(['Marché ou Bon de commande d\'entrée', 'Marché ou Bon de commande d\'entree', 'Marché ou Bon de commande', 'Marche ou Bon de commande', 'Marché/BC', 'Marche/BC'], '—');
      const numMarche = getVal(['N° d\'entrée', 'No d\'entree', 'N° d\'entree', 'N°', 'N', 'Numéro', 'Numero'], '—');
      const societeAttributaire = getVal(['Société attributaire', 'Societe attributaire', 'Société', 'Societe', 'Fournisseur'], '—');
      const qteReceptionnee = getNum(['Qté Réceptionnée', 'Qte Receptionnée', 'Qté Réceptionnee', 'Qte Receptionnee', 'Qté Récept', 'Qte Recept'], 0);
      const dateReception = getVal(['Date de réception', 'Date de reception', 'Date Réception', 'Date Reception'], '—');
      const observationReception = getVal(['Observation de réception', 'Observation de reception', 'Observations de réception', 'Observations de reception'], '—');
      
      const marcheOuBcSortie = getVal(['Message', 'Marché ou Bon de commande de sortie', 'Marché/BC de sortie', 'Marche/BC de sortie'], '—');
      const numMarcheSortie = getVal(['N° de sortie', 'No de sortie', 'Numéro de sortie'], '—');
      const beneficiaires = getVal(['Bénéficiaires', 'Beneficiaires', 'Bénéficiaire', 'Beneficiaire', 'Destinataire', 'Destinataires'], '—');
      const region = getVal(['Région', 'Region'], '—');
      const qteLivree = getNum(['Qté Livrée', 'Qte Livrée', 'Qté Livree', 'Qte Livree', 'Qté Envoyée', 'Qte Envoyee'], 0);
      const dateLivraison = getVal(['Date de livraison', 'Date de livraison', 'Date d\'envoi', 'Date d\'envoi', 'Date envoi', 'Date Livraison'], '—');
      const observationsEnvoi = getVal(['Observations sur l\'envoi', 'Observations sur lenvoi', 'Observation sur l\'envoi', 'Observation sur lenvoi'], '—');
      
      const unite = getVal(['Unité', 'Unite'], 'Pièce');
      const zone = getVal(['Zone', 'Secteur', 'Zone de stockage'], 'Zone A');
      const emplacement = getVal(['Emplacement', 'Position', 'Etagère', 'Etagere', 'Allée', 'Allee'], '—');
      const rfid = getVal(['RFID', 'Tag RFID', 'rfid'], '—');
      const codeBarres = getVal(['CodeBarres', 'Code-barres', 'Code à barres', 'CodeBarre', 'Barcode'], '—');
      const etat = getVal(['État', 'Etat', 'Statut'], 'Bon');
      const derniereMaj = getVal(['Dernière MAJ', 'Derniere MAJ', 'Date MAJ', 'Date de mise à jour', 'Dernière modification'], new Date().toLocaleDateString('fr-FR'));

      return {
        id,
        nom,
        categorie,
        reference,
        quantite,
        qteMin,
        marcheOuBc,
        numMarche,
        societeAttributaire,
        qteReceptionnee,
        dateReception,
        observationReception,
        marcheOuBcSortie,
        numMarcheSortie,
        beneficiaires,
        region,
        qteLivree,
        dateLivraison,
        observationsEnvoi,
        unite,
        zone,
        emplacement,
        rfid,
        codeBarres,
        etat,
        derniereMaj,
        rowIndex: i + 1,
        extraColumns: {},
        marque: societeAttributaire,
        qteEnvoyee: qteLivree,
        dateEnvoi: dateLivraison
      };
    });
  }

  const text = await res.text();
  
  if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('Sign in - Google Accounts')) {
    throw new Error(
      `Impossible d'accéder au fichier. Assurez-vous que le document Google Sheet est partagé en mode public ("Tous les utilisateurs disposant du lien" peuvent lire).`
    );
  }
  return parseCSVToEquipment(text);
}

export const DEFAULT_SYSTEM_USERS: User[] = [
  {
    id: 'u-dir-1',
    username: 'Colonel Ahmed Mansouri',
    fullName: 'Colonel Ahmed Mansouri',
    password: '123456',
    role: 'Direction',
    grade: 'Colonel',
    fonction: 'Directeur Régional de la Protection Civile RSK',
    poste: 'Commandant Régional',
    service: 'Commandement Régional RSK',
    matricule: 'DGPC-001',
    telephone: '+212 661 11 22 33',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: 'a.mansouri@protectioncivile.ma',
    createdAt: '01/01/2026'
  },
  {
    id: 'u-dir-2',
    username: 'Lieutenant-colonel Karim Alami',
    fullName: 'Lieutenant-colonel Karim Alami',
    password: '234567',
    role: 'Direction',
    grade: 'Lieutenant-colonel (Lt. Colonel)',
    fonction: 'Chef de la Division Logistique & Patrimoine',
    poste: 'Adjoint au Commandant Régional',
    service: 'Service Patrimoine',
    matricule: 'DGPC-012',
    telephone: '+212 661 22 33 44',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: 'k.alami@protectioncivile.ma',
    createdAt: '01/01/2026'
  },
  {
    id: 'u-admin-1',
    username: 'Commandant Mohamed El Amrani',
    fullName: 'Commandant Mohamed El Amrani',
    password: '345678',
    role: 'Administrateur',
    grade: 'Commandant',
    fonction: 'Chef de Service Régional Patrimoine',
    poste: 'Responsable Approvisionnement & Dépôt',
    service: 'Service Patrimoine',
    matricule: 'DGPC-045',
    telephone: '+212 661 33 44 55',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: 'm.elamrani@protectioncivile.ma',
    createdAt: '01/01/2026'
  },
  {
    id: 'u-admin-2',
    username: 'Capitaine Rachid Bennani',
    fullName: 'Capitaine Rachid Bennani',
    password: '654321',
    role: 'Administrateur',
    grade: 'Capitaine',
    fonction: 'Gestionnaire de Stock & Magasinier Régional',
    poste: 'Responsable Magasin Kénitra',
    service: 'Magasin Régional de Kénitra',
    matricule: 'DGPC-108',
    telephone: '+212 661 44 55 66',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Kénitra',
    email: 'r.bennani@protectioncivile.ma',
    createdAt: '01/01/2026'
  },
  {
    id: 'u-emp-1',
    username: 'Adjudant-chef Tariq Drissi',
    fullName: 'Adjudant-chef Tariq Drissi',
    password: '112233',
    role: 'Employé',
    grade: 'Adjudant-chef',
    fonction: 'Agent Logistique & Inventaire',
    poste: 'Gestionnaire des Mouvements Dépôt',
    service: 'Dépôt de Sidi Allal Bahraoui',
    matricule: 'DGPC-320',
    telephone: '+212 661 55 66 77',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Sidi Allal Bahraoui',
    email: 't.drissi@protectioncivile.ma',
    createdAt: '01/01/2026'
  },
  {
    id: 'u-emp-2',
    username: 'Sergent Youssef Chraibi',
    fullName: 'Sergent Youssef Chraibi',
    password: '998877',
    role: 'Employé',
    grade: 'Sergent',
    fonction: 'Opérateur Scanner & Réception',
    poste: 'Agent de Distribution & Dotations',
    service: 'Service Patrimoine',
    matricule: 'DGPC-512',
    telephone: '+212 661 77 88 99',
    statut: 'Actif',
    region: 'Rabat-Salé-Kénitra',
    ville: 'Rabat',
    email: 'y.chraibi@protectioncivile.ma',
    createdAt: '01/01/2026'
  }
];

function getStoredOrFallbackUsers(): User[] {
  try {
    const cached = localStorage.getItem('gis_dgpc_cached_logins');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SYSTEM_USERS;
}

/**
 * Fetch users from the 'Login' sheet of Google Sheets
 */
export async function fetchLoginUsers(spreadsheetId: string, appsScriptUrl?: string): Promise<User[]> {
  try {
    const params = new URLSearchParams();
    params.append("spreadsheetId", spreadsheetId);
    params.append("sheetName", "Login");
    if (appsScriptUrl) {
      params.append("appsScriptUrl", appsScriptUrl);
    }

    const res = await fetch(`/api/fetch-sheet?${params.toString()}`);
    if (!res.ok) {
      return getStoredOrFallbackUsers();
    }

    if (appsScriptUrl) {
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        return getStoredOrFallbackUsers();
      }
      const users = json.data.map((item: any, i: number) => {
        const rawGrade = item['Grade'] || '';
        const rawName = item['Nom et Prénom'] || item['Nom complet'] || item['FullName'] || '';
        const rawFonction = item['Fonction'] || item['Role'] || item['Rôle'] || '';
        const service = item['Service de rattachement'] || item['Service'] || '';
        const password = String(item['Mot de passe'] || item['Password'] || '');
        const region = item['Région'] || item['Region'] || '';
        const ville = item['Ville'] || item['City'] || '';
        const email = item['Email'] || '';

        const isGenericName = rawName === 'M.' || rawName === 'Mme' || rawName === '-' || rawName === '';
        const displayFullName = isGenericName ? rawFonction : rawName;
        const displayGrade = rawGrade !== '-' && rawGrade !== '' ? rawGrade : '';

        let role: 'Direction' | 'Administrateur' | 'Employé' = 'Employé';
        const lowerFonction = String(rawFonction).toLowerCase();
        
        if (lowerFonction.includes('directeur') || lowerFonction.includes('direction')) {
          role = 'Direction';
        } else if (lowerFonction.includes('chef') || lowerFonction.includes('administrateur') || lowerFonction.includes('admin')) {
          role = 'Administrateur';
        }

        return {
          id: `u-${i}`,
          username: displayFullName,
          password: password,
          role,
          fullName: displayFullName,
          service: service,
          region: region,
          ville: ville,
          grade: displayGrade,
          fonction: rawFonction,
          email: email,
          createdAt: new Date().toLocaleDateString('fr-FR')
        };
      }).filter((u: any) => u.fullName);

      if (users.length > 0) {
        try {
          localStorage.setItem('gis_dgpc_cached_logins', JSON.stringify(users));
        } catch (e) {}
        return users;
      }
      return getStoredOrFallbackUsers();
    }

    const text = await res.text();
    if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('Sign in - Google Accounts')) {
      return getStoredOrFallbackUsers();
    }
    const rows = parseCSV(text);
    if (rows.length <= 1) {
      return getStoredOrFallbackUsers();
    }

    const users: User[] = [];
    const headers = rows[0].map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
    
    let gradeIdx = headers.findIndex(h => h.includes('grade'));
    let nameIdx = headers.findIndex(h => h.includes('nom et pr') || h.includes('nom complet'));
    let funcIdx = headers.findIndex(h => h.includes('fonction') || h.includes('rôle') || h.includes('role'));
    let serviceIdx = headers.findIndex(h => h.includes('service'));
    let passwordIdx = headers.findIndex(h => h.includes('mot de passe') || h.includes('code'));
    let regionIdx = headers.findIndex(h => h.includes('région') || h.includes('region'));
    let cityIdx = headers.findIndex(h => h.includes('ville') || h.includes('city'));
    let emailIdx = headers.findIndex(h => h.includes('email') || h.includes('courriel'));

    if (gradeIdx === -1) gradeIdx = 0;
    if (nameIdx === -1) nameIdx = 1;
    if (funcIdx === -1) funcIdx = 2;
    if (serviceIdx === -1) serviceIdx = 3;
    if (passwordIdx === -1) passwordIdx = 4;
    if (regionIdx === -1) regionIdx = 5;
    if (cityIdx === -1) cityIdx = 6;
    if (emailIdx === -1) emailIdx = 7;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length < 3) continue;

      const clean = (val: string | undefined) => {
        if (!val) return '';
        return val.replace(/^"|"$/g, '').trim();
      };

      const rawGrade = clean(cols[gradeIdx]);
      const rawName = clean(cols[nameIdx]);
      const rawFonction = clean(cols[funcIdx]);
      const service = clean(cols[serviceIdx]);
      const password = clean(cols[passwordIdx]);
      const region = clean(cols[regionIdx]);
      const ville = clean(cols[cityIdx]);
      const email = clean(cols[emailIdx]);

      const isGenericName = rawName === 'M.' || rawName === 'Mme' || rawName === '-' || rawName === '';
      const displayFullName = isGenericName ? rawFonction : rawName;
      const displayGrade = rawGrade !== '-' && rawGrade !== '' ? rawGrade : '';
      const displayFonction = rawFonction;

      let role: 'Direction' | 'Administrateur' | 'Employé' = 'Employé';
      const lowerFonction = displayFonction.toLowerCase();
      
      if (lowerFonction.includes('directeur') || lowerFonction.includes('direction')) {
        role = 'Direction';
      } else if (lowerFonction.includes('chef') || lowerFonction.includes('administrateur') || lowerFonction.includes('admin')) {
        role = 'Administrateur';
      }

      if (displayFullName) {
        users.push({
          id: `u-${i}`,
          username: displayFullName,
          password: password,
          role,
          fullName: displayFullName,
          service: service,
          region: region,
          ville: ville,
          grade: displayGrade,
          fonction: displayFonction,
          email: email,
          createdAt: new Date().toLocaleDateString('fr-FR')
        });
      }
    }

    if (users.length > 0) {
      try {
        localStorage.setItem('gis_dgpc_cached_logins', JSON.stringify(users));
      } catch (e) {}
      return users;
    }
    return getStoredOrFallbackUsers();
  } catch (error) {
    return getStoredOrFallbackUsers();
  }
}

/**
 * Fetch stock movements from the 'Historique' sheet of Google Sheets
 */
export async function fetchHistoryLogs(spreadsheetId: string, appsScriptUrl?: string, sheetName = "Historique"): Promise<any[]> {
  const params = new URLSearchParams();
  params.append("spreadsheetId", spreadsheetId);
  params.append("sheetName", sheetName);
  if (appsScriptUrl) {
    params.append("appsScriptUrl", appsScriptUrl);
  }

  const res = await fetch(`/api/fetch-sheet?${params.toString()}`);
  if (!res.ok) {
    return [];
  }

  if (appsScriptUrl) {
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      return [];
    }
    return json.data.map((item: any, i: number) => ({
      id: item['ID Mouvement'] || item['id'] || `M-${i}`,
      date: item['Date'] || item['date'] || '',
      type: (item['Type'] || item['type'] || 'Création') as 'Entrée' | 'Sortie' | 'Création',
      equipmentId: item['Article N°'] || item['id_article'] || item['equipmentId'] || '',
      equipmentNom: item['Désignation'] || item['Designation'] || item['equipmentNom'] || '',
      quantite: parseInt(item['Quantité'] || item['Quantite'] || item['quantite'] || '0', 10) || 0,
      employe: item['Employé'] || item['Employe'] || item['employe'] || '',
      notes: item['Notes'] || item['notes'] || '',
      expediteur: item['Expéditeur'] || item['Expediteur'] || '',
      beneficiaire: item['Bénéficiaire'] || item['Beneficiaire'] || '',
      region: item['Région'] || item['Region'] || '',
      observations: item['Observations'] || item['observations'] || ''
    }));
  }

  const text = await res.text();
  if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('Sign in - Google Accounts')) {
    return [];
  }
  const rows = parseCSV(text);
  if (rows.length <= 1) return [];

  const movements: any[] = [];
  // ID Mouvement, Date, Type, Article N°, Désignation, Quantité, Employé, Notes, Expéditeur, Bénéficiaire, Région, Observations
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 6) continue;

    const clean = (val: string | undefined) => {
      if (!val) return '';
      return val.replace(/^"|"$/g, '').trim();
    };

    movements.push({
      id: clean(cols[0]),
      date: clean(cols[1]),
      type: clean(cols[2]) as 'Entrée' | 'Sortie' | 'Création',
      equipmentId: clean(cols[3]),
      equipmentNom: clean(cols[4]),
      quantite: parseInt(clean(cols[5]), 10) || 0,
      employe: clean(cols[6]),
      notes: clean(cols[7]),
      expediteur: clean(cols[8]),
      beneficiaire: clean(cols[9]),
      region: clean(cols[10]),
      observations: clean(cols[11]),
    });
  }
  return movements;
}

