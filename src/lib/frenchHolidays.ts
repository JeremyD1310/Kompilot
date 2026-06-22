/**
 * Jours fériés français — calcul dynamique pour toute année.
 *
 * Retourne un objet { 'yyyy-MM-dd': 'Nom du jour férié' } pour l'année donnée.
 *
 * Jours fixes (8) :
 *   1 janv. — Jour de l'An
 *   1 mai   — Fête du Travail
 *   8 mai   — Victoire 1945
 *   14 juil.— Fête Nationale
 *   15 août — Assomption
 *   1 nov.  — Toussaint
 *   11 nov. — Armistice
 *   25 déc. — Noël
 *
 * Jours mobiles basés sur Pâques (algorithme Meeus/Jones/Butcher) :
 *   Lundi de Pâques    (Pâques + 1 j)
 *   Ascension          (Pâques + 39 j)
 *   Lundi de Pentecôte (Pâques + 50 j)
 */

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Retourne la date de Pâques (dimanche) pour une année donnée. */
function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDaysToDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getFrenchHolidays(year: number): Record<string, string> {
  const holidays: Record<string, string> = {};

  // ── Jours fixes ────────────────────────────────────────────────────────────
  holidays[toKey(year, 1,   1)] = 'Jour de l\'An';
  holidays[toKey(year, 5,   1)] = 'Fête du Travail';
  holidays[toKey(year, 5,   8)] = 'Victoire 1945';
  holidays[toKey(year, 7,  14)] = 'Fête Nationale';
  holidays[toKey(year, 8,  15)] = 'Assomption';
  holidays[toKey(year, 11,  1)] = 'Toussaint';
  holidays[toKey(year, 11, 11)] = 'Armistice';
  holidays[toKey(year, 12, 25)] = 'Noël';

  // ── Jours mobiles basés sur Pâques ─────────────────────────────────────────
  const easter = getEaster(year);
  holidays[toKey(year, easter.getMonth() + 1, easter.getDate())] = 'Pâques';

  const easterMonday = addDaysToDate(easter, 1);
  holidays[toKey(year, easterMonday.getMonth() + 1, easterMonday.getDate())] = 'Lundi de Pâques';

  const ascension = addDaysToDate(easter, 39);
  holidays[toKey(year, ascension.getMonth() + 1, ascension.getDate())] = 'Ascension';

  const pentecote = addDaysToDate(easter, 49);
  holidays[toKey(year, pentecote.getMonth() + 1, pentecote.getDate())] = 'Dimanche de Pentecôte';

  const pentecoteMonday = addDaysToDate(easter, 50);
  holidays[toKey(year, pentecoteMonday.getMonth() + 1, pentecoteMonday.getDate())] = 'Lundi de Pentecôte';

  return holidays;
}

/**
 * Retourne les jours fériés pour plusieurs années d'un coup.
 * Utile pour les vues qui peuvent chevaucher deux années civiles.
 */
export function getFrenchHolidaysForYears(years: number[]): Record<string, string> {
  return years.reduce<Record<string, string>>((acc, y) => ({ ...acc, ...getFrenchHolidays(y) }), {});
}
