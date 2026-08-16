import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

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

/**
 * Polls for the OneSignal push subscription ID for up to ~30s.
 * The ID is generated asynchronously after the device registers with
 * OneSignal's servers, so it is NOT available immediately after
 * initialize() or requestPermission().
 *
 * getIdAsync() returns a string (or null), not an object.
 * getOnesignalId() also returns a string (or null).
 */
async function waitForPlayerId(
  OneSignal: any,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Try push subscription ID first — this is the "player id" used for
    // include_player_ids when sending notifications.
    try {
      const subId = await OneSignal.User.pushSubscription.getIdAsync();
      if (subId && typeof subId === 'string' && subId.length > 0) {
        return subId;
      }
    } catch {
      // ignore
    }

    // Fallback: try the OneSignal user id.
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

    // ── 1. Initialize ───────────────────────────────────────────────
    await OneSignal.initialize(ONESIGNAL_APP_ID);

    // ── 2. Login the user so OneSignal associates this device ───────
    try {
      await OneSignal.login(userId);
    } catch {
      // non-fatal
    }

    // ── 3. Request notification permission ──────────────────────────
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

    // ── 4. Register listeners for the subscription ID ──────────────
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

    // ── 5. Poll as a fallback in case events don't fire ────────────
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