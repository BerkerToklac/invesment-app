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

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

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
