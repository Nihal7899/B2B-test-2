package com.stackknit.test.plugins;

import android.content.Context;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HtmlPrinter")
public class HtmlPrinterPlugin extends Plugin {

    @PluginMethod
    public void printA4(PluginCall call) {
        String html = call.getString("html");
        String jobName = call.getString("jobName", "Invoice");

        if (html == null || html.isEmpty()) {
            call.reject("HTML content is required");
            return;
        }

        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                if (getActivity() == null) {
                    call.reject("Activity not available");
                    return;
                }

                PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("Print service not available");
                    return;
                }

                WebView webView = new WebView(getActivity());
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setUseWideViewPort(true);
                webView.getSettings().setLoadWithOverviewMode(true);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        PrintDocumentAdapter printAdapter;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            printAdapter = view.createPrintDocumentAdapter(jobName);
                        } else {
                            printAdapter = view.createPrintDocumentAdapter();
                        }

                        try {
                            printManager.print(jobName, printAdapter, new PrintAttributes.Builder().build());
                            JSObject result = new JSObject();
                            result.put("success", true);
                            call.resolve(result);
                        } catch (Exception e) {
                            call.reject("Print job failed: " + e.getMessage());
                        }
                    }
                });

                webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);

            } catch (Exception e) {
                call.reject("Print failed: " + e.getMessage());
            }
        });
    }
}
