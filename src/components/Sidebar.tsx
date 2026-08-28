import React, { useState } from 'react';
import LogoIcon from './LogoIcon';
import { 
  Home, Package, AlertTriangle, FileText, Box, 
  Barcode, ArrowDownLeft, ArrowUpRight, DollarSign, 
  Database, RotateCcw, MessageSquare, Calendar as CalendarIcon, 
  ShieldAlert, ShieldCheck, Users, Settings, ChevronDown, ChevronRight,
  LogOut, Menu, Store, Warehouse, RefreshCw, Layers, Building2,
  Award
} from 'lucide-react';
import { User } from '../types';
import { 
  canAccessFinancials, 
  canAccessAIVerification, 
  canManageUsers,
  getAuthorizationLevel
} from '../lib/permissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isNavCollapsed: boolean;
  setIsNavCollapsed: (collapsed: boolean) => void;
  user: User | null;
  totalAlertsCount: number;
  onLogout?: () => void;
  workspaceType?: 'magasin' | 'depot';
  siteName?: string;
  onSwitchWorkspace?: (type: 'magasin' | 'depot') => void;
  onChangeWorkspaceScreen?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isNavCollapsed, 
  setIsNavCollapsed, 
  user,
  totalAlertsCount,
  onLogout,
  workspaceType = 'depot',
  siteName,
  onSwitchWorkspace,
  onChangeWorkspaceScreen
}: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    patrimoine: true,
    transactions: true,
    couts: true,
    documents: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const navItemClass = (isActive: boolean, isSubItem: boolean = false) => {
    const baseClass = "w-full flex items-center rounded-xl font-bold transition-all cursor-pointer ";
    const paddingClass = isNavCollapsed ? "justify-center py-3.5 px-0" : (isSubItem ? "justify-between px-4 py-2.5 ml-2 w-[calc(100%-8px)]" : "justify-between px-4 py-3");
    const textSize = isSubItem ? "text-xs" : "text-sm";
    
    // ROUGE BRIQUE CLAIR: #C84B31 / text-white for active
    if (isActive) {
      return baseClass + paddingClass + " " + textSize + " bg-white/20 text-white shadow-sm";
    }
    return baseClass + paddingClass + " " + textSize + " text-white/70 hover:bg-white/10 hover:text-white";
  };

  const iconClass = (isActive: boolean) => {
    return `h-5 w-5 ${isActive ? 'text-white' : 'text-white/70'}`;
  };

  const renderItem = (id: string, icon: any, label: string, badge?: number, isSubItem: boolean = false) => {
    const isActive = activeTab === id;
    const IconComponent = icon;

    return (
      <button
        onClick={() => {
          setActiveTab(id);
        }}
        title={label}
        className={navItemClass(isActive, isSubItem)}
      >
        <div className={`flex items-center ${isNavCollapsed ? 'space-x-0' : 'space-x-3'}`}>
          <IconComponent className={iconClass(isActive)} />
          {!isNavCollapsed && <span>{label}</span>}
        </div>
        {!isNavCollapsed && badge !== undefined && badge > 0 && (
          <span className="text-[10px] bg-white text-[#C84B31] font-black px-2 py-0.5 rounded-md">
            {badge}
          </span>
        )}
      </button>
    );
  };

  const renderGroup = (id: string, label: string, children: React.ReactNode) => {
    const isOpen = openGroups[id];
    
    if (isNavCollapsed) {
      return <div className="space-y-1">{children}</div>;
    }

    return (
      <div className="space-y-1">
        <button 
          onClick={() => toggleGroup(id)}
          className="w-full flex items-center justify-between px-4 py-2 text-white/50 hover:text-white transition-colors"
        >
          <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {isOpen && <div className="space-y-1">{children}</div>}
      </div>
    );
  };

  const isMagasin = workspaceType === 'magasin';

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#C84B31] text-white flex flex-col z-50 transition-all duration-300 shadow-2xl ${isNavCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
    >
      {/* Header / Logo */}
      <div className={`h-22 flex items-center ${isNavCollapsed ? 'justify-center' : 'px-5'} border-b border-white/10 shrink-0`}>
        {!isNavCollapsed ? (
          <div className="flex items-center gap-3">
             <div className="h-11 w-11 bg-white rounded-2xl flex items-center justify-center p-1 shadow-md shrink-0 border border-white/20">
                <img 
                  src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
                  alt="Logo DGPC" 
                  className="h-full w-full object-contain filter drop-shadow-xs" 
                  referrerPolicy="no-referrer"
                />
             </div>
             <div className="flex flex-col min-w-0">
               <span className="font-black text-base tracking-tight leading-tight flex items-center gap-1.5">
                 GIS-DGPC
                 <span className="text-[9px] bg-white/20 text-white font-extrabold px-1.5 py-0.5 rounded tracking-wide">RSK</span>
               </span>
               <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider truncate">Protection Civile</span>
             </div>
          </div>
        ) : (
          <div className="h-11 w-11 bg-white rounded-2xl flex items-center justify-center p-1 shadow-md border border-white/20">
            <img 
              src="https://i.ibb.co/j9sKPQCP/Logo-PC.png" 
              alt="Logo DGPC" 
              className="h-full w-full object-contain filter drop-shadow-xs" 
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* Workspace Selector Bar in Sidebar */}
      <div className="px-3 pt-3 pb-1 border-b border-white/10 shrink-0">
        {!isNavCollapsed ? (
          <div className="bg-black/25 p-2 rounded-2xl space-y-2 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/70 flex items-center gap-1">
                <Layers className="h-3 w-3 text-amber-300" />
                Espace Actif
              </span>
              {onChangeWorkspaceScreen && (
                <button
                  onClick={onChangeWorkspaceScreen}
                  className="text-[9px] text-amber-200 hover:text-white font-bold underline cursor-pointer"
                  title="Changer d'espace de travail"
                >
                  Changer
                </button>
              )}
            </div>

            {/* Quick Switch Toggle */}
            <div className="grid grid-cols-2 gap-1 bg-black/30 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => onSwitchWorkspace?.('depot')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  !isMagasin 
                    ? 'bg-white text-[#C84B31] shadow-md scale-100 font-extrabold' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Warehouse className="h-3 w-3" />
                <span>Dépôt</span>
              </button>
              
              <button
                type="button"
                onClick={() => onSwitchWorkspace?.('magasin')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isMagasin 
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-100 font-extrabold' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Store className="h-3 w-3" />
                <span>Magasin</span>
              </button>
            </div>

            {siteName && (
              <div className="text-[10px] text-white/80 font-bold truncate px-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span className="truncate">{siteName}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center pb-2">
            <button
              onClick={() => onSwitchWorkspace?.(isMagasin ? 'depot' : 'magasin')}
              title={`Espace actuel : ${isMagasin ? 'Magasin' : 'Dépôt'} (Cliquer pour basculer)`}
              className={`h-9 w-9 rounded-xl flex items-center justify-center border shadow-xs transition-all ${
                isMagasin 
                  ? 'bg-amber-400 text-slate-900 border-amber-300' 
                  : 'bg-white text-[#C84B31] border-white/20'
              }`}
            >
              {isMagasin ? <Store className="h-4 w-4" /> : <Warehouse className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-hide">
        
        <div className="space-y-1">
          {renderItem('dashboard', Home, isMagasin ? 'Accueil Magasin' : 'Accueil Dépôt')}
        </div>

        {/* Section 1: Stock & Patrimoine */}
        {renderGroup('patrimoine', isMagasin ? 'Stock & Patrimoine' : 'Patrimoine & Stock Central', (
          <>
            {renderItem('fiches-techniques', Building2, 'Fiches techniques des sites', undefined, true)}
            {renderItem('stock', Package, isMagasin ? 'Inventaire magasin' : 'Gestion du stock', undefined, true)}
            {renderItem('alerts', AlertTriangle, isMagasin ? 'Stock faible magasin' : 'Stock faible & seuils', totalAlertsCount, true)}
            {renderItem('recap', FileText, 'Tableau récapitulatif', undefined, true)}
            {renderItem('3d', Box, 'Visualisation 3D (1 000 m²)', undefined, true)}
          </>
        ))}

        {/* Section 2: Transactions */}
        {renderGroup('transactions', isMagasin ? 'Flux & Distribution' : 'Transactions & Flux', (
          <>
            {renderItem('scanner', Barcode, isMagasin ? 'Scanner magasin' : 'Scan & RFID Dépôt', undefined, true)}
            {renderItem('transactions-entrees', ArrowDownLeft, isMagasin ? 'Réceptions de dotation' : 'Entrées fournisseurs', undefined, true)}
            {renderItem('transactions-sorties', ArrowUpRight, isMagasin ? 'Distribution aux agents' : 'Sorties régionales', undefined, true)}
            {canAccessAIVerification(user) && renderItem('verification', ShieldCheck, 'Vérification IA', undefined, true)}
          </>
        ))}

        {/* Section 3: Gestion Financière (Réservé Direction & Commandement - Strictement masqué pour les employés) */}
        {canAccessFinancials(user) && (
          <div className="space-y-1">
            {!isNavCollapsed && <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600/70 block px-4 mb-2 mt-4">Finance & Marchés</span>}
            {renderItem('finance-module', DollarSign, 'Gestion Financière & Achats', undefined, false)}
            {renderItem('couts-valorisation-module', Database, 'Coût', undefined, false)}
          </div>
        )}

        {/* Section 4: Documents & Historique (Registre & Bons des magasins) */}
        {renderGroup('documents', isMagasin ? 'Registre & Bons Magasin' : 'Documents & Grands Mouvements', (
          <>
            {renderItem('history', RotateCcw, 'Historique / Registre', undefined, true)}
            {renderItem('docs-entrees', FileText, isMagasin ? 'Bons de réception' : 'Bons d\'entrée', undefined, true)}
            {renderItem('docs-sorties', FileText, isMagasin ? 'Bons de distribution' : 'Bons de sortie', undefined, true)}
          </>
        ))}

        <div className="space-y-1">
          {!isNavCollapsed && <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block px-4 mb-2 mt-4">Utilitaires</span>}
          {renderItem('messages', MessageSquare, 'Communication')}
          {renderItem('planification-agenda', CalendarIcon, isMagasin ? 'Agenda magasin' : 'Planification logistique')}
          {renderItem('urgence', ShieldAlert, 'Urgence')}
        </div>

        {canManageUsers(user) && (
          <div className="space-y-1">
            {!isNavCollapsed && <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block px-4 mb-2 mt-4">Administration</span>}
            {renderItem('users', Users, 'Gestion des Employés')}
            {renderItem('settings', Settings, 'Paramètres')}
            {renderItem('databases', Database, 'Bases de données')}
          </div>
        )}

      </div>

      {/* Footer / User Profile */}
      <div className={`p-4 border-t border-white/10 shrink-0 flex flex-col gap-3`}>
        <button 
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          className={`flex items-center ${isNavCollapsed ? 'justify-center' : 'justify-between px-3'} w-full py-2 text-white/70 hover:text-white transition-colors`}
        >
          {!isNavCollapsed && <span className="text-xs font-bold uppercase">Réduire</span>}
          <Menu className="h-5 w-5" />
        </button>
        
        {!isNavCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-xl">
            <div className="h-9 w-9 bg-white/20 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-white/20">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-xs font-black truncate">{user.fullName}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] bg-white/20 text-white font-extrabold px-1.5 py-0.2 rounded truncate">
                  {user.grade || user.role}
                </span>
                {user.matricule && (
                  <span className="text-[8px] text-white/60 font-mono font-bold truncate">
                    {user.matricule}
                  </span>
                )}
              </div>
            </div>
            {onLogout && (
              <button onClick={onLogout} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white cursor-pointer shrink-0" title="Déconnexion">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
