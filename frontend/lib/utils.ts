/**
 * Format số tiền VNĐ  VD: 10500000 -> "10.500.000 ₫"
 */
export function formatVND(amount?: number | null): string {
  if (amount === undefined || amount === null) return '********';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ngày  "2024-03-15" -> "15/03/2024"
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format giờ từ ISO timestamp  "2024-03-15T09:32:00" -> "09:32"
 */
export function formatTime(isoStr?: string | null): string {
  if (!isoStr) return '~';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '~';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Tạo avatar initials từ tên Tiếng Việt
 * VD: "Nguyễn Đình Dương" -> "NĐD"
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Tạo màu avatar từ seed tên (deterministic)
 */
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Format tháng/năm  "3/2024" -> "Tháng 3/2024"
 */
export function formatMonth(month: number, year: number): string {
  return `Tháng ${month}/${year}`;
}
