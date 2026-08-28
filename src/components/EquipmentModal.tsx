import React from "react";
import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus, Package } from 'lucide-react';
import { Equipment } from '../types';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Equipment, 'rowIndex'>) => void;
  equipment?: Equipment | null; // If provided, we are editing
  nextSuggestedId?: string;
  columnHeaders?: Record<string, string>;
}

export const CATEGORIES = ['Protection', 'Commande', 'Automatisme', 'Variation', 'Machines', 'Capteurs', 'Signalisation', 'Alimentation', 'Câblage', 'Armoires', 'Accessoires', 'Distribution'];
export const ETATS = ['Bon', 'Moyen', 'À réparer', 'Défectueux'];
export const REGIONS_MAROC = [
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

export default function EquipmentModal({
  isOpen,
  onClose,
  onSave,
  equipment,
  nextSuggestedId,
  columnHeaders,
}: EquipmentModalProps) {
  const getHeader = (key: string, fallback: string) => columnHeaders?.[key] || fallback;
  const [id, setId] = useState('');
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Protection');
  const [marque, setMarque] = useState('');
  const [reference, setReference] = useState('');
  const [quantite, setQuantite] = useState<number>(0);
  const [qteMin, setQteMin] = useState<number>(5);
  const [expediteur, setExpediteur] = useState('');
  const [qteReceptionnee, setQteReceptionnee] = useState<number>(0);
  const [dateReception, setDateReception] = useState('');
  const [observationReception, setObservationReception] = useState('');
  const [beneficiaires, setBeneficiaires] = useState('');
  const [region, setRegion] = useState('');
  const [qteEnvoyee, setQteEnvoyee] = useState<number>(0);
  const [dateEnvoi, setDateEnvoi] = useState('');
  const [observationsEnvoi, setObservationsEnvoi] = useState('');
  const [unite, setUnite] = useState('Pièce');
  const [zone, setZone] = useState('Zone A');
  const [emplacement, setEmplacement] = useState('');
  const [rfid, setRfid] = useState('');
  const [codeBarres, setCodeBarres] = useState('');
  const [etat, setEtat] = useState('Bon');
  const [noteUtilisateur, setNoteUtilisateur] = useState('');

  // New states for structural alignment
  const [marcheOuBc, setMarcheOuBc] = useState('');
  const [numMarche, setNumMarche] = useState('');
  const [societeAttributaire, setSocieteAttributaire] = useState('');
  const [livreurNom, setLivreurNom] = useState('');
  const [qteLivree, setQteLivree] = useState<number>(0);
  const [dateLivraison, setDateLivraison] = useState('');
  const [marcheOuBcSortie, setMarcheOuBcSortie] = useState('');
  const [message, setMessage] = useState('');
  const [numMarcheSortie, setNumMarcheSortie] = useState('');
  const [agentSortieNom, setAgentSortieNom] = useState('');
  const [matriculeVehicule, setMatriculeVehicule] = useState('');
  const [conducteurNom, setConducteurNom] = useState('');

  // Local calculation base quantity to prevent infinite loop or buggy math
  const [baseQuantite, setBaseQuantite] = useState<number>(0);

  const [extraColumns, setExtraColumns] = useState<{ [key: string]: string }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  useEffect(() => {
    if (equipment) {
      setId(equipment.id);
      setNom(equipment.nom);
      setCategorie(equipment.categorie || 'Protection');
      setReference(equipment.reference || '');
      setQuantite(equipment.quantite);
      setQteMin(equipment.qteMin ?? 5);
      setExpediteur(equipment.expediteur || '');
      setQteReceptionnee(equipment.qteReceptionnee || 0);
      setDateReception(equipment.dateReception || '');
      setObservationReception(equipment.observationReception || '');
      setBeneficiaires(equipment.beneficiaires || '');
      setRegion(equipment.region || '');
      setObservationsEnvoi(equipment.observationsEnvoi || '');
      setUnite(equipment.unite || 'Pièce');
      setZone(equipment.zone || 'Zone A');
      setEmplacement(equipment.emplacement || '');
      setRfid(equipment.rfid || '');
      setCodeBarres(equipment.codeBarres || '');
      setEtat(equipment.etat || 'Bon');
      
      // Load new fields with fallbacks
      const resolvedSociete = equipment.societeAttributaire || equipment.marque || '';
      setSocieteAttributaire(resolvedSociete);
      setMarque(resolvedSociete);
      setLivreurNom(equipment.livreurNom || '');
      
      setMarcheOuBc(equipment.marcheOuBc || '');
      setNumMarche(equipment.numMarche || '');
      setMarcheOuBcSortie(equipment.marcheOuBcSortie || equipment.message || '');
      setMessage(equipment.message || equipment.marcheOuBcSortie || '');
      setNumMarcheSortie(equipment.numMarcheSortie || '');
      setAgentSortieNom(equipment.agentSortieNom || '');
      setMatriculeVehicule(equipment.matriculeVehicule || '');
      setConducteurNom(equipment.conducteurNom || '');
      setExtraColumns(equipment.extraColumns || {});
      
      const resolvedQteLivree = equipment.qteLivree ?? equipment.qteEnvoyee ?? 0;
      setQteLivree(resolvedQteLivree);
      setQteEnvoyee(resolvedQteLivree);

      const resolvedDateLivraison = equipment.dateLivraison || equipment.dateEnvoi || '';
      setDateLivraison(resolvedDateLivraison);
      setDateEnvoi(resolvedDateLivraison);

      // Stable base calculation (excluding the saved transaction of this item)
      setBaseQuantite(equipment.quantite - (equipment.qteReceptionnee || 0) + resolvedQteLivree);
    } else {
      setId(nextSuggestedId || `EQ-${Math.floor(Math.random() * 10000)}`);
      setNom('');
      setCategorie('Protection');
      setMarque('');
      setReference('');
      setQuantite(0);
      setQteMin(5);
      setExpediteur('');
      setQteReceptionnee(0);
      setDateReception('');
      setObservationReception('');
      setBeneficiaires('');
      setRegion('');
      setQteEnvoyee(0);
      setDateEnvoi('');
      setObservationsEnvoi('');
      setUnite('Pièce');
      setZone('Zone A');
      setEmplacement('');
      setRfid('');
      setCodeBarres('');
      setEtat('Bon');

      // New fields reset
      setMarcheOuBc('');
      setNumMarche('');
      setSocieteAttributaire('');
      setLivreurNom('');
      setQteLivree(0);
      setDateLivraison('');
      setMarcheOuBcSortie('');
      setMessage('');
      setNumMarcheSortie('');
      setAgentSortieNom('');
      setMatriculeVehicule('');
      setConducteurNom('');

      setExtraColumns({});
      setBaseQuantite(0);
    }
    setErrors({});
  }, [equipment, isOpen, nextSuggestedId]);

  if (!isOpen) return null;

  const validate = () => {
    const tempErrors: { [key: string]: string } = {};
    if (!id.trim()) tempErrors.id = 'L\'identifiant est requis';
    if (!nom.trim()) tempErrors.nom = 'La désignation du matériel est requise';
    if (!societeAttributaire.trim()) tempErrors.societeAttributaire = 'La société attributaire est requise';
    if (quantite < 0) tempErrors.quantite = 'La quantité actuelle doit être supérieure ou égale à 0';
    if (qteMin < 0) tempErrors.qteMin = 'La quantité minimale doit être supérieure ou égale à 0';
    if (!zone.trim()) tempErrors.zone = 'La zone de stockage est requise';
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleFileUploadForAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAIGenerating(true);
    setErrors(prev => ({ ...prev, ai: '' }));

    try {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      let fileData = '';
      let mimeType = '';
      let textContent = '';

      if (isImage || isPdf) {
        // Read as base64
        const buffer = await file.arrayBuffer();
        const base64Str = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        fileData = base64Str;
        mimeType = file.type;
      } else {
        // Read as text
        textContent = await file.text();
      }

      const response = await fetch('/api/ai/generate-technical-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, mimeType, textContent })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const aiData = data.data;
      if (aiData.designation) setNom(aiData.designation);
      if (aiData.marque) setMarque(aiData.marque);
      if (aiData.modele_reference) setReference(aiData.modele_reference);

      // Store the rest in extraColumns
      const newExtras = { ...extraColumns };
      if (aiData.caracteristiques_techniques) newExtras["Caractéristiques Techniques"] = aiData.caracteristiques_techniques;
      if (aiData.dimensions) newExtras["Dimensions"] = aiData.dimensions;
      if (aiData.puissance) newExtras["Puissance"] = aiData.puissance;
      if (aiData.tension) newExtras["Tension"] = aiData.tension;
      if (aiData.capacite) newExtras["Capacité"] = aiData.capacite;
      if (aiData.conditions_utilisation) newExtras["Conditions d'Utilisation"] = aiData.conditions_utilisation;
      if (aiData.normes_certifications) newExtras["Normes & Certifications"] = aiData.normes_certifications;
      if (aiData.informations_complementaires) newExtras["Infos Complémentaires"] = aiData.informations_complementaires;

      setExtraColumns(newExtras);

    } catch (error: any) {
      setErrors(prev => ({ ...prev, ai: `Erreur IA : ${error.message}` }));
    } finally {
      setIsAIGenerating(false);
      // reset file input
      e.target.value = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const finalDateReception = qteReceptionnee > 0 ? (dateReception.trim() || new Date().toLocaleDateString('fr-FR')) : '';
    const finalDateLivraison = qteLivree > 0 ? (dateLivraison.trim() || new Date().toLocaleDateString('fr-FR')) : '';
    
    onSave({
      id: id.trim(),
      nom: nom.trim(),
      categorie,
      reference: reference.trim(),
      quantite,
      qteMin,
      expediteur: expediteur.trim(),
      qteReceptionnee,
      dateReception: finalDateReception,
      observationReception: observationReception.trim(),
      beneficiaires: qteLivree > 0 ? beneficiaires.trim() : '',
      region: qteLivree > 0 ? region.trim() : '',
      observationsEnvoi: qteLivree > 0 ? observationsEnvoi.trim() : '',
      unite: unite.trim(),
      zone: zone.trim(),
      emplacement: emplacement.trim(),
      rfid: rfid.trim(),
      codeBarres: codeBarres.trim(),
      etat,
      derniereMaj: new Date().toLocaleDateString('fr-FR'),

      // Aligned properties
      marcheOuBc: marcheOuBc.trim(),
      numMarche: numMarche.trim(),
      societeAttributaire: societeAttributaire.trim(),
      livreurNom: livreurNom.trim(),
      qteLivree,
      dateLivraison: finalDateLivraison,
      marcheOuBcSortie: qteLivree > 0 ? (message.trim() || marcheOuBcSortie.trim()) : '',
      message: qteLivree > 0 ? (message.trim() || marcheOuBcSortie.trim()) : '',
      numMarcheSortie: qteLivree > 0 ? numMarcheSortie.trim() : '',
      agentSortieNom: qteLivree > 0 ? agentSortieNom.trim() : '',
      matriculeVehicule: qteLivree > 0 ? matriculeVehicule.trim() : '',
      conducteurNom: qteLivree > 0 ? conducteurNom.trim() : '',

      // Backward-compat fallback
      marque: societeAttributaire.trim(),
      qteEnvoyee: qteLivree,
      dateEnvoi: finalDateLivraison,
      extraColumns: extraColumns,
    });
  };

  return (
    <AnimatePresence>
      <div id="equipment-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100 transition-all my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header - DGPC Red Brand style */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-red-600 px-6 py-4 text-white">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {equipment ? 'Modifier le matériel' : 'Ajouter un nouveau matériel'}
                </h2>
                <p className="text-[11px] text-red-100 uppercase tracking-widest font-semibold leading-none mt-0.5">
                  Direction Générale de la Protection Civile
                </p>
              </div>
            </div>
            <button
              id="close-equipment-modal-btn"
              onClick={onClose}
              className="rounded-lg p-1.5 text-red-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Row 1: ID & Code-Barres */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('id', 'Article N°')} *
                </label>
                <input
                  id="input-id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={!!equipment}
                  placeholder="Ex. 1, 2, EQ-1042"
                  className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 disabled:opacity-75 focus:bg-white focus:ring-1 focus:ring-red-500 focus:outline-none ${
                    errors.id ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.id && <p className="mt-1 text-xs text-red-500">{errors.id}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('codeBarres', 'Code-barres / EAN')}
                </label>
                <input
                  id="input-codebarres"
                  type="text"
                  value={codeBarres}
                  onChange={(e) => setCodeBarres(e.target.value)}
                  placeholder="Ex. CB000035"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Nom */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {getHeader('nom', 'Désignation')} *
              </label>
              <input
                id="input-nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Coffret électrique étanche IP66"
                className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none ${
                  errors.nom ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
            </div>

            {/* Row 3: Categorie & Société attributaire */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('categorie', 'Catégorie')}
                </label>
                <select
                  id="input-categorie"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('societeAttributaire', 'Société attributaire / Fournisseur')} *
                </label>
                <input
                  id="input-societe-attributaire"
                  type="text"
                  value={societeAttributaire}
                  onChange={(e) => {
                    setSocieteAttributaire(e.target.value);
                    setMarque(e.target.value);
                  }}
                  placeholder="Ex. Schneider Electric"
                  className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none ${
                    errors.societeAttributaire ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.societeAttributaire && <p className="mt-1 text-xs text-red-500">{errors.societeAttributaire}</p>}
              </div>
            </div>

            {/* Row 3.5: Marché ou Bon de commande d'entrée, N° d'entrée & Livreur */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('marcheOuBc', "Marché ou Bon de commande d'entrée")}
                </label>
                <select
                  id="input-marche-ou-bc"
                  value={marcheOuBc}
                  onChange={(e) => setMarcheOuBc(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Marché">Marché</option>
                  <option value="BC">Bon de Commande (BC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('numMarche', "N° d'entrée")}
                </label>
                <input
                  id="input-num-marche"
                  type="text"
                  value={numMarche}
                  onChange={(e) => setNumMarche(e.target.value)}
                  placeholder="Ex. N° 12/2026"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Livreur (Entrée)
                </label>
                <input
                  id="input-livreur-nom"
                  type="text"
                  value={livreurNom}
                  onChange={(e) => setLivreurNom(e.target.value)}
                  placeholder="Nom & prénom du livreur"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3.6: Message, N° de sortie, Agent Sortie, Véhicule & Conducteur */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('marcheOuBcSortie', 'Message (Sortie)')}
                </label>
                <input
                  id="input-message-sortie"
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMarcheOuBcSortie(e.target.value);
                  }}
                  placeholder="Ex. Message N° 15/2026"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('numMarcheSortie', 'N° de sortie')}
                </label>
                <input
                  id="input-num-marche-sortie"
                  type="text"
                  value={numMarcheSortie}
                  onChange={(e) => setNumMarcheSortie(e.target.value)}
                  placeholder="Ex. N° 15/2026"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 3.7: Agent Sortie, Matricule Véhicule, Nom Conducteur */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Agent de sortie
                </label>
                <input
                  id="input-agent-sortie"
                  type="text"
                  value={agentSortieNom}
                  onChange={(e) => setAgentSortieNom(e.target.value)}
                  placeholder="Nom de l'agent"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Matricule Véhicule
                </label>
                <input
                  id="input-matricule-vehicule"
                  type="text"
                  value={matriculeVehicule}
                  onChange={(e) => setMatriculeVehicule(e.target.value)}
                  placeholder="Ex. 12345-A-1"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nom du Conducteur
                </label>
                <input
                  id="input-conducteur-nom"
                  type="text"
                  value={conducteurNom}
                  onChange={(e) => setConducteurNom(e.target.value)}
                  placeholder="Nom du conducteur"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Référence & Code RFID */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('reference', 'Référence constructeur')}
                </label>
                <input
                  id="input-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex. A9F74116"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('rfid', 'Code RFID')}
                </label>
                <input
                  id="input-rfid"
                  type="text"
                  value={rfid}
                  onChange={(e) => setRfid(e.target.value)}
                  placeholder="Ex. RFID0036"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Quantite, Seuil Minimum, Unité */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('quantite', 'Quantité actuelle')} *
                </label>
                <input
                  id="input-quantite"
                  type="number"
                  min="0"
                  value={quantite}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setQuantite(val);
                    setBaseQuantite(val - qteReceptionnee + qteLivree);
                  }}
                  className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none ${
                    errors.quantite ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.quantite && <p className="mt-1 text-xs text-red-500">{errors.quantite}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('qteMin', 'Quantité minimale')} *
                </label>
                <input
                  id="input-qtemin"
                  type="number"
                  min="0"
                  value={qteMin}
                  onChange={(e) => setQteMin(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none ${
                    errors.qteMin ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.qteMin && <p className="mt-1 text-xs text-red-500">{errors.qteMin}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('unite', 'Unité de mesure')}
                </label>
                <input
                  id="input-unite"
                  type="text"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                  placeholder="Ex. Pièce, m, Rouleau"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5.5: Expéditeur & Bénéficiaires */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('expediteur', 'Expéditeur')}
                </label>
                <input
                  id="input-expediteur"
                  type="text"
                  value={expediteur}
                  onChange={(e) => setExpediteur(e.target.value)}
                  placeholder="Ex. NOHATEC SARL"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('beneficiaires', 'Bénéficiaires')}
                </label>
                <input
                  id="input-beneficiaires"
                  type="text"
                  value={beneficiaires}
                  onChange={(e) => setBeneficiaires(e.target.value)}
                  placeholder="Ex. Dépôt patrimoine"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5.6: Qte Réceptionnée & Qte Envoyée */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('qteReceptionnee', 'Quantité Réceptionnée')}
                </label>
                <input
                  id="input-qtereceptionnee"
                  type="number"
                  min="0"
                  value={qteReceptionnee}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setQteReceptionnee(val);
                    setQteLivree(0);
                    setQteEnvoyee(0);
                    setQuantite(baseQuantite + val);
                    
                    if (val > 0) {
                      setDateReception(new Date().toLocaleDateString('fr-FR'));
                    } else {
                      setDateReception('');
                    }
                  }}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('qteLivree', 'Quantité Livrée')}
                </label>
                <input
                  id="input-qtelivree"
                  type="number"
                  min="0"
                  value={qteLivree}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setQteLivree(val);
                    setQteEnvoyee(val);
                    setQteReceptionnee(0);
                    setQuantite(Math.max(0, baseQuantite - val));
                    
                    if (val > 0) {
                      setDateLivraison(new Date().toLocaleDateString('fr-FR'));
                    } else {
                      setDateLivraison('');
                    }
                  }}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5.7: Région */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {getHeader('region', 'Région')}
              </label>
              <select
                id="input-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
              >
                <option value="">-- Choisir une région (Maroc) --</option>
                {REGIONS_MAROC.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 5.8: Observations */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {getHeader('observationsEnvoi', "Observations sur l'envoi / réception")}
              </label>
              <textarea
                id="input-observations"
                value={observationsEnvoi}
                onChange={(e) => setObservationsEnvoi(e.target.value)}
                placeholder="Observations, historique d'envoi ou détails additionnels..."
                rows={3}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {/* Row 5.9: Note utilisateur */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Note utilisateur
              </label>
              <textarea
                id="input-noteutilisateur"
                value={noteUtilisateur}
                onChange={(e) => setNoteUtilisateur(e.target.value)}
                placeholder="Champ de note libre pour ajouter des spécifications ou remarques complémentaires..."
                rows={3}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {/* Row 6: Zone, Emplacement & État */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('zone', 'Zone de stockage')} *
                </label>
                <input
                  id="input-zone"
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="Ex. Zone H"
                  className={`mt-1.5 block w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none ${
                    errors.zone ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.zone && <p className="mt-1 text-xs text-red-500">{errors.zone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('emplacement', 'Emplacement précis')}
                </label>
                <input
                  id="input-emplacement"
                  type="text"
                  value={emplacement}
                  onChange={(e) => setEmplacement(e.target.value)}
                  placeholder="Ex. H-02-B"
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {getHeader('etat', 'État du matériel')}
                </label>
                <select
                  id="input-etat"
                  value={etat}
                  onChange={(e) => setEtat(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-1 focus:ring-red-500 focus:outline-none bg-white"
                >
                  {ETATS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Generated Extra Columns */}
            {Object.keys(extraColumns).length > 0 && (
              <div className="bg-slate-50 border-2 border-slate-100 rounded-xl p-4 mt-6">
                <h4 className="text-xs font-black text-slate-800 uppercase mb-3 flex items-center gap-2">
                  <span className="text-indigo-600">⚡</span> Informations Techniques (IA)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extraColumns).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setExtraColumns({ ...extraColumns, [key]: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-5">
              <button
                id="equipment-modal-cancel-btn"
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                id="equipment-modal-save-btn"
                type="submit"
                className="inline-flex items-center space-x-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-md shadow-red-500/10 transition-colors"
              >
                {equipment ? (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Enregistrer</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Créer l'équipement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
