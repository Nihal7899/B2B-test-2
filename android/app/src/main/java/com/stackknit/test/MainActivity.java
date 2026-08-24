package com.stackknit.test;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enables native edge-to-edge transparent status and navigation bars
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
