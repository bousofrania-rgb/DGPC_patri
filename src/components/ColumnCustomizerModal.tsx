import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, RotateCcw, Columns, Sparkles } from 'lucide-react';

export interface ColumnCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnHeaders: Record<string, string>;
  defaultHeaders: Record<string, string>;
  onSave: (newHeaders: Record<string, string>) => void;
}

export default function ColumnCustomizerModal({
  isOpen,
  onClose,
  columnHeaders,
  defaultHeaders,
  onSave,
}: ColumnCustomizerModalProps) {
  const [tempHeaders, setTempHeaders] = useState<Record<string, string>>(() => ({
    ...defaultHeaders,
    ...columnHeaders,
  }));

  // Keep in sync when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempHeaders({
        ...defaultHeaders,
        ...columnHeaders,
      });
    }
  }, [isOpen, columnHeaders, defaultHeaders]);

  const handleChange = (key: string, value: string) => {
    setTempHeaders((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setTempHeaders({ ...defaultHeaders });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempHeaders);
    onClose();
  };

  if (!isOpen) return null;

  // Group columns logically
  const groups = [
    {
      title: "Identification de l'article",
      fields: [
        { key: 'id', label: "Article N°" },
        { key: 'nom', label: "Désignation" },
        { key: 'categorie', label: "Catégorie" },
        { key: 'reference', label: "Référence" },
        { key: 'etat', label: "État" },
      ]
    },
    {
      title: "Gestion des Quantités",
      fields: [
        { key: 'quantite', label: "Quantité Actuelle" },
        { key: 'qteMin', label: "Qté Min (Seuil de sécurité)" },
        { key: 'unite', label: "Unité de mesure" },
      ]
    },
    {
      title: "Entrées en Stock",
      fields: [
        { key: 'marcheOuBc', label: "Marché ou Bon de commande d'entrée" },
        { key: 'numMarche', label: "N° d'entrée" },
        { key: 'societeAttributaire', label: "Société attributaire / Fournisseur" },
        { key: 'qteReceptionnee', label: "Qté Réceptionnée" },
        { key: 'dateReception', label: "Date de réception" },
        { key: 'observationReception', label: "Observation de réception" },
      ]
    },
    {
      title: "Sorties & Décharges",
      fields: [
        { key: 'marcheOuBcSortie', label: "Intitulé Message (Sortie)" },
        { key: 'numMarcheSortie', label: "N° de Message / N° Sortie" },
        { key: 'beneficiaires', label: "Bénéficiaires" },
        { key: 'region', label: "Région" },
        { key: 'qteLivree', label: "Qté Livrée" },
        { key: 'dateLivraison', label: "Date de livraison" },
        { key: 'observationsEnvoi', label: "Observations sur l'envoi" },
      ]
    },
    {
      title: "Emplacement & Traçabilité",
      fields: [
        { key: 'zone', label: "Zone" },
        { key: 'emplacement', label: "Emplacement" },
        { key: 'rfid', label: "RFID" },
        { key: 'codeBarres', label: "CodeBarres" },
        { key: 'derniereMaj', label: "Dernière MAJ" },
      ]
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                <Columns className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Personnalisation des Intitulés de Colonnes
                </h3>
                <p className="text-xs text-slate-500">
                  Modifiez les intitulés des colonnes pour les adapter exactement à la structure de votre base de données.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit}>
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>Application instantanée :</strong> Les modifications d'intitulés seront immédiatement répercutées sur l'affichage du tableau d'inventaire, les formulaires de saisie, ainsi que sur les exports CSV, Excel et PDF.
                </div>
              </div>

              {groups.map((group, gIdx) => (
                <div key={gIdx} className="bg-slate-50/50 rounded-2xl border border-slate-200/70 p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-200/60">
                    {group.title}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          value={tempHeaders[field.key] ?? defaultHeaders[field.key] ?? ''}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          placeholder={defaultHeaders[field.key] || field.label}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Rétablir les intitulés par défaut</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md shadow-red-600/20 transition-colors cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
