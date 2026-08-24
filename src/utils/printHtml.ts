// src/utils/printHtml.ts

/**
 * Universal Invoice Output Handler
 * - Web Browser: Direct iframe Print dialog & native Blob download.
 * - Capacitor Native (Android & iOS): Direct storage download via Filesystem & Share sheet via Share.
 */

function utf8ToBase64(str: string): string {
  return window.btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function wrapFullDocument(htmlContent: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 5mm 6mm; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;
}

/**
 * 1. Primary Action: Triggers Browser Print on Web, or System Share on Mobile.
 */
export async function printHtml(htmlContent: string, jobTitle?: string): Promise<void> {
  const isCapacitorNative =
    typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  const title = jobTitle || `Invoice_${Date.now()}`;
  const fullDoc = wrapFullDocument(htmlContent, title);

  // ─── A. CAPACITOR NATIVE (OPENS SYSTEM SHARE & PRINT SHEET) ─────────
  if (isCapacitorNative) {
    try {
      let Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
      let Directory = (window as any).Capacitor?.Plugins?.Directory || { Cache: 'CACHE' };
      let Share = (window as any).Capacitor?.Plugins?.Share;

      if (!Filesystem) {
        const fsModule = await import('@capacitor/filesystem');
        Filesystem = fsModule.Filesystem;
        Directory = fsModule.Directory;
      }
      if (!Share) {
        const shareModule = await import('@capacitor/share');
        Share = shareModule.Share;
      }

      const fileName = `${title}.html`;
      const fileResult = await Filesystem.writeFile({
        path: fileName,
        data: utf8ToBase64(fullDoc),
        directory: Directory.Cache,
        recursive: true,
      });

      if (Share) {
        await Share.share({
          title: 'Tax Invoice',
          text: `Invoice #${title}`,
          url: fileResult.uri,
          dialogTitle: 'Share / Print Invoice',
        });
        return;
      }
    } catch (err) {
      console.error('Capacitor native share failed:', err);
    }
  }

  // ─── B. WEB BROWSER (DIRECT IFRAME PRINT) ───────────────────────────
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

  frameDoc.open();
  frameDoc.write(fullDoc);
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

/**
 * 2. Dedicated Action: Direct File Download to Local Storage (No Share Dialog).
 */
export async function downloadHtmlInvoice(htmlContent: string, fileName?: string): Promise<void> {
  const isCapacitorNative =
    typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  const name = fileName || `Invoice_${Date.now()}`;
  const fullDoc = wrapFullDocument(htmlContent, name);

  // ─── A. CAPACITOR NATIVE (SAVE TO DOCUMENTS FOLDER) ─────────────────
  if (isCapacitorNative) {
    try {
      let Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
      let Directory = (window as any).Capacitor?.Plugins?.Directory || { Documents: 'DOCUMENTS' };

      if (!Filesystem) {
        const fsModule = await import('@capacitor/filesystem');
        Filesystem = fsModule.Filesystem;
        Directory = fsModule.Directory;
      }

      await Filesystem.writeFile({
        path: `${name}.html`,
        data: utf8ToBase64(fullDoc),
        directory: Directory.Documents,
        recursive: true,
      });

      alert(`Invoice saved successfully to Documents/${name}.html`);
      return;
    } catch (err) {
      console.error('Failed to save to device Documents folder:', err);
      alert('Could not save file to device storage.');
      return;
    }
  }

  // ─── B. WEB BROWSER (STANDARD FILE DOWNLOAD) ────────────────────────
  const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 3. Dedicated Action: Direct Share Sheet Trigger on Mobile.
 */
export async function shareHtmlInvoice(htmlContent: string, fileName?: string): Promise<void> {
  const isCapacitorNative =
    typeof (window as any).Capacitor !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  const name = fileName || `Invoice_${Date.now()}`;
  const fullDoc = wrapFullDocument(htmlContent, name);

  if (isCapacitorNative) {
    let Filesystem = (window as any).Capacitor?.Plugins?.Filesystem;
    let Directory = (window as any).Capacitor?.Plugins?.Directory || { Cache: 'CACHE' };
    let Share = (window as any).Capacitor?.Plugins?.Share;

    if (!Filesystem) {
      const fsModule = await import('@capacitor/filesystem');
      Filesystem = fsModule.Filesystem;
      Directory = fsModule.Directory;
    }
    if (!Share) {
      const shareModule = await import('@capacitor/share');
      Share = shareModule.Share;
    }

    const fileResult = await Filesystem.writeFile({
      path: `${name}.html`,
      data: utf8ToBase64(fullDoc),
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({
      title: 'Tax Invoice',
      text: `Invoice #${name}`,
      url: fileResult.uri,
      dialogTitle: 'Share Invoice',
    });
    return;
  }

  // Web Share fallback
  if (navigator.share) {
    const file = new File([fullDoc], `${name}.html`, { type: 'text/html' });
    try {
      await navigator.share({
        title: 'Tax Invoice',
        files: [file],
      });
      return;
    } catch (e) {}
  }

  await downloadHtmlInvoice(htmlContent, name);
}
