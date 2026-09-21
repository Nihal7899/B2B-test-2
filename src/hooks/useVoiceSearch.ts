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
  /** Language for recognition. Defaults to 'en-IN'. */
  lang?: string;
  /** Called whenever we get a transcript (interim or final). */
  onTranscript?: (text: string) => void;
  /** Called once a final result is available. */
  onResult?: (text: string) => void;
  /** Safety timeout in ms. Defaults to 8000. */
  timeoutMs?: number;
}

export function useVoiceSearch({
  lang = 'en-IN',
  onTranscript,
  onResult,
  timeoutMs = 8000,
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nativeListenersRef = useRef<{ remove: () => void }[]>([]);

  const isNative = Capacitor.isNativePlatform();

  // -------- Cleanup --------
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    nativeListenersRef.current.forEach((l) => {
      try { l.remove(); } catch {}
    });
    nativeListenersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      if (isNative) {
        NativeSpeechRecognition.stop().catch(() => {});
        NativeSpeechRecognition.removeAllListeners().catch(() => {});
      }
    };
  }, [cleanup, isNative]);

  // -------- Stop --------
  const stop = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

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
  }, [isNative]);

  // -------- Start: Native (Android / iOS) --------
  const startNative = useCallback(async () => {
    try {
      // 1. Check availability
      const { available } = await NativeSpeechRecognition.available();
      if (!available) {
        setError('Speech recognition is not available on this device.');
        return;
      }

      // 2. Check + request permissions
      const check = await NativeSpeechRecognition.checkPermissions();
      if (check.speechRecognition !== 'granted') {
        const requested = await NativeSpeechRecognition.requestPermissions();
        if (requested.speechRecognition !== 'granted') {
          setError('Microphone permission denied.');
          return;
        }
      }

      // 3. Listen for partial results
      const partialListener = await NativeSpeechRecognition.addListener(
        'partialResults',
        (data: { matches: string[] }) => {
          const text = data.matches?.[0]?.trim();
          if (text) {
            onTranscript?.(text);
          }
        },
      );
      nativeListenersRef.current.push(partialListener);

      // 4. Listen for listening-state changes
      const stateListener = await NativeSpeechRecognition.addListener(
        'listeningState',
        (data: { status: 'started' | 'stopped' }) => {
          if (data.status === 'stopped') {
            setIsListening(false);
          }
        },
      );
      nativeListenersRef.current.push(stateListener);

      // 5. Start listening
      const result = await NativeSpeechRecognition.start({
        language: lang,
        maxResults: 1,
        prompt: 'Say something…',
        partialResults: true,
        popup: false,
      });

      // 6. Fallback: if a final result came back immediately
      const finalText = result?.matches?.[0]?.trim();
      if (finalText) {
        onTranscript?.(finalText);
        onResult?.(finalText);
        await stop();
      }
    } catch (err: any) {
      const msg = err?.message || 'Voice search failed. Try again.';
      if (!msg.toLowerCase().includes('cancel')) {
        setError(msg);
      }
      setIsListening(false);
    }
  }, [lang, onTranscript, onResult, stop]);

  // -------- Start: Web (browser) --------
  const startWeb = useCallback(() => {
    const w = window as any;
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError('Voice search is not supported in this browser.');
      return;
    }

    try {
      const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const cleaned = transcript.trim();
        if (cleaned) onTranscript?.(cleaned);

        const lastResult = event.results[event.results.length - 1];
        if (lastResult?.isFinal && cleaned) {
          onResult?.(cleaned);
          setTimeout(() => stop(), 250);
        }
      };

      recognition.onerror = (event: any) => {
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
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Could not start voice search.');
      setIsListening(false);
    }
  }, [lang, onTranscript, onResult, stop]);

  // -------- Public start --------
  const start = useCallback(async () => {
    setError(null);

    // If already listening → stop
    if (isListening) {
      await stop();
      return;
    }

    if (isNative) {
      await startNative();
    } else {
      startWeb();
    }

    // Safety auto-stop
    timeoutRef.current = window.setTimeout(() => {
      void stop();
    }, timeoutMs);
  }, [isListening, isNative, startNative, startWeb, stop, timeoutMs]);

  return {
    /** True while actively listening. */
    isListening,
    /** Error message from last attempt (auto-clears on next start). */
    error,
    /** Start or stop listening. */
    start,
    /** Stop listening immediately. */
    stop,
    /** True if running inside a native Capacitor shell (Android/iOS). */
    isNative,
  };
}