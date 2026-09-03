// src/utils/invoicePdf.js
//
// Builds a professional HTML invoice (EazyEnquiry branded) and generates a PDF
// the user can view / save / share.
//
import { Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Lightweight inline SVG logo mark (orange rounded tile + "E") + wordmark.
// Keeps the PDF small (no heavy base64 PNG) while staying on-brand.
const LOGO_SVG = `
<svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="44" height="44" rx="11" fill="#FD5C02"/>
  <text x="23" y="31" font-family="Arial, sans-serif" font-size="24" font-weight="800"
        fill="#ffffff" text-anchor="middle">E</text>
</svg>`;

function buildHtml(invoice) {
  const c = invoice.company || {};
  const items = invoice.items || [];

  const rows = items.map((it, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>
        <div style="font-weight:600">${it.product_name || 'Item'}</div>
        ${it.product_code ? `<div style="color:#64748B;font-size:10px">${it.product_code}</div>` : ''}
        ${(it.size || it.finish || it.color) ? `<div style="color:#64748B;font-size:10px">${[it.size, it.finish, it.color].filter(Boolean).join(' · ')}</div>` : ''}
      </td>
      <td style="text-align:center">${it.qty} ${it.unit || ''}</td>
      <td style="text-align:right">${money(it.rate)}</td>
      <td style="text-align:right">${it.gst_percent ?? 18}%</td>
      <td style="text-align:right">${money(it.total)}</td>
    </tr>`).join('');

  return `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #01152D; margin: 0; padding: 28px; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FD5C02; padding-bottom: 16px; }
      .brand { display: flex; align-items: center; gap: 12px; }
      .brand-name { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; }
      .brand-name span { color: #FD5C02; }
      .brand-tag { font-size: 10px; color: #64748B; margin-top: 2px; }
      .inv-title { text-align: right; }
      .inv-title h1 { margin: 0; font-size: 26px; letter-spacing: 2px; color: #01152D; }
      .inv-title .no { font-size: 13px; color: #64748B; margin-top: 4px; }
      .badge { display:inline-block; margin-top:6px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
      .meta { display: flex; justify-content: space-between; margin-top: 22px; gap: 20px; }
      .box { flex: 1; background: #F8FAFC; border-radius: 10px; padding: 14px 16px; }
      .box h3 { margin: 0 0 8px; font-size: 11px; letter-spacing: 1px; color: #64748B; text-transform: uppercase; }
      .box .line { font-size: 12.5px; margin: 2px 0; }
      .box .strong { font-weight: 700; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 12px; }
      thead th { background: #01152D; color: #fff; padding: 10px 8px; text-align: left; font-size: 11px; letter-spacing: 0.4px; }
      thead th:first-child { border-radius: 8px 0 0 0; }
      thead th:last-child { border-radius: 0 8px 0 0; }
      tbody td { padding: 10px 8px; border-bottom: 1px solid #E2E8F0; vertical-align: top; }
      .totals { margin-top: 18px; display: flex; justify-content: flex-end; }
      .totals table { width: 300px; margin-top: 0; }
      .totals td { padding: 6px 8px; font-size: 12.5px; border: none; }
      .totals .grand td { border-top: 2px solid #01152D; font-weight: 800; font-size: 15px; padding-top: 10px; }
      .totals .grand .amt { color: #FD5C02; }
      .foot { margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 14px; text-align: center; color: #94A3B8; font-size: 10.5px; }
      .paidwatermark { text-align:right; margin-top:6px; }
    </style>
  </head>
  <body>
    <div class="top">
      <div class="brand">
        ${LOGO_SVG}
        <div>
          <div class="brand-name">Eazy<span>Enquiry</span></div>
          <div class="brand-tag">Wholesale &amp; Trade Platform</div>
        </div>
      </div>
      <div class="inv-title">
        <h1>INVOICE</h1>
        <div class="no">${invoice.invoice_no || ''}</div>
        <div class="no">${fmtDate(invoice.invoice_date)}</div>
      </div>
    </div>

    <div class="meta">
      <div class="box">
        <h3>Billed To</h3>
        <div class="line strong">${c.name || invoice.customer_name || '—'}</div>
        ${c.owner_name ? `<div class="line">${c.owner_name}</div>` : ''}
        ${c.address ? `<div class="line">${c.address}</div>` : ''}
        ${c.mobile ? `<div class="line">📞 ${c.mobile}</div>` : ''}
        ${c.email ? `<div class="line">✉ ${c.email}</div>` : ''}
        ${c.gst_number ? `<div class="line">GSTIN: ${c.gst_number}</div>` : ''}
      </div>
      <div class="box">
        <h3>Invoice Details</h3>
        <div class="line">Invoice No: <b>${invoice.invoice_no || '—'}</b></div>
        ${invoice.order_no ? `<div class="line">Order No: <b>${invoice.order_no}</b></div>` : ''}
        <div class="line">Date: <b>${fmtDate(invoice.invoice_date)}</b></div>
        <div class="line">Payment Status: <b>${invoice.payment_status || '—'}</b></div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:36px;text-align:center">#</th>
          <th>Item</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">GST</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#94A3B8">No items</td></tr>'}</tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${money(invoice.subtotal)}</td></tr>
        <tr><td>GST</td><td style="text-align:right">${money(invoice.gst_amount)}</td></tr>
        ${invoice.discount_amount ? `<tr><td>Discount</td><td style="text-align:right">- ${money(invoice.discount_amount)}</td></tr>` : ''}
        <tr class="grand"><td>Grand Total</td><td style="text-align:right" class="amt">${money(invoice.grand_total)}</td></tr>
        <tr><td>Paid</td><td style="text-align:right">${money(invoice.paid_amount)}</td></tr>
        <tr><td>Balance Due</td><td style="text-align:right"><b>${money(invoice.balance_due)}</b></td></tr>
      </table>
    </div>

    ${invoice.remarks ? `<div style="margin-top:20px;font-size:11.5px;color:#64748B"><b>Note:</b> ${invoice.remarks}</div>` : ''}

    <div class="foot">
      This is a computer-generated invoice from EazyEnquiry. Thank you for your business.
    </div>
  </body>
  </html>`;
}

/**
 * Generate the invoice PDF and open the native share/save sheet.
 * Returns the file path on success.
 */
export async function generateAndShareInvoice(invoice) {
  const fileName = `Invoice_${(invoice.invoice_no || 'EZY').replace(/[^\w-]/g, '')}`;
  const { filePath } = await RNHTMLtoPDF.convert({
    html: buildHtml(invoice),
    fileName,
    base64: false,
  });

  const url = Platform.OS === 'android' ? `file://${filePath}` : filePath;
  await Share.open({
    url,
    type: 'application/pdf',
    filename: fileName,
    title: `Invoice ${invoice.invoice_no || ''}`,
    failOnCancel: false,
  });

  return filePath;
}
