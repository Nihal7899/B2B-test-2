import { useState } from 'react';
import { User, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth';

interface StaffRegistrationModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export function StaffRegistrationModal({ isOpen, onSuccess }: StaffRegistrationModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [personalName, setPersonalName] = useState(profile?.personal_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const trimmedFull = fullName.trim();
    const trimmedPersonal = personalName.trim();

    if (!trimmedFull || !trimmedPersonal) {
      setError('Both official full name and personal name are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFull,
          personal_name: trimmedPersonal,
          staff_registration_status: 'registered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      onSuccess?.();
    } catch (err: any) {
      console.error('Failed to save staff profile details:', err);
      setError(err?.message || 'Could not complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-[#0a382c] text-[#59D9B6] flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Staff Onboarding</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Please register your verified name details to access warehouse dispatch and fleet systems.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-[#0a382c]" /> Official Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-[#0a382c] focus:bg-white transition"
            />
            <p className="text-[10px] text-slate-400 font-medium">Printed on manifests and official invoices</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User size={13} className="text-[#0a382c]" /> Personal / Calling Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh"
              value={personalName}
              onChange={(e) => setPersonalName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 outline-none focus:border-[#0a382c] focus:bg-white transition"
            />
            <p className="text-[10px] text-slate-400 font-medium">Short name displayed to teammates & customers</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-[#0a382c] hover:bg-[#082d23] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition disabled:opacity-60 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-[#59D9B6]" />
                Saving Details...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
