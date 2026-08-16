import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export async function initializePushNotifications(userId: string) {
  console.log('[Push] Starting initialization for user', userId);

  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not native platform, skipping');
    return;
  }

  if (!ONESIGNAL_APP_ID) {
    console.error('[Push] VITE_ONESIGNAL_APP_ID is not defined');
    return;
  }

  try {
    const module = await import('@onesignal/capacitor-plugin');
    console.log('[Push] Module loaded successfully');

    // Get the OneSignal object – try different exports
    const OneSignal = module.default || module.OneSignal || module;
    console.log('[Push] OneSignal object:', OneSignal);

    if (!OneSignal || typeof OneSignal.initialize !== 'function') {
      console.error('[Push] OneSignal.initialize not found');
      return;
    }

    // ✅ Pass app ID as a string (most compatible)
    console.log('[Push] Initializing with app ID (string):', ONESIGNAL_APP_ID);
    await OneSignal.initialize(ONESIGNAL_APP_ID);

    // If string fails, fallback to object
    // try {
    //   await OneSignal.initialize(ONESIGNAL_APP_ID);
    // } catch (e) {
    //   console.warn('[Push] String init failed, trying object...', e);
    //   await OneSignal.initialize({ appId: ONESIGNAL_APP_ID });
    // }

    console.log('[Push] Requesting permission...');
    const permission = await OneSignal.Notifications.requestPermission(true);
    console.log('[Push] Permission result:', permission);

    if (!permission) {
      console.warn('[Push] Permission denied');
      return;
    }

    const playerId = await OneSignal.User.getOnesignalId();
    console.log('[Push] Player ID:', playerId);
    if (!playerId) {
      console.warn('[Push] No player ID');
      return;
    }

    // Save to Supabase
    const { error } = await supabase.from('user_push_subscriptions').upsert({
      user_id: userId,
      onesignal_player_id: playerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, onesignal_player_id' });

    if (error) {
      console.error('[Push] DB upsert error:', error);
    } else {
      console.log('[Push] Subscription saved');
    }

    await OneSignal.User.setExternalUserId(userId);
    console.log('[Push] External user ID set');
  } catch (err) {
    console.error('[Push] Initialization error:', err);
    if (err && typeof err === 'object') {
      console.error('[Push] Error message:', err.message || err.toString());
      console.error('[Push] Error stack:', err.stack);
    }
  }
}