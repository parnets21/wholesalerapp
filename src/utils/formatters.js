// src/utils/formatters.js

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatOrderCode(seq) {
  return 'EE-ORD-' + String(seq).padStart(4, '0');
}

export function calculateAvailableStock(total, reserved, damaged) {
  return (total || 0) - (reserved || 0) - (damaged || 0);
}

export function calculateLineTotal(qty, rate, gstRate) {
  const q = Number(qty) || 0;
  const r = Number(rate) || 0;
  const g = Number(gstRate) || 0;
  const gst_amount = (r * q * g) / 100;
  const line_total = r * q + gst_amount;
  return { gst_amount, line_total };
}

export function calculateRunningBalance(openingBalance, entries) {
  let balance = openingBalance || 0;
  return entries.map(e => {
    balance = balance + (e.credit || 0) - (e.debit || 0);
    return balance;
  });
}

export function calculateNetProfit(salesRevenue, purchaseCost, expenses, salaryCost, marketingCost) {
  return (salesRevenue || 0) - (purchaseCost || 0) - (expenses || 0) - (salaryCost || 0) - (marketingCost || 0);
}

export function filterCustomers(query, customers) {
  if (!query) return customers;
  const q = query.toLowerCase();
  return customers.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.mobile || '').includes(query)
  );
}
