// Utility functions for safe date formatting and official DGPC voucher number extraction

export function formatBonDateTime(dateInput?: string | number | Date | null): {
  full: string;
  dateStr: string;
  timeStr: string;
} {
  if (!dateInput) {
    const now = new Date();
    const d = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const t = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return {
      full: `Date : ${d} – Heure : ${t}`,
      dateStr: d,
      timeStr: t
    };
  }

  try {
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      // Check if it's already in format DD/MM/YYYY with optional time
      const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT]+(\d{1,2})[:h](\d{1,2}))?/i);
      if (frMatch) {
        const day = frMatch[1].padStart(2, '0');
        const month = frMatch[2].padStart(2, '0');
        const year = frMatch[3];
        const hour = (frMatch[4] || '10').padStart(2, '0');
        const min = (frMatch[5] || '00').padStart(2, '0');
        const dateStr = `${day}/${month}/${year}`;
        const timeStr = `${hour}:${min}`;
        return {
          full: `Date : ${dateStr} – Heure : ${timeStr}`,
          dateStr,
          timeStr
        };
      }
      
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        const hour = String(parsed.getHours()).padStart(2, '0');
        const min = String(parsed.getMinutes()).padStart(2, '0');
        const dateStr = `${day}/${month}/${year}`;
        const timeStr = `${hour}:${min}`;
        return {
          full: `Date : ${dateStr} – Heure : ${timeStr}`,
          dateStr,
          timeStr
        };
      }
    }

    const dateObj = new Date(dateInput);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const hour = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      const dateStr = `${day}/${month}/${year}`;
      const timeStr = `${hour}:${min}`;
      return {
        full: `Date : ${dateStr} – Heure : ${timeStr}`,
        dateStr,
        timeStr
      };
    }
  } catch (e) {
    // fallback
  }

  const now = new Date();
  const d = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const t = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return {
    full: `Date : ${d} – Heure : ${t}`,
    dateStr: d,
    timeStr: t
  };
}

export function getBonOfficialNumber(movement: any): string {
  if (!movement) return 'BON-000000';

  if (movement.type === 'Sortie') {
    if (movement.numMarcheSortie && String(movement.numMarcheSortie).trim()) {
      const val = String(movement.numMarcheSortie).trim();
      const typeChoice = movement.marcheOuBcSortie || '';
      const isBc = /bc|bon de commande/i.test(typeChoice) || /bc/i.test(val);
      if (/^(bc|march|be|bs|bl|ordre|commande)/i.test(val)) {
        return val.toUpperCase();
      }
      return `${isBc ? 'BC' : 'MARCHÉ'} N° ${val}`;
    }
    if (movement.message && String(movement.message).trim()) {
      return `ORDRE N° ${String(movement.message).trim().toUpperCase()}`;
    }
    const cleanId = String(movement.id || '').replace(/\D/g, '').slice(-6) || '000001';
    return `BS-${cleanId}`;
  } else {
    // Entrée
    if (movement.numMarche && String(movement.numMarche).trim()) {
      const val = String(movement.numMarche).trim();
      const typeChoice = movement.marcheOuBc || '';
      const isBc = /bc|bon de commande/i.test(typeChoice) || /bc/i.test(val);
      if (/^(bc|march|be|bs|bl|commande)/i.test(val)) {
        return val.toUpperCase();
      }
      return `${isBc ? 'BC' : 'MARCHÉ'} N° ${val}`;
    }
    const cleanId = String(movement.id || '').replace(/\D/g, '').slice(-6) || '000001';
    return `BE-${cleanId}`;
  }
}
