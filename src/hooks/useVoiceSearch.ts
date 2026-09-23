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
  const isStartingRef = useRef(false);

  const transcriptRef = useRef('');
  const hasFiredResultRef = useRef(false);

  const onTranscriptRef = useRef(onTranscript);
  const onResultRef = useRef(onResult);
  const langRef = useRef(lang);
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
    const listeners = nativeListenersRef.current;
    nativeListenersRef.current = [];
    listeners.forEach((l) => {
      try {
        l.remove();
      } catch {}
    });
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
      // NOTE: do NOT call removeAllListeners() here — it wipes listeners globally
      // and can break the plugin on remount. Only our own listeners are removed.
      if (isNative) {
        NativeSpeechRecognition.stop().catch(() => {});
      }
    };
  }, [cleanupAll, isNative]);

  /**
   * Fire onResult exactly once per session, then auto-stop the recognizer.
   */
  const fireFinalResult = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (hasFiredResultRef.current) return;
    hasFiredResultRef.current = true;

    try {
      onResultRef.current?.(trimmed);
    } catch (err) {
      console.warn('[Voice] onResult threw:', err);
    }

    const stopFn = stopRef.current;
    if (stopFn) {
      setTimeout(() => {
        void stopFn();
      }, 100);
    }
  }, []);

  /** Public stop — kills the current session. Never awaited internally. */
  const stop = useCallback(async () => {
    cleanupAll();

    if (isNative) {
      // Fire-and-forget. Never await this — some Android builds never resolve
      // plugin.stop() when no session is running, which would hang callers.
      NativeSpeechRecognition.stop().catch(() => {});
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
    isStartingRef.current = false;
  }, [isNative, cleanupAll]);

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
        console.log('[Voice] startNative: sessionId =', sessionId);

        const { available } = await NativeSpeechRecognition.available();
        console.log('[Voice] available =', available);
        if (sessionId !== sessionIdRef.current) {
          console.log('[Voice] aborted: session changed after available()');
          return;
        }
        if (!available) {
          setError('Speech recognition is not available on this device.');
          return;
        }

        const check = await NativeSpeechRecognition.checkPermissions();
        console.log('[Voice] checkPermissions =', check);
        if (sessionId !== sessionIdRef.current) return;

        if (check.speechRecognition !== 'granted') {
          console.log('[Voice] requesting permissions…');
          const requested = await NativeSpeechRecognition.requestPermissions();
          console.log('[Voice] requestPermissions =', requested);
          if (sessionId !== sessionIdRef.current) return;
          if (requested.speechRecognition !== 'granted') {
            setError('Microphone permission denied.');
            return;
          }
        }

        console.log('[Voice] attaching partialResults listener');
        const partialListener = await NativeSpeechRecognition.addListener(
          'partialResults',
          (data: { matches: string[] }) => {
            if (sessionId !== sessionIdRef.current) return;
            const text = data.matches?.[0]?.trim();
            if (!text) return;

            console.log('[Voice] partial:', text);
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

        console.log('[Voice] attaching listeningState listener');
        const stateListener = await NativeSpeechRecognition.addListener(
          'listeningState',
          (data: { status: 'started' | 'stopped' }) => {
            console.log('[Voice] listeningState:', data.status);
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

        console.log('[Voice] calling plugin.start()');
        setIsListening(true);

        const result = await NativeSpeechRecognition.start({
          language: langRef.current,
          maxResults: 1,
          prompt: 'Say something…',
          partialResults: true,
          popup: false,
        });

        console.log('[Voice] plugin.start() resolved:', result);
        if (sessionId !== sessionIdRef.current) return;

        const finalText = result?.matches?.[0]?.trim() || transcriptRef.current;
        if (finalText) {
          setTranscriptSafe(finalText);
          onTranscriptRef.current?.(finalText);
          fireFinalResult(finalText);
        }
      } catch (err: any) {
        console.error('[Voice] startNative error:', err);
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
   *
   * IMPORTANT: On native, we do NOT call plugin.stop() before starting.
   * The community plugin's stop() can hang or throw when no session exists,
   * blocking the whole startup. We rely on sessionId to invalidate stale events.
   */
  const start = useCallback(async () => {
    console.log('[Voice] start() called, isNative =', isNative);

    if (isStartingRef.current) {
      console.log('[Voice] already starting, ignoring');
      return;
    }
    isStartingRef.current = true;

    // 1. Clear our own timers + listeners (does NOT touch plugin state)
    clearTimeoutRef();
    clearNativeSilenceTimer();
    removeNativeListeners();

    // 2. Bump session id — any event from the old session is now stale
    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;

    // 3. Reset state
    setError(null);
    setTranscriptSafe('');
    hasFiredResultRef.current = false;
    setIsListening(false);

    // 4. Start fresh
    try {
      if (isNative) {
        await startNative(sessionId);
      } else {
        startWeb(sessionId);
      }
    } finally {
      isStartingRef.current = false;
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
    clearTimeoutRef,
    clearNativeSilenceTimer,
    removeNativeListeners,
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