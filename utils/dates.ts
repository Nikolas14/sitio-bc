// Datas de frequência são YYYY-MM-DD (dia de trabalho, sem fuso).

/** Data de hoje no fuso local, em YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

function parseISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** 11/11/2026 */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

/** quarta-feira, 11 de novembro de 2026 */
export function formatLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/** quarta-feira */
export function weekdayOf(iso: string): string {
  return parseISO(iso).toLocaleDateString('pt-BR', { weekday: 'long' });
}
