import React, { useRef } from 'react';
import { StockMovement, Equipment } from '../types';
import { formatBonDateTime, getBonOfficialNumber } from '../lib/dateUtils';
import { Printer, Download, Copy, Check, FileText, CheckCircle2, Shield, QrCode, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface OfficialBonDocumentProps {
  movement: StockMovement | any;
  equipmentDetails?: Equipment | null;
  siteName?: string;
  depotLocation?: string;
  workspaceType?: 'magasin' | 'depot';
  onClose?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function generateOfficialBonPDF(
  movement: StockMovement | any,
  siteName = "Dépôt de Sidi Allal Bahraoui",
  depotLocation = "Khémisset, Rabat-Salé-Kénitra",
  workspaceType: 'magasin' | 'depot' = 'depot'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const isExit = movement.type === 'Sortie';
  const bonNumber = getBonOfficialNumber(movement);
  const dateTime = formatBonDateTime(movement.date);

  // 1. Official DGPC Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Left column (French)
  doc.text("ROYAUME DU MAROC", 15, 12);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("MINISTÈRE DE L'INTÉRIEUR", 15, 16);
  doc.text("DIRECTION GÉNÉRALE DE LA PROTECTION CIVILE", 15, 20);
  doc.setFont("Helvetica", "bold");
  doc.text("COMMANDEMENT RÉGIONAL RABAT-SALÉ-KÉNITRA", 15, 24);
  doc.setFont("Helvetica", "normal");
  doc.text("SERVICE GESTION DU PATRIMOINE", 15, 28);

  // Right column (Meta & Identification)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text(workspaceType === 'magasin' ? "MAGASIN RÉGIONAL" : "DÉPÔT CENTRAL", 195, 12, { align: "right" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(siteName, 195, 16, { align: "right" });
  doc.text(depotLocation, 195, 20, { align: "right" });
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(200, 75, 49);
  doc.text("RÉGION RSK", 195, 24, { align: "right" });

  // Red accent line
  doc.setDrawColor(200, 75, 49);
  doc.setLineWidth(0.8);
  doc.line(15, 32, 195, 32);

  // Gold minor accent line
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.line(15, 33.5, 195, 33.5);

  // 2. Document Title Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 37, 180, 20, 2, 2, 'FD');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isExit ? "BON DE SORTIE ET DE LIVRAISON" : "BON D'ENTRÉE ET DE RÉCEPTION",
    105,
    45,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.setTextColor(200, 75, 49);
  doc.text(`N° DE BON : ${bonNumber}`, 105, 51, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${dateTime.full}`, 105, 55, { align: "center" });

  // 3. Metadata Grid
  let y = 62;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, y, 180, 36, 1.5, 1.5, 'FD');

  // Nature operation badges
  doc.setFontSize(8);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("NATURE : [X] Matériel & Équipement    [ ] Fourniture    [ ] Pièces de rechange", 20, y + 6);

  doc.setDrawColor(241, 245, 249);
  doc.line(20, y + 8.5, 190, y + 8.5);

  if (isExit) {
    // Exit Info
    doc.text("Bénéficiaire / Affectation :", 20, y + 14);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.beneficiaire || movement.destinataire || "Unité d'Intervention RSK", 65, y + 14);

    doc.setFont("Helvetica", "bold");
    doc.text("Service demandeur :", 20, y + 20);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.service || "Protection Civile", 65, y + 20);

    doc.setFont("Helvetica", "bold");
    doc.text("Région / Destination :", 20, y + 26);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.regionDestinataire || movement.region || "Rabat-Salé-Kénitra", 65, y + 26);

    doc.setFont("Helvetica", "bold");
    doc.text("Véhicule / Transport :", 20, y + 32);
    doc.setFont("Helvetica", "normal");
    doc.text([movement.matriculeVehicule, movement.conducteurNom].filter(Boolean).join(" - ") || "Service Interne", 65, y + 32);

    // Right Column
    doc.setFont("Helvetica", "bold");
    doc.text("Agent de sortie :", 120, y + 14);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.agentSortieNom || movement.employe || "Gestionnaire Stock", 152, y + 14);

    doc.setFont("Helvetica", "bold");
    doc.text("Réf. Marché / BC :", 120, y + 20);
    doc.setFont("Helvetica", "normal");
    doc.text(bonNumber, 152, y + 20);

    doc.setFont("Helvetica", "bold");
    doc.text("Ordre / Message :", 120, y + 26);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.message || "—", 152, y + 26);
  } else {
    // Entree Info
    doc.text("Fournisseur / Société :", 20, y + 14);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.societeAttributaire || movement.fournisseur || movement.expediteur || "Fournisseur Agréé", 65, y + 14);

    doc.setFont("Helvetica", "bold");
    doc.text("N° Marché / BC :", 20, y + 20);
    doc.setFont("Helvetica", "normal");
    doc.text(bonNumber, 65, y + 20);

    doc.setFont("Helvetica", "bold");
    doc.text("Livreur / Transporteur :", 20, y + 26);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.livreurNom || "Transporteur autorisé", 65, y + 26);

    doc.setFont("Helvetica", "bold");
    doc.text("Conducteur :", 20, y + 32);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.conducteurNom || "—", 65, y + 32);

    // Right Column
    doc.setFont("Helvetica", "bold");
    doc.text("Réceptionné par :", 120, y + 14);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.employe || "Commission de Réception DGPC", 152, y + 14);

    doc.setFont("Helvetica", "bold");
    doc.text("Service de garde :", 120, y + 20);
    doc.setFont("Helvetica", "normal");
    doc.text(movement.service || "Service Gestion du Patrimoine", 152, y + 20);

    doc.setFont("Helvetica", "bold");
    doc.text("Site de stockage :", 120, y + 26);
    doc.setFont("Helvetica", "normal");
    doc.text(siteName, 152, y + 26);
  }

  // 4. Articles Table
  y = 104;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, y, 180, 8, 'FD');

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Réf.", 18, y + 5.5);
  doc.text("Désignation du Matériel", 45, y + 5.5);
  doc.text("Marque / Catégorie", 115, y + 5.5);
  doc.text("Quantité", 160, y + 5.5);
  doc.text("Unité", 180, y + 5.5);

  // Table Row
  y += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 12, 'FD');

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(movement.equipmentId || "ART-01", 18, y + 7.5);
  
  doc.setFont("Helvetica", "bold");
  const itemName = movement.equipmentNom || movement.nom || "Matériel DGPC";
  doc.text(doc.splitTextToSize(itemName, 65), 45, y + 7.5);

  doc.setFont("Helvetica", "normal");
  doc.text(movement.brand || movement.marque || movement.categorie || "DGPC", 115, y + 7.5);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(200, 75, 49);
  doc.text(String(movement.quantite || movement.qty || 1), 163, y + 7.5);
  
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(movement.unite || "Unité", 180, y + 7.5);

  // 5. Observations Box
  y += 18;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Observations & Remarques :", 15, y);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y + 2, 180, 20, 1.5, 1.5, 'FD');

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const obsText = movement.observations || movement.notes || movement.message || "Conforme aux spécifications techniques et aux normes de dotation en vigueur de la DGPC.";
  doc.text(doc.splitTextToSize(obsText, 172), 19, y + 8);

  // 6. Signatures (3 Official Columns)
  y += 28;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("VISAS ET SIGNATURES RÉGLEMENTAIRES", 105, y, { align: "center" });

  y += 4;
  const colW = 56;
  const colH = 34;

  // Box 1: Livreur / Demandeur
  doc.roundedRect(15, y, colW, colH, 1.5, 1.5);
  doc.setFontSize(7.5);
  doc.setFont("Helvetica", "bold");
  doc.text(isExit ? "1. Visa du Bénéficiaire" : "1. Visa du Livreur / Fournisseur", 18, y + 6);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Date & Signature :", 18, y + 11);

  // Box 2: Agent Magasinier / Gestionnaire
  doc.roundedRect(77, y, colW, colH, 1.5, 1.5);
  doc.setFontSize(7.5);
  doc.setFont("Helvetica", "bold");
  doc.text(isExit ? "2. Visa Agent de Sortie" : "2. Visa Agent Réceptionnaire", 80, y + 6);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Nom : ${movement.employe || movement.agentSortieNom || 'Gestionnaire'}`, 80, y + 11);
  doc.text("Date & Signature :", 80, y + 15);

  // Box 3: Direction / Chef de Service
  doc.roundedRect(139, y, colW, colH, 1.5, 1.5);
  doc.setFontSize(7.5);
  doc.setFont("Helvetica", "bold");
  doc.text("3. Cachet & Visa de la Direction", 142, y + 6);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Commandement Régional RSK", 142, y + 11);
  doc.text("Service Gestion du Patrimoine", 142, y + 15);

  // Footer
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Document généré le ${dateTime.dateStr} à ${dateTime.timeStr} • Système GIS-PATRIMOINE DGPC • Volet ${workspaceType.toUpperCase()}`,
    105,
    285,
    { align: "center" }
  );

  return doc;
}

export default function OfficialBonDocument({
  movement,
  equipmentDetails,
  siteName = "Dépôt de Sidi Allal Bahraoui",
  depotLocation = "Khémisset, Rabat-Salé-Kénitra",
  workspaceType = 'depot',
  onClose,
  onDelete,
  showActions = true,
  compact = false
}: OfficialBonDocumentProps) {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!movement) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
        <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-bold">Sélectionnez un bon pour afficher son aperçu officiel</p>
      </div>
    );
  }

  const isExit = movement.type === 'Sortie';
  const bonNumber = getBonOfficialNumber(movement);
  const dateTime = formatBonDateTime(movement.date);

  const handleDownloadPDF = () => {
    const doc = generateOfficialBonPDF(movement, siteName, depotLocation, workspaceType);
    doc.save(`${isExit ? 'Bon_Sortie' : 'Bon_Entree'}_${bonNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
  };

  const handlePrint = () => {
    const doc = generateOfficialBonPDF(movement, siteName, depotLocation, workspaceType);
    const blobUrl = doc.output('bloburl');
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl as any;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(bonNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      
      {/* Top Action Bar */}
      {showActions && (
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
              isExit 
                ? 'bg-red-50 text-[#C84B31] border-red-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              {isExit ? 'Bon de Sortie' : 'Bon d\'Entrée'}
            </span>
            <span className="text-xs font-black text-slate-800 font-mono">
              {bonNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyRef}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="Copier le N° de bon"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Imprimer le bon directement"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 bg-[#C84B31] hover:bg-[#b54027] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Télécharger le document officiel PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                title="Supprimer ce bon"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Supprimer</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors ml-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Realistic A4 Document Preview Sheet */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100/70">
        <div 
          ref={printRef}
          className="max-w-[760px] mx-auto bg-white rounded-xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-6 text-slate-900 font-sans relative overflow-hidden"
        >
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
            <Shield className="w-96 h-96 text-slate-900" />
          </div>

          {/* 1. Official Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b-2 border-[#C84B31]">
            <div>
              <p className="text-[11px] font-black tracking-wider text-slate-900 uppercase">ROYAUME DU MAROC</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Ministère de l'Intérieur</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase">Direction Générale de la Protection Civile</p>
              <p className="text-[10px] font-black text-[#C84B31] uppercase mt-0.5">Commandement Régional Rabat-Salé-Kénitra</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Service Gestion du Patrimoine</p>
            </div>

            <div className="md:text-right flex flex-col justify-between">
              <div>
                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mb-1 ${
                  workspaceType === 'magasin' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-red-100 text-red-900 border-red-300'
                }`}>
                  {workspaceType === 'magasin' ? 'Espace Magasin' : 'Espace Dépôt Central'}
                </span>
                <p className="text-xs font-black text-slate-900">{siteName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{depotLocation}</p>
              </div>
            </div>
          </div>

          {/* 2. Titre & Numéro de Bon */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-center space-y-1">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
              {isExit ? "BON DE SORTIE ET DE LIVRAISON" : "BON D'ENTRÉE ET DE RÉCEPTION"}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-xs sm:text-sm font-black text-[#C84B31] font-mono tracking-wide">
                N° DE BON : {bonNumber}
              </span>
              <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                {dateTime.full}
              </span>
            </div>
          </div>

          {/* 3. Cadre Métadonnées */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 flex items-center justify-between">
              <span>Nature de l'opération : Matériel & Équipement</span>
              <span className="text-emerald-700 font-black">● Validé & Enregistré</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {isExit ? (
                <>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Bénéficiaire / Affectation</span>
                    <p className="font-bold text-slate-900">{movement.beneficiaire || movement.destinataire || "Unité d'Intervention RSK"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Service Demandeur</span>
                    <p className="font-bold text-slate-900">{movement.service || "Protection Civile"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Région / Destination</span>
                    <p className="font-bold text-slate-900">{movement.regionDestinataire || movement.region || "Rabat-Salé-Kénitra"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Véhicule / Transport</span>
                    <p className="font-bold text-slate-900">{[movement.matriculeVehicule, movement.conducteurNom].filter(Boolean).join(" - ") || "Service Interne"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Agent de Sortie</span>
                    <p className="font-bold text-slate-900">{movement.agentSortieNom || movement.employe || "Gestionnaire Stock"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Réf. Marché / BC</span>
                    <p className="font-mono font-bold text-[#C84B31]">{bonNumber}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Fournisseur / Société</span>
                    <p className="font-bold text-slate-900">{movement.societeAttributaire || movement.fournisseur || movement.expediteur || "Fournisseur Agréé"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">N° Marché / Bon de Commande</span>
                    <p className="font-mono font-bold text-[#C84B31]">{bonNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Livreur / Transporteur</span>
                    <p className="font-bold text-slate-900">{movement.livreurNom || "Transporteur autorisé"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Conducteur</span>
                    <p className="font-bold text-slate-900">{movement.conducteurNom || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Agent Réceptionnaire</span>
                    <p className="font-bold text-slate-900">{movement.employe || "Commission de Réception DGPC"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Service de garde</span>
                    <p className="font-bold text-slate-900">{movement.service || "Service Gestion du Patrimoine"}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 4. Tableau des Articles */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Réf.</th>
                  <th className="py-2.5 px-3">Désignation du Matériel</th>
                  <th className="py-2.5 px-3">Marque / Catégorie</th>
                  <th className="py-2.5 px-3 text-right">Quantité</th>
                  <th className="py-2.5 px-3">Unité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-slate-600">
                    {movement.equipmentId || "ART-01"}
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900">
                    {movement.equipmentNom || movement.nom || "Matériel DGPC"}
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {movement.brand || movement.marque || movement.categorie || "DGPC"}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-sm text-[#C84B31]">
                    {movement.quantite || movement.qty || 1}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium">
                    {movement.unite || "Unité"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Observations & Remarques */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Observations & Remarques
            </span>
            <p className="text-slate-700 font-medium leading-relaxed">
              {movement.observations || movement.notes || movement.message || "Conforme aux spécifications techniques et aux normes de dotation en vigueur de la DGPC."}
            </p>
          </div>

          {/* 6. Signatures et Visas */}
          <div className="pt-2">
            <p className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
              Visas et Signatures Réglementaires
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                  {isExit ? "1. Visa Bénéficiaire" : "1. Visa Livreur / Fournisseur"}
                </span>
                <div className="border-b border-dashed border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-400">Date & Signature :</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                  {isExit ? "2. Visa Agent de Sortie" : "2. Visa Agent Réceptionnaire"}
                </span>
                <span className="text-[9px] font-bold text-slate-600">
                  {movement.employe || movement.agentSortieNom || "Gestionnaire Stock"}
                </span>
                <div className="border-b border-dashed border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-400">Date & Signature :</span>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl p-3 h-28 flex flex-col justify-between bg-slate-50/40">
                <span className="text-[10px] font-extrabold text-slate-700 uppercase">
                  3. Cachet & Visa Direction
                </span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">
                  Commandement Régional RSK
                </span>
                <div className="border-b border-dashed border-slate-300 pb-1">
                  <span className="text-[9px] text-slate-400">Cachet :</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-2 text-[9px] text-slate-400 font-medium">
            Document officiel • Système GIS-PATRIMOINE • Direction Générale de la Protection Civile
          </div>

        </div>
      </div>
    </div>
  );
}
