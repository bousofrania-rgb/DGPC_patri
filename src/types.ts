export interface Fournisseur {
  id: string;
  nom: string;
  identifiantFiscal: string;
  registreCommerce: string;
  adresse: string;
  telephone: string;
  email: string;
  contactNom: string;
  observations: string;
  createdAt: string;
  statut: 'Actif' | 'Inactif' | 'Bloqué';
}

export interface ArticleCommande {
  id: string;
  marcheBcId: string;
  designation: string;
  reference: string;
  quantiteCommandee: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  quantiteReceptionnee: number;
  observations: string;
}

export interface MarcheBC {
  id: string;
  numero: string;
  type: 'Marché' | 'Bon de Commande';
  fournisseurId: string;
  fournisseurNom: string; // denormalized for quick access
  dateCommande: string;
  delaiLivraisonJours: number;
  dateLivraisonPrevue: string;
  statut: 'En cours' | 'Livré Partiellement' | 'Soldé' | 'Annulé';
  montantEngageTTC: number;
  montantConsommeTTC: number;
  budgetImputation: string; // ex: Budget 2026
  observations: string;
}

export interface Budget {
  id: string;
  annee: number;
  libelle: string;
  montantGlobalTTC: number;
  montantEngageTTC: number;
  montantConsommeTTC: number;
}

export interface Equipment {
  id: string; // Column A (Article N°)
  nom: string; // Column B (Désignation)
  categorie: string; // Column C (Catégorie)
  reference: string; // Column D (Référence)
  quantite: number; // Column E (Quantité Actuelle)
  qteMin: number; // Column F (Qté Min)
  expediteur?: string; // Column H (Expéditeur) - keeping for fallback
  qteReceptionnee?: number; // Column I (Qté Réceptionnée)
  dateReception?: string; // Column J (Date de réception)
  observationReception?: string; // Column K (Observation de réception)
  beneficiaires?: string; // Column L (Bénéficiaires)
  region?: string; // Column M (Région)
  qteEnvoyee?: number; // Column N (Qté Envoyée) - keeping for fallback
  dateEnvoi?: string; // Column O (Date d'envoi) - keeping for fallback
  observationsEnvoi?: string; // Column P (Observations sur l'envoi)
  unite: string; // Column Q (Unité)
  zone: string; // Column R (Zone)
  emplacement: string; // Column S (Emplacement)
  rfid: string; // Column T (RFID)
  codeBarres: string; // Column U (CodeBarres)
  etat: string; // Column V (État)
  derniereMaj: string; // Column W (Dernière MAJ)
  rowIndex: number; // 1-based index in the CSV rows
  noteUtilisateur?: string;
  urgenceText?: string;
  requisEnCasDUrgence?: boolean;
  observations?: string;

  // New columns requested by the user
  marcheOuBc?: string;           // Marché ou Bon de commande d'entrée
  numMarche?: string;            // N° d'entrée
  societeAttributaire?: string; // Société attributaire
  
  marcheOuBcSortie?: string;
  message?: string;
  numMarcheSortie?: string;
  
  qteLivree?: number;
  dateLivraison?: string;
  livreurNom?: string;
  agentSortieNom?: string;
  matriculeVehicule?: string;
  conducteurNom?: string;
  prixUnitaire?: number; // Added for Coûts & Valorisation
  extraColumns?: { [key: string]: string };
  marque: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: 'Entrée' | 'Sortie' | 'Création' | 'Modification' | 'Transfert' | 'Retour'; // Expanded types
  equipmentId: string;
  equipmentNom: string;
  quantite: number;
  prixUnitaire?: number; // Added for Coûts & Valorisation
  montant?: number; // Added for Coûts & Valorisation
  employe: string;
  employeUsername?: string;
  service?: string;
  notes?: string;
  regionDestinataire?: string;
  expediteur?: string;
  beneficiaire?: string;
  region?: string;
  observations?: string;
  marcheOuBc?: string;
  numMarche?: string;
  societeAttributaire?: string;
  marcheOuBcSortie?: string;
  message?: string;
  numMarcheSortie?: string;
  livreurNom?: string;
  agentSortieNom?: string;
  matriculeVehicule?: string;
  conducteurNom?: string;
  extraColumns?: { [key: string]: string };
}

export type UserRole = 'Direction' | 'Administrateur' | 'Employé';

export interface User {
  id: string;
  username: string;
  password?: string; // in a real app, hashed.
  role: UserRole;
  fullName: string;
  service?: string; // Service option for employees (e.g., 'Service Électrique', 'Service Informatique', 'Service Patrimoine', 'Service DML')
  region?: string; // Moroccan region added on registration
  ville?: string;
  grade?: string;
  fonction?: string;
  poste?: string;
  matricule?: string;
  telephone?: string;
  statut?: 'Actif' | 'Désactivé';
  notes?: string;
  dateRecrutement?: string;
  email?: string;
  createdAt?: string; // Registration date
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface PlannedEvent {
  id: string;
  title: string;
  date: string;
  type: 'Tâche' | 'Mouvement' | 'Demande' | 'Contrôle' | 'Autre';
  description?: string;
  status: 'À faire' | 'En cours' | 'Terminé';
}


export interface DatabaseImport {
  id: string;
  fileName: string;
  importDate: string;
  recordCount: number;
  status: 'Succès' | 'Échec' | 'Partiel';
}
