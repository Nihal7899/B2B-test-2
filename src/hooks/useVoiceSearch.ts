// src/hooks/useVoiceSearch.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onstart: (() => void) | null;
};

interface UseVoiceSearchOptions {
  lang?: string;
  onTranscript?: (text: string) => void;
  onResult?: (text: string) => void;
  timeoutMs?: number;
  nativeSilenceMs?: number;
}

export function useVoiceSearch({
  lang = 'en-IN',
  onTranscript,
  onResult,
  timeoutMs = 10000,
  nativeSilenceMs = 1200,
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nativeListenersRef = useRef<{ remove: () => void }[]>([]);
  const nativeSilenceTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef(0);

  const transcriptRef = useRef('');
  const hasFiredResultRef = useRef(false);

  const onTranscriptRef = useRef(onTranscript);
  const onResultRef = useRef(onResult);
  const langRef = useRef(lang);

  // Stable ref for stop() so callbacks defined earlier can call it without TDZ
  const stopRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const isNative = Capacitor.isNativePlatform();

  const setTranscriptSafe = useCallback((text: string) => {
    transcriptRef.current = text;
    setTranscript(text);
  }, []);

  const clearNativeSilenceTimer = useCallback(() => {
    if (nativeSilenceTimerRef.current) {
      clearTimeout(nativeSilenceTimerRef.current);
      nativeSilenceTimerRef.current = null;
    }
  }, []);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const removeNativeListeners = useCallback(() => {
    nativeListenersRef.current.forEach((l) => {
      try {
        l.remove();
      } catch {}
    });
    nativeListenersRef.current = [];
  }, []);

  const cleanupAll = useCallback(() => {
    clearTimeoutRef();
    clearNativeSilenceTimer();
    removeNativeListeners();
  }, [clearTimeoutRef, clearNativeSilenceTimer, removeNativeListeners]);

  useEffect(() => {
    return () => {
      cleanupAll();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (isNative) {
        NativeSpeechRecognition.stop().catch(() => {});
        NativeSpeechRecognition.removeAllListeners().catch(() => {});
      }
    };
  }, [cleanupAll, isNative]);

  /**
   * Fire onResult exactly once per session, then auto-stop the recognizer.
   * The auto-stop is what prevents the "reopen shows listening but native isn't
   * actually listening" bug — native is guaranteed to be released after every
   * successful result.
   */
  const fireFinalResult = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (hasFiredResultRef.current) return;
    hasFiredResultRef.current = true;

    try {
      onResultRef.current?.(trimmed);
    } catch {}

    // Auto-stop after the parent's onResult has had a tick to run.
    // Uses stopRef to avoid circular dependency / TDZ.
    const stopFn = stopRef.current;
    if (stopFn) {
      setTimeout(() => {
        void stopFn();
      }, 100);
    }
  }, []);

  /** Public stop — kills the current native/web session and resets UI flags. */
  const stop = useCallback(async () => {
    cleanupAll();

    if (isNative) {
      try {
        await NativeSpeechRecognition.stop();
      } catch {}
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, [isNative, cleanupAll]);

  // Sync stop into ref so fireFinalResult can call it
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  const reset = useCallback(() => {
    setError(null);
    setTranscript('');
    transcriptRef.current = '';
    hasFiredResultRef.current = false;
    clearNativeSilenceTimer();
  }, [clearNativeSilenceTimer]);

  // ---------------- NATIVE ----------------
  const startNative = useCallback(
    async (sessionId: number) => {
      try {
        const { available } = await NativeSpeechRecognition.available();
        if (sessionId !== sessionIdRef.current) return;
        if (!available) {
          setError('Speech recognition is not available on this device.');
          return;
        }

        const check = await NativeSpeechRecognition.checkPermissions();
        if (sessionId !== sessionIdRef.current) return;
        if (check.speechRecognition !== 'granted') {
          const requested = await NativeSpeechRecognition.requestPermissions();
          if (sessionId !== sessionIdRef.current) return;
          if (requested.speechRecognition !== 'granted') {
            setError('Microphone permission denied.');
            return;
          }
        }

        // Live partial results
        const partialListener = await NativeSpeechRecognition.addListener(
          'partialResults',
          (data: { matches: string[] }) => {
            if (sessionId !== sessionIdRef.current) return;
            const text = data.matches?.[0]?.trim();
            if (!text) return;

            setTranscriptSafe(text);
            onTranscriptRef.current?.(text);

            clearNativeSilenceTimer();
            nativeSilenceTimerRef.current = window.setTimeout(() => {
              if (sessionId !== sessionIdRef.current) return;
              if (!hasFiredResultRef.current && transcriptRef.current) {
                fireFinalResult(transcriptRef.current);
              }
            }, nativeSilenceMs);
          }
        );
        nativeListenersRef.current.push(partialListener);

        // Listening-state changes
        const stateListener = await NativeSpeechRecognition.addListener(
          'listeningState',
          (data: { status: 'started' | 'stopped' }) => {
            if (sessionId !== sessionIdRef.current) return;
            if (data.status === 'started') {
              setIsListening(true);
            } else if (data.status === 'stopped') {
              setIsListening(false);
              if (!hasFiredResultRef.current && transcriptRef.current) {
                fireFinalResult(transcriptRef.current);
              }
            }
          }
        );
        nativeListenersRef.current.push(stateListener);

        if (sessionId !== sessionIdRef.current) return;

        // Optimistically set listening state BEFORE start() — Android doesn't
        // always emit a 'started' event.
        setIsListening(true);

        const result = await NativeSpeechRecognition.start({
          language: langRef.current,
          maxResults: 1,
          prompt: 'Say something…',
          partialResults: true,
          popup: false,
        });

        if (sessionId !== sessionIdRef.current) return;

        const finalText = result?.matches?.[0]?.trim() || transcriptRef.current;
        if (finalText) {
          setTranscriptSafe(finalText);
          onTranscriptRef.current?.(finalText);
          fireFinalResult(finalText);
        }
      } catch (err: any) {
        if (sessionId !== sessionIdRef.current) return;
        const msg = err?.message || 'Voice search failed. Try again.';
        if (!msg.toLowerCase().includes('cancel')) {
          setError(msg);
        }
        setIsListening(false);

        if (!hasFiredResultRef.current && transcriptRef.current) {
          fireFinalResult(transcriptRef.current);
        }
      }
    },
    [nativeSilenceMs, setTranscriptSafe, clearNativeSilenceTimer, fireFinalResult]
  );

  // ---------------- WEB ----------------
  const startWeb = useCallback(
    (sessionId: number) => {
      const w = window as any;
      const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        setError('Voice search is not supported in this browser.');
        return;
      }

      try {
        const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
        recognition.lang = langRef.current;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          if (sessionId !== sessionIdRef.current) return;
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          if (sessionId !== sessionIdRef.current) return;
          let combined = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            combined += event.results[i][0].transcript;
          }
          const cleaned = combined.trim();
          if (cleaned) {
            setTranscriptSafe(cleaned);
            onTranscriptRef.current?.(cleaned);
          }

          const lastResult = event.results[event.results.length - 1];
          if (lastResult?.isFinal && cleaned) {
            fireFinalResult(cleaned);
          }
        };

        recognition.onerror = (event: any) => {
          if (sessionId !== sessionIdRef.current) return;
          const code = event?.error;
          if (code === 'not-allowed' || code === 'service-not-allowed') {
            setError('Microphone permission denied.');
          } else if (code === 'no-speech') {
            setError("Didn't catch that. Try again.");
          } else if (code !== 'aborted') {
            setError('Voice search failed. Try again.');
          }
          setIsListening(false);
          recognitionRef.current = null;

          if (!hasFiredResultRef.current && transcriptRef.current) {
            fireFinalResult(transcriptRef.current);
          }
        };

        recognition.onend = () => {
          if (sessionId !== sessionIdRef.current) return;
          setIsListening(false);
          recognitionRef.current = null;

          if (!hasFiredResultRef.current && transcriptRef.current) {
            fireFinalResult(transcriptRef.current);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch {
        setError('Could not start voice search.');
        setIsListening(false);
      }
    },
    [setTranscriptSafe, fireFinalResult]
  );

  /**
   * Public start — always performs a fresh start.
   * Cleans up any previous session, aborts stale native/web recognition,
   * bumps the session id (invalidating late events), then starts.
   */
  const start = useCallback(async () => {
    // 1. Kill any existing session
    cleanupAll();
    if (isNative) {
      try {
        await NativeSpeechRecognition.stop();
      } catch {}
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // 2. Bump session id — any event from the old session is now stale
    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;

    // 3. Reset state
    setError(null);
    setTranscriptSafe('');
    hasFiredResultRef.current = false;
    setIsListening(false);

    // 4. Start fresh
    if (isNative) {
      await startNative(sessionId);
    } else {
      startWeb(sessionId);
    }

    // 5. Safety auto-stop
    timeoutRef.current = window.setTimeout(() => {
      if (sessionId !== sessionIdRef.current) return;
      void stop();
      if (!hasFiredResultRef.current && transcriptRef.current) {
        fireFinalResult(transcriptRef.current);
      }
    }, timeoutMs);
  }, [
    isNative,
    cleanupAll,
    startNative,
    startWeb,
    stop,
    timeoutMs,
    setTranscriptSafe,
    fireFinalResult,
  ]);

  return {
    isListening,
    error,
    transcript,
    start,
    stop,
    reset,
    isNative,
  };
}