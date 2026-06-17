/**
 * Cùng quy tắc hiển thị với nail-app (map từ bản ghi Employee trong DB).
 * Ưu tiên nickName vì đó là tên hiển thị thực tế trong tiệm.
 */
export function employeeFullName(e) {
  if (!e) return '—';
  const nick = (e.nickName ?? '').trim();
  if (nick) return nick;
  const t = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
  return t || '—';
}
