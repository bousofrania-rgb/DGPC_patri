import React, { useState, useMemo } from 'react';
import { StockMovement, User } from '../types';
import { FileText, Download, Printer, Eye, Search, Trash2, ArrowUpRight, Store, Warehouse, Calendar, Clock } from 'lucide-react';
import OfficialBonDocument, { generateOfficialBonPDF } from './OfficialBonDocument';
import ConfirmModal from './ConfirmModal';
import { formatBonDateTime, getBonOfficialNumber } from '../lib/dateUtils';

interface DocsSortiesTabProps {
  historyLogs: StockMovement[];
  user?: User | null;
  onDeleteLog?: (logId: string) => void;
  siteName?: string;
  depotLocation?: string;
  workspaceType?: 'magasin' | 'depot';
  showToast?: (msg: string) => void;
}

export default function DocsSortiesTab({ 
  historyLogs, 
  user,
  onDeleteLog,
  siteName = "Dépôt de Sidi Allal Bahraoui",
  depotLocation = "Khémisset, Rabat-Salé-Kénitra",
  workspaceType = 'depot',
  showToast
}: DocsSortiesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [logToDelete, setLogToDelete] = useState<StockMovement | null>(null);

  const sortiesLogs = useMemo(() => {
    return historyLogs
      .filter(log => log.type === 'Sortie')
      .filter(log => {
        const term = searchTerm.toLowerCase();
        const bonNum = getBonOfficialNumber(log).toLowerCase();
        return (
          log.equipmentNom.toLowerCase().includes(term) ||
          bonNum.includes(term) ||
          (log.numMarcheSortie && log.numMarcheSortie.toLowerCase().includes(term)) ||
          (log.marcheOuBcSortie && log.marcheOuBcSortie.toLowerCase().includes(term)) ||
          (log.beneficiaire && log.beneficiaire.toLowerCase().includes(term)) ||
          (log.regionDestinataire && log.regionDestinataire.toLowerCase().includes(term)) ||
          (log.service && log.service.toLowerCase().includes(term)) ||
          (log.agentSortieNom && log.agentSortieNom.toLowerCase().includes(term)) ||
          (log.employe && log.employe.toLowerCase().includes(term))
        );
      });
  }, [historyLogs, searchTerm]);

  // Auto-select the first item if none selected or if selected item is filtered out
  const activeLog = useMemo(() => {
    if (selectedLogId) {
      const found = sortiesLogs.find(l => l.id === selectedLogId);
      if (found) return found;
    }
    return sortiesLogs.length > 0 ? sortiesLogs[0] : null;
  }, [sortiesLogs, selectedLogId]);

  const handleDeleteConfirm = () => {
    if (!logToDelete || !onDeleteLog) return;
    onDeleteLog(logToDelete.id);
    if (showToast) {
      showToast(`Bon de sortie N° ${getBonOfficialNumber(logToDelete)} supprimé avec succès`);
    }
    if (selectedLogId === logToDelete.id) {
      setSelectedLogId(null);
    }
    setLogToDelete(null);
  };

  const isAuthorizedToDelete = true;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-red-50 text-[#C84B31] border border-red-200 rounded-2xl shadow-xs">
            <ArrowUpRight className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#C84B31] border border-red-300 px-2.5 py-0.5 rounded-full">
                Décharges & Livraisons
              </span>
              <span className="text-xs font-bold text-slate-500">
                {sortiesLogs.length} bon(s) de sortie
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mt-0.5">
              Bons de Sortie & Décharges
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Consultez, imprimez ou exportez les décharges et bons de livraison au format officiel DGPC
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Rechercher par N° bon, BC, bénéficiaire, article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#C84B31] focus:ring-2 focus:ring-red-100 text-xs font-bold text-slate-900 bg-slate-50/50"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Main Master-Detail Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Bons List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Liste des Bons de Sortie
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                Cliquez pour prévisualiser
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {sortiesLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-2">
                  <FileText className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
                  <p>Aucun bon de sortie enregistré.</p>
                </div>
              ) : (
                sortiesLogs.map((log) => {
                  const isSelected = activeLog?.id === log.id;
                  const bonNum = getBonOfficialNumber(log);
                  const dt = formatBonDateTime(log.date);

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected 
                          ? 'bg-red-50/80 border-l-4 border-[#C84B31] shadow-xs' 
                          : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-mono text-xs font-black px-2 py-0.5 rounded border ${
                            isSelected 
                              ? 'bg-[#C84B31] text-white border-red-700' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {bonNum}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {dt.full}
                          </span>
                        </div>

                        <p className="text-xs font-black text-slate-900 truncate">
                          {log.equipmentNom}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                          <span className="font-bold text-red-600">
                            -{log.quantite} {log.unite || 'unité(s)'}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {log.beneficiaire || log.destinataire || "Unité d'Intervention"}
                          </span>
                        </div>
                      </div>

                      {/* Delete action button */}
                      {isAuthorizedToDelete && onDeleteLog && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogToDelete(log);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Supprimer ce bon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Live PDF / Official Document Preview (7 Cols) */}
        <div className="lg:col-span-7 sticky top-20">
          <OfficialBonDocument
            movement={activeLog}
            siteName={siteName}
            depotLocation={depotLocation}
            workspaceType={workspaceType}
            showActions={true}
            onDelete={isAuthorizedToDelete && onDeleteLog && activeLog ? () => setLogToDelete(activeLog) : undefined}
          />
        </div>

      </div>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(logToDelete)}
        title="Supprimer le bon de sortie"
        message={`Êtes-vous certain de vouloir supprimer le bon de sortie N° ${logToDelete ? getBonOfficialNumber(logToDelete) : ''} (${logToDelete?.equipmentNom}) ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        cancelText="Annuler"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setLogToDelete(null)}
      />

    </div>
  );
}
