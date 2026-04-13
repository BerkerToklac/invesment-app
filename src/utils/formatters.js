export const formatUSD = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatTRY = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '₺0,00';
  return `₺${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0.00%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(decimals)}%`;
};

export const formatCrypto = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (value < 0.01) return Number(value).toFixed(8);
  if (value < 1) return Number(value).toFixed(4);
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 4 });
};

const TZ = 'Europe/Istanbul';

/**
 * Date nesnesini "YYYY-MM-DD" olarak Istanbul saatiyle kaydeder.
 * toISOString() UTC'ye çevirdiği için gece yarısı seçimleri
 * bir gün kayabilir — bu fonksiyon bunu önler.
 */
export const toIstanbulDateStr = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date);
// en-CA locale'i doğrudan YYYY-MM-DD döndürür.

/**
 * Tarih stringini Türkçe gün.ay.yıl formatında gösterir.
 * "2026-04-13" gibi date-only stringleri UTC olarak parse edilir
 * bu yüzden parçalara ayırıp yerel Date oluşturuyoruz.
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  // UTC offset sorununu önlemek için local Date oluştur
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Date nesnesini Istanbul saatiyle uzun Türkçe formatta gösterir.
 * Örn: "13 Nisan 2026"
 */
export const formatDateLong = (date) =>
  new Intl.DateTimeFormat('tr-TR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatSmallUSD = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  if (Math.abs(value) >= 1000) return formatUSD(value, 2);
  if (Math.abs(value) >= 1) return formatUSD(value, 2);
  return `$${Number(value).toFixed(4)}`;
};

export const getPLColor = (value, Colors) => {
  if (value > 0) return Colors.success;
  if (value < 0) return Colors.danger;
  return Colors.textSecondary;
};

export const getPLBgColor = (value, Colors) => {
  if (value > 0) return Colors.successLight;
  if (value < 0) return Colors.dangerLight;
  return Colors.borderLight;
};
