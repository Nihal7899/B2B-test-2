import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth';

const heroImage =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85';

// Fix: Handles typing without stripping valid numbers starting with 91,
// while correctly stripping leading 91/+91 or 0 when pasted as 11/12-digit numbers
function normalizeIndianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2, 12);
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

export function AuthScreen() {
  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resending OTP
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
    const result = await sendOtp(`+91${phone}`);
    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setStep('otp');
    setSeconds(30);
    setOtp(['', '', '', '', '', '']);
    setVerifyStatus('idle');
    setTimeout(() => inputRefs.current[0]?.focus(), 150);
  };

  const triggerVerification = async (otpValue: string) => {
    setBusy(true);
    setVerifyStatus('verifying');
    setError('');

    const result = await verifyOtp(`+91${phone}`, otpValue);
    setBusy(false);

    if (result?.error) {
      setVerifyStatus('error');
      setError(result.error || 'Invalid OTP code. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } else {
      setVerifyStatus('success');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otp];
      updated[index] = '';
      setOtp(updated);
      setVerifyStatus('idle');
      return;
    }

    // Handle single digit or pasted sequence
    const updated = [...otp];
    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) updated[i] = char;
      });
      setOtp(updated);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();

      if (updated.every((d) => d !== '')) {
        triggerVerification(updated.join(''));
      }
      return;
    }

    updated[index] = cleanVal[0];
    setOtp(updated);
    setVerifyStatus('idle');

    if (index < 5 && cleanVal[0]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit is entered
    if (index === 5 || updated.every((d) => d !== '')) {
      const fullOtp = updated.join('');
      if (fullOtp.length === 6) {
        triggerVerification(fullOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (seconds > 0 || busy) return;
    setBusy(true);
    setError('');
    const result = await resendOtp(`+91${phone}`);
    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }
    setSeconds(30);
    setOtp(['', '', '', '', '', '']);
    setVerifyStatus('idle');
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-zinc-950 sm:flex sm:items-center sm:justify-center sm:p-6">
      {/* Container: Full bleed on mobile (100dvh), framed on desktop */}
      <div className="relative flex h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#0a3d31] sm:h-[844px] sm:max-w-[420px] sm:rounded-[40px] sm:shadow-2xl">
        
        {/* Top Food Background Image */}
        <div className="absolute inset-x-0 top-0 h-[60%] w-full overflow-hidden">
          <img
            src={heroImage}
            alt="Fresh produce background"
            className="h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20" />
        </div>

        {/* Bottom Floating White Sheet */}
        <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-[36px] bg-white px-6 pt-7 pb-8 shadow-[0_-16px_40px_rgba(0,0,0,0.2)] [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
          {step === 'phone' ? (
            <div className="flex flex-col">
              {/* Heading */}
              <h1 className="text-center text-[23px] font-extrabold leading-snug tracking-tight text-[#1a2e26]">
                All your restaurant needs <br /> delivered next day
              </h1>

              {/* Phone Input */}
              <div className="mt-8">
                <div
                  className={`flex h-14 items-center rounded-2xl border px-4 transition-all duration-200 ${
                    error
                      ? 'border-red-400 bg-red-50/30'
                      : 'border-slate-200 bg-white focus-within:border-[#0f7760] focus-within:ring-4 focus-within:ring-[#0f7760]/10'
                  }`}
                >
                  <div className="flex items-center gap-2 pr-3 text-base font-medium text-slate-800">
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

              {/* Green Continue Button */}
              <button
                type="button"
                disabled={busy}
                onClick={handleSendOtp}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#0f7760] text-base font-bold text-white shadow-lg shadow-[#0f7760]/25 transition hover:bg-[#0c624f] active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? 'Sending code...' : 'Continue'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* Back Button & Phone Info */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                    setVerifyStatus('idle');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0f7760] hover:text-[#0c624f]"
                >
                  <ArrowLeft size={16} /> Change number
                </button>
                <span className="text-xs font-bold text-slate-500">{formattedPhone}</span>
              </div>

              <h2 className="mt-4 text-center text-[22px] font-extrabold text-[#1a2e26]">
                Enter verification code
              </h2>
              <p className="mt-1 text-center text-xs text-slate-500">
                We sent a 6-digit code to your phone
              </p>

              {/* 6-Box Connected OTP Inputs */}
              <div className="relative mt-8">
                {/* Visual Connection Wire */}
                <div className="absolute top-1/2 left-4 right-4 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-500 ${
                      verifyStatus === 'success'
                        ? 'w-full bg-emerald-500'
                        : verifyStatus === 'error'
                        ? 'w-full bg-red-500'
                        : verifyStatus === 'verifying'
                        ? 'w-full animate-pulse bg-[#0f7760]'
                        : otp.some((d) => d !== '')
                        ? 'w-full bg-[#0f7760]/40'
                        : 'w-0'
                    }`}
                  />
                </div>

                <div
                  className={`relative z-10 flex items-center justify-between gap-1.5 ${
                    shake ? 'animate-shake' : ''
                  }`}
                >
                  {otp.map((digit, idx) => {
                    let borderClass = 'border-slate-200 bg-white text-slate-900';

                    if (verifyStatus === 'success') {
                      borderClass = 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                    } else if (verifyStatus === 'error') {
                      borderClass = 'border-red-500 bg-red-50 text-red-600 shadow-[0_0_12px_rgba(239,68,68,0.3)]';
                    } else if (verifyStatus === 'verifying') {
                      borderClass = 'border-[#0f7760] bg-emerald-50/40 text-[#0f7760] animate-pulse';
                    } else if (digit) {
                      borderClass = 'border-[#0f7760] bg-emerald-50/20 text-[#0f7760] ring-2 ring-[#0f7760]/10';
                    }

                    return (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`h-13 w-12 rounded-xl border-2 text-center text-xl font-extrabold outline-none transition-all duration-300 sm:h-14 sm:w-12 ${borderClass}`}
                      />
                    );
                  })}
                </div>

                {error && (
                  <p className="mt-3 text-center text-xs font-semibold text-red-500">{error}</p>
                )}
              </div>

              {/* Resend Code Button */}
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={seconds > 0 || busy}
                  onClick={handleResend}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0f7760] transition hover:text-[#0c624f] disabled:text-slate-400"
                >
                  {seconds > 0 ? (
                    <span>Resend code in {seconds}s</span>
                  ) : (
                    <>
                      <span>Resend OTP</span>
                      <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
                    </>
                  )}
                </button>
              </div>

              {/* Green Verify / Continue Button */}
              <button
                type="button"
                disabled={busy || otp.join('').length < 6 || verifyStatus === 'success'}
                onClick={() => triggerVerification(otp.join(''))}
                className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] ${
                  verifyStatus === 'success'
                    ? 'bg-emerald-500 shadow-emerald-500/25'
                    : verifyStatus === 'error'
                    ? 'bg-red-500 shadow-red-500/25'
                    : 'bg-[#0f7760] shadow-[#0f7760]/25 hover:bg-[#0c624f]'
                } disabled:opacity-50`}
              >
                {verifyStatus === 'verifying' ? (
                  'Verifying...'
                ) : verifyStatus === 'success' ? (
                  <>
                    <span>Verified</span>
                    <Check size={18} strokeWidth={3} />
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Shake Keyframe Animation */}
      <style>{`
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
