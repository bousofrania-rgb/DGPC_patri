import React, { useState, useMemo } from 'react';
import { 
  SiteTechnicalSheet, 
  SiteType, 
  SiteStatus, 
  getStoredSitesSheets, 
  saveStoredSitesSheets 
} from '../types/siteTechnical';
import { User, Equipment } from '../types';
import { 
  Building2, 
  Warehouse, 
  Store, 
  MapPin, 
  Box, 
  Layers, 
  Calendar, 
  Phone, 
  User as UserIcon, 
  FileText, 
  Edit3, 
  Save, 
  Plus, 
  Trash2, 
  Printer, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  Info,
  Maximize2,
  X,
  Compass,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface FichesTechniquesTabProps {
  user?: User | null;
  equipments: Equipment[];
  onNavigate: (tab: string) => void;
  onSelectSite?: (siteId: string, siteName: string, workspaceType: 'magasin' | 'depot') => void;
  showToast?: (msg: string) => void;
}

export default function FichesTechniquesTab({
  user,
  equipments,
  onNavigate,
  onSelectSite,
  showToast
}: FichesTechniquesTabProps) {
  const [sites, setSites] = useState<SiteTechnicalSheet[]>(() => getStoredSitesSheets());
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    return sites[0]?.id || 'depot_sidi_allal_bahraoui';
  });
  const [filterType, setFilterType] = useState<'all' | 'Dépôt' | 'Magasin'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [siteForm, setSiteForm] = useState<Partial<SiteTechnicalSheet>>({});
  const [siteToDelete, setSiteToDelete] = useState<SiteTechnicalSheet | null>(null);

  const filteredSites = useMemo(() => {
    return sites.filter(s => {
      const matchType = filterType === 'all' || s.type === filterType;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        s.designation.toLowerCase().includes(term) ||
        s.sigle.toLowerCase().includes(term) ||
        s.province.toLowerCase().includes(term) ||
        s.region.toLowerCase().includes(term) ||
        s.adresse.toLowerCase().includes(term);
      return matchType && matchSearch;
    });
  }, [sites, filterType, searchTerm]);

  const activeSite = useMemo(() => {
    return sites.find(s => s.id === selectedSiteId) || sites[0] || null;
  }, [sites, selectedSiteId]);

  // Start editing active site
  const handleStartEdit = (site: SiteTechnicalSheet) => {
    setSiteForm({ ...site });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  // Start adding a new site
  const handleStartAddNew = () => {
    setSiteForm({
      id: `site_custom_${Date.now()}`,
      region: 'Rabat-Salé-Kénitra (CR04)',
      province: '',
      type: 'Magasin',
      designation: '',
      sigle: '',
      etat: 'Opérationnel',
      organisme: 'Protection Civile',
      superficie: '',
      capaciteStockage: '',
      adresse: '',
      coordonneesGps: '',
      zonesStockage: '',
      nombreRayonnages: '',
      responsable: '',
      contact: '',
      dateMiseEnService: '',
      informationsTechniques: '',
      documentsAssocies: '',
      photosPlan: '',
      observations: '',
      has3DModel: false
    });
    setIsEditing(true);
    setIsAddingNew(true);
  };

  // Save form edits or new site
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteForm.designation?.trim() || !siteForm.sigle?.trim() || !siteForm.province?.trim()) {
      showToast?.('Veuillez renseigner au minimum la Désignation, le Sigle et la Province.');
      return;
    }

    let updatedSites: SiteTechnicalSheet[];
    if (isAddingNew) {
      const newSite = siteForm as SiteTechnicalSheet;
      updatedSites = [...sites, newSite];
      setSelectedSiteId(newSite.id);
      showToast?.(`Fiche technique "${newSite.sigle}" créée avec succès.`);
    } else {
      updatedSites = sites.map(s => s.id === siteForm.id ? (siteForm as SiteTechnicalSheet) : s);
      showToast?.(`Fiche technique "${siteForm.sigle}" mise à jour avec succès.`);
    }

    setSites(updatedSites);
    saveStoredSitesSheets(updatedSites);
    setIsEditing(false);
    setIsAddingNew(false);
  };

  const handleConfirmDeleteSite = () => {
    if (!siteToDelete) return;
    const updated = sites.filter(s => s.id !== siteToDelete.id);
    setSites(updated);
    saveStoredSitesSheets(updated);
    if (selectedSiteId === siteToDelete.id) {
      setSelectedSiteId(updated[0]?.id || '');
    }
    showToast?.(`Fiche technique "${siteToDelete.sigle}" supprimée.`);
    setSiteToDelete(null);
  };

  const getStatusBadge = (etat: SiteStatus) => {
    switch (etat) {
      case 'Opérationnel':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Opérationnel
          </span>
        );
      case 'En cours de construction':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="h-3.5 w-3.5" />
            En cours de construction
          </span>
        );
      case 'Site de transition':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Info className="h-3.5 w-3.5" />
            Site Provisoire
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {etat || 'Non spécifié'}
          </span>
        );
    }
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* Header Banner with Moroccan DGPC Branding */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        {/* Subtle Moroccan star watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-end pr-6">
          <svg viewBox="0 0 100 100" className="h-64 w-64 text-amber-400 fill-current">
            <polygon points="50,0 61,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 39,35" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Service Gestion du Patrimoine • Région RSK
              </span>
              <span className="text-xs font-bold text-slate-400">
                {sites.length} site(s) répertorié(s)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Fiches Techniques des Dépôts & Magasins
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consultez et gérez les caractéristiques administratives, techniques, opérationnelles et architecturales des infrastructures logistiques de la région.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartAddNew}
              className="inline-flex items-center gap-2 bg-[#C84B31] hover:bg-[#b54027] text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/30 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Site</span>
            </button>
            <button
              onClick={() => onNavigate('3d')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
            >
              <Box className="h-4 w-4" />
              <span>Vue 3D 1 000 m²</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Type Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              filterType === 'all' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tous ({sites.length})
          </button>
          <button
            onClick={() => setFilterType('Dépôt')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === 'Dépôt' 
                ? 'bg-white text-[#C84B31] shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Warehouse className="h-3.5 w-3.5" />
            Dépôts ({sites.filter(s => s.type === 'Dépôt').length})
          </button>
          <button
            onClick={() => setFilterType('Magasin')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === 'Magasin' 
                ? 'bg-white text-amber-700 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            Magasins ({sites.filter(s => s.type === 'Magasin').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Rechercher désignation, sigle, province..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#C84B31] focus:ring-2 focus:ring-red-100 text-xs font-bold text-slate-900 bg-slate-50/50"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Main Grid: Master Sites Selector & Detailed Technical Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left List of Sites (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Répertoire des Sites
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {filteredSites.length} affiché(s)
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
              {filteredSites.map((site) => {
                const isSelected = activeSite?.id === site.id;
                const isDepot = site.type === 'Dépôt';

                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      setSelectedSiteId(site.id);
                      setIsEditing(false);
                    }}
                    className={`p-4 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          isSelected 
                            ? (isDepot ? 'bg-red-500/20 text-red-300' : 'bg-amber-400/20 text-amber-300')
                            : (isDepot ? 'bg-red-50 text-[#C84B31]' : 'bg-amber-50 text-amber-700')
                        }`}>
                          {isDepot ? <Warehouse className="h-5 w-5" /> : <Store className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {site.type}
                            </span>
                            <span className={`text-xs font-black truncate ${isSelected ? 'text-amber-300' : 'text-slate-900'}`}>
                              {site.sigle}
                            </span>
                          </div>
                          <span className={`text-[10px] font-medium block truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {site.province} • {site.region}
                          </span>
                        </div>
                      </div>

                      {site.has3DModel && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                          3D 1 000 m²
                        </span>
                      )}
                    </div>

                    <p className={`text-xs font-medium line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                      {site.designation}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/10 text-[10px]">
                      <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                        Superficie : <strong className={isSelected ? 'text-white' : 'text-slate-800'}>{site.superficie || 'N/C'}</strong>
                      </span>
                      <div>
                        {getStatusBadge(site.etat)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Detailed Fiche Technique View or Edit Form (8 cols) */}
        <div className="lg:col-span-8">
          {isEditing ? (
            /* --- Formulaire d'édition / création --- */
            <form onSubmit={handleSaveForm} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-[#C84B31] rounded-2xl">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">
                      {isAddingNew ? 'Ajouter une Fiche Technique de Site' : `Modifier la Fiche : ${siteForm.sigle}`}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Remplissez ou mettez à jour les informations techniques et administratives du site.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Section 1: Identification & Administration */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#C84B31]" />
                  1. Identification Administrative
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Région *</label>
                    <input
                      type="text"
                      value={siteForm.region || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Province *</label>
                    <input
                      type="text"
                      value={siteForm.province || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, province: e.target.value })}
                      placeholder="Ex: Khémisset, Kénitra, Rabat..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Type de site *</label>
                    <select
                      value={siteForm.type || 'Magasin'}
                      onChange={(e) => setSiteForm({ ...siteForm, type: e.target.value as SiteType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    >
                      <option value="Dépôt">Dépôt</option>
                      <option value="Magasin">Magasin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Désignation Complète *</label>
                    <input
                      type="text"
                      value={siteForm.designation || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, designation: e.target.value })}
                      placeholder="Ex: Dépôt Logistique d'Assistance aux Sinistres"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Sigle Officiel *</label>
                    <input
                      type="text"
                      value={siteForm.sigle || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, sigle: e.target.value })}
                      placeholder="Ex: DLAS Sidi Allal Bahraoui"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">État Opérationnel</label>
                    <select
                      value={siteForm.etat || 'Opérationnel'}
                      onChange={(e) => setSiteForm({ ...siteForm, etat: e.target.value as SiteStatus })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    >
                      <option value="Opérationnel">Opérationnel</option>
                      <option value="En cours de construction">En cours de construction</option>
                      <option value="Site de transition">Site de transition / Provisoire</option>
                      <option value="Non opérationnel">Non opérationnel</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Organisme de tutelle</label>
                    <input
                      type="text"
                      value={siteForm.organisme || 'Protection Civile'}
                      onChange={(e) => setSiteForm({ ...siteForm, organisme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Modèle 3D 1 000 m²</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteForm.has3DModel || false}
                        onChange={(e) => setSiteForm({ ...siteForm, has3DModel: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Associer à la Vue 3D 1 000 m²</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Caractéristiques Techniques & Capacité */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Box className="h-4 w-4 text-emerald-600" />
                  2. Caractéristiques Techniques & Bâtiment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Superficie</label>
                    <input
                      type="text"
                      value={siteForm.superficie || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, superficie: e.target.value })}
                      placeholder="Ex: 1 000 m², 450 m²..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Capacité de Stockage</label>
                    <input
                      type="text"
                      value={siteForm.capaciteStockage || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, capaciteStockage: e.target.value })}
                      placeholder="Ex: 3 500 m³ / 180 palettes..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre de Rayonnages</label>
                    <input
                      type="text"
                      value={siteForm.nombreRayonnages || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, nombreRayonnages: e.target.value })}
                      placeholder="Ex: 24 travées lourdes..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Adresse / Localisation</label>
                    <input
                      type="text"
                      value={siteForm.adresse || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, adresse: e.target.value })}
                      placeholder="Adresse physique exacte..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Coordonnées GPS</label>
                    <input
                      type="text"
                      value={siteForm.coordonneesGps || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, coordonneesGps: e.target.value })}
                      placeholder="Ex: 33.9928° N, 6.5514° W"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Zones de Stockage Définies</label>
                  <textarea
                    rows={2}
                    value={siteForm.zonesStockage || ''}
                    onChange={(e) => setSiteForm({ ...siteForm, zonesStockage: e.target.value })}
                    placeholder="Ex: Zone Nord (Secours), Zone Sud (Énergie), Zone Est (Médical)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Détails Techniques du Bâtiment</label>
                  <textarea
                    rows={2}
                    value={siteForm.informationsTechniques || ''}
                    onChange={(e) => setSiteForm({ ...siteForm, informationsTechniques: e.target.value })}
                    placeholder="Structure, sécurité incendie, ventilation, quais de déchargement..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                  />
                </div>
              </div>

              {/* Section 3: Responsables, Contacts & Historique */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                  3. Gestion & Responsabilités
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Responsable du Site</label>
                    <input
                      type="text"
                      value={siteForm.responsable || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, responsable: e.target.value })}
                      placeholder="Nom et grade du responsable..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact (Tél / Email)</label>
                    <input
                      type="text"
                      value={siteForm.contact || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, contact: e.target.value })}
                      placeholder="+212 5... / email..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Date de Mise en Service</label>
                    <input
                      type="text"
                      value={siteForm.dateMiseEnService || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, dateMiseEnService: e.target.value })}
                      placeholder="Ex: 15/03/2019 ou Prévue T4-2026..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Documents Associés / Réf.</label>
                    <textarea
                      rows={2}
                      value={siteForm.documentsAssocies || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, documentsAssocies: e.target.value })}
                      placeholder="Plans d'architecte, PV de réception, autorisations..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Observations & Remarques</label>
                    <textarea
                      rows={2}
                      value={siteForm.observations || ''}
                      onChange={(e) => setSiteForm({ ...siteForm, observations: e.target.value })}
                      placeholder="Notes particulières de gestion..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#C84B31] hover:bg-[#b54027] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer la Fiche</span>
                </button>
              </div>
            </form>
          ) : activeSite ? (
            /* --- Affichage officiel de la Fiche Technique --- */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-6 p-6 md:p-8">
              
              {/* Header de la Fiche Institutionnelle */}
              <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center p-2 shadow-sm border shrink-0 ${
                    activeSite.type === 'Dépôt' 
                      ? 'bg-red-50 text-[#C84B31] border-red-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {activeSite.type === 'Dépôt' ? <Warehouse className="h-8 w-8" /> : <Store className="h-8 w-8" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                        {activeSite.type}
                      </span>
                      <span className="text-xs font-black text-[#C84B31] font-mono">
                        {activeSite.sigle}
                      </span>
                      {getStatusBadge(activeSite.etat)}
                    </div>

                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {activeSite.designation}
                    </h2>

                    <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{activeSite.adresse || `${activeSite.province}, ${activeSite.region}`}</span>
                    </p>
                  </div>
                </div>

                {/* Toolbar Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeSite.has3DModel && (
                    <button
                      onClick={() => onNavigate('3d')}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                      title="Ouvrir la visualisation 3D du stock 1 000 m²"
                    >
                      <Box className="h-4 w-4" />
                      <span>Vue 3D 1 000 m²</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleStartEdit(activeSite)}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Modifier les données de la fiche"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                    <span>Modifier</span>
                  </button>

                  <button
                    onClick={handlePrintSheet}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Imprimer la fiche technique"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-600" />
                    <span>Imprimer</span>
                  </button>

                  {sites.length > 1 && (
                    <button
                      onClick={() => setSiteToDelete(activeSite)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Supprimer cette fiche"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fiche Technique Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Cadre 1 : Données Administratives */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#C84B31]" />
                      Informations Administratives
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Région</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{activeSite.region || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Province</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{activeSite.province || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Organisme de tutelle</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{activeSite.organisme || 'Protection Civile'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">État Opérationnel</dt>
                      <dd className="mt-0.5">{getStatusBadge(activeSite.etat)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Date de mise en service</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">{activeSite.dateMiseEnService || 'Non renseigné'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Cadre 2 : Données Techniques & Capacité */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Box className="h-4 w-4 text-emerald-600" />
                      Capacité & Caractéristiques
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Superficie Totale</dt>
                      <dd className="font-black text-slate-900 text-sm text-[#C84B31] mt-0.5">
                        {activeSite.superficie || 'Non renseigné'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Capacité de Stockage</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">
                        {activeSite.capaciteStockage || 'Non renseigné'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Rayonnages & Travées</dt>
                      <dd className="font-bold text-slate-900 mt-0.5">
                        {activeSite.nombreRayonnages || 'Non renseigné'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Coordonnées GPS</dt>
                      <dd className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                        {activeSite.coordonneesGps || 'Non renseigné'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Cadre 3 : Zones de Stockage Définies */}
                <div className="col-span-1 md:col-span-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <Grid className="h-4 w-4 text-blue-600" />
                      Organisation des Zones & Emplacements
                    </span>
                    {activeSite.has3DModel && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Synchronisé avec le modèle 3D
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeSite.zonesStockage || 'Aucune zone de stockage spécifique renseignée pour le moment.'}
                  </p>

                  {/* Boutons d'accès direct */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onNavigate('stock')}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Consulter l'inventaire du site</span>
                    </button>
                    {activeSite.has3DModel && (
                      <button
                        onClick={() => onNavigate('3d')}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Box className="h-3.5 w-3.5" />
                        <span>Explorer en 3D (1 000 m²)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cadre 4 : Responsables & Contacts */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-purple-600" />
                      Responsable & Contacts
                    </span>
                  </div>

                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Responsable du Site</dt>
                      <dd className="font-black text-slate-900 mt-0.5">{activeSite.responsable || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Contact Téléphonique & Mail</dt>
                      <dd className="font-bold text-slate-700 mt-0.5">{activeSite.contact || 'Non renseigné'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Cadre 5 : Spécifications Techniques & Bâtiment */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      Sécurité & Spécifications Bâtiment
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeSite.informationsTechniques || 'Aucune spécification technique additionnelle renseignée.'}
                  </p>
                </div>

                {/* Cadre 6 : Documents & Observations */}
                <div className="col-span-1 md:col-span-2 bg-slate-50/80 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      Documents Associés & Observations Générales
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Documents Associés</span>
                      <p className="text-slate-700 font-medium">
                        {activeSite.documentsAssocies || 'Aucun document associé.'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Observations</span>
                      <p className="text-slate-700 font-medium">
                        {activeSite.observations || 'Aucune observation enregistrée.'}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40 text-slate-400" />
              <p className="text-sm font-bold">Sélectionnez un site dans la liste de gauche pour consulter sa fiche technique.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={Boolean(siteToDelete)}
        title="Supprimer la fiche technique"
        message={`Êtes-vous certain de vouloir supprimer la fiche technique de "${siteToDelete?.sigle}" (${siteToDelete?.designation}) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
        onConfirm={handleConfirmDeleteSite}
        onClose={() => setSiteToDelete(null)}
      />

    </div>
  );
}
