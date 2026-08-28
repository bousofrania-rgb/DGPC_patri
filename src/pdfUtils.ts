import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

// Helper to safely load image element
export const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export interface OfficialHeaderOptions {
  siteName?: string;
  depotLocation?: string;
  workspaceType?: 'magasin' | 'depot';
  documentReference?: string;
  isLandscape?: boolean;
}

/**
 * Adds the official high-standard DGPC & Ministère de l'Intérieur header
 * Includes official visual logo/banner or fallback crisp vectorized typographic header
 */
export const addOfficialHeader = async (
  doc: jsPDF, 
  options: OfficialHeaderOptions = {}
): Promise<number> => {
  const isLandscape = options.isLandscape || doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const usableWidth = pageWidth - (marginX * 2);

  let startY = 10;
  let bannerRendered = false;

  try {
    const headerImg = await loadImageElement('https://i.ibb.co/DgvhJJMk/Capture-d-cran-2026-07-14-220747.png');
    if (headerImg && headerImg.width > 0) {
      const imgWidth = Math.min(usableWidth, isLandscape ? 260 : 186);
      const imgHeight = imgWidth * (headerImg.height / headerImg.width);
      const imgX = (pageWidth - imgWidth) / 2;
      doc.addImage(headerImg, 'PNG', imgX, 5, imgWidth, imgHeight);
      startY = 5 + imgHeight + 3;
      bannerRendered = true;
    }
  } catch (e) {
    bannerRendered = false;
  }

  if (!bannerRendered) {
    // Official governmental header (French & Arabic styled typographic layout)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42); // Slate 900

    // Left Column: Official Administrative Hierarchy
    doc.text("ROYAUME DU MAROC", marginX, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text("MINISTÈRE DE L'INTÉRIEUR", marginX, 14);
    doc.text("DIRECTION GÉNÉRALE DE LA PROTECTION CIVILE", marginX, 18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("COMMANDEMENT RÉGIONAL RABAT-SALÉ-KÉNITRA", marginX, 22);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("SERVICE GESTION DU PATRIMOINE & CONFORMITÉ TECHNIQUE", marginX, 26);

    // Right Column: Entity & Location
    const rightAlignX = pageWidth - marginX;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(
      options.workspaceType === 'magasin' ? "MAGASIN RÉGIONAL PRINCIPAL" : "DÉPÔT CENTRAL DU PATRIMOINE", 
      rightAlignX, 
      10, 
      { align: "right" }
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(options.siteName || "Dépôt Central de Sidi Allal Bahraoui", rightAlignX, 14, { align: "right" });
    doc.text(options.depotLocation || "Khémisset, Région Rabat-Salé-Kénitra", rightAlignX, 18, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(220, 38, 38); // Official Red
    doc.text("DIRECTION LOGISTIQUE & ACHATS", rightAlignX, 22, { align: "right" });

    if (options.documentReference) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Réf : ${options.documentReference}`, rightAlignX, 26, { align: "right" });
    }

    startY = 29;
  }

  // Official Red and Gold Accent Lines
  doc.setDrawColor(220, 38, 38); // DGPC Red
  doc.setLineWidth(0.8);
  doc.line(marginX, startY, pageWidth - marginX, startY);

  doc.setDrawColor(217, 119, 6); // Amber Gold
  doc.setLineWidth(0.3);
  doc.line(marginX, startY + 1.2, pageWidth - marginX, startY + 1.2);

  return startY + 5;
};

/**
 * Standard Document Title Banner with badges and metadata
 */
export const addDocumentTitleBanner = (
  doc: jsPDF,
  {
    startY,
    title,
    subtitle,
    badge,
    badgeColor = [79, 70, 229], // purple/indigo default
    metadata = [],
    isLandscape = false
  }: {
    startY: number;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: [number, number, number];
    metadata?: Array<{ label: string; value: string }>;
    isLandscape?: boolean;
  }
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const boxWidth = pageWidth - (marginX * 2);

  let currentY = startY;

  // Title Container Box
  const boxHeight = metadata.length > 0 ? 25 : 17;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  // Title Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, marginX + 6, currentY + 6.5);

  // Badge (if provided)
  if (badge) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    const badgeWidth = doc.getTextWidth(badge) + 6;
    const badgeX = pageWidth - marginX - badgeWidth - 6;
    
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(badgeX, currentY + 3, badgeWidth, 5.5, 1.2, 1.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(badge, badgeX + 3, currentY + 6.8);
  }

  // Subtitle
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, marginX + 6, currentY + 11.5);
  }

  // Metadata items
  if (metadata.length > 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX + 4, currentY + 14.5, pageWidth - marginX - 4, currentY + 14.5);

    let metaX = marginX + 6;
    const colWidth = (boxWidth - 12) / Math.max(metadata.length, 1);

    metadata.forEach((m) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(m.label.toUpperCase() + " :", metaX, currentY + 19);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(m.value, metaX, currentY + 23);

      metaX += colWidth;
    });
  }

  return currentY + boxHeight + 5;
};

/**
 * Standard Metric Summary Cards (Conforme, Non conforme, etc.)
 */
export const addSummaryCards = (
  doc: jsPDF,
  startY: number,
  cards: Array<{
    title: string;
    value: string | number;
    subtitle?: string;
    color: [number, number, number];
    bgColor: [number, number, number];
  }>
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const totalWidth = pageWidth - (marginX * 2);
  const cardGap = 3.5;
  const cardWidth = (totalWidth - (cardGap * (cards.length - 1))) / cards.length;
  const cardHeight = 15;

  let x = marginX;
  cards.forEach(card => {
    doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
    doc.setDrawColor(card.color[0], card.color[1], card.color[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.title.toUpperCase(), x + 3.5, startY + 4.2);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(card.value), x + 3.5, startY + 9.8);

    // Subtitle
    if (card.subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(card.subtitle, x + 3.5, startY + 13.2);
    }

    x += cardWidth + cardGap;
  });

  return startY + cardHeight + 5;
};

/**
 * Unified autoTable styling options matching the DGPC modern standard
 */
export const getStandardAutoTableOptions = (custom: Partial<UserOptions> = {}): UserOptions => {
  return {
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
      cellPadding: 2.2,
      lineColor: [51, 65, 85],
      lineWidth: 0.2,
      ...custom.headStyles
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      valign: 'middle',
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      ...custom.bodyStyles
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
      ...custom.alternateRowStyles
    },
    styles: {
      font: "helvetica",
      overflow: 'linebreak',
      ...custom.styles
    },
    ...custom
  };
};

/**
 * Standard Signatures and Validation Box
 */
export const addOfficialSignatureBlock = (
  doc: jsPDF,
  startY: number,
  options: {
    leftTitle?: string;
    leftSubtitle?: string;
    rightTitle?: string;
    rightSubtitle?: string;
    locationDate?: string;
  } = {}
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;

  let y = startY;
  if (y + 38 > pageHeight - 16) {
    doc.addPage();
    y = 20;
  }

  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultDate = `Rabat, le ${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
  const locDate = options.locationDate || defaultDate;

  // Left Signatory Box
  const leftX = marginX + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(options.leftTitle || "« Commission Technique de Contrôle »", leftX, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(options.leftSubtitle || "Visa, Signature et Mention Manuscrite", leftX, y + 9.5);
  
  // Left dotted signature box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, y + 12, 75, 20, 1.5, 1.5);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("[ Cachet Officiel & Signature ]", leftX + 20, y + 23);

  // Right Signatory Box
  const rightX = pageWidth - marginX - 79;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(options.rightTitle || "« Le Chef de Centre / Commandant »", rightX, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(locDate, rightX, y + 9.5);

  // Right dotted signature box
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(rightX, y + 12, 75, 20, 1.5, 1.5);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("[ Visa de Validation & Cachet ]", rightX + 20, y + 23);

  return y + 36;
};

/**
 * Standard Page Footers across all pages
 * Adds page numbering "Page X sur Y", confidential notice, and DGPC signature
 */
export const addOfficialPageFooters = (doc: jsPDF) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 12;

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} à ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    // Footer text Left
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      "DIRECTION GÉNÉRALE DE LA PROTECTION CIVILE — SYSTÈME DE GESTION & CONFORMITÉ TECHNIQUE", 
      marginX, 
      pageHeight - 6
    );

    // Footer text Center
    doc.text(
      `Document officiel généré le ${dateStr}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );

    // Footer text Right (Page numbering)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Page ${i} sur ${totalPages}`, 
      pageWidth - marginX, 
      pageHeight - 6, 
      { align: "right" }
    );
  }
};

/**
 * Complete, High-Standard PDF Exporter for Verification & Compliance Analysis
 */
export const exportComplianceReportPDF = async (
  results: any,
  documents: Array<{ title: string; fileName?: string }>,
  tolerance: string = '0%',
  onSuccess?: (msg: string) => void
) => {
  if (!results) return;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const usableWidth = pageWidth - (marginX * 2);

  // 1. Official Header
  let y = await addOfficialHeader(doc, {
    siteName: "Dépôt Central Sidi Allal Bahraoui",
    depotLocation: "Rabat-Salé-Kénitra",
    documentReference: `RAP-CONF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const articles = results.articles || [];
  let totalCarac = 0;
  let totalConformes = 0;
  let totalConformesTolerance = 0;
  let totalNonConformes = 0;
  let conformesArticles = 0;
  let conformesToleranceArticles = 0;
  let nonConformesArticles = 0;
  let mainDivergences: string[] = [];

  articles.forEach((art: any) => {
    let artCaracTotal = 0;
    let artNonConf = 0;
    let artTol = 0;

    (art.caracteristiques || []).forEach((c: any) => {
      totalCarac++;
      artCaracTotal++;
      
      const isNonConf = c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'));
      const hasEcart = c.ecart && c.ecart !== '0' && c.ecart !== '0 %' && c.ecart !== '—' && c.ecart.toLowerCase() !== 'identique';

      if (isNonConf) {
        totalNonConformes++;
        artNonConf++;
        mainDivergences.push(`${art.designation} - ${c.caracteristique} : Exigence (${c.valeur_demandee || c.valeur_doc1 || ''}) vs Proposition (${c.valeur_proposee || c.valeur_doc2 || ''})`);
      } else if (hasEcart) {
        totalConformesTolerance++;
        artTol++;
      } else {
        totalConformes++;
      }
    });

    if (artNonConf > 0) {
      nonConformesArticles++;
    } else if (artTol > 0) {
      conformesToleranceArticles++;
    } else {
      conformesArticles++;
    }
  });

  // EN-TÊTE DU RAPPORT (Title, Date, Reference, Tolerance)
  const doc1Title = documents[0]?.title || documents[0]?.fileName || 'Document 1';
  const doc2Title = documents[1]?.title || documents[1]?.fileName || 'Document 2';

  y = addDocumentTitleBanner(doc, {
    startY: y,
    title: "RAPPORT DE VÉRIFICATION DE CONFORMITÉ TECHNIQUE",
    subtitle: `Analyse comparative détaillée : ${doc1Title} ⟷ ${doc2Title}`,
    badge: nonConformesArticles === 0 ? "✅ TOTALEMENT CONFORME" : "❌ DIVERGENCES DÉTECTÉES",
    badgeColor: nonConformesArticles === 0 ? [22, 101, 52] : [185, 28, 28],
    metadata: [
      { label: "Date de l'analyse", value: new Date().toLocaleString('fr-FR') },
      { label: "Articles concernés", value: `${articles.length} article(s)` },
      { label: "Tolérance appliquée", value: tolerance }
    ]
  });

  // Iterate over each article
  for (let idx = 0; idx < articles.length; idx++) {
    const art = articles[idx];
    
    // Check space for article title
    if (y > 250) { doc.addPage(); y = 20; }

    // Article Title
    doc.setFillColor(30, 41, 59);
    doc.rect(marginX, y, 4, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Article ${idx + 1} : ${art.designation}`, marginX + 7, y + 6);
    y += 12;

    // Build Table for this article
    const caracs = art.caracteristiques || [];
    const tableRows = caracs.map((c: any) => {
      const isNonConf = c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'));
      return [
        c.caracteristique || 'Caractéristique technique',
        c.valeur_demandee || c.valeur_doc1 || '—',
        c.valeur_proposee || c.valeur_doc2 || '—',
        c.ecart || c.ecart_constate || '—',
        c.tolerance || tolerance,
        isNonConf ? '❌ Non conforme' : '✅ Conforme'
      ];
    });

    // Add baseline identifiers if missing (Désignation, Référence) if available in root object
    if (art.reference_modele && !tableRows.find((r: any[]) => String(r[0]).toLowerCase().includes('référence'))) {
      tableRows.unshift(['Référence', '—', art.reference_modele, '—', '—', '✅ Conforme']);
    }

    autoTable(doc, getStandardAutoTableOptions({
      startY: y,
      head: [['Caractéristique', 'Exigence – Document 1', 'Proposition – Document 2', 'Écart', 'Tolérance', 'Statut']],
      body: tableRows,
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 31, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = String(data.cell.raw || '');
          if (val.includes('Non conforme') || val.includes('❌')) {
            data.cell.styles.textColor = [185, 28, 28]; // Red
            data.cell.styles.fillColor = [254, 242, 242];
          } else {
            data.cell.styles.textColor = [22, 101, 52]; // Green
          }
        }
      }
    }));

    y = (doc as any).lastAutoTable.finalY + 8;

    // Détails de la conformité technique (After Table)
    if (y > 250) { doc.addPage(); y = 20; }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("Détails de la conformité technique", marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    caracs.forEach((c: any) => {
      const isNonConf = c.criticite === 'non_conforme' || (c.resultat && c.resultat.toLowerCase().includes('non conforme'));
      const statusText = isNonConf ? "Non conforme" : "Conforme";
      const detailText = `• ${c.caracteristique} : ${statusText}. Demandé: ${c.valeur_demandee || '—'} | Proposé: ${c.valeur_proposee || '—'}. ${c.observation || (isNonConf ? 'La proposition dépasse la tolérance autorisée ou est divergente.' : 'La proposition respecte les exigences et la tolérance appliquée.')}`;
      
      const splitDetail = doc.splitTextToSize(detailText, usableWidth);
      if (y + (splitDetail.length * 4) > 280) { doc.addPage(); y = 20; }
      doc.text(splitDetail, marginX, y);
      y += (splitDetail.length * 4) + 1;
    });

    y += 4;

    // Conclusion de l'article
    if (y > 260) { doc.addPage(); y = 20; }

    const isArtConf = tableRows.every((r: any[]) => r[5].includes('✅'));
    const statusLabel = isArtConf ? "✅ CONFORME" : "❌ NON CONFORME";
    
    doc.setFillColor(isArtConf ? 240 : 254, isArtConf ? 253 : 242, isArtConf ? 244 : 242);
    doc.setDrawColor(isArtConf ? 134 : 248, isArtConf ? 239 : 113, isArtConf ? 172 : 113);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, y, usableWidth, 18, 1, 1, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(isArtConf ? 22 : 185, isArtConf ? 101 : 28, isArtConf ? 52 : 28);
    doc.text(`STATUT GLOBAL : ${statusLabel}`, marginX + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    
    const conclusionText = art.resume_article || (isArtConf 
      ? `L'article respecte l'ensemble des caractéristiques techniques exigées en tenant compte de la tolérance de ${tolerance}. Il est considéré comme conforme.` 
      : `L'article présente des écarts supérieurs à la tolérance autorisée (${tolerance}) sur certaines caractéristiques techniques (ex: ${caracs.filter((c:any) => c.criticite === 'non_conforme').map((c:any) => c.caracteristique).join(', ')}). L'article est donc considéré comme non conforme.`);

    const splitConc = doc.splitTextToSize(conclusionText, usableWidth - 8);
    doc.text(splitConc, marginX + 4, y + 11);
    
    y += 24;
  }

  // 5. Synthèse Générale
  doc.addPage();
  y = 20;

  doc.setFillColor(15, 23, 42);
  doc.rect(marginX, y, 4, 8, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Synthèse générale", marginX + 7, y + 6);
  y += 14;

  const metrics = [
    { label: "Nombre total d'articles analysés", value: articles.length },
    { label: "Nombre d'articles conformes (strict)", value: conformesArticles },
    { label: "Nombre d'articles conformes avec tolérance", value: conformesToleranceArticles },
    { label: "Nombre d'articles non conformes", value: nonConformesArticles },
    { label: "Nombre total de caractéristiques vérifiées", value: totalCarac },
    { label: "Nombre de divergences détectées", value: totalNonConformes }
  ];

  metrics.forEach((m) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`• ${m.label} :`, marginX + 4, y);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(m.value), marginX + 80, y);
    y += 6;
  });

  y += 6;

  // Liste des principales divergences techniques
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text("Liste des principales divergences techniques :", marginX + 4, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  if (mainDivergences.length === 0) {
    doc.text("Aucune divergence technique constatée. Le matériel est intégralement conforme.", marginX + 4, y);
  } else {
    const limitedDivs = mainDivergences.slice(0, 15);
    limitedDivs.forEach((div) => {
      const splitDiv = doc.splitTextToSize(`- ${div}`, usableWidth - 8);
      if (y + (splitDiv.length * 4) > 280) { doc.addPage(); y = 20; }
      doc.text(splitDiv, marginX + 4, y);
      y += (splitDiv.length * 4) + 2;
    });

    if (mainDivergences.length > 15) {
      doc.setFont("helvetica", "italic");
      doc.text(`...et ${mainDivergences.length - 15} autres divergences relevées dans le rapport détaillé.`, marginX + 4, y + 2);
    }
  }

  // 7. Official Signatures
  y = Math.max(y + 20, 150);
  if (y > 240) { doc.addPage(); y = 20; }
  y = addOfficialSignatureBlock(doc, y, {
    leftTitle: "« La Commission Technique d'Examen & de Conformité »",
    leftSubtitle: "Visa de validation technique & signatures des membres",
    rightTitle: "« Le Commandant Régional / Chef de Service »",
    rightSubtitle: "Mention manuscrite, visa final et cachet officiel"
  });

  // 8. Uniform Footers across all pages
  addOfficialPageFooters(doc);

  // Save PDF
  const filename = `Rapport_Vérification_Conformité_Technique_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  if (onSuccess) {
    onSuccess(`Rapport de vérification technique exporté avec succès (${filename}) !`);
  }
};

export interface ComparisonSummaryRow {
  id: string;
  articleNom: string;
  caracteristique: string;
  designationComplete: string;
  pageDoc1?: string;
  sectionDoc1?: string;
  ligneDoc1?: string;
  pageDoc2?: string;
  sectionDoc2?: string;
  ligneDoc2?: string;
  valeurDoc1: string;
  valeurDoc2: string;
  differenceConstatee: string;
  toleranceAppliquee: string;
  ecartParRapportTolerance: string;
  statut: 'Conforme' | 'Non conforme';
  isConforme: boolean;
  observation?: string;
}

export interface ArticleSummaryItem {
  id: string;
  designation: string;
  referenceModele: string;
  marque: string;
  statut: 'Conforme' | 'Non conforme';
  isConforme: boolean;
  tauxConformite: number;
  totalSpecs: number;
  conformesSpecs: number;
  nonConformesSpecs: number;
  divergencesConstates: string[];
}

/**
 * Dedicated, High-Standard PDF Exporter for the Summary Comparison Table (Tableau Récapitulatif)
 * Formatted with Article States breakdown, 7 mandatory columns, official DGPC branding, metrics, signatures and page footers.
 */
export const exportSummaryComparisonTablePDF = async (
  rows: ComparisonSummaryRow[],
  documents: Array<{ title: string; fileName?: string }>,
  tolerance: string = '0%',
  onSuccess?: (msg: string) => void,
  articles?: ArticleSummaryItem[]
) => {
  if (!rows || rows.length === 0) return;

  // Landscape orientation gives maximum horizontal clarity for analytical columns
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;

  // 1. Official Header
  let y = await addOfficialHeader(doc, {
    isLandscape: true,
    siteName: "Dépôt Central Sidi Allal Bahraoui",
    depotLocation: "Rabat-Salé-Kénitra",
    documentReference: `REC-COMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const totalItems = rows.length;
  const conformesCount = rows.filter(r => r.isConforme).length;
  const nonConformesCount = rows.filter(r => !r.isConforme).length;
  const globalConformityRate = totalItems > 0 ? Math.round((conformesCount / totalItems) * 100) : 100;
  const isAllConforme = nonConformesCount === 0;

  // 2. Document Title Banner
  const doc1Title = documents[0]?.title || 'Document 1 (Exigences)';
  const doc2Title = documents[1]?.title || 'Document 2 (Offre/Livré)';

  y = addDocumentTitleBanner(doc, {
    startY: y,
    title: "TABLEAU RÉCAPITULATIF DE COMPARAISON CROISÉE & CONFORMITÉ",
    subtitle: `Comparaison méthodique : ${doc1Title} ⟷ ${doc2Title}`,
    badge: isAllConforme ? "✅ TOTALEMENT CONFORME" : `⚠️ ${nonConformesCount} DIVERGENCE(S) DÉTECTÉE(S)`,
    badgeColor: isAllConforme ? [22, 101, 52] : [185, 28, 28],
    metadata: [
      { label: "Date d'analyse", value: new Date().toLocaleDateString('fr-FR') },
      { label: "Tolérance appliquée", value: tolerance === '0%' ? '0% (Strictement exacte)' : `Tolérance autorisée (${tolerance})` },
      { label: "Total Fournitures / Spécifications", value: `${totalItems}` },
      { label: "Taux de conformité global", value: `${globalConformityRate} %` }
    ],
    isLandscape: true
  });

  // 3. Summary Metric Cards
  y = addSummaryCards(doc, y, [
    {
      title: "Total Spécifications",
      value: `${totalItems}`,
      subtitle: "Éléments comparés",
      color: [15, 23, 42],
      bgColor: [248, 250, 252]
    },
    {
      title: "Fournitures Conformes",
      value: `${conformesCount}`,
      subtitle: `Respectent la tolérance (${tolerance})`,
      color: [22, 101, 52],
      bgColor: [240, 253, 244]
    },
    {
      title: "Fournitures Non Conformes",
      value: `${nonConformesCount}`,
      subtitle: "Écarts hors tolérance",
      color: nonConformesCount > 0 ? [185, 28, 28] : [100, 116, 139],
      bgColor: nonConformesCount > 0 ? [254, 242, 242] : [248, 250, 252]
    },
    {
      title: "Taux de Conformité",
      value: `${globalConformityRate} %`,
      subtitle: isAllConforme ? "Validation technique accordée" : "Examen de réserve requis",
      color: isAllConforme ? [22, 101, 52] : [194, 65, 12],
      bgColor: isAllConforme ? [240, 253, 244] : [255, 247, 237]
    }
  ]);

  // 4. Section 1: Liste des Articles & État de Conformité pour chacun d'eux
  if (articles && articles.length > 0) {
    // Section Header in PDF
    doc.setFillColor(15, 23, 42);
    doc.rect(marginX, y, 4, 9, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("1. ÉTAT DE CONFORMITÉ PAR ARTICLE & DIVERGENCES CONSTATÉES", marginX + 7, y + 6.5);
    y += 12;

    const articleHeaders = [
      [
        "N°",
        "Article / Désignation & Réf.",
        "Spécifications (Total / Conformes / Écarts)",
        "Taux",
        "État de Conformité",
        "Divergences constatées"
      ]
    ];

    const articleBodyData = articles.map((art, idx) => {
      const divergencesText = art.isConforme
        ? "✅ Aucune divergence constatée (100% conforme aux exigences)"
        : art.divergencesConstates && art.divergencesConstates.length > 0
        ? art.divergencesConstates.map(d => `• ${d}`).join('\n')
        : "⚠️ Divergence technique constatée sur les spécifications";

      return [
        `Art. ${idx + 1}`,
        `${art.designation}\nRéf: ${art.referenceModele || 'N/A'} | Marque: ${art.marque || 'Standard'}`,
        `${art.totalSpecs} total  |  ${art.conformesSpecs} conformes  |  ${art.nonConformesSpecs} écart(s)`,
        `${art.tauxConformite} %`,
        art.isConforme ? "✅ CONFORME" : "❌ NON CONFORME",
        divergencesText
      ];
    });

    autoTable(doc, getStandardAutoTableOptions({
      startY: y,
      head: articleHeaders,
      body: articleBodyData,
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 65, fontStyle: 'bold' },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 38, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 84 }
      },
      didParseCell: (data) => {
        // Colorize Status column
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw || '');
          if (val.includes('NON CONFORME') || val.includes('❌')) {
            data.cell.styles.textColor = [185, 28, 28];
            data.cell.styles.fillColor = [254, 242, 242];
          } else {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [240, 253, 244];
          }
        }
      }
    }));

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if new page needed for the detailed 7 columns table
  if (y > 150) {
    doc.addPage();
    y = 20;
  }

  // Section Header for Detailed 7 Columns Table
  doc.setFillColor(15, 23, 42);
  doc.rect(marginX, y, 4, 9, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("2. TABLEAU DÉTAILLÉ DE COMPARAISON CROISÉE DES SPÉCIFICATIONS", marginX + 7, y + 6.5);
  y += 12;

  // 5. The 7 Columns AutoTable
  const headers = [
    [
      "Fourniture / Désignation",
      "Valeur du Doc 1",
      "Valeur du Doc 2",
      "Différence constatée",
      "Tolérance appliquée",
      "Écart par rapport à la tolérance",
      "Statut"
    ]
  ];

  const bodyData = rows.map(r => {
    const locLine = (r.pageDoc1 || r.pageDoc2) 
      ? `\n[Doc 1: ${r.pageDoc1 || 'P.1'}, ${r.ligneDoc1 || 'L.?'}] | [Doc 2: ${r.pageDoc2 || 'P.2'}, ${r.ligneDoc2 || 'L.?'}]` 
      : '';
    const fournitureText = `${r.articleNom}\n• ${r.caracteristique}${locLine}`;

    return [
      fournitureText,
      r.valeurDoc1 || '—',
      r.valeurDoc2 || '—',
      r.differenceConstatee || '0 %',
      r.toleranceAppliquee || tolerance,
      r.ecartParRapportTolerance || 'Conforme',
      r.statut === 'Conforme' ? '✅ CONFORME' : '❌ NON CONFORME'
    ];
  });

  autoTable(doc, getStandardAutoTableOptions({
    startY: y,
    head: headers,
    body: bodyData,
    headStyles: { 
      fillColor: [15, 23, 42], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: 'bold' },
      1: { cellWidth: 35, fontStyle: 'normal' },
      2: { cellWidth: 35, fontStyle: 'normal' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 53 },
      6: { cellWidth: 36, halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Colorize Status column
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw || '');
        if (val.includes('NON CONFORME') || val.includes('❌')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fillColor = [254, 242, 242];
        } else {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fillColor = [240, 253, 244];
        }
      }
      // Highlight non zero differences
      if (data.section === 'body' && data.column.index === 3) {
        const val = String(data.cell.raw || '');
        if (val !== '0 %' && val !== '0' && val !== '—' && val !== 'Identique') {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  }));

  const finalTableY = (doc as any).lastAutoTable.finalY + 6;

  // 6. Official Signature Block
  addOfficialSignatureBlock(doc, finalTableY, {
    leftTitle: "« La Commission Technique de Contrôle & Conformité »",
    leftSubtitle: "Visa technique d'admissibilité des fournitures",
    rightTitle: "« Le Commandant Régional de la Protection Civile »",
    rightSubtitle: "Validation générale & visa d'inspection"
  });

  // 7. Uniform Official Page Footers
  addOfficialPageFooters(doc);

  // 8. Save Document
  const filename = `TABLEAU_RECAPITULATIF_COMPARAISON_DGPC_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  if (onSuccess) {
    onSuccess(`Tableau récapitulatif PDF exporté avec succès (${filename}) !`);
  }
};
