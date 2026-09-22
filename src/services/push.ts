import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

// Cache for cold-starts (when the app is opened from a closed state by clicking the CTA)
let pendingPushData: any = null;

export function getPendingPushData(): any {
  const data = pendingPushData;
  pendingPushData = null;
  return data;
}

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function saveSubscription(userId: string, playerId: string): Promise<void> {
  const { error } = await supabase.from('user_push_subscriptions').upsert(
    {
      user_id: userId,
      onesignal_player_id: playerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id, onesignal_player_id' }
  );

  if (error) {
    // silently ignore
  }
}

function dispatchPushClick(payload: any) {
  if (!payload) return;
  pendingPushData = payload;

  window.dispatchEvent(
    new CustomEvent('push_notification_click', {
      detail: payload,
    })
  );
}

async function waitForPlayerId(
  OneSignal: any,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const subId = await OneSignal.User.pushSubscription.getIdAsync();
      if (subId && typeof subId === 'string' && subId.length > 0) {
        return subId;
      }
    } catch {
      // ignore
    }

    try {
      const osId = await OneSignal.User.getOnesignalId();
      if (osId && typeof osId === 'string' && osId.length > 0) {
        return osId;
      }
    } catch {
      // ignore
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return null;
}

export async function initializePushNotifications(userId: string) {
  if (!isNative()) {
    return;
  }

  if (!ONESIGNAL_APP_ID) {
    return;
  }

  try {
    const module = await import('@onesignal/capacitor-plugin');
    const OneSignal = module.default || module.OneSignal || module;

    if (!OneSignal || typeof OneSignal.initialize !== 'function') {
      return;
    }

    // ── 1. Initialize OneSignal ─────────────────────────────────────
    await OneSignal.initialize(ONESIGNAL_APP_ID);

    // ── 2. Click & CTA Action Listener ──────────────────────────────
    // Captures both notification body taps and CTA button clicks
    try {
      OneSignal.Notifications.addEventListener('click', (event: any) => {
        const actionId = event?.result?.actionId;
        const additionalData = event?.notification?.additionalData || {};

        dispatchPushClick({
          actionId,
          ...additionalData,
        });
      });
    } catch (e) {
      console.warn('[push] Could not register click listener:', e);
    }

    // ── 3. Associate User ID with OneSignal ─────────────────────────
    try {
      await OneSignal.login(userId);
    } catch {
      // non-fatal
    }

    // ── 4. Request Permission ───────────────────────────────────────
    let permission = false;
    try {
      const permResult = await OneSignal.Notifications.requestPermission(true);
      permission =
        typeof permResult === 'boolean'
          ? permResult
          : permResult?.permission ?? false;
    } catch {
      try {
        const has = await OneSignal.Notifications.hasPermission();
        permission = typeof has === 'boolean' ? has : has?.permission ?? false;
      } catch {
        permission = false;
      }
    }

    if (!permission) {
      return;
    }

    // ── 5. Subscription Listeners ───────────────────────────────────
    let saved = false;
    const cleanupListeners = () => {
      try {
        OneSignal.User.pushSubscription.removeEventListener('change', subscriptionListener);
      } catch { /* ignore */ }
      try {
        OneSignal.User.removeEventListener('change', userChangeListener);
      } catch { /* ignore */ }
    };

    const subscriptionListener = async (event: any) => {
      try {
        const currentId = event?.current?.id ?? null;
        if (currentId && typeof currentId === 'string' && currentId.length > 0 && !saved) {
          saved = true;
          cleanupListeners();
          await saveSubscription(userId, currentId);
        }
      } catch {
        // ignore
      }
    };

    const userChangeListener = async (event: any) => {
      try {
        const osId = event?.current?.onesignalId ?? null;
        if (osId && typeof osId === 'string' && osId.length > 0 && !saved) {
          let pushSubId: string | null = null;
          try {
            pushSubId = await OneSignal.User.pushSubscription.getIdAsync();
          } catch { /* ignore */ }
          const idToSave = (pushSubId && typeof pushSubId === 'string' && pushSubId.length > 0) ? pushSubId : osId;
          if (idToSave && !saved) {
            saved = true;
            cleanupListeners();
            await saveSubscription(userId, idToSave);
          }
        }
      } catch {
        // ignore
      }
    };

    try {
      OneSignal.User.pushSubscription.addEventListener('change', subscriptionListener);
    } catch {
      // ignore
    }

    try {
      OneSignal.User.addEventListener('change', userChangeListener);
    } catch {
      // ignore
    }

    // ── 6. Fallback Polling ──────────────────────────────────────────
    const polledId = await waitForPlayerId(OneSignal);
    if (polledId && !saved) {
      saved = true;
      cleanupListeners();
      await saveSubscription(userId, polledId);
    }

  } catch {
    // ignore
  }
}
