// src/utils/printHtml.ts
import { Capacitor, registerPlugin } from '@capacitor/core';

// 1. Direct inline plugin registration (no external file import required)
interface HtmlPrinterPlugin {
  printA4(options: { html: string; jobName?: string }): Promise<{ success: boolean }>;
}

const HtmlPrinter = registerPlugin<HtmlPrinterPlugin>('HtmlPrinter');

// 2. Cross-platform print handler
export async function printHtml(htmlContent: string, documentTitle = 'Invoice'): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Native Android: invokes Android PrintManager through custom native plugin
    await HtmlPrinter.printA4({
      html: htmlContent,
      jobName: documentTitle,
    });
  } else {
    // Web / Desktop Browser: uses standard window print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
}
