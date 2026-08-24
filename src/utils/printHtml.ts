/**
 * Cross-platform HTML printing utility for Web, iOS, and Android.
 * Handles iOS WebKit iframe rendering requirements, waits for assets/fonts to load,
 * and cleans up the DOM after printing.
 */
export function printHtml(htmlContent: string): void {
  const iframe = document.createElement('iframe');

  // iOS Safari requires non-zero dimensions and mounting in the DOM to render & print
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
              margin: 8mm;
              size: A4 portrait;
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
