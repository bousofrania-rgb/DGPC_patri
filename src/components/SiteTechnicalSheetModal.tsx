import React, { useState, useEffect } from 'react';
import { 
  SiteTechnicalSheet, 
  SiteType, 
  SiteStatus, 
  getStoredSitesSheets, 
  saveStoredSitesSheets 
} from '../types/siteTechnical';
import { 
  Building2, 
  Warehouse, 
  Store, 
  MapPin, 
  Box, 
  Edit3, 
  Save, 
  X, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  User as UserIcon, 
  Grid, 
  FileText, 
  ArrowRight,
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface SiteTechnicalSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSiteId?: string;
  onOpenSiteDatabase?: (siteId: string) => void;
  onOpen3DView?: () => void;
}

export default function SiteTechnicalSheetModal({
  isOpen,
  onClose,
  initialSiteId,
  onOpenSiteDatabase,
  onOpen3DView
}: SiteTechnicalSheetModalProps) {
  const [sites, setSites] = useState<SiteTechnicalSheet[]>(() => getStoredSitesSheets());
  const [activeSiteId, setActiveSiteId] = useState<string>(() => {
    return initialSiteId || sites[0]?.id || 'depot_sidi_allal_bahraoui';
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<SiteTechnicalSheet>>({});
  const [siteToDelete, setSiteToDelete] = useState<SiteTechnicalSheet | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync active site id when initialSiteId changes
  useEffect(() => {
    if (initialSiteId) {
      setActiveSiteId(initialSiteId);
      setIsEditing(false);
    }
  }, [initialSiteId, isOpen]);

  // Reload latest sites from storage on open
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredSitesSheets();
      setSites(stored);
    }
  }, [isOpen]);

  const activeSite = sites.find(s => s.id === activeSiteId) || sites[0];

  const handleStartEdit = (site: SiteTechnicalSheet) => {
    setEditForm({ ...site });
    setIsEditing(true);
    setIsAddingNew(false);
  };

  const handleStartAddNew = () => {
    setEditForm({
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

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.designation?.trim() || !editForm.sigle?.trim() || !editForm.province?.trim()) {
      setFeedbackMsg({ text: 'Veuillez renseigner au minimum la Désignation, le Sigle et la Province.', type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 4000);
      return;
    }

    let updatedList: SiteTechnicalSheet[];
    if (isAddingNew) {
      const newSheet = editForm as SiteTechnicalSheet;
      updatedList = [...sites, newSheet];
      setActiveSiteId(newSheet.id);
      setFeedbackMsg({ text: `Fiche technique "${newSheet.sigle}" ajoutée avec succès.`, type: 'success' });
    } else {
      updatedList = sites.map(s => s.id === editForm.id ? (editForm as SiteTechnicalSheet) : s);
      setFeedbackMsg({ text: `Fiche technique "${editForm.sigle}" enregistrée avec succès.`, type: 'success' });
    }

    setSites(updatedList);
    saveStoredSitesSheets(updatedList);
    setIsEditing(false);
    setIsAddingNew(false);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (!siteToDelete) return;
    const updated = sites.filter(s => s.id !== siteToDelete.id);
    setSites(updated);
    saveStoredSitesSheets(updated);
    if (activeSiteId === siteToDelete.id) {
      setActiveSiteId(updated[0]?.id || '');
    }
    setFeedbackMsg({ text: `Fiche technique "${siteToDelete.sigle}" supprimée.`, type: 'success' });
    setSiteToDelete(null);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const getStatusBadge = (etat: SiteStatus) => {
    switch (etat) {
      case 'Opérationnel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Opérationnel
          </span>
        );
      case 'En cours de construction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="h-3 w-3" />
            En cours de construction
          </span>
        );
      case 'Site de transition':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300">
            <Info className="h-3 w-3" />
            Site Provisoire
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="h-3 w-3" />
            {etat || 'Non spécifié'}
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white text-slate-900 rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Moroccan Institutional DGPC Gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-700 flex items-center justify-between shrink-0 relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#C84B31] text-white flex items-center justify-center shadow-md shrink-0 border border-white/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  Organisation des Sites • Service Patrimoine
                </span>
                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                  Région Rabat-Salé-Kénitra
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mt-0.5">
                Fiches Techniques des Dépôts & Magasins
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAddNew}
              className="inline-flex items-center gap-1.5 bg-[#C84B31] hover:bg-[#b54027] text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              title="Ajouter un nouveau site"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau Site</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if any */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Site Selector Tabs Bar */}
        <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 mr-2 shrink-0">
            Choisir un site :
          </span>
          {sites.map(site => {
            const isSelected = activeSite?.id === site.id;
            const isDepot = site.type === 'Dépôt';

            return (
              <button
                key={site.id}
                onClick={() => {
                  setActiveSiteId(site.id);
                  setIsEditing(false);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isSelected
                    ? (isDepot ? 'bg-slate-900 text-white shadow-md' : 'bg-amber-500 text-slate-950 shadow-md')
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {isDepot ? <Warehouse className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                <span>{site.sigle}</span>
                {site.has3DModel && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body: View Mode vs Edit Form */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {isEditing ? (
            /* --- Formulaire d'édition / modification --- */
            <form onSubmit={handleSaveForm} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    {isAddingNew ? 'Créer une Fiche Technique de Site' : `Modifier la Fiche : ${editForm.sigle}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifiez les paramètres administratifs, techniques et opérationnels du site.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Annuler l'édition
                </button>
              </div>

              {/* 1. Identification */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#C84B31]" />
                  1. Identification Administrative
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Région *</label>
                    <input
                      type="text"
                      value={editForm.region || ''}
                      onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Province *</label>
                    <input
                      type="text"
                      value={editForm.province || ''}
                      onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                      placeholder="Ex: Khémisset, Kénitra, Rabat..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Type de site *</label>
                    <select
                      value={editForm.type || 'Magasin'}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value as SiteType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    >
                      <option value="Dépôt">Dépôt</option>
                      <option value="Magasin">Magasin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Désignation Complète *</label>
                    <input
                      type="text"
                      value={editForm.designation || ''}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      placeholder="Ex: Dépôt Logistique d'Assistance aux Sinistres"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Sigle Officiel *</label>
                    <input
                      type="text"
                      value={editForm.sigle || ''}
                      onChange={(e) => setEditForm({ ...editForm, sigle: e.target.value })}
                      placeholder="Ex: DLAS Sidi Allal Bahraoui"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">État Opérationnel</label>
                    <select
                      value={editForm.etat || 'Opérationnel'}
                      onChange={(e) => setEditForm({ ...editForm, etat: e.target.value as SiteStatus })}
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
                      value={editForm.organisme || 'Protection Civile'}
                      onChange={(e) => setEditForm({ ...editForm, organisme: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Option 3D (1 000 m²)</label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.has3DModel || false}
                        onChange={(e) => setEditForm({ ...editForm, has3DModel: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Associer à la Vue 3D</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Caractéristiques & Capacité */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-emerald-600" />
                  2. Caractéristiques & Capacité de Stockage
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Superficie</label>
                    <input
                      type="text"
                      value={editForm.superficie || ''}
                      onChange={(e) => setEditForm({ ...editForm, superficie: e.target.value })}
                      placeholder="Ex: 1 000 m², 450 m²..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Capacité de Stockage</label>
                    <input
                      type="text"
                      value={editForm.capaciteStockage || ''}
                      onChange={(e) => setEditForm({ ...editForm, capaciteStockage: e.target.value })}
                      placeholder="Ex: 3 500 m³ / 180 palettes..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre de Rayonnages</label>
                    <input
                      type="text"
                      value={editForm.nombreRayonnages || ''}
                      onChange={(e) => setEditForm({ ...editForm, nombreRayonnages: e.target.value })}
                      placeholder="Ex: 24 rayonnages lourds..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Adresse / Localisation</label>
                    <input
                      type="text"
                      value={editForm.adresse || ''}
                      onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })}
                      placeholder="Adresse physique exacte..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Coordonnées GPS</label>
                    <input
                      type="text"
                      value={editForm.coordonneesGps || ''}
                      onChange={(e) => setEditForm({ ...editForm, coordonneesGps: e.target.value })}
                      placeholder="Ex: 33.9928° N, 6.5514° W"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Zones de Stockage Définies</label>
                  <textarea
                    rows={2}
                    value={editForm.zonesStockage || ''}
                    onChange={(e) => setEditForm({ ...editForm, zonesStockage: e.target.value })}
                    placeholder="Zone Nord (Secours), Zone Sud (Énergie), Zone Est (Médical)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Détails Techniques & Bâtiment</label>
                  <textarea
                    rows={2}
                    value={editForm.informationsTechniques || ''}
                    onChange={(e) => setEditForm({ ...editForm, informationsTechniques: e.target.value })}
                    placeholder="Structure, sécurité incendie, ventilation, quais niveleurs..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                  />
                </div>
              </div>

              {/* 3. Responsables & Contact */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                  3. Gestion & Responsabilités
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Responsable</label>
                    <input
                      type="text"
                      value={editForm.responsable || ''}
                      onChange={(e) => setEditForm({ ...editForm, responsable: e.target.value })}
                      placeholder="Nom et grade..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Contact</label>
                    <input
                      type="text"
                      value={editForm.contact || ''}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      placeholder="+212 5... / email..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Date Mise en Service</label>
                    <input
                      type="text"
                      value={editForm.dateMiseEnService || ''}
                      onChange={(e) => setEditForm({ ...editForm, dateMiseEnService: e.target.value })}
                      placeholder="Ex: 15/03/2019 ou Prévue T4-2026..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Documents Associés</label>
                    <textarea
                      rows={2}
                      value={editForm.documentsAssocies || ''}
                      onChange={(e) => setEditForm({ ...editForm, documentsAssocies: e.target.value })}
                      placeholder="Plans de masse, autorisations..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Observations</label>
                    <textarea
                      rows={2}
                      value={editForm.observations || ''}
                      onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                      placeholder="Remarques et notes particulières..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:border-[#C84B31]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-[#C84B31] hover:bg-[#b54027] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          ) : activeSite ? (
            /* --- Affichage Détaillé de la Fiche Technique --- */
            <div className="space-y-6">
              
              {/* Site Banner */}
              <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center p-2 shadow-sm border shrink-0 ${
                    activeSite.type === 'Dépôt' 
                      ? 'bg-red-50 text-[#C84B31] border-red-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {activeSite.type === 'Dépôt' ? <Warehouse className="h-7 w-7" /> : <Store className="h-7 w-7" />}
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

                    <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">
                      {activeSite.designation}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{activeSite.adresse || `${activeSite.province}, ${activeSite.region}`}</span>
                    </p>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleStartEdit(activeSite)}
                    className="inline-flex items-center gap-1.5 bg-[#C84B31] hover:bg-[#b54027] text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                    title="Modifier directement cette fiche"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Modifier la Fiche</span>
                  </button>

                  {activeSite.has3DModel && onOpen3DView && (
                    <button
                      onClick={onOpen3DView}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                      title="Ouvrir la modélisation 3D 1 000 m²"
                    >
                      <Box className="h-3.5 w-3.5" />
                      <span>Vue 3D 1 000 m²</span>
                    </button>
                  )}

                  {onOpenSiteDatabase && (
                    <button
                      onClick={() => onOpenSiteDatabase(activeSite.id)}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                      title="Accéder aux bases de données du site"
                    >
                      <span>Entrer dans le Site</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Imprimer la fiche"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  {sites.length > 1 && (
                    <button
                      onClick={() => setSiteToDelete(activeSite)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Supprimer la fiche"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Details Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Cadre Administratif */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Building2 className="h-4 w-4 text-[#C84B31]" />
                    Informations Administratives
                  </span>
                  <dl className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Région</dt>
                      <dd className="font-bold text-slate-900">{activeSite.region || 'N/C'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Province</dt>
                      <dd className="font-bold text-slate-900">{activeSite.province || 'N/C'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Organisme</dt>
                      <dd className="font-bold text-slate-900">{activeSite.organisme || 'Protection Civile'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Mise en service</dt>
                      <dd className="font-bold text-slate-900">{activeSite.dateMiseEnService || 'N/C'}</dd>
                    </div>
                  </dl>
                </div>

                {/* 2. Cadre Bâtiment & Capacité */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Box className="h-4 w-4 text-emerald-600" />
                    Capacité & Bâtiment
                  </span>
                  <dl className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Superficie</dt>
                      <dd className="font-black text-sm text-[#C84B31]">{activeSite.superficie || 'N/C'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Capacité Stock</dt>
                      <dd className="font-bold text-slate-900">{activeSite.capaciteStockage || 'N/C'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Rayonnages</dt>
                      <dd className="font-bold text-slate-900">{activeSite.nombreRayonnages || 'N/C'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Coordonnées GPS</dt>
                      <dd className="font-mono text-[11px] font-bold text-slate-700">{activeSite.coordonneesGps || 'N/C'}</dd>
                    </div>
                  </dl>
                </div>

                {/* 3. Organisation des Zones */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Grid className="h-4 w-4 text-blue-600" />
                      Organisation des Zones de Stockage
                    </span>
                    {activeSite.has3DModel && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Associé au modèle 3D 1 000 m²
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {activeSite.zonesStockage || 'Aucune zone détaillée spécifiée.'}
                  </p>
                </div>

                {/* 4. Responsables & Contacts */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <UserIcon className="h-4 w-4 text-purple-600" />
                    Responsable & Contacts
                  </span>
                  <dl className="space-y-1.5 text-xs">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Responsable</dt>
                      <dd className="font-bold text-slate-900">{activeSite.responsable || 'Non renseigné'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-slate-400">Contact Téléphonique & Mail</dt>
                      <dd className="font-bold text-slate-700">{activeSite.contact || 'Non renseigné'}</dd>
                    </div>
                  </dl>
                </div>

                {/* 5. Sécurité & Spécifications */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Spécifications Techniques Bâtiment
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeSite.informationsTechniques || 'Aucune spécification technique particulière renseignée.'}
                  </p>
                </div>

                {/* 6. Documents & Observations */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    Documents & Observations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Documents Associés</span>
                      <p className="text-slate-700 font-medium">{activeSite.documentsAssocies || 'Néant.'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Observations</span>
                      <p className="text-slate-700 font-medium">{activeSite.observations || 'Néant.'}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            GIS-DGPC • Direction Générale de la Protection Civile RSK
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={Boolean(siteToDelete)}
        title="Supprimer la fiche technique"
        message={`Êtes-vous certain de vouloir supprimer définitivement la fiche technique "${siteToDelete?.sigle}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setSiteToDelete(null)}
      />
    </div>
  );
}
