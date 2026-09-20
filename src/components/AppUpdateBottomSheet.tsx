// src/components/AppUpdateBottomSheet.tsx
import { Capacitor } from '@capacitor/core';
import { ArrowUpCircle, ShieldCheck } from 'lucide-react';

export interface AppVersionData {
  app_version: string;
  playstore_link: string;
  app_store_link: string;
  release_notes?: string | null;
}

interface AppUpdateBottomSheetProps {
  versionData: AppVersionData;
  currentVersion: string;
}

export function AppUpdateBottomSheet({ versionData, currentVersion }: AppUpdateBottomSheetProps) {
  const handleRedirectToStore = () => {
    const platform = Capacitor.getPlatform();
    let url = versionData.playstore_link;

    if (platform === 'ios') {
      url = versionData.app_store_link || versionData.playstore_link;
    } else if (platform === 'android') {
      url = versionData.playstore_link;
    }

    if (url) {
      // In Capacitor native WebView, '_system' triggers external Play Store or App Store app
      window.open(url, '_system');
      // Fallback
      window.location.href = url;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex flex-col justify-end pointer-events-auto select-none"
      aria-modal="true"
      role="dialog"
    >
      {/* Non-clickable frosted backdrop blocking all underlying routes and clicks */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Bottom Sheet Container */}
      <div className="relative w-full bg-white rounded-t-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 pb-8 safe-bottom">
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-3.5 mb-2" />

        <div className="px-6 pt-2 pb-3 flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-[#02402c] mb-4 shadow-inner">
            <ArrowUpCircle size={36} className="text-emerald-700 animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Update Required
          </h2>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mt-2">
            <ShieldCheck size={14} />
            <span>v{versionData.app_version} is available</span>
          </div>

          <p className="text-sm text-slate-500 mt-3 max-w-[310px] leading-relaxed">
            {versionData.release_notes ||
              'A newer version of the app is required to continue. Please update to get the latest features, security enhancements, and improvements.'}
          </p>

          <p className="text-[11px] text-slate-400 mt-2">
            Current version installed: <span className="font-semibold text-slate-600">v{currentVersion}</span>
          </p>

          <div className="w-full mt-6">
            <button
              onClick={handleRedirectToStore}
              type="button"
              className="w-full h-13 py-3.5 rounded-xl bg-[#02402c] hover:bg-[#03593d] text-white font-bold text-base shadow-lg shadow-emerald-950/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
