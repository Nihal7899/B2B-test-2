// services/gstBill.ts
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

  // Fetch business profile if available
  const { data: business } = await supabase
    .from('businesses')
    .select('business_name, gstin')
    .eq('owner_user_id', order.user_id)
    .maybeSingle();

  let customerName = business?.business_name || null;
  let customerGst = business?.gstin || null;
  let customerPhone = '';

  if (!customerName) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', order.user_id)
      .maybeSingle();
    if (profile) {
      customerName = profile.full_name || address?.recipient_name || 'Customer';
      customerPhone = profile.phone || address?.phone || '';
    }
  }

  return {
    order: order as DbOrder,
    items: (items || []) as (DbOrderItem & { hsn_code?: string; gst_percentage?: number })[],
    address,
    customerName: customerName || address?.recipient_name || 'Customer',
    customerPhone: customerPhone || address?.phone || '',
    customerGst: customerGst || '',
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

  const totalDiscount = Number(order.discount || 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const rawSubtotal = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);

  // 1. Pro-rata discount distribution per item (Section 15(3) CGST Act)
  const itemsWithDetails = items.map((item, idx) => {
    const lineTotal = Number(item.line_total || 0);
    const unitPrice = Number(item.unit_price || 0);
    const gstRate = Number(item.gst_percentage || 0);

    const itemDiscount = rawSubtotal > 0 ? (lineTotal / rawSubtotal) * totalDiscount : 0;
    const taxableValue = Math.max(0, lineTotal - itemDiscount);

    const gstAmount = (gstRate * taxableValue) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    return {
      serial: idx + 1,
      product_name: `${item.brand ? `${item.brand} ` : ''}${item.product_name}`,
      hsn: item.hsn_code || '-',
      quantity: Number(item.quantity || 1),
      unit_price: unitPrice,
      taxable_value: taxableValue,
      gst_rate: gstRate,
      cgst,
      sgst,
      gst_amount: gstAmount,
      line_total: lineTotal,
      row_total: taxableValue + gstAmount,
      is_delivery: false,
    };
  });

  // 2. Add Delivery Fee as a taxable service row (SAC 9968 @ 18% GST) if present
  if (deliveryFee > 0) {
    const deliveryTaxable = deliveryFee / 1.18;
    const deliveryGst = deliveryFee - deliveryTaxable;
    itemsWithDetails.push({
      serial: itemsWithDetails.length + 1,
      product_name: 'Delivery & Fulfillment Charge',
      hsn: '9968',
      quantity: 1,
      unit_price: deliveryTaxable,
      taxable_value: deliveryTaxable,
      gst_rate: 18,
      cgst: deliveryGst / 2,
      sgst: deliveryGst / 2,
      gst_amount: deliveryGst,
      line_total: deliveryTaxable,
      row_total: deliveryFee,
      is_delivery: true,
    });
  }

  // 3. Overall Totals
  const overallTaxable = itemsWithDetails.reduce((sum, i) => sum + i.taxable_value, 0);
  const overallCgst = itemsWithDetails.reduce((sum, i) => sum + i.cgst, 0);
  const overallSgst = itemsWithDetails.reduce((sum, i) => sum + i.sgst, 0);
  const overallGst = overallCgst + overallSgst;
  const overallGrand = Number(order.total) || (overallTaxable + overallGst);

  const invoiceNumber = order.order_number || `INV-${order.id.slice(0, 8)}`;
  const paymentType = 'cash';
  const isGst = overallGst > 0;
  const template = design.gstTemplate || 'template1';
  const fontSize = design.gstFont === 'small' ? 10 : design.gstFont === 'large' ? 14 : 12;
  const isCompact = design.invoiceLayout === 'compact';
  const isProfessional = design.invoiceLayout === 'professional';
  const primaryColor = design.primaryColor || '#1d4ed8';
  const colorOpacity = design.colorOpacity ?? 1;
  const printMode = design.gstPrintMode || 'sliced';

  const hexToRgba = (hex: string, opacity: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 29;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 78;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 216;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  const primaryRgba = hexToRgba(primaryColor, colorOpacity);

  // 4. Page Slicing Helpers
  const computePageSlices = (totalItems: number, firstCapacity: number, nextCapacity: number) => {
    const slices: { start: number; end: number }[] = [];
    let start = 0;
    if (totalItems === 0) return slices;
    const firstPageRows = Math.min(firstCapacity, totalItems);
    slices.push({ start: 0, end: firstPageRows });
    start = firstPageRows;
    while (start < totalItems) {
      const end = Math.min(start + nextCapacity, totalItems);
      slices.push({ start, end });
      start = end;
    }
    return slices;
  };

  const getPageRowCounts = (tmpl: string, fSize: string, layout: string, customFirst?: number, customNext?: number) => {
    let defaultFirst = 20, defaultNext = 24;
    switch (tmpl) {
      case 'template1': defaultFirst = 20; defaultNext = 24; break;
      case 'template2': defaultFirst = 18; defaultNext = 22; break;
      case 'template3': defaultFirst = 22; defaultNext = 25; break;
      case 'template4': defaultFirst = 17; defaultNext = 20; break;
      case 'template5': defaultFirst = 38; defaultNext = 44; break;
      default: defaultFirst = 20; defaultNext = 24;
    }
    if (fSize === 'small') { defaultFirst += 3; defaultNext += 4; }
    else if (fSize === 'large') { defaultFirst -= 3; defaultNext -= 4; }
    if (layout === 'compact') { defaultFirst += 2; defaultNext += 3; }
    else if (layout === 'professional') { defaultFirst -= 2; defaultNext -= 2; }
    return {
      first: customFirst && customFirst > 0 ? customFirst : defaultFirst,
      next: customNext && customNext > 0 ? customNext : defaultNext,
    };
  };

  const { first, next } = getPageRowCounts(template, design.gstFont, design.invoiceLayout, design.firstPageRows, design.nextPageRows);
  const slices = printMode === 'sliced' ? computePageSlices(itemsWithDetails.length, first, next) : [{ start: 0, end: itemsWithDetails.length }];

  // 5. Common Component Sections
  const logoSection = config?.company_logo
    ? `<img src="${config.company_logo}" style="max-height:60px;margin-bottom:8px;">`
    : config?.company_name && design.showLogo
      ? `<h1 style="font-size:22px;margin:0 0 4px 0;font-weight:700;">${config.company_name}</h1>`
      : '';

  const companyInfo = (config?.company_name || config?.company_logo) && design.showLogo ? `
      <div style="text-align:center;margin-bottom:12px;">
        ${logoSection}
        ${config?.company_address ? `<div style="font-size:11px;color:#4b5563;">${config.company_address}</div>` : ''}
        ${config?.company_phone ? `<div style="font-size:11px;color:#4b5563;">Phone: ${config.company_phone}</div>` : ''}
        ${config?.company_gst ? `<div style="font-size:11px;font-weight:600;color:#111827;">GSTIN: ${config.company_gst}</div>` : ''}
      </div>` : '';

  const customerNameDisplay = customerName || 'Walk-in Customer';
  const customerPhoneDisplay = customerPhone || '';
  const customerGstDisplay = customerGst || '';
  const currentDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const addressBlock = `
    <div style="margin-bottom:12px;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;display:flex;justify-content:space-between;">
      <div>
        <strong style="color:#111827;">Billed & Shipped To:</strong>
        <div style="font-weight:600;color:#1f2937;margin-top:2px;">${customerNameDisplay}</div>
        ${address ? `<div style="color:#4b5563;max-width:320px;margin-top:2px;">${address.line1}${address.line2 ? `, ${address.line2}` : ''}, ${address.city}, ${address.state} - ${address.postal_code}</div>` : ''}
        ${customerPhoneDisplay ? `<div style="color:#4b5563;margin-top:2px;">Phone: ${customerPhoneDisplay}</div>` : ''}
      </div>
      <div style="text-align:right;">
        ${customerGstDisplay ? `<div><strong style="color:#111827;">Customer GST:</strong> ${customerGstDisplay}</div>` : ''}
        <div><strong style="color:#111827;">Invoice:</strong> ${invoiceNumber}</div>
        <div><strong style="color:#111827;">Date:</strong> ${currentDate}</div>
      </div>
    </div>
  `;

  const bankSection = design.showBankDetails && config?.bank_name ? `
      <div style="margin-top:14px;padding:8px;border:1px solid #e5e7eb;border-radius:4px;font-size:11px;">
        <div style="font-weight:600;margin-bottom:2px;color:#111827;">Bank Details</div>
        <div>Bank: ${config.bank_name}</div>
        <div>A/c: ${config.bank_account || '-'}</div>
        <div>IFSC: ${config.bank_ifsc || '-'}</div>
      </div>` : '';

  const termsSection = config?.terms_conditions ? `
      <div style="margin-top:10px;font-size:10px;color:#6b7280;">
        <div style="font-weight:600;margin-bottom:2px;color:#374151;">Terms & Conditions:</div>
        <div style="white-space:pre-wrap;">${config.terms_conditions}</div>
      </div>` : '';

  const signatureHtml = (design.showAuthorisedSignature || design.showReceiverSignature) ? `
      <div style="margin-top:28px;display:flex;justify-content:space-between;font-size:11px;">
        ${design.showReceiverSignature ? `<div style="border-top:1px solid #000;padding-top:4px;width:35%;text-align:center;">Receiver's Signature</div>` : '<div></div>'}
        ${design.showAuthorisedSignature ? `<div style="border-top:1px solid #000;padding-top:4px;width:35%;text-align:center;">Authorised Signatory</div>` : '<div></div>'}
      </div>` : '';

  // 6. Multi-Page Table Builders
  const buildPageTable = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
    const pageItems = itemsWithDetails.slice(startIdx, endIdx);
    const pageTaxable = pageItems.reduce((s, i) => s + i.taxable_value, 0);
    const pageCgst = pageItems.reduce((s, i) => s + i.cgst, 0);
    const pageSgst = pageItems.reduce((s, i) => s + i.sgst, 0);
    const pageTotal = pageItems.reduce((s, i) => s + i.row_total, 0);

    const rows = pageItems.map((item) => `
      <tr style="${item.is_delivery ? 'background:#fafafa;' : ''}">
        <td style="text-align:center">${item.serial}</td>
        <td style="text-align:left">${item.product_name}</td>
        <td style="text-align:center">${item.hsn}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.unit_price.toFixed(2)}</td>
        <td style="text-align:right">₹${item.taxable_value.toFixed(2)}</td>
        ${isGst ? `<td style="text-align:center">${item.gst_rate}%</td>` : ''}
        ${isGst ? `
          <td style="text-align:right">₹${item.cgst.toFixed(2)}</td>
          <td style="text-align:right">₹${item.sgst.toFixed(2)}</td>
        ` : ''}
        <td style="text-align:right;font-weight:600;">₹${item.row_total.toFixed(2)}</td>
      </tr>
    `).join('');

    const pageFooter = printMode === 'sliced' && totalPages > 1 ? `
      <tr class="total-row" style="font-weight:600;background:#f9fafb;">
        <td colspan="${isGst ? 5 : 4}" style="text-align:right;">Page ${pageNum} Subtotal:</td>
        <td style="text-align:right;">₹${pageTaxable.toFixed(2)}</td>
        ${isGst ? `<td></td><td style="text-align:right;">₹${pageCgst.toFixed(2)}</td><td style="text-align:right;">₹${pageSgst.toFixed(2)}</td>` : ''}
        <td style="text-align:right;">₹${pageTotal.toFixed(2)}</td>
      </tr>
    ` : '';

    const colSpanTotal = isGst ? 10 : 7;
    const metaRowHtml = totalPages > 1 ? `
      <tr style="background:#f3f4f6;font-weight:600;">
        <td colspan="${colSpanTotal}" style="border:none;padding:4px 8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;">
            <span>${customerNameDisplay}</span>
            <span>Page ${pageNum} of ${totalPages}</span>
            <span>${invoiceNumber}</span>
          </div>
        </td>
      </tr>
    ` : '';

    return `
      <table>
        <thead>
          ${metaRowHtml}
          <tr>
            <th style="width:30px;">#</th>
            <th>Description</th>
            <th style="width:45px;">HSN</th>
            <th style="width:35px;">Qty</th>
            <th style="width:60px;">Rate</th>
            <th style="width:65px;">Taxable</th>
            ${isGst ? '<th style="width:40px;">GST</th>' : ''}
            ${isGst ? '<th style="width:55px;">CGST</th><th style="width:55px;">SGST</th>' : ''}
            <th style="width:70px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          ${pageFooter}
        </tbody>
      </table>
    `;
  };

  const buildCompactTable = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
    const pageItems = itemsWithDetails.slice(startIdx, endIdx);
    const rows = pageItems.map((item) => `
      <tr style="${item.is_delivery ? 'background:#fafafa;' : ''}">
        <td>${item.serial}</td>
        <td style="text-align:left">${item.product_name}</td>
        <td>${item.hsn}</td>
        <td>${item.quantity}</td>
        <td>₹${item.taxable_value.toFixed(2)}</td>
        <td>${item.gst_rate}%</td>
        <td>₹${item.cgst.toFixed(2)}</td>
        <td>₹${item.sgst.toFixed(2)}</td>
        <td>₹${item.row_total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <table>
        <thead>
          ${totalPages > 1 ? `<tr><td colspan="9" style="text-align:right;font-size:9px;padding:2px;">Page ${pageNum} of ${totalPages}</td></tr>` : ''}
          <tr>
            <th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  };

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

  // 7. Summary Box
  const summaryHtml = `
    <div style="display:flex;justify-content:flex-end;margin-top:14px;">
      <div style="width:280px;font-size:${fontSize}px;line-height:1.7;">
        <div style="display:flex;justify-content:space-between;">
          <span>Gross Value:</span><span>₹${rawSubtotal.toFixed(2)}</span>
        </div>
        ${totalDiscount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#16a34a;">
            <span>Total Discount:</span><span>- ₹${totalDiscount.toFixed(2)}</span>
          </div>` : ''}
        <div style="display:flex;justify-content:space-between;border-top:1px dashed #e5e7eb;padding-top:2px;">
          <span>Net Taxable Value:</span><span>₹${overallTaxable.toFixed(2)}</span>
        </div>
        ${isGst ? `
          <div style="display:flex;justify-content:space-between;color:#4b5563;">
            <span>Total CGST:</span><span>₹${overallCgst.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:#4b5563;">
            <span>Total SGST:</span><span>₹${overallSgst.toFixed(2)}</span>
          </div>` : ''}
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.15em;border-top:2px solid #111827;padding-top:4px;margin-top:4px;">
          <span>GRAND TOTAL:</span><span>₹${overallGrand.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  // ─── 8. Template Styles & Body Assembly ────────────────────────────
  let templateStyles = '';
  let templateBody = '';

  switch (template) {
    case 'template1':
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #000; padding: 20px; margin: 0; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
        .header h1 { font-size: ${isCompact ? 16 : 20}px; font-weight: 700; margin: 0; }
        .payment-type { display: inline-block; padding: 3px 10px; background: #dcfce7; border-radius: 4px; font-weight: 600; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #ccc; padding: ${isCompact ? '4px 6px' : '6px 8px'}; text-align: right; }
        th { background: #f5f5f5; text-align: center; font-weight: 600; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 10mm; }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType.toUpperCase()}</div>
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        ${isProfessional ? `<div style="margin-top:30px;display:flex;justify-content:space-between;font-size:11px;"><div>Receiver's Signature</div><div>For ${config?.company_name || 'Company'}</div></div>` : ''}
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
        .header { background: ${primaryRgba}; color: #ffffff; padding: 10px 14px; border-radius: 8px; text-align: center; margin-bottom: 12px; }
        .header h1 { font-size: ${isCompact ? 16 : 20}px; font-weight: 700; margin: 0; }
        .payment-type { display: inline-block; padding: 3px 12px; background: ${primaryRgba}; color: #ffffff; border-radius: 16px; font-weight: 600; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: ${primaryRgba}; color: #fff; padding: 6px 8px; text-align: center; font-weight: 600; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 16px; color: #64748b; font-size: 11px; }
        .header, .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 10mm; }
      `;
      templateBody = `
        <div class="invoice-container">
          ${companyInfo}
          <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
          <div class="payment-type">${paymentType.toUpperCase()}</div>
          ${addressBlock}
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
        .payment-type { display: inline-block; padding: 2px 12px; background: #f3f4f6; border-radius: 20px; font-weight: 500; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: none; padding: 6px 4px; text-align: right; }
        th { background: transparent; font-weight: 600; color: #4b5563; border-bottom: 2px solid #e5e7eb; text-align: center; }
        td { border-bottom: 1px solid #f3f4f6; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 14px; color: #9ca3af; font-size: 10px; }
        .payment-type, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 10mm; }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType.toUpperCase()}</div>
        ${addressBlock}
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
        .company-header { display: flex; align-items: center; gap: 20px; margin-bottom: 18px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 14px; }
        .company-logo { max-height: 65px; }
        .company-details { font-size: 12px; color: #374151; }
        .company-name { font-size: 24px; font-weight: 700; margin: 0; color: ${primaryColor}; }
        .header { text-align: center; margin-bottom: 12px; }
        .header h1 { font-size: ${isCompact ? 16 : 22}px; font-weight: 700; letter-spacing: 2px; color: ${primaryColor}; margin: 0; }
        .payment-type { display: inline-block; padding: 3px 12px; background: ${primaryRgba}; color: #fff; border-radius: 4px; font-weight: 600; margin-bottom: 10px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: ${primaryRgba}; color: #fff; padding: 6px 8px; text-align: center; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 16px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 10mm; }
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
        <div class="payment-type">${paymentType.toUpperCase()}</div>
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You for your business!'}</p></div>
      `;
      break;

    case 'template5':
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${Math.min(fontSize, 10)}px; padding: 8px; margin: 0; }
        .header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; }
        .header h1 { font-size: 14px; font-weight: 700; margin: 0; }
        .payment-type { display: inline-block; padding: 2px 8px; background: #f3f4f6; border-radius: 4px; font-weight: 600; font-size: 9px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        th, td { padding: 2px 4px; border: 1px solid #ccc; text-align: center; font-size: 9px; }
        th { background: #f3f4f6; font-weight: 600; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 6px; font-size: 9px; color: #666; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 8mm 6mm; }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType.toUpperCase()}</div>
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You'}</p></div>
      `;
      break;

    default:
      templateStyles = `
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 20px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
        th { background: #f5f5f5; }
        td:nth-child(2) { text-align: left; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
        .payment-type, th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }
        @page { margin: 12mm 10mm; }
      `;
      templateBody = `
        ${companyInfo}
        <div class="header"><h1>${design.headerText || 'TAX INVOICE'}</h1></div>
        <div class="payment-type">${paymentType.toUpperCase()}</div>
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You for your business!'}</p></div>
      `;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNumber}</title><style>${templateStyles}</style></head><body>${templateBody}</body></html>`;
}
