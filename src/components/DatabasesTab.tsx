import React, { useState, useRef } from 'react';
import { Database, Upload, FileText, CheckCircle2, Clock, Plus, AlertTriangle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { DatabaseImport, Equipment } from '../types';
import * as XLSX from 'xlsx';

interface DatabasesTabProps {
  importHistory: DatabaseImport[];
  onImport: (newItems: Equipment[], fileInfo: { fileName: string; recordCount: number; status: 'Succès' | 'Échec' | 'Partiel' }) => void;
}

export default function DatabasesTab({ importHistory, onImport }: DatabasesTabProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
      if (isExcel) {
        parseExcelFile(file);
      } else {
        setError("Veuillez choisir un fichier Excel valide (.XLSX, .XLS, ou .CSV).");
      }
    }
  };

  const parseExcelFile = (file: File) => {
    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Impossible de lire les données du fichier.");

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        let totalItems: Equipment[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (rawRows.length < 2) return;

          const headerRow = rawRows[0] as string[];
          const normHeader = (h: any) => String(h || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9#°]/g, "");
          const cleanedHeaders = headerRow.map(h => normHeader(h));
          
          const findColIndex = (exactNames: string[], containsNames: string[], excludedTerms: string[] = []) => {
            for (const name of exactNames) {
              const target = normHeader(name);
              const idx = cleanedHeaders.indexOf(target);
              if (idx !== -1) return idx;
            }
            for (const name of containsNames) {
              const target = normHeader(name);
              const idx = cleanedHeaders.findIndex(cleaned => {
                if (cleaned.includes(target)) {
                  return !excludedTerms.some(term => cleaned.includes(normHeader(term)));
                }
                return false;
              });
              if (idx !== -1) return idx;
            }
            return -1;
          };

          const colIndices = {
            id: findColIndex(['Article N°', 'Article Numéro', 'Article No', 'ID'], ['articlen', 'id', 'codemat', 'matricule'], ['nummarche', 'numeromarche', 'marche', 'bc', 'rfid']),
            nom: findColIndex(['Désignation', 'Designation', 'Désignations', 'Article', 'Matériel', 'Nom'], ['designation', 'nom', 'materiel', 'matériel'], ['num', 'n°', 'no', 'reference', 'ref', 'rfid']),
            categorie: findColIndex(['Catégorie', 'Categorie'], ['categor', 'type']),
            reference: findColIndex(['Référence', 'Reference'], ['ref', 'model']),
            quantite: findColIndex(['Quantité Actuelle', 'Quantite Actuelle', 'Quantité', 'Stock Actuel'], ['quantite', 'qte', 'stock'], ['min', 'seuil', 'reception', 'livr', 'envoi']),
            qteMin: findColIndex(['Qté Min', 'Qte Min', 'Seuil Alerte', 'Seuil'], ['min', 'seuil']),
            etat: findColIndex(['État', 'Etat', 'Condition'], ['etat', 'condition', 'statut']),
            unite: findColIndex(['Unité', 'Unite', 'Conditionnement'], ['unite', 'condit']),
            zone: findColIndex(['Zone', 'Magasin'], ['zone', 'magasin']),
            emplacement: findColIndex(['Emplacement', 'Rayon'], ['emplac', 'rayon']),
            rfid: findColIndex(['Code RFID', 'RFID', 'Tag RFID'], ['rfid', 'tag']),
            codeBarres: findColIndex(['Code Barres', 'Code-Barres', 'EAN'], ['codebar', 'ean', 'barre'])
          };

          if (colIndices.nom === -1) return; // Skip if no name column

          for (let i = 1; i < rawRows.length; i++) {
            const row = rawRows[i];
            if (!row || row.length === 0 || !row[colIndices.nom]) continue;

            const eq: Equipment = {
              id: colIndices.id !== -1 && row[colIndices.id] ? String(row[colIndices.id]).trim() : `IMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              nom: String(row[colIndices.nom]).trim(),
              categorie: colIndices.categorie !== -1 && row[colIndices.categorie] ? String(row[colIndices.categorie]).trim() : 'Général',
              reference: colIndices.reference !== -1 && row[colIndices.reference] ? String(row[colIndices.reference]).trim() : '',
              quantite: colIndices.quantite !== -1 ? (Number(row[colIndices.quantite]) || 0) : 0,
              qteMin: colIndices.qteMin !== -1 ? (Number(row[colIndices.qteMin]) || 5) : 5,
              unite: colIndices.unite !== -1 && row[colIndices.unite] ? String(row[colIndices.unite]).trim() : 'Unité',
              etat: colIndices.etat !== -1 && row[colIndices.etat] ? String(row[colIndices.etat]).trim() : 'Bon',
              zone: colIndices.zone !== -1 && row[colIndices.zone] ? String(row[colIndices.zone]).trim() : 'Zone Générale',
              emplacement: colIndices.emplacement !== -1 && row[colIndices.emplacement] ? String(row[colIndices.emplacement]).trim() : '-',
              rfid: colIndices.rfid !== -1 && row[colIndices.rfid] ? String(row[colIndices.rfid]).trim() : '',
              codeBarres: colIndices.codeBarres !== -1 && row[colIndices.codeBarres] ? String(row[colIndices.codeBarres]).trim() : '',
              derniereMaj: new Date().toLocaleDateString('fr-FR'),
              marque: '',
              rowIndex: totalItems.length + 2
            };
            totalItems.push(eq);
          }
        });

        if (totalItems.length > 0) {
          onImport(totalItems, {
            fileName: file.name,
            recordCount: totalItems.length,
            status: 'Succès'
          });
        } else {
          setError("Aucun article n'a pu être extrait du fichier. Vérifiez les entêtes.");
        }
      } catch (err: any) {
        console.error("Excel parse error:", err);
        setError(err.message || "Erreur lors du traitement du fichier Excel.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Database className="h-6 w-6 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bases de données</h1>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Centralisation et historique des données importées
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".xlsx,.xls,.csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Importation...
              </span>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importer une base de données
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">Erreur d'importation</h4>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* HISTORIQUE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Clock className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-black text-slate-900">Historique des importations</h2>
        </div>

        <div className="p-6">
          {importHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-base font-black text-slate-900">Aucune importation</h3>
              <p className="text-sm font-medium text-slate-500 mt-1 max-w-sm mx-auto">
                Les bases de données importées s'afficheront ici. Elles sont automatiquement ajoutées à la base globale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="p-4 rounded-tl-xl">Fichier importé</th>
                    <th className="p-4">Date et Heure</th>
                    <th className="p-4">Enregistrements ajoutés</th>
                    <th className="p-4 rounded-tr-xl">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {importHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <FileText className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-slate-900">{record.fileName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">
                        {record.importDate}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-black rounded-lg text-xs">
                          +{record.recordCount} articles
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                          record.status === 'Succès' ? 'bg-emerald-50 text-emerald-700' :
                          record.status === 'Partiel' ? 'bg-orange-50 text-orange-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {record.status === 'Succès' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {record.status === 'Partiel' && <AlertTriangle className="h-3.5 w-3.5" />}
                          {record.status === 'Échec' && <AlertCircle className="h-3.5 w-3.5" />}
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
