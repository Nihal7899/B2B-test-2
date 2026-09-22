// src/services/gstBill.ts
import { supabase } from '@/lib/supabase';
import { getInvoiceConfig, getInvoiceDesign, type InvoiceConfig, type InvoiceDesignSettings } from './invoice.service';
import type { DbOrder, DbOrderItem, DbAddress } from './catalog';

export interface PaymentBreakdown {
  walletPaid: number;
  onlinePaid: number;
  codPending: number;
  codPaid: number;
  totalPaid: number;
  amountToCollect: number;
  isSplit: boolean;
  paymentStatusText: string;
  paymentStatusBg: string;
  paymentStatusColor: string;
  providers: string[];
}

export interface OrderBillData {
  order: DbOrder;
  items: (DbOrderItem & { hsn_code?: string; gst_percentage?: number })[];
  address: DbAddress | null;
  customerName: string;
  customerPhone: string;
  customerGst?: string;
  payments: { id: string; provider: string; status: string; amount: number }[];
  paymentBreakdown: PaymentBreakdown;
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

  // Fetch all payment records for this order (handles Wallet, COD, and Razorpay split records)
  const { data: paymentsData } = await supabase
    .from('payments')
    .select('id, provider, status, amount')
    .eq('order_id', orderId);

  const payments = (paymentsData || []) as { id: string; provider: string; status: string; amount: number }[];

  let walletPaid = 0;
  let onlinePaid = 0;
  let codPending = 0;
  let codPaid = 0;
  let totalPaid = 0;
  const providers: string[] = [];

  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (!providers.includes(p.provider)) providers.push(p.provider);

    if (p.provider === 'wallet' && (p.status === 'paid' || p.status === 'completed')) {
      walletPaid += amt;
      totalPaid += amt;
    } else if (p.provider === 'razorpay' && (p.status === 'paid' || p.status === 'completed')) {
      onlinePaid += amt;
      totalPaid += amt;
    } else if (p.provider === 'cod') {
      if (p.status === 'paid' || p.status === 'completed') {
        codPaid += amt;
        totalPaid += amt;
      } else {
        codPending += amt;
      }
    }
  });

  const orderTotal = Number(order.total) || 0;
  const isDelivered = order.status === 'delivered';
  const amountToCollect = isDelivered ? 0 : Math.max(0, codPending > 0 ? codPending : (orderTotal - totalPaid));
  const isSplit = providers.length > 1;

  let paymentStatusText = 'PAID';
  let paymentStatusBg = '#dcfce7'; // green-100
  let paymentStatusColor = '#15803d'; // green-700

  if (order.status === 'cancelled') {
    paymentStatusText = 'CANCELLED';
    paymentStatusBg = '#fee2e2';
    paymentStatusColor = '#b91c1c';
  } else if (amountToCollect > 0) {
    if (walletPaid > 0) {
      paymentStatusText = `PARTIALLY PAID (COLLECT COD: ₹${amountToCollect.toFixed(2)})`;
    } else if (providers.includes('cod')) {
      paymentStatusText = 'CASH ON DELIVERY (PENDING)';
    } else {
      paymentStatusText = 'PAYMENT PENDING';
    }
    paymentStatusBg = '#fef3c7'; // amber-100
    paymentStatusColor = '#b45309'; // amber-700
  } else {
    if (walletPaid > 0 && onlinePaid > 0) {
      paymentStatusText = 'PAID (WALLET + ONLINE)';
    } else if (walletPaid > 0 && codPaid > 0) {
      paymentStatusText = 'PAID (WALLET + COD)';
    } else if (walletPaid > 0 && walletPaid >= orderTotal) {
      paymentStatusText = 'PAID (WALLET)';
    } else if (onlinePaid > 0) {
      paymentStatusText = 'PAID (ONLINE)';
    } else if (codPaid > 0) {
      paymentStatusText = 'PAID (COD)';
    } else {
      paymentStatusText = 'PAID';
    }
  }

  const paymentBreakdown: PaymentBreakdown = {
    walletPaid,
    onlinePaid,
    codPending,
    codPaid,
    totalPaid,
    amountToCollect,
    isSplit,
    paymentStatusText,
    paymentStatusBg,
    paymentStatusColor,
    providers,
  };

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
    payments,
    paymentBreakdown,
  };
}

export async function buildGstBillHtml(orderId: string): Promise<string> {
  const data = await fetchOrderBillData(orderId);
  const config = await getInvoiceConfig();
  const design = await getInvoiceDesign();
  return buildA4InvoiceHtml(data, config, design);
}

function buildA4InvoiceHtml(
  data: OrderBillData,
  config: InvoiceConfig | null,
  design: InvoiceDesignSettings
): string {
  const { order, items, address, customerName, customerPhone, customerGst, paymentBreakdown } = data;

  const totalDiscount = Number(order.discount || 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const rawSubtotal = items.reduce((sum, item) => sum + Number(item.line_total || 0), 0);

  const {
    walletPaid,
    onlinePaid,
    codPaid,
    amountToCollect,
    paymentStatusText,
    paymentStatusBg,
    paymentStatusColor,
  } = paymentBreakdown;

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

  // 2. Delivery Fee SAC 9968
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

  const overallTaxable = itemsWithDetails.reduce((sum, i) => sum + i.taxable_value, 0);
  const overallCgst = itemsWithDetails.reduce((sum, i) => sum + i.cgst, 0);
  const overallSgst = itemsWithDetails.reduce((sum, i) => sum + i.sgst, 0);
  const overallGst = overallCgst + overallSgst;
  const overallGrand = Number(order.total) || (overallTaxable + overallGst);

  const invoiceNumber = order.order_number || `INV-${order.id.slice(0, 8)}`;
  const template = design.gstTemplate || 'template1';
  const fontSize = design.gstFont === 'small' ? 9.5 : design.gstFont === 'large' ? 13 : 11;
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

  const customerNameDisplay = customerName || 'Customer';
  const customerPhoneDisplay = customerPhone || '';
  const customerGstDisplay = customerGst || '';
  const currentDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

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

  const getPageRowCounts = (tmpl: string, fSize: string) => {
    let defaultFirst = 18, defaultNext = 22;
    switch (tmpl) {
      case 'template1': defaultFirst = 17; defaultNext = 21; break;
      case 'template2': defaultFirst = 16; defaultNext = 20; break;
      case 'template3': defaultFirst = 19; defaultNext = 24; break;
      case 'template4': defaultFirst = 16; defaultNext = 20; break;
      case 'template5': defaultFirst = 34; defaultNext = 40; break;
      default: defaultFirst = 18; defaultNext = 22;
    }
    if (fSize === 'small') { defaultFirst += 3; defaultNext += 4; }
    else if (fSize === 'large') { defaultFirst -= 3; defaultNext -= 4; }
    return {
      first: design.firstPageRows && design.firstPageRows > 0 ? design.firstPageRows : defaultFirst,
      next: design.nextPageRows && design.nextPageRows > 0 ? design.nextPageRows : defaultNext,
    };
  };

  const { first, next } = getPageRowCounts(template, design.gstFont);
  const slices = printMode === 'sliced' ? computePageSlices(itemsWithDetails.length, first, next) : [{ start: 0, end: itemsWithDetails.length }];

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

  const sharedPrintRules = `
    @page { 
      size: A4 portrait; 
      margin: 6mm 6mm 6mm 6mm; 
    }
    *, *:before, *:after { 
      box-sizing: border-box; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      color-adjust: exact !important; 
    }
    body { 
      width: 100% !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
    }
    table { width: 100% !important; border-collapse: collapse; }
    tr { page-break-inside: avoid; }
    thead { display: table-header-group; }
  `;

  // ─── TEMPLATE 1: CLASSIC CORPORATE GRID ──────────────────────────────────────────
  if (template === 'template1') {
    const buildT1Table = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
      const pageItems = itemsWithDetails.slice(startIdx, endIdx);
      const rows = pageItems.map((item) => `
        <tr style="${item.is_delivery ? `background:#f8fafc;font-weight:600;` : ''}">
          <td style="text-align:center;border:1px solid #000;">${item.serial}</td>
          <td style="text-align:left;border:1px solid #000;"><strong>${item.product_name}</strong> ${item.pack_size ? `<span style="font-size:9px;color:#555;">(${item.pack_size})</span>` : ''}</td>
          <td style="text-align:center;border:1px solid #000;">${item.hsn}</td>
          <td style="text-align:center;border:1px solid #000;">${item.quantity}</td>
          <td style="text-align:right;border:1px solid #000;">₹${item.unit_price.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #000;">${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '-'}</td>
          <td style="text-align:right;border:1px solid #000;font-weight:600;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="text-align:center;border:1px solid #000;">${item.gst_rate}%</td>
          <td style="text-align:right;border:1px solid #000;">₹${item.cgst.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #000;">₹${item.sgst.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #000;font-weight:700;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `).join('');

      return `
        <table style="width:100%;border-collapse:collapse;border:1px solid #000;margin-top:4px;">
          <thead>
            ${totalPages > 1 ? `<tr><td colspan="11" style="text-align:right;font-size:9px;padding:2px;border:none;">Page ${pageNum} of ${totalPages}</td></tr>` : ''}
            <tr style="background:#e2e8f0;font-size:10px;">
              <th style="border:1px solid #000;padding:4px;width:28px;">S.N</th>
              <th style="border:1px solid #000;padding:4px;">Description of Goods/Services</th>
              <th style="border:1px solid #000;padding:4px;width:50px;">HSN/SAC</th>
              <th style="border:1px solid #000;padding:4px;width:35px;">Qty</th>
              <th style="border:1px solid #000;padding:4px;width:60px;">Rate</th>
              <th style="border:1px solid #000;padding:4px;width:55px;">Disc</th>
              <th style="border:1px solid #000;padding:4px;width:65px;">Taxable</th>
              <th style="border:1px solid #000;padding:4px;width:40px;">GST%</th>
              <th style="border:1px solid #000;padding:4px;width:55px;">CGST</th>
              <th style="border:1px solid #000;padding:4px;width:55px;">SGST</th>
              <th style="border:1px solid #000;padding:4px;width:70px;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    };

    let tablesHtml = '';
    slices.forEach((s, idx) => {
      tablesHtml += buildT1Table(s.start, s.end, idx + 1, slices.length);
      if (printMode === 'sliced' && idx < slices.length - 1) tablesHtml += `<div style="page-break-after:always;"></div>`;
    });

    const bodyContent = `
      <div style="border:2px solid #000;padding:10px;">
        <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
          <div style="font-size:18px;font-weight:900;letter-spacing:1px;">${design.headerText || 'TAX INVOICE'}</div>
          <div style="font-size:10px;font-weight:700;">(Under Section 31 of GST Act, 2017)</div>
        </div>
        <div style="display:flex;border:1px solid #000;margin-bottom:8px;">
          <div style="flex:1.2;padding:6px;border-right:1px solid #000;font-size:10.5px;line-height:1.4;">
            <div style="font-size:9px;font-weight:bold;text-transform:uppercase;color:#555;">Details of Supplier / Seller</div>
            <div style="font-size:13px;font-weight:bold;margin-top:2px;">${config?.company_name || 'Store'}</div>
            <div>${config?.company_address || ''}</div>
            <div><strong>GSTIN:</strong> ${config?.company_gst || '-'}</div>
            <div><strong>Phone:</strong> ${config?.company_phone || '-'}</div>
          </div>
          <div style="flex:1;padding:6px;font-size:10.5px;line-height:1.4;">
            <div style="font-size:9px;font-weight:bold;text-transform:uppercase;color:#555;">Details of Recipient / Buyer</div>
            <div style="font-size:13px;font-weight:bold;margin-top:2px;">${customerNameDisplay}</div>
            <div>${address ? `${address.line1}, ${address.city} - ${address.postal_code}` : 'Walk-in'}</div>
            <div><strong>GSTIN:</strong> ${customerGstDisplay || 'Unregistered'}</div>
            <div><strong>Invoice No:</strong> ${invoiceNumber} | <strong>Date:</strong> ${currentDate}</div>
            <div style="margin-top:3px;"><span style="background:${paymentStatusBg};color:${paymentStatusColor};font-weight:800;padding:1px 6px;border-radius:4px;font-size:9.5px;">${paymentStatusText}</span></div>
          </div>
        </div>
        ${tablesHtml}
        <div style="display:flex;justify-content:flex-end;margin-top:8px;">
          <table style="width:320px;border:1px solid #000;border-collapse:collapse;font-size:10.5px;">
            <tr><td style="border:1px solid #000;padding:3px 6px;">Gross Amount:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;">₹${rawSubtotal.toFixed(2)}</td></tr>
            ${totalDiscount > 0 ? `<tr><td style="border:1px solid #000;padding:3px 6px;color:green;">Discount:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;color:green;">-₹${totalDiscount.toFixed(2)}</td></tr>` : ''}
            <tr><td style="border:1px solid #000;padding:3px 6px;font-weight:bold;">Total Taxable:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;font-weight:bold;">₹${overallTaxable.toFixed(2)}</td></tr>
            <tr><td style="border:1px solid #000;padding:3px 6px;">Total CGST:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;">₹${overallCgst.toFixed(2)}</td></tr>
            <tr><td style="border:1px solid #000;padding:3px 6px;">Total SGST:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;">₹${overallSgst.toFixed(2)}</td></tr>
            <tr style="background:#e2e8f0;font-weight:bold;font-size:11.5px;"><td style="border:1px solid #000;padding:4px 6px;">Invoice Total:</td><td style="border:1px solid #000;padding:4px 6px;text-align:right;">₹${overallGrand.toFixed(2)}</td></tr>
            ${walletPaid > 0 ? `<tr><td style="border:1px solid #000;padding:3px 6px;color:#15803d;font-weight:600;">Paid via Wallet:</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;color:#15803d;font-weight:600;">-₹${walletPaid.toFixed(2)}</td></tr>` : ''}
            ${onlinePaid > 0 ? `<tr><td style="border:1px solid #000;padding:3px 6px;color:#1d4ed8;font-weight:600;">Paid Online (Razorpay):</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;color:#1d4ed8;font-weight:600;">-₹${onlinePaid.toFixed(2)}</td></tr>` : ''}
            ${codPaid > 0 ? `<tr><td style="border:1px solid #000;padding:3px 6px;color:#15803d;font-weight:600;">Paid on Delivery (COD):</td><td style="border:1px solid #000;padding:3px 6px;text-align:right;color:#15803d;font-weight:600;">-₹${codPaid.toFixed(2)}</td></tr>` : ''}
            ${amountToCollect > 0 ? `<tr style="background:#fef3c7;color:#b45309;font-weight:bold;"><td style="border:1px solid #000;padding:4px 6px;">Balance Due (Collect COD):</td><td style="border:1px solid #000;padding:4px 6px;text-align:right;">₹${amountToCollect.toFixed(2)}</td></tr>` : ''}
          </table>
        </div>
        ${bankSection}
        ${termsSection}
        ${signatureHtml}
        <div style="text-align:center;margin-top:12px;font-size:9.5px;color:#555;">${design.footerText || 'Thank you for your business!'}</div>
      </div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules} body { font-family: Arial, sans-serif; font-size: ${fontSize}px; }</style></head><body>${bodyContent}</body></html>`;
  }

  // ─── TEMPLATE 2: MODERN COLOR BANNER ─────────────────────────────────────────────
  if (template === 'template2') {
    const buildT2Table = (startIdx: number, endIdx: number) => {
      const pageItems = itemsWithDetails.slice(startIdx, endIdx);
      const rows = pageItems.map((item, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};${item.is_delivery ? `background:${primaryRgbaLight};font-weight:bold;` : ''}">
          <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;">${item.serial}</td>
          <td style="padding:6px 8px;text-align:left;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;color:#1e293b;">${item.product_name}</div>
            ${item.pack_size ? `<div style="font-size:9px;color:#64748b;">${item.pack_size}</div>` : ''}
          </td>
          <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;">${item.hsn}</td>
          <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;font-weight:600;">${item.quantity}</td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;">₹${item.unit_price.toFixed(2)}</td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;color:${item.item_discount > 0 ? '#16a34a' : '#94a3b8'};">
            ${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '₹0.00'}
          </td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0;color:#64748b;">${item.gst_rate}%</td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;color:#475569;">₹${item.cgst.toFixed(2)}</td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;color:#475569;">₹${item.sgst.toFixed(2)}</td>
          <td style="padding:6px 8px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:800;color:#0f172a;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `).join('');

      return `
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;margin-top:6px;border:1px solid #e2e8f0;">
          <thead>
            <tr style="background:${primaryRgba};color:#ffffff;font-size:10.5px;">
              <th style="padding:7px;width:30px;">#</th>
              <th style="padding:7px;text-align:left;">Item & Details</th>
              <th style="padding:7px;width:48px;">HSN</th>
              <th style="padding:7px;width:35px;">Qty</th>
              <th style="padding:7px;width:60px;">Rate</th>
              <th style="padding:7px;width:55px;">Disc</th>
              <th style="padding:7px;width:65px;">Taxable</th>
              <th style="padding:7px;width:40px;">GST</th>
              <th style="padding:7px;width:55px;">CGST</th>
              <th style="padding:7px;width:55px;">SGST</th>
              <th style="padding:7px;width:75px;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    };

    let tablesHtml = '';
    slices.forEach((s, idx) => {
      tablesHtml += buildT2Table(s.start, s.end);
      if (printMode === 'sliced' && idx < slices.length - 1) tablesHtml += `<div style="page-break-after:always;"></div>`;
    });

    const bodyContent = `
      <div style="background:#ffffff;">
        <div style="background:${primaryRgba};color:#ffffff;padding:14px 18px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            ${config?.company_logo ? `<img src="${config.company_logo}" style="max-height:48px;margin-bottom:4px;filter:brightness(0) invert(1);" />` : ''}
            <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#fff;">${config?.company_name || 'Store'}</div>
            <div style="font-size:10px;opacity:0.9;margin-top:2px;">${config?.company_address || ''} • GSTIN: ${config?.company_gst || '-'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">${design.headerText || 'TAX INVOICE'}</div>
            <div style="font-size:11px;opacity:0.9;margin-top:3px;">#${invoiceNumber}</div>
            <div style="font-size:10px;opacity:0.8;">${currentDate}</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:12px;">
          <div style="flex:1.2;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:10.5px;">
            <span style="font-size:9px;font-weight:800;color:${primaryColor};text-transform:uppercase;">Billed To</span>
            <div style="font-size:13px;font-weight:800;color:#0f172a;margin-top:1px;">${customerNameDisplay}</div>
            ${address ? `<div style="color:#475569;margin-top:2px;">${address.line1}, ${address.city} - ${address.postal_code}</div>` : ''}
            <div style="color:#64748b;margin-top:2px;">Phone: ${customerPhoneDisplay || '-'} | GSTIN: ${customerGstDisplay || 'Unregistered'}</div>
          </div>
          <div style="flex:0.8;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:10.5px;text-align:right;">
            <span style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;">Payment Status</span>
            <div style="margin-top:2px;"><span style="background:${paymentStatusBg};color:${paymentStatusColor};font-weight:800;padding:2px 8px;border-radius:20px;font-size:10px;">${paymentStatusText}</span></div>
            <div style="color:#64748b;margin-top:6px;">Place of Supply: <strong>${address?.state || 'Local'}</strong></div>
          </div>
        </div>

        ${tablesHtml}

        <div style="display:flex;justify-content:flex-end;margin-top:12px;">
          <div style="width:310px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;font-size:11px;line-height:1.6;">
            <div style="display:flex;justify-content:space-between;color:#475569;"><span>Gross Subtotal:</span><span>₹${rawSubtotal.toFixed(2)}</span></div>
            ${totalDiscount > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a;font-weight:600;"><span>Promo Discount:</span><span>-₹${totalDiscount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;color:#0f172a;font-weight:700;border-top:1px dashed #cbd5e1;padding-top:2px;margin-top:2px;"><span>Net Taxable:</span><span>₹${overallTaxable.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#64748b;"><span>CGST:</span><span>₹${overallCgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#64748b;"><span>SGST:</span><span>₹${overallSgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:800;font-size:12px;color:#0f172a;border-top:1px solid #cbd5e1;padding-top:3px;margin-top:3px;">
              <span>Invoice Total:</span><span>₹${overallGrand.toFixed(2)}</span>
            </div>
            ${walletPaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#15803d;font-weight:600;"><span>Paid via Wallet:</span><span>-₹${walletPaid.toFixed(2)}</span></div>` : ''}
            ${onlinePaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#1d4ed8;font-weight:600;"><span>Paid Online (Razorpay):</span><span>-₹${onlinePaid.toFixed(2)}</span></div>` : ''}
            ${codPaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#15803d;font-weight:600;"><span>Paid on Delivery:</span><span>-₹${codPaid.toFixed(2)}</span></div>` : ''}
            ${amountToCollect > 0 ? `
              <div style="display:flex;justify-content:space-between;font-weight:900;font-size:13px;color:#b45309;background:#fef3c7;padding:4px 8px;border-radius:6px;margin-top:4px;">
                <span>COLLECT COD:</span><span>₹${amountToCollect.toFixed(2)}</span>
              </div>` : `
              <div style="display:flex;justify-content:space-between;font-weight:900;font-size:13px;color:#ffffff;background:${primaryRgba};padding:4px 8px;border-radius:6px;margin-top:4px;">
                <span>FULLY SETTLED:</span><span>₹0.00</span>
              </div>`}
          </div>
        </div>

        ${bankSection}
        ${termsSection}
        ${signatureHtml}
        <div style="text-align:center;margin-top:14px;font-size:10px;color:#94a3b8;">${design.footerText || 'Thank you!'}</div>
      </div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules} body { font-family: 'Segoe UI', Arial, sans-serif; font-size: ${fontSize}px; color:#0f172a; }</style></head><body>${bodyContent}</body></html>`;
  }

  // ─── TEMPLATE 3: MINIMALIST MONOCHROME ───────────────────────────────────────────
  if (template === 'template3') {
    const buildT3Table = (startIdx: number, endIdx: number) => {
      const pageItems = itemsWithDetails.slice(startIdx, endIdx);
      const rows = pageItems.map((item) => `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:6px 2px;color:#94a3b8;text-align:center;">${item.serial}</td>
          <td style="padding:6px 4px;text-align:left;">
            <div style="font-weight:600;color:#0f172a;">${item.product_name}</div>
            ${item.pack_size ? `<div style="font-size:8.5px;color:#94a3b8;">${item.pack_size}</div>` : ''}
          </td>
          <td style="padding:6px 2px;text-align:center;color:#64748b;">${item.hsn}</td>
          <td style="padding:6px 2px;text-align:center;">${item.quantity}</td>
          <td style="padding:6px 2px;text-align:right;">₹${item.unit_price.toFixed(2)}</td>
          <td style="padding:6px 2px;text-align:right;color:#64748b;">${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '-'}</td>
          <td style="padding:6px 2px;text-align:right;font-weight:600;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="padding:6px 2px;text-align:center;color:#64748b;">${item.gst_rate}%</td>
          <td style="padding:6px 2px;text-align:right;color:#64748b;">₹${item.cgst.toFixed(2)}</td>
          <td style="padding:6px 2px;text-align:right;color:#64748b;">₹${item.sgst.toFixed(2)}</td>
          <td style="padding:6px 2px;text-align:right;font-weight:700;color:#0f172a;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `).join('');

      return `
        <table style="width:100%;border-collapse:collapse;margin-top:12px;">
          <thead>
            <tr style="border-bottom:2px solid #0f172a;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#475569;">
              <th style="padding:4px;text-align:center;width:25px;">#</th>
              <th style="padding:4px;text-align:left;">Description</th>
              <th style="padding:4px;width:48px;">HSN</th>
              <th style="padding:4px;width:30px;">Qty</th>
              <th style="padding:4px;text-align:right;width:55px;">Rate</th>
              <th style="padding:4px;text-align:right;width:50px;">Disc</th>
              <th style="padding:4px;text-align:right;width:60px;">Taxable</th>
              <th style="padding:4px;text-align:center;width:35px;">GST</th>
              <th style="padding:4px;text-align:right;width:50px;">CGST</th>
              <th style="padding:4px;text-align:right;width:50px;">SGST</th>
              <th style="padding:4px;text-align:right;width:65px;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    };

    let tablesHtml = '';
    slices.forEach((s, idx) => {
      tablesHtml += buildT3Table(s.start, s.end);
      if (printMode === 'sliced' && idx < slices.length - 1) tablesHtml += `<div style="page-break-after:always;"></div>`;
    });

    const bodyContent = `
      <div style="color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:24px;font-weight:300;letter-spacing:2px;text-transform:uppercase;color:#0f172a;">${config?.company_name || 'TAX INVOICE'}</div>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">${config?.company_address || ''} • GSTIN: ${config?.company_gst || '-'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#0f172a;">INVOICE #${invoiceNumber}</div>
            <div style="font-size:10px;color:#64748b;">${currentDate}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:10.5px;color:#334155;line-height:1.5;">
          <div>
            <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:#94a3b8;text-transform:uppercase;">Billed To</div>
            <div style="font-weight:700;color:#0f172a;">${customerNameDisplay}</div>
            ${address ? `<div>${address.line1}, ${address.city} - ${address.postal_code}</div>` : ''}
            <div>Phone: ${customerPhoneDisplay || '-'} | GST: ${customerGstDisplay || 'Unregistered'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;color:#94a3b8;text-transform:uppercase;">Status</div>
            <div>Payment: <strong>${paymentStatusText}</strong></div>
            <div>Place of Supply: ${address?.state || 'Local'}</div>
          </div>
        </div>

        ${tablesHtml}

        <div style="display:flex;justify-content:flex-end;margin-top:16px;">
          <div style="width:280px;font-size:10.5px;line-height:1.7;">
            <div style="display:flex;justify-content:space-between;color:#64748b;"><span>Taxable Amount:</span><span>₹${overallTaxable.toFixed(2)}</span></div>
            ${totalDiscount > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a;"><span>Total Discount:</span><span>-₹${totalDiscount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;color:#64748b;"><span>CGST:</span><span>₹${overallCgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#64748b;"><span>SGST:</span><span>₹${overallSgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:11.5px;color:#0f172a;border-top:1px solid #e2e8f0;padding-top:3px;margin-top:2px;">
              <span>Invoice Total:</span><span>₹${overallGrand.toFixed(2)}</span>
            </div>
            ${walletPaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a;"><span>Paid via Wallet:</span><span>-₹${walletPaid.toFixed(2)}</span></div>` : ''}
            ${onlinePaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#2563eb;"><span>Paid Online:</span><span>-₹${onlinePaid.toFixed(2)}</span></div>` : ''}
            ${amountToCollect > 0 ? `
              <div style="display:flex;justify-content:space-between;font-weight:800;font-size:13px;color:#b45309;border-top:1px solid #0f172a;padding-top:4px;margin-top:4px;">
                <span>BALANCE DUE (COD):</span><span>₹${amountToCollect.toFixed(2)}</span>
              </div>` : `
              <div style="display:flex;justify-content:space-between;font-weight:800;font-size:13px;color:#0f172a;border-top:1px solid #0f172a;padding-top:4px;margin-top:4px;">
                <span>BALANCE DUE:</span><span>₹0.00</span>
              </div>`}
          </div>
        </div>

        ${bankSection}
        ${termsSection}
        ${signatureHtml}
        <div style="text-align:center;margin-top:16px;font-size:9.5px;color:#94a3b8;">${design.footerText || 'Thank you.'}</div>
      </div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules} body { font-family: -apple-system, sans-serif; font-size: ${fontSize}px; color:#0f172a; }</style></head><body>${bodyContent}</body></html>`;
  }

  // ─── TEMPLATE 4: EXECUTIVE ENTERPRISE ───────────────────────────────────────────
  if (template === 'template4') {
    const buildT4Table = (startIdx: number, endIdx: number, pageNum: number, totalPages: number) => {
      const pageItems = itemsWithDetails.slice(startIdx, endIdx);
      const rows = pageItems.map((item) => `
        <tr style="${item.is_delivery ? `background-color:${primaryRgbaLight};font-weight:600;border-left:3px solid ${primaryColor};` : ''}">
          <td style="text-align:center;border:1px solid #cbd5e1;padding:5px 7px;">${item.serial}</td>
          <td style="text-align:left;border:1px solid #cbd5e1;padding:5px 7px;">
            <div style="font-weight:700;">${item.product_name}</div>
            ${item.pack_size ? `<div style="font-size:9px;color:#64748b;">${item.pack_size}</div>` : ''}
          </td>
          <td style="text-align:center;border:1px solid #cbd5e1;padding:5px 7px;">${item.hsn}</td>
          <td style="text-align:center;border:1px solid #cbd5e1;padding:5px 7px;">${item.quantity}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;">₹${item.unit_price.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;color:${item.item_discount > 0 ? '#16a34a' : '#64748b'};">
            ${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '₹0.00'}
          </td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;font-weight:600;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="text-align:center;border:1px solid #cbd5e1;padding:5px 7px;">${item.gst_rate}%</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;">₹${item.cgst.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;">₹${item.sgst.toFixed(2)}</td>
          <td style="text-align:right;border:1px solid #cbd5e1;padding:5px 7px;font-weight:700;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `).join('');

      return `
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <thead>
            ${totalPages > 1 ? `<tr><td colspan="11" style="text-align:right;font-size:9px;padding:2px;border:none;">Page ${pageNum} of ${totalPages}</td></tr>` : ''}
            <tr style="background:#f1f5f9;font-size:10px;">
              <th style="border:1px solid #cbd5e1;padding:5px;width:28px;">#</th>
              <th style="border:1px solid #cbd5e1;padding:5px;text-align:left;">Item Description</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:48px;">HSN</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:34px;">Qty</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:58px;">Rate</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:54px;">Disc</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:64px;">Taxable</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:38px;">GST</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:54px;">CGST</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:54px;">SGST</th>
              <th style="border:1px solid #cbd5e1;padding:5px;width:68px;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    };

    let tablesHtml = '';
    slices.forEach((s, idx) => {
      tablesHtml += buildT4Table(s.start, s.end, idx + 1, slices.length);
      if (printMode === 'sliced' && idx < slices.length - 1) tablesHtml += `<div style="page-break-after:always;"></div>`;
    });

    const bodyContent = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;margin-bottom:12px;border-bottom:2px solid ${primaryColor};">
          <div style="display:flex;align-items:center;gap:14px;max-width:65%;">
            ${config?.company_logo ? `<img src="${config.company_logo}" style="max-height:58px;max-width:160px;object-fit:contain;" />` : ''}
            <div>
              <h1 style="font-size:20px;font-weight:900;margin:0;color:#0f172a;letter-spacing:-0.4px;">${config?.company_name || 'Tax Invoice'}</h1>
              ${config?.company_address ? `<div style="font-size:10px;color:#475569;margin-top:3px;">${config.company_address}</div>` : ''}
              <div style="margin-top:4px;font-size:10px;color:#334155;">
                <strong>Tel:</strong> ${config?.company_phone || '-'} • <strong>GSTIN:</strong> ${config?.company_gst || '-'}
              </div>
            </div>
          </div>
          <div style="text-align:right;min-width:32%;">
            <div style="display:inline-block;background:${primaryRgba};color:#ffffff;padding:4px 12px;border-radius:5px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
              ${design.headerText || 'TAX INVOICE'}
            </div>
            <div style="font-size:9.5px;color:#64748b;font-weight:700;margin-top:4px;text-transform:uppercase;">Original For Recipient</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:12px;width:100%;">
          <div style="flex:1.2;border:1px solid #cbd5e1;border-top:3.5px solid ${primaryColor};border-radius:6px;padding:8px 10px;background:#f8fafc;">
            <div style="font-size:9.5px;font-weight:800;text-transform:uppercase;color:${primaryColor};">Billed To / Consignee</div>
            <div style="font-size:12.5px;font-weight:800;color:#0f172a;margin-top:1px;">${customerNameDisplay}</div>
            ${address ? `<div style="font-size:10.5px;color:#334155;margin-top:2px;">${address.line1}, ${address.city} - ${address.postal_code}</div>` : ''}
            <div style="font-size:10px;color:#475569;margin-top:3px;">Phone: ${customerPhoneDisplay || '-'} | GSTIN: ${customerGstDisplay || 'Unregistered'}</div>
          </div>
          <div style="flex:1;border:1px solid #cbd5e1;border-top:3.5px solid #0f172a;border-radius:6px;padding:8px 10px;background:#f8fafc;font-size:10.5px;">
            <div style="display:flex;justify-content:space-between;"><span>Invoice No:</span><strong>${invoiceNumber}</strong></div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;"><span>Invoice Date:</span><span>${currentDate}</span></div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;"><span>Place of Supply:</span><span>${address?.state || 'Local'}</span></div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;"><span>Payment Status:</span><strong style="color:${paymentStatusColor};">${paymentStatusText}</strong></div>
          </div>
        </div>

        ${tablesHtml}

        <div style="display:flex;justify-content:flex-end;margin-top:10px;">
          <div style="width:310px;font-size:${fontSize}px;line-height:1.65;border:1px solid #cbd5e1;border-radius:6px;padding:8px 10px;background:#f8fafc;">
            <div style="display:flex;justify-content:space-between;color:#475569;"><span>Gross Total:</span><span>₹${rawSubtotal.toFixed(2)}</span></div>
            ${totalDiscount > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a;font-weight:600;"><span>Total Discount:</span><span>-₹${totalDiscount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;border-top:1px dashed #cbd5e1;padding-top:3px;margin-top:2px;font-weight:600;"><span>Net Taxable Value:</span><span>₹${overallTaxable.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#475569;"><span>Total CGST:</span><span>₹${overallCgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;color:#475569;"><span>Total SGST:</span><span>₹${overallSgst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.05em;border-top:1px solid #cbd5e1;padding-top:3px;margin-top:3px;color:#0f172a;">
              <span>Invoice Amount:</span><span>₹${overallGrand.toFixed(2)}</span>
            </div>
            ${walletPaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#15803d;font-weight:600;"><span>Wallet Deduction:</span><span>-₹${walletPaid.toFixed(2)}</span></div>` : ''}
            ${onlinePaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#1d4ed8;font-weight:600;"><span>Online Payment:</span><span>-₹${onlinePaid.toFixed(2)}</span></div>` : ''}
            ${amountToCollect > 0 ? `
              <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.15em;border-top:2px solid #b45309;padding-top:4px;margin-top:4px;color:#b45309;">
                <span>COLLECT ON DELIVERY:</span><span>₹${amountToCollect.toFixed(2)}</span>
              </div>` : `
              <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.15em;border-top:2px solid #0f172a;padding-top:4px;margin-top:4px;color:#0f172a;">
                <span>NET BALANCE DUE:</span><span>₹0.00</span>
              </div>`}
          </div>
        </div>

        ${bankSection}
        ${termsSection}
        ${signatureHtml}
        <div style="text-align:center;margin-top:14px;font-size:10.5px;color:#64748b;">${design.footerText || 'Thank you for your business!'}</div>
      </div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules} body { font-family: Arial, sans-serif; font-size: ${fontSize}px; color:#0f172a; }</style></head><body>${bodyContent}</body></html>`;
  }

  // ─── TEMPLATE 5: COMPACT HIGH-DENSITY ───────────────────────────────────────────
  if (template === 'template5') {
    const buildT5Table = (startIdx: number, endIdx: number) => {
      const pageItems = itemsWithDetails.slice(startIdx, endIdx);
      const rows = pageItems.map((item) => `
        <tr style="font-size:8.5px;${item.is_delivery ? 'background:#f1f5f9;font-weight:bold;' : ''}">
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:center;">${item.serial}</td>
          <td style="border:1px solid #cbd5e1;padding:2px 4px;text-align:left;">${item.product_name}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:center;">${item.hsn}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:center;">${item.quantity}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;">₹${item.unit_price.toFixed(2)}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;">${item.item_discount > 0 ? `-₹${item.item_discount.toFixed(2)}` : '-'}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;font-weight:600;">₹${item.taxable_value.toFixed(2)}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:center;">${item.gst_rate}%</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;">₹${item.cgst.toFixed(2)}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;">₹${item.sgst.toFixed(2)}</td>
          <td style="border:1px solid #cbd5e1;padding:2px;text-align:right;font-weight:700;">₹${item.row_total.toFixed(2)}</td>
        </tr>
      `).join('');

      return `
        <table style="width:100%;border-collapse:collapse;margin-top:4px;">
          <thead>
            <tr style="background:#f8fafc;font-size:8.5px;font-weight:bold;">
              <th style="border:1px solid #cbd5e1;padding:3px;width:24px;">#</th>
              <th style="border:1px solid #cbd5e1;padding:3px;text-align:left;">Description</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:44px;">HSN</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:28px;">Qty</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:50px;">Rate</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:46px;">Disc</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:55px;">Taxable</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:34px;">GST%</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:46px;">CGST</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:46px;">SGST</th>
              <th style="border:1px solid #cbd5e1;padding:3px;width:60px;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    };

    let tablesHtml = '';
    slices.forEach((s, idx) => {
      tablesHtml += buildT5Table(s.start, s.end);
      if (printMode === 'sliced' && idx < slices.length - 1) tablesHtml += `<div style="page-break-after:always;"></div>`;
    });

    const bodyContent = `
      <div style="font-size:9px;line-height:1.3;">
        <div style="display:flex;justify-content:space-between;border-bottom:1.5px solid #0f172a;padding-bottom:4px;margin-bottom:6px;">
          <div>
            <div style="font-size:14px;font-weight:900;">${config?.company_name || 'STORE'}</div>
            <div style="font-size:8.5px;color:#555;">${config?.company_address || ''} | GSTIN: ${config?.company_gst || '-'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;">${design.headerText || 'TAX INVOICE'}</div>
            <div style="font-size:8.5px;color:#555;">#${invoiceNumber} | ${currentDate}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;background:#f8fafc;border:1px solid #cbd5e1;padding:4px 6px;margin-bottom:4px;font-size:8.5px;">
          <div><strong>Customer:</strong> ${customerNameDisplay} (${customerPhoneDisplay || '-'}) | GST: ${customerGstDisplay || 'Unreg'}</div>
          <div><strong>Status:</strong> ${paymentStatusText}</div>
        </div>

        ${tablesHtml}

        <div style="display:flex;justify-content:flex-end;margin-top:6px;">
          <div style="width:250px;border:1px solid #cbd5e1;padding:4px 6px;background:#f8fafc;font-size:9px;line-height:1.5;">
            <div style="display:flex;justify-content:space-between;"><span>Taxable Subtotal:</span><span>₹${overallTaxable.toFixed(2)}</span></div>
            ${totalDiscount > 0 ? `<div style="display:flex;justify-content:space-between;color:green;"><span>Discount:</span><span>-₹${totalDiscount.toFixed(2)}</span></div>` : ''}
            <div style="display:flex;justify-content:space-between;"><span>Total Tax:</span><span>₹${overallGst.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:800;border-top:1px solid #000;margin-top:2px;padding-top:2px;">
              <span>Total:</span><span>₹${overallGrand.toFixed(2)}</span>
            </div>
            ${walletPaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#15803d;"><span>Wallet Paid:</span><span>-₹${walletPaid.toFixed(2)}</span></div>` : ''}
            ${onlinePaid > 0 ? `<div style="display:flex;justify-content:space-between;color:#1d4ed8;"><span>Online Paid:</span><span>-₹${onlinePaid.toFixed(2)}</span></div>` : ''}
            ${amountToCollect > 0 ? `
              <div style="display:flex;justify-content:space-between;font-weight:900;color:#b45309;border-top:1px dashed #cbd5e1;margin-top:2px;padding-top:2px;">
                <span>DUE (COD):</span><span>₹${amountToCollect.toFixed(2)}</span>
              </div>` : `
              <div style="display:flex;justify-content:space-between;font-weight:900;color:#15803d;border-top:1px dashed #cbd5e1;margin-top:2px;padding-top:2px;">
                <span>BALANCE:</span><span>₹0.00</span>
              </div>`}
          </div>
        </div>

        ${bankSection}
        ${termsSection}
        ${signatureHtml}
      </div>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules} body { font-family: Arial, sans-serif; font-size: 8.5px; color:#0f172a; }</style></head><body>${bodyContent}</body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>${sharedPrintRules}</style></head><body>${buildA4InvoiceHtml(data, config, { ...design, gstTemplate: 'template4' })}</body></html>`;
}
