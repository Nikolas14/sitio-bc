/** Texto do grupo de abate. O valor gravado é o nome da planilha (ABATE 01 / ABATE 02). */
export function employeeGroupText(groupName: string): string {
  if (groupName === 'ABATE 01') return 'Grupo 1';
  if (groupName === 'ABATE 02') return 'Grupo 2';
  return groupName || 'Sem grupo';
}

export const GROUP_FILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'ABATE 01', label: 'Grupo 1' },
  { value: 'ABATE 02', label: 'Grupo 2' },
  { value: '', label: 'Sem grupo' },
];

export function matchesGroupFilter(groupName: string, filter: string): boolean {
  return filter === 'todos' || groupName === filter;
}
