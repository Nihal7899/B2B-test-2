// src/utils/printHtml.ts
import { Capacitor, registerPlugin } from '@capacitor/core';

interface HtmlPrinterPlugin {
  printA4(options: { html: string; jobName?: string }): Promise<{ success: boolean }>;
}

const HtmlPrinter = registerPlugin<HtmlPrinterPlugin>('HtmlPrinter');

export async function printHtml(htmlContent: string, documentTitle = 'Invoice'): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Native Android/iOS: Hands the raw HTML directly to system PrintManager
    await HtmlPrinter.printA4({
      html: htmlContent,
      jobName: documentTitle,
    });
  } else {
    // Desktop Browser (Admin / Warehouse): Uses an invisible iframe
    // Prevents "about:blank" header URL and retains all CSS background colors
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      throw new Error('Unable to access print frame.');
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();

    if (iframe.contentWindow) {
      iframe.contentWindow.document.title = documentTitle;
    }

    // Allow CSS assets, fonts, and company logo images to settle
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }

    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2500);
  }
}
