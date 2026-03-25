/**
 * Cùng quy tắc hiển thị với nail-app (map từ bản ghi Employee trong DB).
 */
export function employeeFullName(e) {
  if (!e) return '—';
  const t = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
  return t || '—';
}
