// src/plugins/HtmlPrinter.ts
import { registerPlugin } from '@capacitor/core';

export interface HtmlPrinterPlugin {
  printA4(options: { html: string; jobName?: string }): Promise<{ success: boolean }>;
}

const HtmlPrinter = registerPlugin<HtmlPrinterPlugin>('HtmlPrinter');
export default HtmlPrinter;
