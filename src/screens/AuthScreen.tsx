import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth';

// Original image from your project matching the screenshot exactly
const groceryImage =
  'https://images.pexels.com/photos/7363163/pexels-photo-7363163.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200';

// Fixed Normalizer: Never corrupts typing, safely handles pasted 11/12-digit numbers
function normalizeIndianPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  
  // If pasted with 91 country code (12 digits), strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If pasted with leading 0 (11 digits), strip 0
  else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
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

  // 30s Countdown timer for resend
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
      setOtp(['', '', '', '', '', '']);
      setVerifyStatus('idle');
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }

    setBusy(true);
    setVerifyStatus('verifying');
    setError('');

    try {
      const result = await verifyOtp(`+91${phone}`, codeToVerify);
      if (result?.error) {
        setVerifyStatus('error');
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Invalid OTP code.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      } else {
        setVerifyStatus('success');
      }
    } catch (err: any) {
      setVerifyStatus('error');
      setError(err?.message || 'Verification failed. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setBusy(false);
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
        handleVerifyOtp(updated.join(''));
      }
      return;
    }

    updated[index] = cleanVal[0];
    setOtp(updated);
    setVerifyStatus('idle');

    if (index < 5 && cleanVal[0]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit is typed
    if (index === 5 || updated.every((d) => d !== '')) {
      const fullOtp = updated.join('');
      if (fullOtp.length === 6) {
        handleVerifyOtp(fullOtp);
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

    try {
      const result = await resendOtp(`+91${phone}`);
      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : result.error.message || 'Failed to resend code');
        return;
      }
      setSeconds(30);
      setOtp(['', '', '', '', '', '']);
      setVerifyStatus('idle');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-zinc-950 sm:flex sm:items-center sm:justify-center sm:p-6">
      {/* Container: Full bleed on mobile (100dvh), framed on tablet/desktop */}
      <div className="relative flex h-[100dvh] w-full flex-col justify-between overflow-hidden bg-[#0c3e33] sm:h-[844px] sm:max-w-[420px] sm:rounded-[40px] sm:shadow-2xl">
        
        {/* Full-bleed Top Food Image */}
        <div className="absolute inset-x-0 top-0 h-[62%] w-full overflow-hidden">
          <img
            src={groceryImage}
            alt="Fresh ingredients backdrop"
            className="h-full w-full object-cover object-center"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10" />
        </div>

        {/* Bottom Floating White Sheet */}
        <div className="relative z-10 mt-auto flex w-full flex-col rounded-t-[36px] bg-white px-6 pt-7 pb-8 shadow-[0_-16px_40px_rgba(0,0,0,0.2)] [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
          {step === 'phone' ? (
            <div className="flex flex-col">
              <h1 className="text-center text-[23px] font-extrabold leading-snug tracking-tight text-[#1a2e26]">
                All your restaurant needs <br /> delivered next day
              </h1>

              {/* Phone Input Box */}
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

              {/* Header-Themed Green Continue Button */}
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
              {/* Back Link & Phone Details */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                    setVerifyStatus('idle');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#0f7760] transition hover:text-[#0c624f]"
                >
                  <ArrowLeft size={16} /> Edit number
                </button>
                <span className="text-xs font-bold text-slate-500">{formattedPhone}</span>
              </div>

              <h2 className="mt-4 text-center text-[22px] font-extrabold text-[#1a2e26]">
                Enter verification code
              </h2>
              <p className="mt-1 text-center text-xs text-slate-500">
                We sent a 6-digit code to your phone
              </p>

              {/* 6 Connected Digit Boxes */}
              <div className="relative mt-8">
                {/* Visual Connection Bar Behind Boxes */}
                <div className="absolute top-1/2 left-4 right-4 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-500 ${
                      verifyStatus === 'success'
                        ? 'w-full bg-[#0f7760]'
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
                      borderClass = 'border-[#0f7760] bg-emerald-50 text-[#0f7760] shadow-[0_0_12px_rgba(15,119,96,0.3)]';
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

              {/* Header Green Verify Button */}
              <button
                type="button"
                disabled={busy || otp.join('').length < 6 || verifyStatus === 'success'}
                onClick={() => handleVerifyOtp(otp.join(''))}
                className={`mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] ${
                  verifyStatus === 'success'
                    ? 'bg-[#0f7760] shadow-[#0f7760]/25'
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
