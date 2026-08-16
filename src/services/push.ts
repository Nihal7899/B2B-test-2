import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export async function initializePushNotifications(userId: string) {
  // Only proceed on native platforms (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    console.log('Push notifications are only available on native platforms');
    return;
  }

  try {
    // Dynamically import the plugin to avoid web build issues
    const { OneSignal } = await import('@onesignal/capacitor-plugin');

    // 1. Initialize
    await OneSignal.initialize(ONESIGNAL_APP_ID);

    // 2. Request permission
    const permission = await OneSignal.Notifications.requestPermission(true);
    if (!permission) {
      console.warn('Push permission denied');
      return;
    }

    // 3. Get player ID
    const playerId = await OneSignal.User.getOnesignalId();
    if (!playerId) {
      console.warn('No OneSignal player ID');
      return;
    }

    // 4. Store in Supabase
    await supabase.from('user_push_subscriptions').upsert({
      user_id: userId,
      onesignal_player_id: playerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, onesignal_player_id' });

    // 5. (Optional) set external user ID
    await OneSignal.User.setExternalUserId(userId);

    console.log('Push notifications initialised for user', userId);
  } catch (err) {
    console.error('Push init error:', err);
  }
}