// src/components/BarcodeScanner.tsx
import { useEffect, useState } from 'react';
import {
  BarcodeScanner as MLKitScanner,
  BarcodeFormat,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { X, ScanLine, Loader2, AlertCircle, Keyboard } from 'lucide-react';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
  title?: string;
}

export function BarcodeScanner({
  onDetected,
  onClose,
  title = 'Scan Barcode',
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isNative, setIsNative] = useState(false);

  // Check platform and plugin support on mount
  useEffect(() => {
    const check = async () => {
      if (!Capacitor.isNativePlatform()) {
        setShowManual(true);
        return;
      }
      try {
        const { supported } = await MLKitScanner.isSupported();
        if (!supported) {
          setError('Barcode scanning is not supported on this device.');
          setShowManual(true);
          return;
        }
        setIsNative(true);
      } catch {
        setShowManual(true);
      }
    };
    void check();
  }, []);

  const startNativeScan = async () => {
    setError(null);
    setScanning(true);
    try {
      // Request camera permission first
      const { camera } = await MLKitScanner.requestPermissions();
      if (camera !== 'granted') {
        setError('Camera permission was denied. Please enable it in settings.');
        setScanning(false);
        return;
      }

      // Open the ready-to-use native scanner UI
      const { barcodes } = await MLKitScanner.scan({
        formats: [BarcodeFormat.All],
        lensFacing: LensFacing.Back,
      });

      if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
        onDetected(barcodes[0].rawValue);
      } else {
        setScanning(false);
      }
    } catch (err: any) {
      console.error('ML Kit scan error:', err);
      setError(
        err?.message ||
          'Unable to open the camera. Please check permissions and try again.'
      );
      setScanning(false);
    }
  };

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    onDetected(code);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0a382c] text-white">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-[#59D9B6]" />
            <span className="text-sm font-black tracking-tight">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5">
              <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-900 font-semibold leading-snug">
                {error}
              </p>
            </div>
          )}

          {isNative ? (
            <>
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <div className="h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                  <ScanLine size={34} className="text-emerald-700" />
                </div>
                <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[240px]">
                  Tap the button below to open the camera and scan a barcode using ML Kit.
                </p>
              </div>

              <button
                onClick={startNativeScan}
                disabled={scanning}
                className="w-full h-12 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-sm font-black flex items-center justify-center gap-2 shadow-xs active:scale-95 transition disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ScanLine size={16} /> Open Camera
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Keyboard size={28} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[260px]">
                  Live camera scanning is unavailable on this platform. Please type the barcode manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSubmit();
                  }}
                  placeholder="Type barcode…"
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-[#0a382c] font-mono"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  className="h-11 px-5 rounded-xl bg-[#0a382c] text-white text-xs font-black disabled:opacity-50 active:scale-95 transition"
                >
                  Use
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}