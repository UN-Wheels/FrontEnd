const LOCALE = 'es-CO';

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { weekday: 'short', month: 'short', day: 'numeric' });

export const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleString(LOCALE, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const fmtDateFull = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { year: 'numeric', month: 'long', day: 'numeric' });

/** "Calle 80 # 55-23, Bogotá" → "Calle 80 # 55-23" */
export const shortAddr = (addr: string) => addr.split(',')[0].trim();
