export type SiteType = 'Magasin' | 'Dépôt';
export type SiteStatus = 'Opérationnel' | 'En cours de construction' | 'Non opérationnel' | 'Site de transition';

export interface StorageZoneConfig {
  id: string;
  code: string;
  name: string;
  category: string;
  color: string;
  description?: string;
  rackCount?: number;
  capacityPalettes?: number;
}

export interface SiteTechnicalSheet {
  id: string;
  region: string;
  province: string;
  type: SiteType;
  designation: string;
  sigle: string;
  etat: SiteStatus;
  organisme: string;
  superficie: string;
  capaciteStockage: string;
  adresse: string;
  coordonneesGps: string;
  zonesStockage: string;
  nombreRayonnages: string;
  responsable: string;
  contact: string;
  dateMiseEnService: string;
  informationsTechniques: string;
  documentsAssocies: string;
  photosPlan: string;
  observations: string;
  has3DModel?: boolean;
  defaultZones?: StorageZoneConfig[];
}

export const OFFICIAL_SITES_SHEETS: SiteTechnicalSheet[] = [
  {
    id: 'depot_sidi_allal_bahraoui',
    region: 'Rabat-Salé-Kénitra (CR04)',
    province: 'Khémisset',
    type: 'Dépôt',
    designation: "Dépôt Logistique d'Assistance aux Sinistres",
    sigle: 'DLAS Sidi Allal Bahraoui',
    etat: 'En cours de construction',
    organisme: 'Protection Civile',
    superficie: '1 000 m²',
    capaciteStockage: '3 500 m³ / 180 palettes standardisées',
    adresse: 'Zone Logistique Stratégique, Route Nationale N6, Sidi Allal El Bahraoui',
    coordonneesGps: '33.9928° N, 6.5514° W',
    zonesStockage: 'Zone Nord (Secours), Zone Sud (Énergie), Zone Est (Médical), Zone Ouest (Mobilier & Crise), Zone Centrale (Quai & Transit)',
    nombreRayonnages: '24 rayonnages industriels lourds (hauteur 6m, 3 niveaux)',
    responsable: 'Commandant Régional Logistique RSK',
    contact: '+212 5 37 XX XX XX / dlas.bahraoui@protectioncivile.ma',
    dateMiseEnService: 'Prévue T4-2026',
    informationsTechniques: 'Structure métallique renforcée, dalle industrielle traitée quartz 5T/m², système RIA & sprinklers, vidéosurveillance périmétrique, éclairage LED haute puissance, 2 quais de déchargement niveleurs.',
    documentsAssocies: 'Plan de masse architectural, Cahier des charges APS/APD, PV de réception gros œuvre, Autorisation d\'exploitation.',
    photosPlan: 'Plan d\'implantation 1 000 m² - Zones A/B/C/D - Baies de rayonnages 1 à 24.',
    observations: 'Pôle logistique central de la région Rabat-Salé-Kénitra dédié au stockage massif et au déploiement rapide en cas de sinistres majeurs ou intempéries.',
    has3DModel: true,
    defaultZones: [
      { id: 'zone-nord', code: 'Zone Nord', name: 'Zone Nord - Tentes & Secours d\'urgence', category: 'Secours', color: '#10B981', rackCount: 6, capacityPalettes: 48 },
      { id: 'zone-sud', code: 'Zone Sud', name: 'Zone Sud - Générateurs & Énergie', category: 'Énergie', color: '#F59E0B', rackCount: 6, capacityPalettes: 40 },
      { id: 'zone-est', code: 'Zone Est', name: 'Zone Est - Médical & Assistance vitale', category: 'Médical', color: '#EF4444', rackCount: 4, capacityPalettes: 32 },
      { id: 'zone-ouest', code: 'Zone Ouest', name: 'Zone Ouest - Mobilier & Matériel de crise', category: 'Mobilier', color: '#6366F1', rackCount: 4, capacityPalettes: 30 },
      { id: 'zone-quai', code: 'Zone Quai', name: 'Zone Quai - Réception & Expédition', category: 'Transit', color: '#64748B', rackCount: 4, capacityPalettes: 30 }
    ]
  },
  {
    id: 'magasin_kenitra',
    region: 'Rabat-Salé-Kénitra (CR04)',
    province: 'Kénitra',
    type: 'Magasin',
    designation: "Magasin Logistique d'Assistance aux Sinistres",
    sigle: 'MLAS Kénitra',
    etat: 'Opérationnel',
    organisme: 'Protection Civile',
    superficie: '450 m²',
    capaciteStockage: '1 200 m³ / 65 palettes',
    adresse: 'Centre de Secours Principal, Avenue Hassan II, Kénitra',
    coordonneesGps: '34.2610° N, 6.5802° W',
    zonesStockage: 'Rayonnages A1 à A8 (Dotation intervention), B1 à B6 (Tenues & EPI), C1 à C4 (Outillage & Réserve)',
    nombreRayonnages: '14 travées mi-lourdes à accès direct',
    responsable: 'Capitaine Chef de Magasin Kénitra',
    contact: '+212 5 37 37 XX XX / mlas.kenitra@protectioncivile.ma',
    dateMiseEnService: '15/03/2019',
    informationsTechniques: 'Magasin avec comptoir de distribution doté de lecteurs code-barres et RFID, sécurisation biométrique, système d\'alarme intrusion et incendie.',
    documentsAssocies: 'Fiche d\'inventaire initial, Registre de conformité sécurité, Plans des travées.',
    photosPlan: 'Schéma de distribution et comptoir de délivrance des dotations individuelles.',
    observations: 'Magasin régional assurant la dotation courante et le réapprovisionnement immédiat des unités d\'intervention provinciales de Kénitra.',
    has3DModel: false
  },
  {
    id: 'magasin_dgpc_siege',
    region: 'Rabat-Salé-Kénitra (CR04)',
    province: 'Rabat',
    type: 'Magasin',
    designation: 'DGPC Provisoire (Siège / Magasin Central de Transition)',
    sigle: 'DGPC Provisoire',
    etat: 'Opérationnel',
    organisme: 'Protection Civile',
    superficie: '380 m²',
    capaciteStockage: '900 m³ / 50 palettes',
    adresse: 'Direction Générale de la Protection Civile, Quartier Administratif, Rabat',
    coordonneesGps: '33.9716° N, 6.8498° W',
    zonesStockage: 'Zone R1 (Télécoms & Transmissions), Zone R2 (Matériel informatique & commandement), Zone R3 (Réserve de crise)',
    nombreRayonnages: '12 travées métalliques modulaires',
    responsable: 'Lieutenant-Colonel Chef de Service Gestion du Patrimoine',
    contact: '+212 5 37 77 XX XX / patrimoine.siege@protectioncivile.ma',
    dateMiseEnService: '01/06/2023 (Provisoire)',
    informationsTechniques: 'Salle climatisée pour équipements sensibles, contrôle d\'accès sécurisé par badge, alimentation sans coupure (UPS) pour baies télécoms.',
    documentsAssocies: 'Décision d\'affectation temporaire, Inventaire des matériels sensibles, PV d\'audit trimestriel.',
    photosPlan: 'Plan d\'aménagement provisoire et zone sécurisée télécoms.',
    observations: 'Site de transition assurant la gestion et la dotation des équipements spécifiques et informatiques du siège en attente du déploiement définitif.',
    has3DModel: false
  }
];

export const SITES_STORAGE_KEY = 'gis_dgpc_sites_technical_sheets_v2';

export function getStoredSitesSheets(): SiteTechnicalSheet[] {
  try {
    const raw = localStorage.getItem(SITES_STORAGE_KEY);
    if (!raw) return OFFICIAL_SITES_SHEETS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure official sites always exist
      const merged = [...parsed];
      OFFICIAL_SITES_SHEETS.forEach(official => {
        const idx = merged.findIndex(s => s.id === official.id);
        if (idx === -1) {
          merged.push(official);
        }
      });
      return merged;
    }
    return OFFICIAL_SITES_SHEETS;
  } catch (e) {
    console.error('Error loading stored sites sheets:', e);
    return OFFICIAL_SITES_SHEETS;
  }
}

export function saveStoredSitesSheets(sheets: SiteTechnicalSheet[]) {
  try {
    localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sheets));
  } catch (e) {
    console.error('Error saving sites sheets:', e);
  }
}
