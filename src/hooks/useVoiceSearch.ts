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
}

export function useVoiceSearch({
  lang = 'en-IN',
  onTranscript,
  onResult,
  timeoutMs = 8000,
}: UseVoiceSearchOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const nativeListenersRef = useRef<{ remove: () => void }[]>([]);
  const transcriptRef = useRef('');
  const onTranscriptRef = useRef(onTranscript);
  const onResultRef = useRef(onResult);
  const langRef = useRef(lang);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const isNative = Capacitor.isNativePlatform();

  const setTranscriptSafe = useCallback((text: string) => {
    transcriptRef.current = text;
    setTranscript(text);
  }, []);

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

  const stop = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isNative) {
      try { await NativeSpeechRecognition.stop(); } catch {}
    } else if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    setIsListening(false);
  }, [isNative]);

  const startNative = useCallback(async () => {
    try {
      const { available } = await NativeSpeechRecognition.available();
      if (!available) {
        setError('Speech recognition is not available on this device.');
        return;
      }

      const check = await NativeSpeechRecognition.checkPermissions();
      if (check.speechRecognition !== 'granted') {
        const requested = await NativeSpeechRecognition.requestPermissions();
        if (requested.speechRecognition !== 'granted') {
          setError('Microphone permission denied.');
          return;
        }
      }

      const partialListener = await NativeSpeechRecognition.addListener(
        'partialResults',
        (data: { matches: string[] }) => {
          const text = data.matches?.[0]?.trim();
          if (text) {
            setTranscriptSafe(text);
            onTranscriptRef.current?.(text);
          }
        },
      );
      nativeListenersRef.current.push(partialListener);

      const stateListener = await NativeSpeechRecognition.addListener(
        'listeningState',
        (data: { status: 'started' | 'stopped' }) => {
          if (data.status === 'stopped') {
            setIsListening(false);
          }
        },
      );
      nativeListenersRef.current.push(stateListener);

      const result = await NativeSpeechRecognition.start({
        language: langRef.current,
        maxResults: 1,
        prompt: 'Say something…',
        partialResults: true,
        popup: false,
      });

      const finalText = result?.matches?.[0]?.trim();
      if (finalText) {
        setTranscriptSafe(finalText);
        onTranscriptRef.current?.(finalText);
        onResultRef.current?.(finalText);
        await stop();
      }
    } catch (err: any) {
      const msg = err?.message || 'Voice search failed. Try again.';
      if (!msg.toLowerCase().includes('cancel')) {
        setError(msg);
      }
      setIsListening(false);
    }
  }, [setTranscriptSafe, stop]);

  const startWeb = useCallback(() => {
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

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
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
          onResultRef.current?.(cleaned);
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
  }, [setTranscriptSafe, stop]);

  const start = useCallback(async () => {
    setError(null);
    setTranscriptSafe('');

    if (isListening) {
      await stop();
      return;
    }

    if (isNative) {
      await startNative();
    } else {
      startWeb();
    }

    timeoutRef.current = window.setTimeout(() => {
      void stop();
    }, timeoutMs);
  }, [isListening, isNative, startNative, startWeb, stop, timeoutMs, setTranscriptSafe]);

  return {
    isListening,
    error,
    transcript,
    start,
    stop,
    isNative,
  };
}