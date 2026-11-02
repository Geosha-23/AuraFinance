export function formatCurrency(amount, showDecimals = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const num = Number(amount);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  });
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}

export const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Travel & Commute': '#0284c7',
  'Shopping & E-Commerce': '#a855f7',
  'Subscriptions & Streaming': '#6366f1',
  'Utilities & Bills': '#eab308',
  'Education & Books': '#06b6d4',
  'Entertainment & Outings': '#ec4899',
  'Healthcare & Fitness': '#10b981',
  'Groceries & Essentials': '#84cc16',
  'Other & Miscellaneous': '#64748b'
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#64748b';
}
