package com.cafkart.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.cafkart.app.plugins.HtmlPrinterPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HtmlPrinterPlugin.class);
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        
        // 1. Permanently lock edge-to-edge rendering
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // 2. Make system bars transparent at the OS level
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        
        // 3. Disable OS-level shadow injection on touch/gestures
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            
            // 4. KEEP the original dark green to ensure ZERO flickering during hybrid splash!
            webView.setBackgroundColor(Color.parseColor("#011f1a"));

            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        }
    }
}
