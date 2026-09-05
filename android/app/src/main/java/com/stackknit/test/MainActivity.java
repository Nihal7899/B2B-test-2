package com.stackknit.test;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.stackknit.test.plugins.HtmlPrinterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HtmlPrinterPlugin.class);
        super.onCreate(savedInstanceState);

        // Enables native edge-to-edge transparent status and navigation bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Sets WebView background to match splash dark-green and eliminate white flash
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setBackgroundColor(Color.parseColor("#011f1a"));

            // Force hardware acceleration layer on the WebView surface
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

            WebSettings settings = webView.getSettings();

            // Pre-rasterize offscreen tiles into GPU memory ahead of scroll direction
            settings.setOffscreenPreRaster(true);

            // Enable local storage caching for immediate cold boot loads
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        }
    }
}
