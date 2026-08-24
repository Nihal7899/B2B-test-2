// src/utils/printHtml.ts

/**
 * Direct Cross-Platform HTML Printer.
 * - Native Android / iOS: Directly opens the System Print / AirPrint dialog (No share sheet).
 * - Web Browsers: Triggers the browser's print dialog via iframe.
 */
export async function printHtml(htmlContent: string): Promise<void> {
  const isCapacitorNative =
    typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  // ─── 1. CAPACITOR NATIVE (DIRECT SYSTEM PRINT) ──────────────────────
  if (isCapacitorNative) {
    try {
      // Dynamic import to support both web builds and native bundles
      const { Printer } = await import('@bcyesil/capacitor-printer');

      const fullDoc = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              @page { size: A4 portrait; margin: 5mm 6mm; }
              body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

      // Opens native Android Print Preview or iOS AirPrint UI directly
      await Printer.print({
        content: fullDoc,
        name: `Invoice_${Date.now()}`,
        orientation: 'portrait',
      });
      return;
    } catch (err) {
      console.warn('Direct native printer plugin failed, falling back to browser print:', err);
    }
  }

  // ─── 2. WEB BROWSER FALLBACK (IFRAME PRINT) ────────────────────────
  const iframe = document.createElement('iframe');

  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!frameDoc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    throw new Error('Unable to access iframe document for printing');
  }

  const styledHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;

  frameDoc.open();
  frameDoc.write(styledHtml);
  frameDoc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  };

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      if ('onafterprint' in iframe.contentWindow!) {
        iframe.contentWindow.onafterprint = cleanup;
      }
      iframe.contentWindow?.print();
      if (!('onafterprint' in iframe.contentWindow!)) {
        cleanup();
      }
    } catch (err) {
      console.error('Print execution failed:', err);
      cleanup();
    }
  };

  if (frameDoc.readyState === 'complete') {
    setTimeout(triggerPrint, 250);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, 250);
  }
}
