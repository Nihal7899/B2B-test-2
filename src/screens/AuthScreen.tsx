import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ArrowLeft, Delete } from 'lucide-react';
import { useAuth } from '@/auth';
import { preloadHomeScreenDataAndImages } from '@/services/homePreload';
import heroImage from './hero.jpg';

function normalizeIndianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

function OtpIllustration() {
  return (
    <div className="relative mx-auto flex h-44 w-full items-center justify-center pt-2">
      <div className="absolute bottom-2 h-32 w-52 rounded-t-full bg-gradient-to-t from-[#0f7760]/15 to-[#0f7760]/5" />

      <div className="relative z-10 flex h-36 w-24 flex-col items-center justify-between rounded-2xl border-[3px] border-slate-800 bg-white p-2 shadow-xl shadow-slate-200/50">
        <div className="h-1 w-6 rounded-full bg-slate-300" />

        <div className="flex w-full flex-col gap-2">
          <div className="h-2.5 w-10 animate-pulse rounded-full bg-slate-100" />
          <div className="h-2.5 w-14 self-end rounded-full bg-[#0f7760]/20" />
          <div className="h-2.5 w-8 rounded-full bg-slate-100" />
        </div>

        <div className="h-1 w-7 rounded-full bg-slate-200" />
      </div>

      <div className="animate-float absolute z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f7760] text-white shadow-lg shadow-[#0f7760]/40 -translate-x-6">
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-wider">OTP</span>
          <span className="text-[8px] font-medium opacity-80">CODE</span>
        </div>
      </div>

      <div className="absolute left-[24%] bottom-2 z-10 hidden sm:block">
        <div className="h-16 w-5 rounded-t-full bg-slate-800" />
      </div>
    </div>
  );
}

interface OtpViewProps {
  phone: string;
  formattedPhone: string;
  onBack: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  busy: boolean;
  error: string;
  verifyStatus: 'idle' | 'verifying' | 'success' | 'error';
  seconds: number;
}

function OtpVerificationView({
  formattedPhone,
  onBack,
  onVerify,
  onResend,
  busy,
  error,
  verifyStatus,
  seconds,
}: OtpViewProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (busy || verifyStatus === 'success') return;

      const firstEmptyIndex = digits.findIndex((d) => d === '');
      if (firstEmptyIndex !== -1) {
        const updated = [...digits];
        updated[firstEmptyIndex] = key;
        setDigits(updated);

        if (firstEmptyIndex === 5) {
          onVerify(updated.join(''));
        }
      }
    },
    [digits, busy, verifyStatus, onVerify]
  );

  const handleDelete = useCallback(() => {
    if (busy || verifyStatus === 'success') return;

    const lastFilledIndex = [...digits].reverse().findIndex((d) => d !== '');
    if (lastFilledIndex !== -1) {
      const targetIndex = 5 - lastFilledIndex;
      const updated = [...digits];
      updated[targetIndex] = '';
      setDigits(updated);
    }
  }, [digits, busy, verifyStatus]);

  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyPress, handleDelete]);

  return (
    <div className="flex h-full flex-col justify-between px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] select-none">
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={16} /> Edit number
          </button>
          <span className="text-xs font-bold text-[#0f7760]">{formattedPhone}</span>
        </div>

        <OtpIllustration />

        <div className="mt-3 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Enter Verification code
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            We have sent a 6-digit confirmation code to your mobile number
          </p>
        </div>

        <div className="mt-6">
          <div
            className={`flex items-center justify-center gap-2 transition-transform ${
              verifyStatus === 'error' ? 'animate-shake' : ''
            }`}
          >
            {digits.map((digit, i) => {
              const isFilled = digit !== '';
              const isCurrent = digits.findIndex((d) => d === '') === i;

              let style = 'bg-[#0f7760]/10 text-transparent border-transparent';

              if (verifyStatus === 'success') {
                style = 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105';
              } else if (verifyStatus === 'error') {
                style = 'bg-red-500 text-white shadow-md shadow-red-500/30';
              } else if (isFilled) {
                style = 'bg-[#0f7760] text-white shadow-md shadow-[#0f7760]/25 scale-105 animate-pop';
              } else if (isCurrent) {
                style = 'bg-[#0f7760]/15 border-2 border-[#0f7760] shadow-sm animate-pulse-glow';
              }

              return (
                <div
                  key={i}
                  className={`flex h-12 w-11 sm:h-13 sm:w-12 items-center justify-center rounded-2xl text-xl font-black transition-all duration-200 ${style}`}
                >
                  {isFilled ? digit : ''}
                </div>
              );
            })}
          </div>

          {error && <p className="mt-2 text-center text-xs font-bold text-red-500">{error}</p>}

          <div className="mt-3.5 text-center">
            <span className="text-xs text-slate-500">Didn&apos;t receive code? </span>
            <button
              type="button"
              disabled={seconds > 0 || busy}
              onClick={onResend}
              className="text-xs font-bold text-[#0f7760] hover:underline disabled:opacity-50"
            >
              {seconds > 0 ? `Resend code (${seconds}s)` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-y-3 gap-x-6 px-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(num)}
            className="flex h-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-slate-800 transition active:scale-90 active:bg-slate-100"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="flex h-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-slate-800 transition active:scale-90 active:bg-slate-100"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-12 items-center justify-center rounded-2xl text-slate-700 transition active:scale-90 active:bg-slate-100"
        >
          <Delete size={22} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void preloadHomeScreenDataAndImages();
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((c) => Math.max(c - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const isPhoneValid = phone.length === 10;
  const formattedPhone = useMemo(() => `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`.trim(), [phone]);

  const handleSendOtp = async () => {
    if (!isPhoneValid) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    setError('');

    try {
      const result = await sendOtp(`+91${phone}`);
      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Failed to send OTP.');
        return;
      }
      setStep('otp');
      setSeconds(30);
      setVerifyStatus('idle');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify: string) => {
    setBusy(true);
    setVerifyStatus('verifying');
    setError('');

    try {
      const result = await verifyOtp(`+91${phone}`, codeToVerify);
      if (result?.error) {
        setVerifyStatus('error');
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Invalid verification code.');
      } else {
        setVerifyStatus('success');
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setError(err?.message || 'Verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || busy) return;
    setBusy(true);
    setError('');

    try {
      const result = await resendOtp(`+91${phone}`);
      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Failed to resend code');
        return;
      }
      setSeconds(30);
      setVerifyStatus('idle');
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-slate-900 sm:flex sm:items-center sm:justify-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full flex-col justify-between overflow-hidden bg-white sm:h-[844px] sm:max-w-[420px] sm:rounded-[40px] sm:shadow-2xl">
        {step === 'phone' ? (
          <div className="relative flex h-full flex-col justify-between bg-slate-900">
            <div className="absolute inset-x-0 top-0 h-[72%] w-full overflow-hidden">
              <img
                src={heroImage}
                alt="Fresh ingredients"
                className="h-full w-full object-cover object-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10" />
            </div>

            <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-[36px] bg-white px-6 pt-7 pb-8 shadow-[0_-16px_40px_rgba(0,0,0,0.25)] [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
              <h1 className="text-center text-[23px] font-extrabold leading-snug tracking-tight text-[#1a2e26]">
                All your restaurant needs <br /> delivered next day
              </h1>

              <div className="mt-8">
                <div
                  className={`flex h-14 items-center rounded-2xl border px-4 transition-all duration-200 ${
                    error
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-slate-200 bg-white focus-within:border-[#0f7760] focus-within:ring-4 focus-within:ring-[#0f7760]/10'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-3 text-base font-semibold text-slate-800">
                    <span className="text-xl leading-none">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <div className="h-5 w-[1px] bg-slate-200" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => {
                      setError('');
                      setPhone(normalizeIndianPhone(e.target.value));
                    }}
                    placeholder="Enter mobile number"
                    className="h-full w-full bg-transparent pl-3 text-base font-normal text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleSendOtp}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#0f7760] text-base font-bold text-white shadow-lg shadow-[#0f7760]/25 transition hover:bg-[#0c624f] active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? 'Sending code...' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <OtpVerificationView
            phone={phone}
            formattedPhone={formattedPhone}
            onBack={() => {
              setStep('phone');
              setError('');
              setVerifyStatus('idle');
            }}
            onVerify={handleVerifyOtp}
            onResend={handleResend}
            busy={busy}
            error={error}
            verifyStatus={verifyStatus}
            seconds={seconds}
          />
        )}
      </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1.05); }
        }
        .animate-pop {
          animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(-24px); }
          50% { transform: translateY(-8px) translateX(-24px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
