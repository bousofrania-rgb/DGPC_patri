import { User } from '../types';

export const DGPC_GRADES = [
  // Commandement Supérieur
  { id: 'colonel', label: 'Colonel', category: 'Officiers Supérieurs', isCommand: true },
  { id: 'lt_colonel', label: 'Lieutenant-colonel (Lt. Colonel)', category: 'Officiers Supérieurs', isCommand: true },
  { id: 'commandant', label: 'Commandant', category: 'Officiers Supérieurs', isCommand: true },
  
  // Officiers
  { id: 'capitaine', label: 'Capitaine', category: 'Officiers Subalternes', isCommand: true },
  { id: 'lieutenant', label: 'Lieutenant', category: 'Officiers Subalternes', isCommand: false },
  { id: 'sous_lieutenant', label: 'Sous-lieutenant', category: 'Officiers Subalternes', isCommand: false },
  
  // Sous-Officiers
  { id: 'adjudant_chef', label: 'Adjudant-chef', category: 'Sous-officiers', isCommand: false },
  { id: 'adjudant', label: 'Adjudant', category: 'Sous-officiers', isCommand: false },
  { id: 'sergent_chef', label: 'Sergent-chef', category: 'Sous-officiers', isCommand: false },
  { id: 'sergent', label: 'Sergent', category: 'Sous-officiers', isCommand: false },
  
  // Hommes du rang
  { id: 'caporal_chef', label: 'Caporal-chef', category: 'Hommes du rang', isCommand: false },
  { id: 'caporal', label: 'Caporal', category: 'Hommes du rang', isCommand: false },
  { id: 'sapeur', label: 'Sapeur', category: 'Hommes du rang', isCommand: false },
  
  // Personnel Civil & Direction
  { id: 'directeur', label: 'Directeur Régional / Général', category: 'Personnel Civil & Direction', isCommand: true },
  { id: 'chef_service', label: 'Chef de Service', category: 'Personnel Civil & Direction', isCommand: true },
  { id: 'ingenieur', label: 'Ingénieur d\'État / Administrateur', category: 'Personnel Civil & Direction', isCommand: false },
  { id: 'agent_civil', label: 'Agent Technique / Employé', category: 'Personnel Civil & Direction', isCommand: false },
] as const;

export const DGPC_SERVICES = [
  'Service Patrimoine',
  'Service Électrique',
  'Service Informatique',
  'Service DML',
  'Commandement Régional RSK',
  'Direction Générale',
  'Magasin Régional de Kénitra',
  'Magasin DGPC Siège',
  'Dépôt de Sidi Allal Bahraoui'
];

export type AuthorizationLevel = 'COMMANDEMENT_DIRECTION' | 'ADMINISTRATEUR_GESTIONNAIRE' | 'EMPLOYE_OPERATIONNEL';

/**
 * Determine the user's authorization level based on their Grade, Role, and Function
 */
export function getAuthorizationLevel(user: User | null): AuthorizationLevel {
  if (!user) return 'EMPLOYE_OPERATIONNEL';

  // Inactive users have no operational command rights
  if (user.statut === 'Désactivé') {
    return 'EMPLOYE_OPERATIONNEL';
  }

  const role = user.role;
  const grade = (user.grade || '').toLowerCase().trim();
  const fonction = (user.fonction || '').toLowerCase().trim();

  // 1. High command & Direction: Colonel, Lieutenant-colonel, Commandant, Directeur
  if (
    role === 'Direction' ||
    grade.includes('colonel') ||
    grade.includes('commandant') ||
    fonction.includes('directeur') ||
    fonction.includes('direction') ||
    fonction.includes('général')
  ) {
    return 'COMMANDEMENT_DIRECTION';
  }

  // 2. Administrators & Managers: Capitaine, Lieutenant, Chef de service, Administrateur
  if (
    role === 'Administrateur' ||
    grade.includes('capitaine') ||
    grade.includes('lieutenant') ||
    fonction.includes('chef') ||
    fonction.includes('admin') ||
    fonction.includes('responsable') ||
    fonction.includes('gestionnaire')
  ) {
    return 'ADMINISTRATEUR_GESTIONNAIRE';
  }

  // 3. Operational employee
  return 'EMPLOYE_OPERATIONNEL';
}

/**
 * Checks if the user has Full High Command or Administrative privileges
 */
export function isCommandOrAdmin(user: User | null): boolean {
  const level = getAuthorizationLevel(user);
  return level === 'COMMANDEMENT_DIRECTION' || level === 'ADMINISTRATEUR_GESTIONNAIRE';
}

/**
 * Checks if the user is authorized to access Financial details (Coûts & Valorisation)
 * STRICT RULE: Financial section must NEVER be accessible to employees
 */
export function canAccessFinancials(user: User | null): boolean {
  return isCommandOrAdmin(user);
}

/**
 * Checks if the user is authorized to use AI Automatic Verification
 * STRICT RULE: AI Verification must NOT be accessible to employees
 */
export function canAccessAIVerification(user: User | null): boolean {
  return isCommandOrAdmin(user);
}

/**
 * Checks if the user is authorized to manage employees and users
 */
export function canManageUsers(user: User | null): boolean {
  return isCommandOrAdmin(user);
}

/**
 * List of tabs permitted for each profile
 */
export function getAccessibleTabs(user: User | null): string[] {
  const level = getAuthorizationLevel(user);

  // Full access for Commandement / Direction and Administrators
  if (level === 'COMMANDEMENT_DIRECTION' || level === 'ADMINISTRATEUR_GESTIONNAIRE') {
    return [
      'dashboard',
      'fiches-techniques',
      'stock',
      'alerts',
      'stock-faible',
      'recap',
      '3d',
      'scanner',
      'transactions-scan',
      'transactions-entrees',
      'transactions-sorties',
      'verification', // IA Verification allowed
      'finance-module', // Comprehensive Financial Management allowed
      'couts-valorisation-module', // Cost and Valuation Module allowed
      'history',
      'docs-historique',
      'docs-entrees',
      'docs-sorties',
      'messages',
      'communication-messages',
      'planification-agenda',
      'urgence',
      'users', // Employee Management allowed
      'settings', 'databases' // Settings allowed
    ];
  }

  // Restricted access strictly for Employees (Operational Scope):
  // 1. Flux de distribution (transactions-entrees, transactions-sorties, scanner)
  // 2. Stock Patrimoine (dashboard, stock, alerts, 3d, fiches-techniques, recap)
  // 3. Registre (history, docs-historique)
  // 4. Bons des magasins (docs-entrees, docs-sorties)
  // 5. Utilitaires (messages, planification-agenda, urgence)
  // FORBIDDEN: verification (IA), couts-* (Finance), users, settings
  return [
    'dashboard',
    'fiches-techniques',
    'stock',
    'alerts',
    'stock-faible',
    'recap',
    '3d',
    'scanner',
    'transactions-scan',
    'transactions-entrees',
    'transactions-sorties',
    'history',
    'docs-historique',
    'docs-entrees',
    'docs-sorties',
    'messages',
    'communication-messages',
    'planification-agenda',
    'urgence'
  ];
}

/**
 * Verifies if a specific tab ID can be viewed by the user
 */
export function canAccessTab(tabId: string, user: User | null): boolean {
  const accessibleTabs = getAccessibleTabs(user);
  return accessibleTabs.includes(tabId);
}
