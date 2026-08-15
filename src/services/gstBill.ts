import { supabase } from '@/lib/supabase';
import { getInvoiceConfig, getInvoiceDesign, type InvoiceConfig, type InvoiceDesignSettings } from './invoice.service';
import type { DbOrder, DbOrderItem, DbAddress } from './catalog';

export interface OrderBillData {
  order: DbOrder;
  items: (DbOrderItem & { hsn_code?: string; gst_percentage?: number })[];
  address: DbAddress | null;
  customerName: string;
  customerPhone: string;
  customerGst?: string;
}

export async function fetchOrderBillData(orderId: string): Promise<OrderBillData> {
  const { data: order, error: oe } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (oe || !order) throw new Error('Order not found');

  const { data: items, error: ie } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  if (ie) throw new Error('Items not found');

  let address: DbAddress | null = null;
  if (order.address_id) {
    const { data: addr } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', order.address_id)
      .maybeSingle();
    address = addr as DbAddress | null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', order.user_id)
    .maybeSingle();

  const { data: business } = await supabase
    .from('businesses')
    .select('business_name, gstin')
    .eq('owner_user_id', order.user_id)
    .eq('gst_verification_status', 'verified')
    .maybeSingle();

  const customerName = business?.business_name || profile?.full_name || 'Customer';
  const customerGst = business?.gstin || '';
  const customerPhone = profile?.phone || '';

  return {
    order: order as DbOrder,
    items: items as (DbOrderItem & { hsn_code?: string; gst_percentage?: number })[],
    address,
    customerName,
    customerPhone,
    customerGst,
  };
}

export async function buildGstBillHtml(orderId: string): Promise<string> {
  const data = await fetchOrderBillData(orderId);
  const config = await getInvoiceConfig();
  const design = await getInvoiceDesign();
  return buildA4InvoiceHtml(data, config, design);
}

// ─── HTML BUILDER ──────────────────────────────────────────────
function buildA4InvoiceHtml(
  data: OrderBillData,
  config: InvoiceConfig | null,
  design: InvoiceDesignSettings
): string {
  const { order, items, address, customerName, customerPhone, customerGst } = data;

  // Compute totals
  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
  const gstTotal = items.reduce((sum, i) => sum + (i.gst_percentage || 0) * i.line_total / 100, 0);
  const cgstTotal = gstTotal / 2;
  const sgstTotal = gstTotal / 2;
  const grandTotal = subtotal + gstTotal;
  const outstandingCredit = 0;
  const finalGrand = grandTotal + outstandingCredit;

  const invoiceNumber = order.order_number || `INV-${order.id.slice(0, 8)}`;
  const paymentType = 'cash';
  const isGst = gstTotal > 0;
  const template = design.gstTemplate || 'template1';
  const fontSize = design.gstFont === 'small' ? 10 : design.gstFont === 'large' ? 14 : 12;
  const isCompact = design.invoiceLayout === 'compact';
  const isProfessional = design.invoiceLayout === 'professional';
  const primaryColor = design.primaryColor || '#1d4ed8';
  const colorOpacity = design.colorOpacity ?? 1;
  const printMode = design.gstPrintMode || 'sliced';

  const itemsWithDetails = items.map((item) => ({
    product_name: `${item.brand} ${item.product_name}`,
    hsn: item.hsn_code || '',
    gst_rate: item.gst_percentage || 0,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    gst_amount: (item.gst_percentage || 0) * item.line_total / 100,
  }));

  const overallSubtotal = subtotal;
  const overallGst = gstTotal;
  const overallCgst = cgstTotal;
  const overallSgst = sgstTotal;
  const overallGrand = grandTotal;

  // Page slicing helpers
  const computePageSlices = (totalItems: number, firstCapacity: number, nextCapacity: number) => {
    const slices: { start: number; end: number }[] = [];
    let start = 0;
    if (totalItems === 0) return slices;
    const firstPageRows = Math.min(firstCapacity, totalItems);
    slices.push({ start: 0, end: firstPageRows });
    start = firstPageRows;
    if (start >= totalItems) return slices;
    while (start < totalItems) {
      const end = Math.min(start + nextCapacity, totalItems);
      slices.push({ start, end });
      start = end;
    }
    return slices;
  };

  const getPageRowCounts = (template: string, fontSize: string, layout: string, customFirst?: number, customNext?: number) => {
    let defaultFirst = 22, defaultNext = 25;
    switch (template) {
      case 'template1': defaultFirst = 22; defaultNext = 25; break;
      case 'template2': defaultFirst = 21; defaultNext = 24; break;
      case 'template3': defaultFirst = 23; defaultNext = 26; break;
      case 'template4': defaultFirst = 20; defaultNext = 23; break;
      case 'template5': defaultFirst = 45; defaultNext = 50; break;
      default: defaultFirst = 22; defaultNext = 25;
    }
    if (fontSize === 'small') { defaultFirst += 3; defaultNext += 4; }
    else if (fontSize === 'large') { defaultFirst -= 3; defaultNext -= 4; }
    if (layout === 'compact') { defaultFirst += 2; defaultNext += 3; }
    else if (layout === 'professional') { defaultFirst -= 2; defaultNext -= 2; }
    return {
      first: (customFirst && customFirst > 0) ? customFirst : defaultFirst,
      next: (customNext && customNext > 0) ? customNext : defaultNext,
    };
  };

  let slices: { start: number; end: number }[] = [];
  if (printMode === 'sliced') {
    const { first, next } = getPageRowCounts(
      template,
      design.gstFont,
      design.invoiceLayout,
      design.firstPageRows,
      design.nextPageRows
    );
    slices = computePageSlices(itemsWithDetails.length, first, next);
  } else {
    slices = [{ start: 0, end: itemsWithDetails.length }];
  }

  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  const primaryRgba = hexToRgba(primaryColor, colorOpacity);

  // Common sections
  const logoSection = config?.company_logo
    ? `<img src="${config.company_logo}" style="max-height:60px;margin-bottom:8px;">`
    : config?.company_name && design.showLogo
      ? `<h1 style="font-size:24px;margin:0 0 4px 0;">${config.company_name}</h1>`
      : '';

  const companyInfo = config?.company_name && design.showLogo ? `
      <div style="text-align:center;margin-bottom:12px;">
        ${logoSection}
        ${config.company_address ? `<div style="font-size:11px">${config.company_address}</div>` : ''}
        ${config.company_phone ? `<div style="font-size:11px">Phone: ${config.company_phone}</div>` : ''}
        ${config.company_gst ? `<div style="font-size:11px;font-weight:600">GSTIN: ${config.company_gst}</div>` : ''}
      </div>` : '';

  const bankSection = design.showBankDetails && config?.bank_name ? `
      <div style="margin-top:16px;padding:8px;border:1px solid #ddd;border-radius:4px;">
        <div style="font-weight:600;margin-bottom:4px">Bank Details</div>
        <div style="font-size:11px">Bank: ${config.bank_name}</div>
        <div style="font-size:11px">A/c: ${config.bank_account || '-'}</div>
        <div style="font-size:11px">IFSC: ${config.bank_ifsc || '-'}</div>
      </div>` : '';

  const termsSection = config?.terms_conditions ? `
      <div style="margin-top:12px;font-size:10px;color:#666;">
        <div style="font-weight:600;margin-bottom:4px">Terms & Conditions:</div>
        <div style="white-space:pre-wrap">${config.terms_conditions}</div>
      </div>` : '';

  let signatureHtml = '';
  if (design.showAuthorisedSignature || design.showReceiverSignature) {
    signatureHtml = `
        <div style="margin-top:24px;display:flex;justify-content:space-between;font-size:12px;">
          ${design.showReceiverSignature ? `
            <div style="border-top:1px solid #000;padding-top:4px;width:40%;">
              <span style="font-weight:400;">Receiver's Signature</span>
            </div>` : ''
          }
          ${design.showAuthorisedSignature ? `
            <div style="border-top:1px solid #000;padding-top:4px;width:40%;">
              <span style="font-weight:400;">Authorised Signatory</span>
            </div>` : ''
          }
        </div>
      `;
  }

  const displayInvoiceNumber = invoiceNumber;
  const customerNameDisplay = customerName || 'Walk-in';
  const customerPhoneDisplay = customerPhone || '';
  const customerGstDisplay = customerGst || '';
  const currentDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  // ─── Build page table ────────────────────────────────────────────
  const buildPageTable = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
    const pageItems = itemsWithDetails.slice(startIdx, endIdx);
    const pageSubtotal = pageItems.reduce((s, i) => s + i.line_total, 0);
    const pageGst = pageItems.reduce((s, i) => s + i.gst_amount, 0);
    const pageCgst = pageGst / 2;
    const pageSgst = pageGst / 2;

    const rows = pageItems.map((item, idx) => {
      const serial = startIdx + idx + 1;
      const cgst = item.gst_amount / 2;
      const sgst = item.gst_amount / 2;
      return `<tr>
        <td style="text-align:center">${serial}</td>
        <td>${item.product_name}</td>
        <td style="text-align:center">${item.hsn || '-'}</td>
        ${isGst ? `<td style="text-align:center">${item.gst_rate}%</td>` : ''}
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.unit_price.toFixed(2)}</td>
        ${isGst ? `
          <td style="text-align:right">₹${cgst.toFixed(2)}</td>
          <td style="text-align:right">₹${sgst.toFixed(2)}</td>
        ` : ''}
        <td style="text-align:right">₹${(item.line_total + item.gst_amount).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const pageFooter = `
      <tr class="total-row"><td colspan="${isGst ? 6 : 4}"></td><td colspan="${isGst ? 2 : 1}">Page Subtotal</td><td>₹${pageSubtotal.toFixed(2)}</td></tr>
      ${isGst ? `
        <tr class="total-row"><td colspan="${isGst ? 6 : 4}"></td><td>Page CGST</td><td>₹${pageCgst.toFixed(2)}</td><td></td></tr>
        <tr class="total-row"><td colspan="${isGst ? 6 : 4}"></td><td>Page SGST</td><td>₹${pageSgst.toFixed(2)}</td><td></td></tr>
      ` : ''}
      <tr class="total-row"><td colspan="${isGst ? 6 : 4}"></td><td colspan="${isGst ? 2 : 1}">Page Total</td><td>₹${(pageSubtotal + pageGst).toFixed(2)}</td></tr>
    `;

    const colCount = isGst ? 9 : 7;
    const metaRowHtml = `
      <tr style="background:#f0f0f0; font-weight:600;">
        <td colspan="${colCount}" style="border:none; padding:4px 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:${fontSize}px;">
            <div style="text-align:left;">
              <div><strong>${customerNameDisplay}</strong></div>
              ${customerPhoneDisplay ? `<div style="font-weight:400;">${customerPhoneDisplay}</div>` : ''}
              ${customerGstDisplay ? `<div style="font-weight:400;">GST: ${customerGstDisplay}</div>` : ''}
            </div>
            <div style="text-align:center; font-weight:400;">
              Page ${pageNum} of ${totalPages}
            </div>
            <div style="text-align:right;">
              <div><strong>Invoice:</strong> ${displayInvoiceNumber}</div>
              <div style="font-weight:400;">${currentDate}</div>
            </div>
          </div>
        </td>
      </tr>
    `;

    return `
      <table>
        <thead>
          ${metaRowHtml}
          <tr>
            <th>S.No</th><th>Product</th><th>HSN</th>${isGst ? '<th>GST%</th>' : ''}<th>Qty</th><th>Rate</th>${isGst ? '<th>CGST</th><th>SGST</th>' : ''}<th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${pageFooter}
        </tbody>
      </table>
    `;
  };

  // ─── Build compact table (template5) ──────────────────────────────
  const buildCompactTable = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
    const pageItems = itemsWithDetails.slice(startIdx, endIdx);
    const pageSubtotal = pageItems.reduce((s, i) => s + i.line_total, 0);
    const pageGst = pageItems.reduce((s, i) => s + i.gst_amount, 0);
    const pageCgst = pageGst / 2;
    const pageSgst = pageGst / 2;

    const rows = pageItems.map((item, idx) => {
      const serial = startIdx + idx + 1;
      const cgst = item.gst_amount / 2;
      const sgst = item.gst_amount / 2;
      return `<tr>
        <td>${serial}</td>
        <td style="text-align:left">${item.product_name}</td>
        <td>${item.hsn || '-'}</td>
        <td>${item.gst_rate}%</td>
        <td>${item.quantity}</td>
        <td>₹${item.unit_price.toFixed(2)}</td>
        <td>₹${cgst.toFixed(2)}</td>
        <td>₹${sgst.toFixed(2)}</td>
        <td>₹${(item.line_total + item.gst_amount).toFixed(2)}</td>
      </tr>`;
    }).join('');

    const pageFooter = `
      <tr class="total-row"><td colspan="6"></td><td>Page Subtotal</td><td>₹${pageSubtotal.toFixed(2)}</td></tr>
      <tr class="total-row"><td colspan="6"></td><td>Page CGST</td><td>₹${pageCgst.toFixed(2)}</td><td></td></tr>
      <tr class="total-row"><td colspan="6"></td><td>Page SGST</td><td>₹${pageSgst.toFixed(2)}</td><td></td></tr>
      <tr class="total-row"><td colspan="6"></td><td>Page Total</td><td>₹${(pageSubtotal + pageGst).toFixed(2)}</td></tr>
    `;

    const metaRowCompact = `
      <tr style="background:#f3f4f6; font-weight:600;">
        <td colspan="9" style="border:none; padding:2px 4px;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:${Math.min(fontSize,10)}px;">
            <div style="text-align:left;">
              <div><strong>${customerNameDisplay}</strong></div>
              ${customerPhoneDisplay ? `<div style="font-weight:400;">${customerPhoneDisplay}</div>` : ''}
              ${customerGstDisplay ? `<div style="font-weight:400;">GST: ${customerGstDisplay}</div>` : ''}
            </div>
            <div style="text-align:center; font-weight:400;">
              Page ${pageNum} of ${totalPages}
            </div>
            <div style="text-align:right;">
              <div><strong>Invoice:</strong> ${displayInvoiceNumber}</div>
              <div style="font-weight:400;">${currentDate}</div>
            </div>
          </div>
        </td>
      </tr>
    `;

    return `
      <table>
        <thead>
          ${metaRowCompact}
          <tr>
            <th>S.No</th><th>Product</th><th>HSN</th><th>GST%</th><th>Qty</th><th>Rate</th><th>CGST</th><th>SGST</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${pageFooter}
        </tbody>
      </table>
    `;
  };

  // ─── Build all pages ──────────────────────────────────────────────
  let allTablesHtml = '';
  const isCompactTemplate = template === 'template5';
  slices.forEach((slice, idx) => {
    if (isCompactTemplate) {
      allTablesHtml += buildCompactTable(slice.start, slice.end, idx + 1, slices.length);
    } else {
      allTablesHtml += buildPageTable(slice.start, slice.end, idx + 1, slices.length);
    }
    if (printMode === 'sliced' && idx < slices.length - 1) {
      allTablesHtml += `<div style="page-break-after: always;"></div>`;
    }
  });

  // ─── Summary ──────────────────────────────────────────────────────
  const summaryHtml = `
    <div class="summary" style="margin-top:24px;border-top:3px double #000;padding-top:16px;">
      <div style="display:flex;justify-content:space-between;font-weight:700;padding:4px 0;">
        <span>Total Subtotal</span><span>₹${overallSubtotal.toFixed(2)}</span>
      </div>
      ${isGst ? `
        <div style="display:flex;justify-content:space-between;font-weight:700;padding:4px 0;">
          <span>Total CGST</span><span>₹${overallCgst.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;padding:4px 0;">
          <span>Total SGST</span><span>₹${overallSgst.toFixed(2)}</span>
        </div>
      ` : ''}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.2em;padding:8px 0;border-top:2px solid #000;">
        <span>GRAND TOTAL</span><span>₹${overallGrand.toFixed(2)}</span>
      </div>
      ${outstandingCredit > 0 ? `
        <div style="display:flex;justify-content:space-between;color:#dc2626;padding:4px 0;">
          <span>Previous Credit</span><span>₹${outstandingCredit.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.3em;color:#dc2626;padding:8px 0;border-top:2px solid #dc2626;">
          <span>FINAL GRAND TOTAL</span><span>₹${finalGrand.toFixed(2)}</span>
        </div>
      ` : ''}
    </div>
  `;

  // ─── Template-specific styles & body ────────────────────────────
  let templateStyles = '';
  let templateBody = '';

  switch (template) {
    case 'template1':
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #000; padding: 20px; margin: 0; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
        .header h1 { font-size: ${isCompact ? 16 : 20}px; font-weight: 700; }
        .payment-type { display: inline-block; padding: 4px 12px; background: ${paymentType === 'cash' ? '#dcfce7' : '#fef3c7'}; border-radius: 4px; font-weight: 600; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #ccc; padding: ${isCompact ? '4px 6px' : '6px 8px'}; text-align: right; }
        th { background: #f5f5f5; text-align: center; }
        td:nth-child(2), td:nth-child(3) { text-align: left; }
        .footer { text-align: center; margin-top: ${isCompact ? 12 : 20}px; font-size: ${isCompact ? 10 : 11}px; color: #666; }
        ${isProfessional ? '.signature { margin-top:30px;display:flex;justify-content:space-between; }' : ''}
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 2px 0; }
        .summary > div:last-child { border-top: 2px solid #000; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 15mm 10mm 15mm 10mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        ${isProfessional ? `<div class="signature"><div>Receiver's Signature</div><div>For ${config?.company_name || 'Company'}</div></div>` : ''}
        <div class="footer"><p>${design.footerText || 'Thank You for your business!'}</p></div>
      `;
      break;

    case 'template2':
      templateStyles = `
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: ${fontSize}px; padding: 20px; margin: 0; background: #f0f4ff; }
        .invoice-container { background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        @media print {
          .invoice-container { background: none !important; box-shadow: none !important; padding: 0 !important; }
          body { background: #fff !important; }
        }
        .header { background: ${primaryRgba}; color: #ffffff; padding: 12px 16px; border-radius: 8px; text-align: center; margin-bottom: 16px; }
        .header h1 { font-size: ${isCompact ? 16 : 20}px; font-weight: 700; margin: 0; }
        .payment-type { display: inline-block; padding: 4px 16px; background: ${primaryRgba}; color: #ffffff; border-radius: 20px; font-weight: 600; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: ${primaryRgba}; color: #fff; padding: 6px 8px; text-align: center; font-weight: 600; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        td:nth-child(2), td:nth-child(3) { text-align: left; }
        .footer { text-align: center; margin-top: 16px; color: #64748b; font-size: 11px; }
        .header, .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 4px 0; }
        .summary > div:last-child { border-top: 2px solid #000; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 15mm 10mm 15mm 10mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
      `;
      templateBody = `
        <div class="invoice-container">
          ${companyInfo ? `<div style="text-align:center;margin-bottom:12px;">${companyInfo}</div>` : ''}
          <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
          <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
          ${allTablesHtml}
          ${summaryHtml}
          ${signatureHtml}
          ${bankSection}
          ${termsSection}
          <div class="footer"><p>${design.footerText || 'Thank You!'}</p></div>
        </div>
      `;
      break;

    case 'template3':
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; padding: 20px; margin: 0; }
        .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
        .header h1 { font-size: ${isCompact ? 16 : 20}px; font-weight: 300; letter-spacing: 2px; }
        .payment-type { display: inline-block; padding: 2px 12px; background: #f3f4f6; border-radius: 20px; font-weight: 500; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: none; padding: 6px 4px; text-align: right; }
        th { background: transparent; font-weight: 500; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-align: center; }
        td { border-bottom: 1px solid #f3f4f6; }
        td:nth-child(2), td:nth-child(3) { text-align: left; }
        .footer { text-align: center; margin-top: 12px; color: #9ca3af; font-size: 10px; }
        .payment-type, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 2px 0; }
        .summary > div:last-child { border-top: 1px solid #000; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 15mm 10mm 15mm 10mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank you'}</p></div>
      `;
      break;

    case 'template4':
      templateStyles = `
        body { font-family: 'Georgia', serif; font-size: ${fontSize}px; padding: 20px; margin: 0; }
        .company-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 16px; }
        .company-logo { max-height: 70px; }
        .company-details { font-size: 13px; color: #374151; }
        .company-name { font-size: 26px; font-weight: 700; margin: 0; color: ${primaryColor}; }
        .header { text-align: center; margin-bottom: 14px; }
        .header h1 { font-size: ${isCompact ? 18 : 24}px; font-weight: 700; letter-spacing: 3px; color: ${primaryColor}; }
        .payment-type { display: inline-block; padding: 4px 16px; background: ${primaryRgba}; color: #fff; border-radius: 4px; font-weight: 600; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        th { background: ${primaryRgba}; color: #fff; padding: 6px 8px; text-align: center; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        td:nth-child(2), td:nth-child(3) { text-align: left; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 4px 0; }
        .summary > div:last-child { border-top: 2px solid ${primaryColor}; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 15mm 10mm 15mm 10mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
      `;
      templateBody = `
        <div class="company-header">
          ${config?.company_logo ? `<img src="${config.company_logo}" class="company-logo">` : ''}
          <div class="company-details">
            <div class="company-name">${config?.company_name || 'Company'}</div>
            <div>${config?.company_address || ''}</div>
            <div>Phone: ${config?.company_phone || ''} | GST: ${config?.company_gst || ''}</div>
          </div>
        </div>
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You for your business!'}</p></div>
      `;
      break;

    case 'template5':
      // Already handled as compact, return directly
      const compactStyles = `
        body { font-family: Arial, sans-serif; font-size: ${Math.min(fontSize, 10)}px; padding: 8px; margin: 0; }
        .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
        .header h1 { font-size: 14px; font-weight: 700; margin: 0; }
        .payment-type { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-weight: 600; font-size: 9px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        th, td { padding: 2px 4px; border: 1px solid #ccc; text-align: center; }
        th { background: #f3f4f6; font-weight: 600; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 6px; font-size: 9px; color: #666; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 1px 0; }
        .summary > div:last-child { border-top: 1px solid #000; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 8mm 12mm 8mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 8px; color: #555; } }
      `;
      const compactBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You'}</p></div>
      `;
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${displayInvoiceNumber}</title>
        <style>${compactStyles}</style>
      </head><body>${compactBody}</body></html>`;

    default:
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; }
        .header h1 { font-size: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
        th { background: #f5f5f5; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .summary > div { padding: 2px 0; }
        .summary > div:last-child { border-top: 2px solid #000; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 9px; color: #555; } }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType === 'cash' ? 'CASH' : 'CREDIT'}</div>
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You for your business!'}</p></div>
      `;
  }

  // For templates 1-4, return the full HTML
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${displayInvoiceNumber}</title>
    <style>${templateStyles}</style>
  </head><body>${templateBody}</body></html>`;
}