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

  // 1. Pro-rata discount per line item under Section 15(3) CGST Act
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
      pack_size: item.pack_size || '',
      hsn: item.hsn_code || '-',
      quantity: Number(item.quantity || 1),
      unit_price: unitPrice,
      item_discount: itemDiscount,
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

  // 2. Add Delivery Fee as a taxable service row (SAC 9968 @ 18% GST)
  if (deliveryFee > 0) {
    const deliveryTaxable = deliveryFee / 1.18;
    const deliveryGst = deliveryFee - deliveryTaxable;
    itemsWithDetails.push({
      serial: itemsWithDetails.length + 1,
      product_name: 'Delivery & Fulfillment Service',
      pack_size: 'SAC: 9968',
      hsn: '9968',
      quantity: 1,
      unit_price: deliveryTaxable,
      item_discount: 0,
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
  const template = design.gstTemplate || 'template1';
  const fontSize = design.gstFont === 'small' ? 9.5 : design.gstFont === 'large' ? 13 : 11;
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
  const primaryRgbaLight = hexToRgba(primaryColor, 0.08);

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
    let defaultFirst = 18, defaultNext = 22;
    switch (tmpl) {
      case 'template1': defaultFirst = 18; defaultNext = 22; break;
      case 'template2': defaultFirst = 17; defaultNext = 21; break;
      case 'template3': defaultFirst = 19; defaultNext = 23; break;
      case 'template4': defaultFirst = 16; defaultNext = 20; break;
      case 'template5': defaultFirst = 34; defaultNext = 40; break;
      default: defaultFirst = 18; defaultNext = 22;
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

  // 5. Executive Enterprise Top Header (Split Brand & Title Layout)
  const logoElement = config?.company_logo
    ? `<img src="${config.company_logo}" style="max-height:58px;max-width:160px;object-fit:contain;" alt="Company Logo" />`
    : '';

  const companyBrandingHeader = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid ${primaryColor};">
      <!-- Left: Logo & Company Credentials -->
      <div style="display:flex;align-items:center;gap:14px;max-width:65%;">
        ${logoElement}
        <div>
          <h1 style="font-size:20px;font-weight:900;margin:0;color:#0f172a;letter-spacing:-0.4px;line-height:1.2;">
            ${config?.company_name || 'Tax Invoice'}
          </h1>
          ${config?.company_address ? `<div style="font-size:10px;color:#475569;margin-top:3px;line-height:1.35;">${config.company_address}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:4px;font-size:10px;color:#334155;">
            ${config?.company_phone ? `<span><strong>Tel:</strong> ${config.company_phone}</span>` : ''}
            ${config?.company_email ? `<span>• <strong>Email:</strong> ${config.company_email}</span>` : ''}
            ${config?.company_gst ? `
              <span style="background:#f1f5f9;border:1px solid #cbd5e1;padding:1px 6px;border-radius:4px;font-weight:800;color:#0f172a;">
                GSTIN: ${config.company_gst}
              </span>` : ''}
          </div>
        </div>
      </div>

      <!-- Right: Document Title & Legal Nature -->
      <div style="text-align:right;min-width:32%;">
        <div style="display:inline-block;background:${primaryRgba};color:#ffffff;padding:4px 12px;border-radius:5px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
          ${design.headerText || 'TAX INVOICE'}
        </div>
        <div style="font-size:9.5px;color:#64748b;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">
          Original For Recipient
        </div>
        <div style="font-size:9.5px;color:#475569;margin-top:2px;">
          Rule 46 of CGST Rules, 2017
        </div>
      </div>
    </div>
  `;

  const customerNameDisplay = customerName || 'Customer';
  const customerPhoneDisplay = customerPhone || '';
  const customerGstDisplay = customerGst || '';
  const currentDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  // 6. Address & Invoice Meta Header
  const addressBlock = `
    <div style="display:flex;gap:10px;margin-bottom:12px;width:100%;">
      <!-- Left: Consignee / Customer Details -->
      <div style="flex:1.2;border:1px solid #cbd5e1;border-top:3.5px solid ${primaryColor};border-radius:6px;padding:8px 10px;background:#f8fafc;">
        <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;color:${primaryColor};letter-spacing:0.5px;margin-bottom:3px;">
          Billed To / Consignee
        </div>
        <div style="font-size:12.5px;font-weight:800;color:#0f172a;line-height:1.2;">${customerNameDisplay}</div>
        ${address ? `
          <div style="font-size:10.5px;color:#334155;margin-top:3px;line-height:1.35;">
            ${address.line1}${address.line2 ? `, ${address.line2}` : ''}, ${address.city}, ${address.state} - <strong>${address.postal_code}</strong>
          </div>` : ''}
        <div style="margin-top:4px;font-size:10px;color:#475569;display:flex;flex-wrap:wrap;gap:10px;">
          ${customerPhoneDisplay ? `<span><strong>Phone:</strong> ${customerPhoneDisplay}</span>` : ''}
          ${customerGstDisplay ? `<span style="color:#0f172a;font-weight:700;">GSTIN: ${customerGstDisplay}</span>` : ''}
        </div>
      </div>

      <!-- Right: Invoice Metadata Box -->
      <div style="flex:1;border:1px solid #cbd5e1;border-top:3.5px solid #0f172a;border-radius:6px;padding:8px 10px;background:#f8fafc;">
        <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;color:#475569;letter-spacing:0.5px;margin-bottom:3px;">
          Invoice Details
        </div>
        <table style="width:100%;border:none;margin:0;font-size:10.5px;line-height:1.4;">
          <tr>
            <td style="border:none;padding:1px 0;color:#64748b;text-align:left;width:45%;">Invoice No:</td>
            <td style="border:none;padding:1px 0;font-weight:800;color:#0f172a;text-align:right;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="border:none;padding:1px 0;color:#64748b;text-align:left;">Invoice Date:</td>
            <td style="border:none;padding:1px 0;font-weight:600;color:#0f172a;text-align:right;">${currentDate}</td>
          </tr>
          <tr>
            <td style="border:none;padding:1px 0;color:#64748b;text-align:left;">Place of Supply:</td>
            <td style="border:none;padding:1px 0;font-weight:600;color:#0f172a;text-align:right;">${address?.state || 'Local'}</td>
          </tr>
          <tr>
            <td style="border:none;padding:1px 0;color:#64748b;text-align:left;">Payment:</td>
            <td style="border:none;padding:1px 0;font-weight:800;color:#166534;text-align:right;">
              <span style="background:#dcfce7;padding:1px 6px;border-radius:3px;font-size:9.5px;">PAID</span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  const bankSection = design.showBankDetails && config?.bank_name ? `
      <div style="margin-top:12px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:5px;font-size:10.5px;background:#fafafa;">
        <div style="font-weight:700;margin-bottom:2px;color:#0f172a;">Bank Details</div>
        <div style="display:flex;gap:16px;color:#334155;">
          <span><strong>Bank:</strong> ${config.bank_name}</span>
          <span><strong>A/c:</strong> ${config.bank_account || '-'}</span>
          <span><strong>IFSC:</strong> ${config.bank_ifsc || '-'}</span>
        </div>
      </div>` : '';

  const termsSection = config?.terms_conditions ? `
      <div style="margin-top:10px;font-size:9.5px;color:#64748b;">
        <div style="font-weight:700;margin-bottom:2px;color:#334151;">Terms & Conditions:</div>
        <div style="white-space:pre-wrap;line-height:1.3;">${config.terms_conditions}</div>
      </div>` : '';

  const signatureHtml = (design.showAuthorisedSignature || design.showReceiverSignature) ? `
      <div style="margin-top:24px;display:flex;justify-content:space-between;font-size:10.5px;">
        ${design.showReceiverSignature ? `<div style="border-top:1px solid #0f172a;padding-top:4px;width:32%;text-align:center;">Receiver's Signature</div>` : '<div></div>'}
        ${design.showAuthorisedSignature ? `<div style="border-top:1px solid #0f172a;padding-top:4px;width:32%;text-align:center;">Authorised Signatory</div>` : '<div></div>'}
      </div>` : '';

  // 7. Multi-Page Table Builders (Includes Disc (₹) Column and Colored Delivery Row)
  const buildPageTable = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
    const pageItems = itemsWithDetails.slice(startIdx, endIdx);
    const pageTaxable = pageItems.reduce((s, i) => s + i.taxable_value, 0);
    const pageCgst = pageItems.reduce((s, i) => s + i.cgst, 0);
    const pageSgst = pageItems.reduce((s, i) => s + i.sgst, 0);
    const pageTotal = pageItems.reduce((s, i) => s + i.row_total, 0);

    const rows = pageItems.map((item) => {
      const deliveryStyle = item.is_delivery
        ? `background-color:${primaryRgbaLight};font-weight:600;color:#0f172a;border-left:3px solid ${primaryColor};`
        : '';

      return `
        <tr style="${deliveryStyle}">
          <td style="text-align:center;">${item.serial}</td>
          <td style="text-align:left;">
            <div style="font-weight:600;">${item.product_name}</div>
            ${item.pack_size ? `<div style="font-size:9px;color:#64748b;">${item.pack_size}</div>` : ''}
          </td>
          <td style="text-align:center;">${item.hsn}</td>
          <td style="text-align:center;">${item.quantity}</td>
          <td style="text-align:right;">₹${item.unit_price.toFixed(2)}</td>
          <td style="text-align:right;color:${item.item_discount > 0 ? '#16a34a' : '#64748b'};">
            ${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '₹0.00'}
          </td>
          <td style="text-align:right;font-weight:600;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="text-align:center;">${item.gst_rate}%</td>
          <td style="text-align:right;">₹${item.cgst.toFixed(2)}</td>
          <td style="text-align:right;">₹${item.sgst.toFixed(2)}</td>
          <td style="text-align:right;font-weight:700;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const pageFooter = printMode === 'sliced' && totalPages > 1 ? `
      <tr class="total-row" style="font-weight:700;background:#f8fafc;">
        <td colspan="6" style="text-align:right;">Page ${pageNum} Subtotal:</td>
        <td style="text-align:right;">₹${pageTaxable.toFixed(2)}</td>
        <td></td>
        <td style="text-align:right;">₹${pageCgst.toFixed(2)}</td>
        <td style="text-align:right;">₹${pageSgst.toFixed(2)}</td>
        <td style="text-align:right;">₹${pageTotal.toFixed(2)}</td>
      </tr>
    ` : '';

    return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;table-layout:auto;">
        <thead>
          ${totalPages > 1 ? `
            <tr style="background:#f1f5f9;font-size:9.5px;">
              <td colspan="11" style="border:none;padding:3px 6px;">
                <div style="display:flex;justify-content:space-between;">
                  <span>${customerNameDisplay}</span>
                  <span>Page ${pageNum} of ${totalPages}</span>
                  <span>${invoiceNumber}</span>
                </div>
              </td>
            </tr>
          ` : ''}
          <tr>
            <th style="width:28px;">#</th>
            <th>Item Description</th>
            <th style="width:48px;">HSN</th>
            <th style="width:34px;">Qty</th>
            <th style="width:58px;">Rate</th>
            <th style="width:54px;">Disc</th>
            <th style="width:64px;">Taxable</th>
            <th style="width:38px;">GST</th>
            <th style="width:54px;">CGST</th>
            <th style="width:54px;">SGST</th>
            <th style="width:68px;">Amount</th>
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
      <tr style="${item.is_delivery ? `background-color:${primaryRgbaLight};font-weight:700;` : ''}">
        <td>${item.serial}</td>
        <td style="text-align:left;">${item.product_name}</td>
        <td>${item.hsn}</td>
        <td>${item.quantity}</td>
        <td>₹${item.unit_price.toFixed(2)}</td>
        <td style="color:${item.item_discount > 0 ? '#16a34a' : '#64748b'};">
          ${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '-'}
        </td>
        <td>₹${item.taxable_value.toFixed(2)}</td>
        <td>${item.gst_rate}%</td>
        <td>₹${item.cgst.toFixed(2)}</td>
        <td>₹${item.sgst.toFixed(2)}</td>
        <td>₹${item.row_total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <thead>
          ${totalPages > 1 ? `<tr><td colspan="11" style="text-align:right;font-size:8.5px;padding:2px;">Page ${pageNum} of ${totalPages}</td></tr>` : ''}
          <tr>
            <th>#</th><th>Description</th><th>HSN</th><th>Qty</th><th>Rate</th><th>Disc</th><th>Taxable</th><th>GST%</th><th>CGST</th><th>SGST</th><th>Total</th>
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

  // 8. Summary Box
  const summaryHtml = `
    <div style="display:flex;justify-content:flex-end;margin-top:10px;">
      <div style="width:290px;font-size:${fontSize}px;line-height:1.65;border:1px solid #e2e8f0;border-radius:6px;padding:8px 10px;background:#f8fafc;">
        <div style="display:flex;justify-content:space-between;color:#475569;">
          <span>Gross Total:</span><span>₹${rawSubtotal.toFixed(2)}</span>
        </div>
        ${totalDiscount > 0 ? `
          <div style="display:flex;justify-content:space-between;color:#16a34a;font-weight:600;">
            <span>Total Discount:</span><span>- ₹${totalDiscount.toFixed(2)}</span>
          </div>` : ''}
        <div style="display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;padding-top:3px;margin-top:2px;font-weight:600;">
          <span>Net Taxable Value:</span><span>₹${overallTaxable.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:#475569;">
          <span>Total CGST:</span><span>₹${overallCgst.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:#475569;">
          <span>Total SGST:</span><span>₹${overallSgst.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.18em;border-top:2px solid #0f172a;padding-top:4px;margin-top:4px;color:#0f172a;">
          <span>GRAND TOTAL:</span><span>₹${overallGrand.toFixed(2)}</span>
        </div>
      </div>
    </div>
  `;

  // ─── 9. Template Styles & Body Assembly ────────────────────────────
  let templateStyles = '';
  let templateBody = '';

  const sharedPrintRules = `
    @page { size: A4 portrait; margin: 5mm 6mm 6mm 6mm; }
    body { width: 100% !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box; }
    * { box-sizing: border-box; }
    table { width: 100% !important; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
  `;

  switch (template) {
    case 'template1':
      templateStyles = `
        ${sharedPrintRules}
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #0f172a; }
        th, td { border: 1px solid #cbd5e1; padding: ${isCompact ? '3px 5px' : '5px 7px'}; font-size: ${fontSize}px; }
        th { background: #f1f5f9; text-align: center; font-weight: 700; color: #0f172a; }
        td { text-align: right; }
        .footer { text-align: center; margin-top: 16px; font-size: 10.5px; color: #64748b; }
        th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        ${isProfessional ? `<div style="margin-top:24px;display:flex;justify-content:space-between;font-size:10.5px;"><div>Receiver's Signature</div><div>For ${config?.company_name || 'Company'}</div></div>` : ''}
        <div class="footer"><p>${design.footerText || 'Thank you for your business!'}</p></div>
      `;
      break;

    case 'template2':
      templateStyles = `
        ${sharedPrintRules}
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: ${fontSize}px; color: #0f172a; }
        th { background: ${primaryRgba}; color: #fff; padding: 5px 7px; text-align: center; font-weight: 700; border: 1px solid ${primaryColor}; }
        td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; border-left: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; text-align: right; }
        .footer { text-align: center; margin-top: 16px; color: #64748b; font-size: 10.5px; }
        th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank You!'}</p></div>
      `;
      break;

    case 'template3':
      templateStyles = `
        ${sharedPrintRules}
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #0f172a; }
        th, td { border: none; padding: 5px 4px; text-align: right; }
        th { background: transparent; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; text-align: center; }
        td { border-bottom: 1px solid #f1f5f9; }
        .footer { text-align: center; margin-top: 14px; color: #94a3b8; font-size: 10px; }
        .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
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
        ${sharedPrintRules}
        body { font-family: 'Georgia', serif; font-size: ${fontSize}px; color: #0f172a; }
        th { background: ${primaryRgba}; color: #fff; padding: 5px 7px; text-align: center; }
        td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; text-align: right; }
        .footer { text-align: center; margin-top: 16px; font-size: 10.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
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
        ${sharedPrintRules}
        body { font-family: Arial, sans-serif; font-size: ${Math.min(fontSize, 9.5)}px; color: #0f172a; }
        th, td { padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 8.5px; }
        th { background: #f1f5f9; font-weight: 700; }
        .footer { text-align: center; margin-top: 6px; font-size: 8.5px; color: #64748b; }
        th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
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
        ${sharedPrintRules}
        body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color: #0f172a; }
        th, td { border: 1px solid #cbd5e1; padding: 5px; text-align: center; }
        th { background: #f1f5f9; font-weight: 700; }
        .footer { text-align: center; margin-top: 16px; color: #64748b; font-size: 10.5px; }
        th, .total-row { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      `;
      templateBody = `
        ${companyBrandingHeader}
        ${addressBlock}
        ${allTablesHtml}
        ${summaryHtml}
        ${signatureHtml}
        ${bankSection}
        ${termsSection}
        <div class="footer"><p>${design.footerText || 'Thank you for your business!'}</p></div>
      `;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoiceNumber}</title><style>${templateStyles}</style></head><body>${templateBody}</body></html>`;
}
