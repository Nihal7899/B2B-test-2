// src/components/BarcodeScanner.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  BarcodeScanner as MLKitScanner,
  BarcodeFormat,
  LensFacing,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { X, ScanLine, Loader2, AlertCircle, Keyboard } from 'lucide-react';

// --- Web Polyfill ---
// On the web, the ML Kit plugin's scan() method is not available.
// We use the barcode-detector polyfill (ZXing WebAssembly) to enable
// live camera scanning in browsers.
import 'barcode-detector/polyfill';

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
  const [isWeb, setIsWeb] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const detectedRef = useRef(false);

  // Check platform and plugin support on mount
  useEffect(() => {
    const check = async () => {
      if (!Capacitor.isNativePlatform()) {
        // Web path — use the polyfilled BarcodeDetector
        setIsWeb(true);
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
        // isSupported() throws on web — fall back to web mode
        setIsWeb(true);
      }
    };
    void check();
  }, []);

  // ---------- NATIVE (Capacitor Android / iOS) ----------
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
  
      // Open the ready-to-use native scanner UI.
      // NOTE: We intentionally omit `formats` so the scanner defaults to
      // detecting ALL supported barcode formats. Passing `BarcodeFormat.All`
      // inside the formats array causes a native Android type-mismatch error.
      const { barcodes } = await MLKitScanner.scan({
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

  // ---------- WEB (Browser) ----------
  const startWebScan = useCallback(async () => {
    setError(null);
    setScanning(true);
    detectedRef.current = false;

    try {
      if (!('BarcodeDetector' in window)) {
        setError(
          'Live camera scanning is not supported in this browser. Please enter the barcode manually.'
        );
        setShowManual(true);
        setScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({
        formats: [
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'code_128',
          'code_39',
          'code_93',
          'itf',
          'codabar',
          'qr_code',
        ],
      });

      intervalRef.current = window.setInterval(async () => {
        if (detectedRef.current) return;
        const video = videoRef.current;
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
        try {
          const results = await detector.detect(video);
          if (results && results.length > 0 && results[0]?.rawValue) {
            detectedRef.current = true;
            if (typeof navigator.vibrate === 'function') navigator.vibrate(80);
            onDetected(String(results[0].rawValue));
          }
        } catch {
          // ignore per-frame errors
        }
      }, 220);
    } catch (err: any) {
      console.error('Web scan error:', err);
      setError(
        err?.message ||
          'Unable to access the camera. Check permissions and try again.'
      );
      setShowManual(true);
      setScanning(false);
    }
  }, [onDetected]);

  // Cleanup web camera on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) return;
    onDetected(code);
  };

  // ---------- RENDER ----------
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

          {/* Native scanner */}
          {isNative && !showManual && (
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
          )}

          {/* Web scanner */}
          {isWeb && !showManual && (
            <>
              <div className="relative bg-black aspect-[4/5] w-full overflow-hidden rounded-2xl">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[78%] h-[32%] rounded-2xl border-2 border-[#59D9B6] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] relative">
                    <span className="absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-[#59D9B6]" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-[#59D9B6]" />
                    <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-[#59D9B6]" />
                    <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-[#59D9B6]" />
                  </div>
                </div>
              </div>
              <button
                onClick={startWebScan}
                disabled={scanning}
                className="w-full h-12 rounded-full bg-[#0a382c] hover:bg-[#082d23] text-white text-sm font-black flex items-center justify-center gap-2 shadow-xs active:scale-95 transition disabled:opacity-50"
              >
                {scanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <ScanLine size={16} /> Start Camera
                  </>
                )}
              </button>
            </>
          )}

          {/* Manual input fallback */}
          {showManual && (
            <>
              <div className="flex flex-col items-center justify-center py-4 gap-3">
                <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Keyboard size={28} className="text-slate-500" />
                </div>
                <p className="text-xs text-slate-500 text-center leading-relaxed max-w-[260px]">
                  Live camera scanning is unavailable. Please type the barcode manually.
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